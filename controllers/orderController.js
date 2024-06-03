const User = require('../model/userSchema');
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');
const Order = require('../model/orderSchema');
const { default: mongoose } = require("mongoose");
const Address = require('../model/addressSchema');
const Cart = require('../model/cartSchema');
const crypto = require('crypto')
const Razorpay = require('razorpay');
require('dotenv').config();
const Wallet = require('../model/walletSchema');



// Create Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // Retrieve the user's cart items
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
        const cartItems = cart.cartItems;

        // Get the selected address for the order
        const { addressId, paymentMethod } = req.body;
        const address = await Address.findOne({ user_id: userId, 'address._id': addressId });
        const shippingAddress = address.address.find(item => item._id.toString() === addressId);

        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += item.productId.price * item.quantity;
        });

        const shippingCost = 60; // Assuming a fixed shipping cost
        const couponDiscount = 55; // Assuming a fixed coupon discount
        const total = subtotal + shippingCost - couponDiscount;

        const orderItems = cartItems.map(item => ({
            productId: item.productId._id,
            productName: item.productId.productName,
            quantity: item.quantity,
            brand: item.productId.brand,
            category: item.productId.category,
            description: item.productId.description,
            price: item.productId.price,
            discountPrice: item.productId.discountPrice,
            discount: item.productId.discount,
            image: item.productId.image
        }));

        // Save the order details to your database
        const order = new Order({
            userId: userId,
            orderItems: orderItems,
            address: shippingAddress,
            paymentMethod: paymentMethod,
            totalAmount: total,
        });

        await order.save();

        // Decrease stock for each product in the order
        for (const item of cartItems) {
            await Product.findByIdAndUpdate(item.productId._id, { $inc: { inStock: -parseInt(item.quantity) } }, { new: true });
        }

        if (paymentMethod === 'OnlinePayment') {
            // If online payment method, initiate Razorpay checkout
            const options = {
                amount: total * 100, // Amount in paisa
                currency: 'INR',
                receipt: order._id.toString()
            };

            razorpayInstance.orders.create(options, (err, razorpayOrder) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ success: false, message: 'Failed to initiate payment. Please try again later.' });
                }
                res.status(200).json({
                    success: true,
                    message: 'Order placed successfully!',
                    orderId: order._id,
                    razorpayOrderId: razorpayOrder.id,
                    key_id: process.env.RAZORPAY_KEY_ID,
                    amount: options.amount
                });
            });
        } else {
            // Update order status
            order.orderStatus = 'Order confirmed';
            await order.save();
            // If cash on delivery, respond with success message
            res.status(200).json({ success: true, message: 'Order placed successfully!', orderId: order._id });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Failed to place order. Please try again later.' });
    }
};


// Payment verification  
  
