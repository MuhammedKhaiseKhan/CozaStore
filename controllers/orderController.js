const User = require('../model/userSchema');
const Categories = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');
const Order = require('../model/orderSchema');
const { default: mongoose } = require("mongoose");
const Address = require('../model/addressSchema');
const Cart = require('../model/cartSchema');
const crypto = require('crypto')
const Razorpay = require('razorpay');
require('dotenv').config();
const Wallet = require('../model/walletSchema');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const Offer = require('../model/offerSchema');



// Create Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const checkOfferForProduct = async (product) => {
    const now = new Date();

    // Check for product-specific offer
    let offer = await Offer.findOne({
        Pname: product.productName,
        expiredDate: { $gt: now },
        status: true
    });

    if (offer) {
        let discountPrice = product.price - (product.price * offer.discount / 100);

        // Check if maxRedeemableAmount is applicable
        if (offer.maxRedeemableAmount > 0 && offer.maxRedeemableAmount < discountPrice) {
            discountPrice = product.price - offer.maxRedeemableAmount;
        }

        return {
            discount: offer.discount,
            discountPrice: discountPrice,
            specialOffer: true,
            offerName: offer.offer
        };
    }

    // Check for category-specific offer
    offer = await Offer.findOne({
        category: product.category.name,
        expiredDate: { $gt: now },
        status: true
    });

    if (offer) {
        let discountPrice = product.price - (product.price * offer.discount / 100);

        // Check if maxRedeemableAmount is applicable
        if (offer.maxRedeemableAmount > 0 && offer.maxRedeemableAmount < discountPrice) {
            discountPrice = product.price - offer.maxRedeemableAmount;
        }

        return {
            discount: offer.discount,
            discountPrice: discountPrice,
            specialOffer: true,
            offerName: offer.offer
        };
    }

    // No offer available
    return {
        discount: 0,
        discountPrice: product.price,
        specialOffer: false
    };
};

