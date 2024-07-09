
const User = require('../model/userSchema');
const bcrypt = require("bcrypt");
const sendEmail = require('../util/Nodemailer');
const generateOTP = require('../util/genereteOTP');
const reSendEmail = require('../util/reSendEmail');
const Otp = require("../model/otpSchema");
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');
const Address = require('../model/addressSchema');
const Cart = require('../model/cartSchema');
const user_route = require('../routes/userRoute');
const Order = require('../model/orderSchema');
const { default: mongoose } = require("mongoose");
const { name } = require('ejs');
const Coupon = require('../model/couponSchema');
const Offer = require('../model/offerSchema');





const securePassword = async (password)=>{
    try {
        const passwordHash = bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async(req, res, next)=>{
    try {
        const sPassword = await securePassword(req.body.password);
        const {fname,sname,username,email,number,spassword}=req.body

            const regexPattern = new RegExp(`^${email}$`,'i')
            const alreadyExist = await User.find({email:regexPattern})
            if(alreadyExist.length > 0){
                return res.render('registration',{message:"this Email is already added"})
            }

        const userData = new User({
            fname:fname,
            sname:sname,
            username:username,
            email:email,
            number:number,
            password:sPassword
        })

        // const user =await userData.save();
        req.session.userData = userData
        
        await sendEmail(req,res)
        res.render('otp');

        
    } catch (error) {
         console.log(error.message);
         next(error);
    }
}


const contactPage = async(req, res, next)=>{
    try{

        res.render('contact');

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const blogPage = async(req, res, next)=>{
    try {
        
        res.render('blog');

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const blogDetailPage = async(req, res, next)=>{
    try {
        
        res.render('blog-detail');

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const aboutPage = async(req, res, next)=>{
    try {
        
        res.render('about');

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

//checking the offer
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


// const homePage = async (req, res, next) => {
//     try {
//         // Pagination
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         // Fetch filter options
//         const colors = await Product.distinct("color");
//         const brands = await Product.distinct("brand");

//         // Build query object for filtering
//         let query = { isDeleted: false };
//         if (req.query.category) {
//             query.category = req.query.category;
//         }
//         if (req.query.color) {
//             query.color = req.query.color;
//         }
//         if (req.query.brand) {
//             query.brand = req.query.brand;
//         }

//         // Fetch products based on query
//         let products = await Product.find(query).populate('category').skip(skip).limit(limit);

//         // Handle sorting
//         if (req.query.sort) {
//             switch (req.query.sort) {
//                 case 'newness':
//                     products = products.sort((a, b) => b.createdAt - a.createdAt);
//                     break;
//                 case 'price-asc':
//                     products = products.sort((a, b) => a.price - b.price);
//                     break;
//                 case 'price-desc':
//                     products = products.sort((a, b) => b.price - a.price);
//                     break;
//                 default:
//                     break;
//             }
//         }

//         // Fetch categories
//         const categories = await Category.find({ is_delete: false });

//         // Check for offers and update product data
//         for (let i = 0; i < products.length; i++) {
//             const offerDetails = await checkOfferForProduct(products[i]);
//             products[i] = {
//                 ...products[i]._doc,
//                 discount: offerDetails.discount,
//                 discountPrice: offerDetails.discountPrice,
//                 specialOffer: offerDetails.specialOffer
//             };
//         }

//         // Count total products for pagination
//         const totalProducts = await Product.countDocuments(query);
//         const totalPages = Math.ceil(totalProducts / limit);

//         // Fetch user cart
//         const userId = req.session.user_id;
//         const userCarts = await Cart.findOne({ userId }).populate('cartItems.productId');
//         let totalProductsInCart = 0;
//         if (userCarts) {
//             totalProductsInCart = userCarts.cartItems.reduce((total, item) => total + item.quantity, 0);
//         }

//         // Render the index page with the fetched data
//         res.render('index', {
//             categories,
//             products,
//             totalProductsInCart,
//             userCart: userCarts,
//             currentPage: page,
//             totalPages,
//             limit,
//             colors,
//             brands
//         });

//     } catch (error) {
//         console.log('Error in homePage controller:', error.message);
//         res.status(500).send('Internal Server Error');
//         next(error);
//     }
// };




const fetchPageData = async (req) => {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch filter options
    const colors = await Product.distinct("color");
    const brands = await Product.distinct("brand");

    // Build query object for filtering
    let query = { isDeleted: false };
    if (req.query.category) {
        query.category = req.query.category;
    }
    if (req.query.color) {
        query.color = req.query.color;
    }
    if (req.query.brand) {
        query.brand = req.query.brand;
    }

    // Fetch products based on query
    let products = await Product.find(query).populate('category').skip(skip).limit(limit);

    // Handle sorting
    if (req.query.sort) {
        switch (req.query.sort) {
            case 'newness':
                products = products.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'price-asc':
                products = products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products = products.sort((a, b) => b.price - a.price);
                break;
            default:
                break;
        }
    }

    // Fetch categories
    const categories = await Category.find({ is_delete: false });

    // Check for offers and update product data
    for (let i = 0; i < products.length; i++) {
        const offerDetails = await checkOfferForProduct(products[i]);
        products[i] = {
            ...products[i]._doc,
            discount: offerDetails.discount,
            discountPrice: offerDetails.discountPrice,
            specialOffer: offerDetails.specialOffer
        };
    }

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch user cart
    const userId = req.session.user_id;
    const userCarts = await Cart.findOne({ userId }).populate('cartItems.productId');
    let totalProductsInCart = 0;
    if (userCarts) {
        totalProductsInCart = userCarts.cartItems.reduce((total, item) => total + item.quantity, 0);
    }

    return {
        categories,
        products,
        totalProductsInCart,
        userCart: userCarts,
        currentPage: page,
        totalPages,
        limit,
        colors,
        brands
    };
};

const homePage = async (req, res, next) => {
    try {
        const pageData = await fetchPageData(req);
        res.render('index', pageData);
    } catch (error) {
        console.log('Error in homePage controller:', error.message);
        res.status(500).send('Internal Server Error');
        next(error);
    }
};

const productPage = async (req, res, next) => {
    try {
        const pageData = await fetchPageData(req);
        res.render('product', pageData);
    } catch (error) {
        console.log('Error in productPage controller:', error.message);
        res.status(500).send('Internal Server Error');
        next(error);
    }
};

// const productPage = async(req, res, next)=>{
//     try {

//         res.render('product')
        
//     } catch (error) {
//         console.log(error.message);
//         next(error);
//     }
// }

const productDetail = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category');

        if (!product || product.status !== true) {
            // Handle case where product is not found or status is false
            return res.status(404).render('error', { message: 'Product not found or not available' });
        }

        // Fetch categories
        const categories = await Category.find({ is_delete: false });

        // Check for offers on the product
        const offerDetails = await checkOfferForProduct(product);

        // Integrate offer details into the product object
        const productWithOffer = {
            ...product._doc,
            discount: offerDetails.discount,
            discountPrice: offerDetails.discountPrice,
            specialOffer: offerDetails.specialOffer,
            offerName: offerDetails.offerName
        };

        res.render('product-detail', {
            product: productWithOffer,
            category: categories
        });
    } catch (error) {
        console.log(error.message);
        // res.status(500).render('error', { message: 'Internal Server Error' });
        next(error);
    }
};




// const productDetail = async (req, res) => {
//     try {
//         const productId = req.params.id; 
//         const product = await Product.findById(productId);
//         const category = await Category.find();

//         if (!product) {
//             // Handle case where product is not found
//             return res.status(404).render('error', { message: 'Product not found' });
//         }

//         res.render('product-detail', { product: product, category: category });
//     } catch (error) {
//         console.log(error.message);
//         // res.status(500).render('error', { message: 'Internal Server Error' });
//     }
// };


const cartPage = async(req, res, next)=>{
    try {
       
        const userId = req.session.user_id;
        const userCart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const product = userCart.cartItems.map(item => item.productId);
        res.render('shoping-cart', { userCart , product})
    } catch (error) {
        console.error(error.message);
        next(error);
    }
}

const registrationPage = async(req, res, next)=>{
    try {
        if(req.session.isUserAuthenticated){
            res.redirect('/index.html');
        }
        else{
            res.render('registration');
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const loginPage = async(req, res, next)=>{
    try {
        if(req.session.isUserAuthenticated){
            res.redirect('/index.html');
        }
        else{
            res.render('login');
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const otpPage = async(req, res, next)=>{
    try {
        if(req.session.isUserAuthenticated){
            res.redirect('/index.html');
        }else{
            res.render('otp')
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const otpVerification = async(req, res, next)=>{
    try {
         
        const { otp1, otp2, otp3, otp4 } = req.body;
        const userEnteredOTP = [otp1, otp2, otp3, otp4].join('') 
        const {email} = req.session.userData
       console.log(email)
        const storedOtp = await Otp.findOne({userEmail:email})

        // console.log(storedOtp.code);
        // const generatedOTP = req.session.otpData;

        if(userEnteredOTP == storedOtp.code){

            const userData = req.session.userData
           userData.is_verified = true
            
            await User.create(userData)
           
            res.redirect('login');

        }else{
            // res.send("<script>alert('Invalid OTP'); window.history.back();</script>");
            res.render('otp',{message:"Invalid OTP"});

            console.log("Invalid OTP");
        }
        
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const resentOTP = async(req, res, next)=>{
    try {
        await reSendEmail(req,res)

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}


const verifyLogin = async(req, res, next)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});
        

        if(userData){
         
           const passwordMatch = await bcrypt.compare(password,userData.password);
           
           if(passwordMatch){
            if(userData.is_verified){
                req.session.user_id = userData._id;
                req.session.isUserAuthenticated = true;
                res.redirect('/index.html');
            }else{
                res.render('login',{message:"your Account is blocked by Admin"});
            }      
           }
           else{
            res.render('login',{message:"Email or password is incorrect"});
           }

        }
        else{
            res.render('login',{message:"Email or password is incorrect"});
        }

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const userLogout = async(req, res, next)=>{
    try {
        
        req.session.destroy();
        res.redirect('login');

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const userProfile = async (req, res, next) => {
    try {

        const userId = req.session.user_id;

        // Assuming you're using Mongoose
        const user = await User.findById(userId);
        if (!user) {
            // User not found, handle this situation
            return res.status(404).send('User not found');
        }

        res.render('userProfile', { user: user });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
        next(error);
    }
}

const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const { fname, sname, username, number } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);

        // Update user fields if provided in the request
        if (fname) user.fname = fname;
        if (sname) user.sname = sname;
        if (username) user.username = username;
        if (number) user.number = number;

        // Save the updated user object
        await user.save();

        // Send a success response
        res.status(200).json({ message: "User profile updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
        next(error);
    }
};




const changePassword = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(userId);
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;

        await user.save();

        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
        next(error);
    }
};


const manageAddress = async(req, res, next)=>{
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        let addresses = await Address.find({ user_id: userId });
        const index = req.params.index;

        addresses = addresses.filter(address => address !== undefined);

        res.render('manageAddress', { user: user, addresses: addresses ,index:index});
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}


const newAddress = async (req, res, next) => {
    try {
        const id = req.session.user_id;

        const { Name, email, Mobile, pin, Locality, address, city, state, is_Home, is_Work } = req.body;

        const isHome = is_Home === 'true';
        const isWork = is_Work === 'true';

        const  newAddress = {
            Name: Name,
            email: email,
            Mobile: Mobile,
            PIN: pin,
            Locality: Locality,
            address: address,
            city: city,
            state: state,
            is_Home: isHome, 
            is_Work: isWork,
        };

        const alreadyExist = await Address.findOne({user_id:id});
        if(alreadyExist){
            const addAddress = await Address.findOneAndUpdate({user_id:id},{$push:{address:newAddress}},{new:true});
            return  res.sendStatus(200);   
        }
        else{
            const insertAddress = await Address.create({user_id:id,address:newAddress});
            return  res.sendStatus(200);
        }
        
    } catch (error) {
        console.log(error.message);
        res.sendStatus(500); 
        next(error);
    }
}


const updateAddress = async (req, res, next) => {
    try {
        const id = req.session.user_id;
        const index = req.params.index;
        
        const updatedAddress = req.body

        const userAddress = await Address.findOne({ user_id: id });
        if (!userAddress) {
            return res.status(404).json({ message: 'User address not found' });
        }

        if (index < 0 || index >= userAddress.address.length) {
            return res.status(400).json({ message: 'Invalid address index' });
        }

        userAddress.address[index] = updatedAddress;

        await userAddress.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error.message);
        res.sendStatus(500);
        next(error);
    }
}


const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const addressId = req.params.addressId;

        const userAddress = await Address.findOne({ user_id: userId });

        if (!userAddress) {
            return res.status(404).json({ message: 'User address not found' });
        }

        const addressIndex = userAddress.address.findIndex(addr => addr._id.toString() === addressId);

        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        userAddress.address.splice(addressIndex, 1);

        await userAddress.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error.message);
        res.sendStatus(500);
        next(error);
    }
}

const addToCart = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.productId;
        const quantity = req.body.quantity || 1;

        // Fetch the product details
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check for any available offers for the product
        const offerDetails = await checkOfferForProduct(product);

        // Calculate the price to be added to the cart
        const priceToUse = offerDetails.specialOffer ? offerDetails.discountPrice : product.price;
        console.log('Calculated Price:', priceToUse);

        // Find the user's cart
        let userCart = await Cart.findOne({ userId });
        if (!userCart) {
            if (!userId) {
                throw new Error('User ID is required to create a cart');
            }
            // Create a new cart if it doesn't exist
            userCart = new Cart({
                userId,
                cartItems: [{ productId, quantity, price: priceToUse }]
            });
        } else {
            // Check if the product already exists in the cart
            const existingItem = userCart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                // Update the quantity and price if the product already exists in the cart
                existingItem.quantity += quantity;
                existingItem.price = priceToUse;
            } else {
                // Add the new product to the cart
                userCart.cartItems.push({ productId, quantity, price: priceToUse });
            }
        }

        // Save the updated cart
        await userCart.save();
        return res.status(200).json({ message: 'Item added to cart successfully' });
    } catch (error) {
        console.error('Error adding item to cart:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
        next(error);
    }
};


// const addToCart = async (req, res) => {
//     try {
       
//         const userId = req.session.user_id
//         const productId  = req.body.productId;
//         const  quantity = req.body. quantity || 1
//         let userCart = await Cart.findOne({ userId });
//         if (!userCart) {
//             if (!userId) {
//                 throw new Error('User ID is required to create a cart');
//             }
//             userCart = new Cart({
//                 userId,
//                 cartItems: [{ productId, quantity }]
//             });
//         } else { 
//              const existingItem = userCart.cartItems.find(item => item.productId.equals(productId));
//             if (existingItem) {
//                 existingItem.quantity += quantity;
//             } else {
//                 userCart.cartItems.push({ productId, quantity });
//             }
//         }
//         await userCart.save();
//         return res.status(200).json({ message: 'Item added to cart successfully' });
//     } catch (error) {
//         console.log(error.message);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

const updateQuantity = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;
        const change = parseInt(req.query.change);
        // console.log("userId :"+ userId);
        // console.log("proId :"+ productId);
        // console.log("change :"+ change);



        let cart = await Cart.findOne({ userId: userId });

        const index = cart.cartItems.findIndex(item => item.productId.equals(productId));

        if (index !== -1) {
            cart.cartItems[index].quantity += change;

            if (cart.cartItems[index].quantity <= 0) {
                cart.cartItems.splice(index, 1);
            }
        }

        await cart.save();
        res.sendStatus(200)

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error'});
        next(error);
    }
}

const removeFromCart = async(req, res, next)=>{
    try {
        const productId = req.query.productId
        const userId = req.session.user_id

        const cart = await Cart.findOne({userId:userId})
        const index = cart.cartItems.findIndex((value)=>{
            return value.productId.toString()===productId
        })

        cart.cartItems.splice(index, 1)
        await cart.save()
        res.sendStatus(200)

    } catch (error) {
        console.log(error.message); 
        res.status(500).json({ error: 'Internal server error'});
        next(error);      
    }
}



const loadCheckout = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        // Fetch user addresses
        const userAddress = await Address.find({ user_id: userId });

        // Fetch user's cart with populated product and category details
        const cart = await Cart.findOne({ userId: userId }).populate({
            path: 'cartItems.productId',
            populate: { path: 'category' }
        });

        // Fetch active coupons
        const coupons = await Coupon.find({ status: true });

        if (!cart) {
            // Handle case where cart doesn't exist
            res.render('checkoutPage', { userAddress, cart: null });
            return;
        }

        // Calculate subtotal, offer discount, shipping cost, and total
        let subtotal = 0;
        let offerDiscount = 0;

        // Iterate through each item in the cart
        for (const item of cart.cartItems) {
            const product = item.productId;
            const { discountPrice, discount } = await checkOfferForProduct(product);
            const itemTotal = discountPrice * item.quantity;

            // Add to subtotal and offer discount
            subtotal += itemTotal;
            offerDiscount += (product.price - discountPrice) * item.quantity;
        }

        const shippingCost = 60;
        const total = subtotal + shippingCost;

        // Render checkout page with calculated values
        res.render('checkoutPage', {
            userAddress,
            cart,
            coupons,
            subtotal: subtotal.toFixed(2),
            offerDiscount: offerDiscount.toFixed(2),
            shippingCost: shippingCost.toFixed(2),
            total: total.toFixed(2)
        });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};




// const loadCheckout = async(req,res)=>{
//     try {
//         const userId = req.session.user_id
//         const userAddress = await Address.find({ user_id:userId }); 
//         const cart = await Cart.findOne({ userId:userId }).populate('cartItems.productId');
//         const coupons = await Coupon.find({ status: true });
        

//         if (!cart) {
//             // Handle case where cart doesn't exist
//             res.render('checkoutPage', { userAddress, cart: null });
//             return;
//         }

//         res.render('checkoutPage', { userAddress, cart,coupons })
//     } catch (error) {
//         console.log(error.message);
//     }
// }


// index search

// const searchProducts = async (req, res) => {
//     try {
//         const query = req.query.query;
//         console.log('Query:', query);

//         // Pagination
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         // Fetch filter options
//         const colors = await Product.distinct("color");
//         const brands = await Product.distinct("brand");

//         if (typeof query !== 'string') {
//             return res.status(400).send('Query parameter must be a string');
//         }

//         // Build query object for searching and filtering
//         let searchQuery = {
//             productName: { $regex: query, $options: 'i' },
//             isDeleted: false
//         };
//         if (req.query.category) {
//             searchQuery.category = req.query.category;
//         }
//         if (req.query.color) {
//             searchQuery.color = req.query.color;
//         }
//         if (req.query.brand) {
//             searchQuery.brand = req.query.brand;
//         }

//         // Sort option
//         let sortOption = {};
//         if (req.query.sort) {
//             switch (req.query.sort) {
//                 case 'newness':
//                     sortOption = { createdAt: -1 };
//                     break;
//                 case 'price-asc':
//                     sortOption = { price: 1 };
//                     break;
//                 case 'price-desc':
//                     sortOption = { price: -1 };
//                     break;
//                 default:
//                     break;
//             }
//         }

//         // Fetch products based on search and filtering query with sorting
//         let products = await Product.find(searchQuery).populate('category').sort(sortOption).skip(skip).limit(limit);

//         // Fetch filter options and user cart
//         const userId = req.session.user_id;
//         const categories = await Category.find({ is_delete: false });
//         const userCarts = await Cart.findOne({ userId }).populate('cartItems.productId');
//         let totalProductsInCart = 0;
//         if (userCarts) {
//             totalProductsInCart = userCarts.cartItems.reduce((total, item) => total + item.quantity, 0);
//         }

//         // Count total products for pagination
//         const totalProducts = await Product.countDocuments(searchQuery);
//         const totalPages = Math.ceil(totalProducts / limit);

//         // Render the search results page with the fetched data
//         res.render('index', {
//             totalProductsInCart,
//             colors,
//             brands,
//             userCart: userCarts,
//             products: products,
//             categories: categories,
//             currentPage: page,
//             totalPages,
//             limit
//         });
//     } catch (error) {
//         console.error('Error during product search:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };


const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const searchProducts = async (req, res) => {
    try {
        const query = req.query.query;
        console.log('Query:', query);

        // Check if query parameter is missing or not a string
        if (!query || typeof query !== 'string') {
            return res.status(400).send('Query parameter must be a string');
        }

        // Escape special characters in the query
        const sanitizedQuery = escapeRegex(query);

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch distinct filter options
        const colors = await Product.distinct("color");
        const brands = await Product.distinct("brand");

        // Build search query object
        let searchQuery = {
            $or: [
                { productName: { $regex: sanitizedQuery, $options: 'i' } },
                { variantName: { $regex: sanitizedQuery, $options: 'i' } },
                { categoryName: { $regex: sanitizedQuery, $options: 'i' } },
            ],
            isDeleted: false
        };

        // Apply additional filters if provided
        if (req.query.category) {
            searchQuery.category = req.query.category;
        }
        if (req.query.color) {
            searchQuery.color = req.query.color;
        }
        if (req.query.brand) {
            searchQuery.brand = req.query.brand;
        }

        // Sorting options
        let sortOption = {};
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'newness':
                    sortOption = { createdAt: -1 };
                    break;
                case 'price-asc':
                    sortOption = { price: 1 };
                    break;
                case 'price-desc':
                    sortOption = { price: -1 };
                    break;
                default:
                    break;
            }
        }

        // Fetch products based on search and filtering query with sorting
        let products = await Product.find(searchQuery)
                                    .populate('category')
                                    .sort(sortOption)
                                    .skip(skip)
                                    .limit(limit);

        // Fetch categories and user cart
        const userId = req.session.user_id;
        const categories = await Category.find({ is_delete: false });
        const userCart = await Cart.findOne({ userId }).populate('cartItems.productId');

        // Calculate total products in user's cart
        let totalProductsInCart = 0;
        if (userCart) {
            totalProductsInCart = userCart.cartItems.reduce((total, item) => total + item.quantity, 0);
        }

        // Count total matching products for pagination
        const totalProducts = await Product.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the search results page with fetched data
        res.render('index', {
            totalProductsInCart,
            colors,
            brands,
            userCart,
            products,
            categories,
            currentPage: page,
            totalPages,
            limit
        });

    } catch (error) {
        console.error('Error during product search:', error);
        res.status(500).send('Internal Server Error');
    }
};


// const searchProducts = async (req, res) => {
//     try {
//         const query = req.query.query;
//         console.log('Query:', query);

//         // Check if query parameter is missing or not a string
//         if (!query || typeof query !== 'string') {
//             return res.status(400).send('Query parameter must be a string');
//         }

//         // Pagination setup
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         // Fetch distinct filter options
//         const colors = await Product.distinct("color");
//         const brands = await Product.distinct("brand");

//         // Build search query object
//         let searchQuery = {
//             productName: { $regex: query, $options: 'i' },
//             isDeleted: false
//         };

//         // Apply additional filters if provided
//         if (req.query.category) {
//             searchQuery.category = req.query.category;
//         }
//         if (req.query.color) {
//             searchQuery.color = req.query.color;
//         }
//         if (req.query.brand) {
//             searchQuery.brand = req.query.brand;
//         }

//         // Sorting options
//         let sortOption = {};
//         if (req.query.sort) {
//             switch (req.query.sort) {
//                 case 'newness':
//                     sortOption = { createdAt: -1 };
//                     break;
//                 case 'price-asc':
//                     sortOption = { price: 1 };
//                     break;
//                 case 'price-desc':
//                     sortOption = { price: -1 };
//                     break;
//                 default:
//                     break;
//             }
//         }

//         // Fetch products based on search and filtering query with sorting
//         let products = await Product.find(searchQuery)
//                                     .populate('category')
//                                     .sort(sortOption)
//                                     .skip(skip)
//                                     .limit(limit);

//         // Fetch categories and user cart
//         const userId = req.session.user_id;
//         const categories = await Category.find({ is_delete: false });
//         const userCart = await Cart.findOne({ userId }).populate('cartItems.productId');

//         // Calculate total products in user's cart
//         let totalProductsInCart = 0;
//         if (userCart) {
//             totalProductsInCart = userCart.cartItems.reduce((total, item) => total + item.quantity, 0);
//         }

//         // Count total matching products for pagination
//         const totalProducts = await Product.countDocuments(searchQuery);
//         const totalPages = Math.ceil(totalProducts / limit);

//         // Render the search results page with fetched data
//         res.render('index', {
//             totalProductsInCart,
//             colors,
//             brands,
//             userCart,
//             products,
//             categories,
//             currentPage: page,
//             totalPages,
//             limit
//         });

//     } catch (error) {
//         console.error('Error during product search:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };



module.exports = {
    contactPage,
    blogPage,
    aboutPage,
    blogDetailPage,
    homePage,
    productPage,
    productDetail,
    cartPage,
    registrationPage,
    insertUser,
    loginPage,
    otpPage,
    otpVerification,
    resentOTP,
    verifyLogin,
    userLogout,
    userProfile,
    updateUserProfile,
    changePassword,
    manageAddress,
    newAddress,
    updateAddress,
    deleteAddress,
    addToCart,
    updateQuantity,
    removeFromCart,
    loadCheckout,
    searchProducts
}