const verifyPayment = async (req, res) => {
    try {
        const { paymentId, razorpayOrderId, razorpaySignature, orderId } = req.body;

        if (!paymentId || !razorpayOrderId || !razorpaySignature || !orderId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        shasum.update(`${razorpayOrderId}|${paymentId}`);
        const digest = shasum.digest('hex');

        console.log("Generated Signature:", digest); // Debugging line

        if (digest === razorpaySignature) {
            // Find the order
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Update order status and payment ID
            order.orderStatus = 'Order confirmed';
            order.razorPayment_id = paymentId;
            await order.save();

            console.log('Order updated successfully:', order);

            return res.status(200).json({ orderId, success: 'Payment successful and Order placed' });
        } else {
            return res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const orderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const userId = req.session.user_id;
        const orderInfo = await Order.findById({ _id: orderId}).populate('orderItems.productId');
    
        const orderDateTimestamp = orderInfo.orderDate.$date;
        orderInfo.orderDate = new Date(orderDateTimestamp);
        
        res.render('orderDetails', { orderData: orderInfo });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error fetching order details');
    }
};

const orders = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const userOrders = await Order.find({ userId: userId }).sort({ orderDate: -1 }).populate('orderItems.productId');

        res.render('orders', { orders: userOrders });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// cancelOrder

const cancellOrder = async (req, res, next) => {
    try {
      const orderId = req.query.orderId;
      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid Order ID' });
      }
  
      const orderData = await Order.findById(orderId);
      if (!orderData) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // Update order status to 'cancelled'
      await Order.findByIdAndUpdate(orderId, { $set: { orderStatus: "cancelled" } }, { new: true });
  
      // Aggregate order data
      const data = await Order.aggregate([
        {
          '$match': {
            '_id': new mongoose.Types.ObjectId(orderId)
          }
        }
      ]);
  
      if (data.length === 0) {
        throw new Error('Order data aggregation failed.');
      }
  
      // Update product stock
      for (const product of data[0].orderItems) {
        const update = Number(product.quantity);
        await Product.findOneAndUpdate(
          { _id: product.productId },
          {
            $inc: { inStock: update },
            $set: { popularProduct: true }
          }
        );
      }
  
      // Refund amount to wallet if payment method is online
      if (orderData.paymentMethod === 'OnlinePayment') {
        const userId = orderData.userId;
        const orderAmount = orderData.totalAmount;
  
        // Update user's wallet balance and log the transaction
        await Wallet.findOneAndUpdate(
          { userId: userId },
          {
            $inc: { walletAmount: orderAmount },
            $push: {
              transactionHistory: {
                amount: orderAmount,
                PaymentType: 'credit',
                date: new Date()
              }
            }
          },
          { new: true, upsert: true }
        );
      }
  
      res.status(200).json({ message: 'Order Cancelled Successfully' });
    } catch (error) {
      console.error('Error occurred while cancelling order:', error.message);
      res.status(500).json({ message: 'An error occurred while Cancelling Order' });
      next(error);
    }
  };
  
  

// const cancellOrder = async (req, res, next) => {
//     try {
//       const orderId = req.query.orderId;
//       if (!orderId) {
//         return res.status(400).json({ message: 'Order ID is required' });
//       }
  
//       const orderData = await Order.findById(orderId);
//       if (!orderData) {
//         return res.status(404).json({ message: 'Order not found' });
//       }
  
//       await Order.findByIdAndUpdate(orderId, { $set: { orderStatus: "cancelled" } });
  
//       const data = await Order.aggregate([
//         {
//           '$match': {
//             '_id': new mongoose.Types.ObjectId(orderId)
//           }
//         }
//       ]);
  
//       if (data.length === 0) {
//         throw new Error('Order data aggregation failed.');
//       }
  
//       for (const product of data[0].orderItems) {
//         const update = Number(product.quantity);
//         await Product.findOneAndUpdate(
//           { _id: product.productId },
//           {
//             $inc: { inStock: update },
//             $set: { popularProduct: true }
//           }
//         );
//       }
  
//       res.status(200).json({ message: 'Order Cancelled Successfully' });
//     } catch (error) {
//       console.error('Error occurred while cancelling order:', error.message);
//       res.status(500).json({ message: 'An error occurred while Cancelling Order' });
//       next(error);
//     }
//   };


  const requestForReturn = async (req, res, next) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Order.findByIdAndUpdate(orderId,
            { $set: { returnReason: reason, orderStatus: 'Requested for Return' } })

        if (!order) {
            return res.status(404).send({
                message: "Order not found."
            });
        }

        res.status(200).send({
            message: "Return processed successfully.",
            order: order
        });
    } catch (error) {
        console.log(error.message);
        next(error)

    }
}


const orderManagement = async (req, res) => {
    try {
        const allOrders = await Order.find().sort({ orderDate: -1 }).populate('orderItems.productId');
        res.render('orderManagement', { orders: allOrders });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updateOrderStatus =  async (req, res) => {
    const { orderId, status } = req.body;

    try {
        let order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = status;
        await order.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const approveReturn = async (req, res, next) => {
    try {
        const orderId = req.body.orderId; // Changed to req.body.orderId to match fetch request payload

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).send({ message: "Invalid order ID." });
        }

        const order = await Order.findByIdAndUpdate(orderId, { $set: { orderStatus: 'returned' } }, { new: true });

        if (!order) {
            return res.status(404).send({ message: "Order not found." });
        }

        // Add to wallet
        const orderData = await Order.findById(orderId);
        await Wallet.findOneAndUpdate(
            { userId: orderData.userId },
            {
                $inc: { walletAmount: orderData.totalAmount },
                $push: {
                    transactionHistory: {
                        amount: orderData.totalAmount,
                        PaymentType: "credit",
                        date: new Date()
                    }
                }
            },
            { new: true, upsert: true }
        );

        res.status(200).send({ message: "Return approved successfully.", order: order });
    } catch (error) {
        console.error('Error approving return:', error.message);
        res.status(500).send({ message: 'An error occurred while approving return.' });
        next(error);
    }
};


// const approveReturn = async (req, res, next) => {
//     try {
//         const orderId = req.body.orderId; // Changed to req.body.orderId to match fetch request payload

//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).send({ message: "Invalid order ID." });
//         }

//         const order = await Order.findByIdAndUpdate(orderId, { $set: { orderStatus: 'returned' } }, { new: true });

//         if (!order) {
//             return res.status(404).send({ message: "Order not found." });
//         }

//         res.status(200).send({ message: "Return approved successfully.", order: order });
//     } catch (error) {
//         console.error('Error approving return:', error.message);
//         res.status(500).send({ message: 'An error occurred while approving return.' });
//         next(error);
//     }
// };

const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user_id; 

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find the wallet associated with the user
        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        // Render the wallet page with user and wallet data
        res.render('wallet', { user, wallet });
    } catch (error) {
        console.error('Error loading wallet:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    orderManagement,
    updateOrderStatus,
    approveReturn,
    placeOrder,
    orderDetails,
    orders,
    cancellOrder,
    requestForReturn,
    verifyPayment,
    loadWallet
}