const placeOrder = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        // Retrieve the user's cart items with category details
        const cart = await Cart.findOne({ userId: userId }).populate({
            path: 'cartItems.productId',
            populate: {
                path: 'category',
                model: 'Categories'
            }
        });

        const cartItems = cart.cartItems;

        // Get the selected address and payment method for the order
        const { addressId, paymentMethod } = req.body;
        const address = await Address.findOne({ user_id: userId, 'address._id': addressId });
        const shippingAddress = address.address.find(item => item._id.toString() === addressId);

        let subtotal = 0;
        let totalDiscount = 0;
        const orderItems = [];

        for (const item of cartItems) {
            const product = item.productId;
            const offerDetails = await checkOfferForProduct(product);

            subtotal += offerDetails.discountPrice * item.quantity;
            totalDiscount += (product.price - offerDetails.discountPrice) * item.quantity;

            orderItems.push({
                productId: product._id,
                productName: product.productName,
                quantity: item.quantity,
                brand: product.brand,
                category: product.category.name, // Use category name instead of ID
                description: product.description,
                price: product.price,
                discountPrice: offerDetails.discountPrice,
                discount: offerDetails.discount,
                image: product.image
            });
        }

        const shippingCost = 60; // Assuming a fixed shipping cost

        // Retrieve coupon discount from session
        const coupon = req.session.coupon;
        let couponDiscount = 0;
        if (coupon) {
            const discountAmount = (subtotal * coupon.discountPercentage) / 100;
            couponDiscount = Math.min(discountAmount, coupon.maxRedeemableAmount);
        }

        const total = subtotal + shippingCost - couponDiscount;

        // Check if order is above Rs 1000 and payment method is COD
        if (total > 1000 && paymentMethod === 'CashOnDelivery') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cash on Delivery is not available for orders above Rs 1000. Please choose a different payment method.' 
            });
        }

        // Check wallet balance if payment method is wallet
        if (paymentMethod === 'UserWallet') {
            const wallet = await Wallet.findOne({ userId: userId });
            if (!wallet || wallet.walletAmount < total) {
                return res.status(400).json({ success: false, message: 'Insufficient balance in wallet' });
            }
        }

        // Generate unique 6-digit orderID
        const generateUniqueOrderID = async () => {
            let uniqueOrderID;
            let isUnique = false;
            while (!isUnique) {
                uniqueOrderID = Math.floor(100000 + Math.random() * 900000).toString();
                const existingOrder = await Order.findOne({ orderID: uniqueOrderID });
                if (!existingOrder) {
                    isUnique = true;
                }
            }
            return uniqueOrderID;
        };

        const orderID = await generateUniqueOrderID();

        // Save the order details to your database
        const order = new Order({
            userId: userId,
            orderID: orderID,
            orderItems: orderItems,
            address: shippingAddress,
            paymentMethod: paymentMethod,
            totalAmount: total,
            couponId: coupon ? coupon.id : null,
            couponDiscount: couponDiscount,
            offerDiscount: totalDiscount
        });

        await order.save();

        // Decrease stock for each product in the order
        for (const item of cartItems) {
            await Product.findByIdAndUpdate(item.productId._id, { $inc: { inStock: -parseInt(item.quantity) } }, { new: true });
        }

        if (paymentMethod === 'OnlinePayment') {
            // If online payment method, initiate Razorpay checkout
            const options = {
                amount: Math.round(total * 100),
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
        } else if (paymentMethod === 'UserWallet') {
            // If wallet payment, deduct amount from wallet
            const wallet = await Wallet.findOne({ userId: userId });
            wallet.walletAmount -= total;
            wallet.transactionHistory.push({
                amount: -total,
                PaymentType: 'debit',
                date: new Date()
            });
            await wallet.save();

            // Update order status
            order.orderStatus = 'Order confirmed';
            await order.save();

            res.status(200).json({ success: true, message: 'Order placed successfully using wallet!', orderId: order._id });
        } else if (paymentMethod === 'CashOnDelivery') {
            // If cash on delivery, respond with success message
            order.orderStatus = 'Order confirmed';
            await order.save();
            res.status(200).json({ success: true, message: 'Order placed successfully!', orderId: order._id });
        } else {
            // Handle unknown payment method
            res.status(400).json({ success: false, message: 'Invalid payment method.' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Failed to place order. Please try again later.' });
        next(error);
    }
};




// const placeOrder = async (req, res) => {
//     try {
//         const userId = req.session.user_id;

//         // Retrieve the user's cart items with category details
//         const cart = await Cart.findOne({ userId: userId }).populate({
//             path: 'cartItems.productId',
//             populate: {
//                 path: 'category',
//                 model: 'Categories'
//             }
//         });

//         const cartItems = cart.cartItems;

//         // Get the selected address and payment method for the order
//         const { addressId, paymentMethod } = req.body;
//         const address = await Address.findOne({ user_id: userId, 'address._id': addressId });
//         const shippingAddress = address.address.find(item => item._id.toString() === addressId);

//         let subtotal = 0;
//         let totalDiscount = 0;

//         cartItems.forEach(item => {
//             // Calculate the best offer for the product
//             let productOffer = item.productId.productOffer || 0;
//             let categoryOffer = item.productId.categoryOffer || 0;
//             let bestOffer = Math.max(productOffer, categoryOffer);
//             let discountAmount = (item.productId.price * (bestOffer / 100));
//             if (item.productId.maxRedeemableAmount && discountAmount > item.productId.maxRedeemableAmount) {
//                 discountAmount = item.productId.maxRedeemableAmount;
//             }
//             let discountedPrice = item.productId.price - discountAmount;

//             subtotal += discountedPrice * item.quantity;
//             totalDiscount += discountAmount * item.quantity;
//         });

//         const shippingCost = 60; // Assuming a fixed shipping cost

//         // Retrieve coupon discount from session
//         const coupon = req.session.coupon;
//         let couponDiscount = 0;
//         if (coupon) {
//             const discountAmount = (subtotal * coupon.discountPercentage) / 100;
//             couponDiscount = Math.min(discountAmount, coupon.maxRedeemableAmount);
//         }

//         const total = subtotal + shippingCost - couponDiscount;

//         // Check if order is above Rs 1000 and payment method is COD
//         if (total > 1000 && paymentMethod === 'CashOnDelivery') {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Cash on Delivery is not available for orders above Rs 1000. Please choose a different payment method.' 
//             });
//         }

//         const orderItems = cartItems.map(item => ({
//             productId: item.productId._id,
//             productName: item.productId.productName,
//             quantity: item.quantity,
//             brand: item.productId.brand,
//             category: item.productId.category.name, // Use category name instead of ID
//             description: item.productId.description,
//             price: item.productId.price,
//             discountPrice: item.productId.discountPrice,
//             discount: item.productId.discount,
//             image: item.productId.image
//         }));

//         // Check wallet balance if payment method is wallet
//         if (paymentMethod === 'UserWallet') {
//             const wallet = await Wallet.findOne({ userId: userId });
//             if (!wallet || wallet.walletAmount < total) {
//                 return res.status(400).json({ success: false, message: 'Insufficient balance in wallet' });
//             }
//         }

//         // Generate unique 6-digit orderID
//         const generateUniqueOrderID = async () => {
//             let uniqueOrderID;
//             let isUnique = false;
//             while (!isUnique) {
//                 uniqueOrderID = Math.floor(100000 + Math.random() * 900000).toString();
//                 const existingOrder = await Order.findOne({ orderID: uniqueOrderID });
//                 if (!existingOrder) {
//                     isUnique = true;
//                 }
//             }
//             return uniqueOrderID;
//         };

//         const orderID = await generateUniqueOrderID();

//         // Save the order details to your database
//         const order = new Order({
//             userId: userId,
//             orderID: orderID,
//             orderItems: orderItems,
//             address: shippingAddress,
//             paymentMethod: paymentMethod,
//             totalAmount: total,
//             couponId: coupon ? coupon.id : null,
//             couponDiscount: couponDiscount,
//             offerDiscount: totalDiscount
//         });

//         await order.save();

//         // Decrease stock for each product in the order
//         for (const item of cartItems) {
//             await Product.findByIdAndUpdate(item.productId._id, { $inc: { inStock: -parseInt(item.quantity) } }, { new: true });
//         }

//         if (paymentMethod === 'OnlinePayment') {
//             // If online payment method, initiate Razorpay checkout
//             const options = {
//                 amount: Math.round(total * 100),
//                 currency: 'INR',
//                 receipt: order._id.toString()
//             };

//             razorpayInstance.orders.create(options, (err, razorpayOrder) => {
//                 if (err) {
//                     console.log(err);
//                     return res.status(500).json({ success: false, message: 'Failed to initiate payment. Please try again later.' });
//                 }
//                 res.status(200).json({
//                     success: true,
//                     message: 'Order placed successfully!',
//                     orderId: order._id,
//                     razorpayOrderId: razorpayOrder.id,
//                     key_id: process.env.RAZORPAY_KEY_ID,
//                     amount: options.amount
//                 });
//             });
//         } else if (paymentMethod === 'UserWallet') {
//             // If wallet payment, deduct amount from wallet
//             const wallet = await Wallet.findOne({ userId: userId });
//             wallet.walletAmount -= total;
//             wallet.transactionHistory.push({
//                 amount: -total,
//                 PaymentType: 'debit',
//                 date: new Date()
//             });
//             await wallet.save();

//             // Update order status
//             order.orderStatus = 'Order confirmed';
//             await order.save();

//             res.status(200).json({ success: true, message: 'Order placed successfully using wallet!', orderId: order._id });
//         } else if (paymentMethod === 'CashOnDelivery') {
//             // If cash on delivery, respond with success message
//             order.orderStatus = 'Order confirmed';
//             await order.save();
//             res.status(200).json({ success: true, message: 'Order placed successfully!', orderId: order._id });
//         } else {
//             // Handle unknown payment method
//             res.status(400).json({ success: false, message: 'Invalid payment method.' });
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ success: false, message: 'Failed to place order. Please try again later.' });
//     }
// };



const getPaymentDetails = async (req, res, next) => {
    console.log("Starting getPaymentDetails");
    try {
      const { orderId } = req.body;
      console.log("Order ID:", orderId);
  
      if (!req.session || !req.session.user_id) {
        console.log("User is not authenticated.");
        return res.status(403).json({ message: "User is not authenticated." });
      }
  
      const order = await Order.findById(orderId);
      if (!order) {
        console.log("Order not found.");
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      console.log("Order found in DB:", order);
  
      if (order.userId.toString() !== req.session.user_id) {
        console.log("Unauthorized access to the order.");
        return res.status(403).json({ success: false, message: "Unauthorized access to the order." });
      }
  
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
  
      const amount = Math.round(order.totalAmount * 100); // Amount in paisa, ensure it's an integer
      const options = {
        amount: amount,
        currency: 'INR',
        receipt: orderId.toString()
      };
      console.log("Options for Razorpay order creation:", options);
  
      const razorpayOrder = await instance.orders.create(options);
      if (!razorpayOrder) {
        console.log("Failed to create Razorpay order.");
        return res.status(500).json({ success: false, message: 'Failed to create payment order. Please try again later.' });
      }
      console.log("Razorpay order created:", razorpayOrder);
  
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
  
      res.json({
        success: true,
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        razorpayOrderId: razorpayOrder.id,
        orderId: order._id
      });
    } catch (error) {
      console.log("Error in getPaymentDetails:", error.message);
      next(error);
    }
  };
  

// Payment verification  
  
const verifyPayment = async (req, res, next) => {
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
        next(error);
    }
};


const orderDetails = async (req, res, next) => {
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
        next(error);
    }
};

const invoiceDownload = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('orderItems.productId').exec();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 50 });
        const filename = `Invoice-${orderId}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Helper function for drawing lines
        const drawLine = (x1, y1, x2, y2) => {
            doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
        };

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);
        
        // Company Info (You can replace this with your company details)
        doc.fontSize(10).font('Helvetica').text('Coza Store', { align: 'right' });
        doc.text('Coza Store , Calicut, India', { align: 'right' });
        doc.text('Phone: +91 9961009900', { align: 'right' });
        doc.text('Email: cozastore@gmail.com', { align: 'right' });
        
        doc.moveDown(1);
        drawLine(50, doc.y, 550, doc.y);
        doc.moveDown(1);

        // Order Info
        
        doc.fontSize(10).font('Helvetica').text(`Order Date: ${new Date(order.orderDate).toLocaleString()}`, { align: 'left' });
        doc.text(`Order Status: ${order.orderStatus}`, { align: 'left' });
        doc.moveDown(1);

        // Billing Address
        doc.fontSize(12).font('Helvetica-Bold').text('Billing Address', { align: 'left' });
        doc.fontSize(10).font('Helvetica').text(`${order.address.Name}`, { align: 'left' });
        doc.text(`${order.address.address}`, { align: 'left' });
        doc.text(`${order.address.city}, ${order.address.state} ${order.address.PIN}`, { align: 'left' });
        doc.text(`Email: ${order.address.email}`, { align: 'left' });
        doc.text(`Phone: ${order.address.Mobile}`, { align: 'left' });
        doc.moveDown(1);

        // Order Items Table
        const tableTop = doc.y;
        const itemCodeX = 50;
        const descriptionX = 100;
        const quantityX = 300;
        const priceX = 380;
        const amountX = 480;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', itemCodeX, tableTop);
        doc.text('Description', descriptionX, tableTop);
        doc.text('Qty', quantityX, tableTop);
        doc.text('Price', priceX, tableTop);
        doc.text('Amount', amountX, tableTop);

        drawLine(50, doc.y + 5, 550, doc.y + 5);
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica');
        let subtotal = 0;
        order.orderItems.forEach((item, index) => {
            const y = doc.y;
            doc.text(index + 1, itemCodeX, y);
            doc.text(item.productName, descriptionX, y);
            doc.text(item.quantity, quantityX, y);
            doc.text(`₹${item.price.toFixed(2)}`, priceX, y);
            const amount = item.quantity * item.price;
            subtotal += amount;
            doc.text(`₹${amount.toFixed(2)}`, amountX, y);
            doc.moveDown(0.5);
        });

        drawLine(50, doc.y, 550, doc.y);
        doc.moveDown(0.5);

        // Subtotal, Discount, and Total
        doc.font('Helvetica-Bold');
        const subtotalY = doc.y;
        doc.text('Subtotal:', 350, subtotalY);
        doc.text(`₹${subtotal.toFixed(2)}`, amountX, subtotalY);
        doc.moveDown(0.5);

        const discountAmount = subtotal - order.totalAmount;
        const discountY = doc.y;
        doc.text('Discount:', 350, discountY);
        doc.text(`₹${discountAmount.toFixed(2)}`, amountX, discountY);
        doc.moveDown(0.5);

        drawLine(350, doc.y, 550, doc.y);
        doc.moveDown(0.5);

        const totalY = doc.y;
        doc.fontSize(12);
        doc.text('Total Amount:', 350, totalY);
        doc.text(`₹${order.totalAmount.toFixed(2)}`, amountX, totalY);

        // Footer
        doc.fontSize(10).font('Helvetica');
        doc.text('Thank you for your business!', 50, 700, { align: 'center' });

        doc.end();
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error fetching order details');
        next(error);
    }
};


const orders = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const userOrders = await Order.find({ userId: userId })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit)
            .populate('orderItems.productId');

        res.render('orders', { orders: userOrders, currentPage: page, totalPages: totalPages, limit: limit });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
        next(error);
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

        // Refund amount to wallet if payment method is online or wallet
        if (orderData.paymentMethod === 'OnlinePayment' || orderData.paymentMethod === 'UserWallet') {
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


const orderManagement = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;  // Number of orders per page
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        const allOrders = await Order.find()
            .sort({ orderDate: -1 })
            .populate('orderItems.productId')
            .skip(skip)
            .limit(limit);

        res.render('orderManagement', {
            orders: allOrders,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
        next(error);
    }
};



// const orderManagement = async (req, res) => {
//     try {
//         const allOrders = await Order.find().sort({ orderDate: -1 }).populate('orderItems.productId');
//         res.render('orderManagement', { orders: allOrders });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

const updateOrderStatus =  async (req, res, next) => {
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
        next(error);
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

const loadWallet = async (req, res, next) => {
    try {
        const userId = req.session.user_id; 
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const wallet = await Wallet.findOneAndUpdate(
            { userId: user._id }, 
            { $setOnInsert: { userId: user._id } },
            { new: true, upsert: true } 
        );

        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        const totalTransactions = wallet.transactionHistory.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalTransactions);
        const transactions = wallet.transactionHistory.slice(startIndex, endIndex);

        res.render('wallet', {
            user,
            wallet: {
                ...wallet.toObject(),
                transactionHistory: transactions
            },
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error loading wallet:', error);
        res.status(500).send('Internal Server Error');
        next(error);
    }
};

// const loadWallet = async (req, res, next) => {
//     try {
//         const userId = req.session.user_id; 

        
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         const wallet = await Wallet.findOneAndUpdate(
//             { userId: user._id }, // Query condition
//             { $setOnInsert: { userId: user._id } }, 
//             { new: true, upsert: true } 
//         );
        
//         if (!wallet) {
//             return res.status(404).send('Wallet not found');
//         }

        
//         res.render('wallet', { user, wallet });
//     } catch (error) {
//         console.error('Error loading wallet:', error);
//         res.status(500).send('Internal Server Error');
//         next(error);
//     }
// };


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
    loadWallet,
    getPaymentDetails,
    invoiceDownload
}