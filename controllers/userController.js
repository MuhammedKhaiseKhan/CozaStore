
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





const securePassword = async (password)=>{
    try {
        const passwordHash = bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async(req,res)=>{
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
    }
}


const contactPage = async(req,res)=>{
    try{

        res.render('contact');

    } catch (error) {
        console.log(error.message);
    }
}

const blogPage = async(req,res)=>{
    try {
        
        res.render('blog');

    } catch (error) {
        console.log(error.message);
    }
}

const blogDetailPage = async(req,res)=>{
    try {
        
        res.render('blog-detail');

    } catch (error) {
        console.log(error.message);
    }
}

const aboutPage = async(req,res)=>{
    try {
        
        res.render('about');

    } catch (error) {
        console.log(error.message);
    }
}

const homePage = async (req, res) => {
    try {
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

        // Render the index page with the fetched data
        res.render('index', {
            categories,
            products,
            totalProductsInCart,
            userCart: userCarts,
            currentPage: page,
            totalPages,
            limit,
            colors,
            brands
        });

    } catch (error) {
        console.log('Error in homePage controller:', error.message);
        res.status(500).send('Internal Server Error');
    }
}


// const homePage = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         const categories = await Category.find({ is_delete: false });
//         const products = await Product.find({ isDeleted: false }).skip(skip).limit(limit);
//         const totalProducts = await Product.countDocuments({ isDeleted: false });
//         const totalPages = Math.ceil(totalProducts / limit);

//         const userId = req.session.user_id;
//         const userCarts = await Cart.findOne({ userId }).populate('cartItems.productId');
//         let totalProductsInCart = 0;
//         if (userCarts) {
//             totalProductsInCart = userCarts.cartItems.reduce((total, item) => total + item.quantity, 0);
//         }

//         res.render('index', {
//             categories,
//             products,
//             totalProductsInCart,
//             userCart: userCarts,
//             currentPage: page,
//             totalPages,
//             limit
//         });

//     } catch (error) {
//         console.log('Error in homePage controller:', error.message);
//         res.status(500).send('Internal Server Error');
//     }
// }



const productPage = async(req,res)=>{
    try {

        res.render('product')
        
    } catch (error) {
        console.log(error.message);
    }
}
const productDetail = async (req, res) => {
    try {
        const productId = req.params.id; 
        const product = await Product.findById(productId);
        const category = await Category.find();

        if (!product) {
            // Handle case where product is not found
            return res.status(404).render('error', { message: 'Product not found' });
        }

        res.render('product-detail', { product: product, category: category });
    } catch (error) {
        console.log(error.message);
        // res.status(500).render('error', { message: 'Internal Server Error' });
    }
};


const cartPage = async(req,res)=>{
    try {
       
        const userId = req.session.user_id;
        const userCart = await Cart.findOne({ userId }).populate('cartItems.productId');
        const product = userCart.cartItems.map(item => item.productId);
        res.render('shoping-cart', { userCart , product})
    } catch (error) {
        console.error(error.message);
    }
}

const registrationPage = async(req,res)=>{
    try {
        if(req.session.isUserAuthenticated){
            res.redirect('/index.html');
        }
        else{
            res.render('registration');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loginPage = async(req,res)=>{
    try {
        if(req.session.isUserAuthenticated){
            res.redirect('/index.html');
        }
        else{
            res.render('login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const otpPage = async(req,res)=>{
    try {
        if(req.session.isUserAuthenticated){
            res.redirect('/index.html');
        }else{
            res.render('otp')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const otpVerification = async(req,res)=>{
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
    }
}

const resentOTP = async(req,res)=>{
    try {
        await reSendEmail(req,res)

    } catch (error) {
        console.log(error.message);
    }
}


const verifyLogin = async(req,res)=>{
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
    }
}

const userLogout = async(req,res)=>{
    try {
        
        req.session.destroy();
        res.redirect('login');

    } catch (error) {
        console.log(error.message);
    }
}

const userProfile = async (req, res) => {
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
    }
}

const updateUserProfile = async (req, res) => {
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
        // Handle errors
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




const changePassword = async (req, res) => {
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

    }
};


const manageAddress = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        let addresses = await Address.find({ user_id: userId });
        const index = req.params.index;

        addresses = addresses.filter(address => address !== undefined);

        res.render('manageAddress', { user: user, addresses: addresses ,index:index});
    } catch (error) {
        console.log(error.message);
    }
}


const newAddress = async (req, res) => {
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
    }
}


const updateAddress = async (req, res) => {
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
    }
}


const deleteAddress = async (req, res) => {
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
    }
}


const addToCart = async (req, res) => {
    try {
       
        const userId = req.session.user_id
        const productId  = req.body.productId;
        const  quantity = req.body. quantity || 1
        let userCart = await Cart.findOne({ userId });
        if (!userCart) {
            if (!userId) {
                throw new Error('User ID is required to create a cart');
            }
            userCart = new Cart({
                userId,
                cartItems: [{ productId, quantity }]
            });
        } else { 
             const existingItem = userCart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                userCart.cartItems.push({ productId, quantity });
            }
        }
        await userCart.save();
        return res.status(200).json({ message: 'Item added to cart successfully' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateQuantity = async (req, res) => {
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
        res.status(500).json({ error: 'Internal server error' });
    }
}

const removeFromCart = async(req,res)=>{
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
        res.status(500).json({ error: 'Internal server error' });      
    }
}

const loadCheckout = async(req,res)=>{
    try {
        const userId = req.session.user_id
        const userAddress = await Address.find({ user_id:userId }); 
        const cart = await Cart.findOne({ userId:userId }).populate('cartItems.productId');
        const coupons = await Coupon.find({ status: true });
        

        if (!cart) {
            // Handle case where cart doesn't exist
            res.render('checkoutPage', { userAddress, cart: null });
            return;
        }

        res.render('checkoutPage', { userAddress, cart,coupons })
    } catch (error) {
        console.log(error.message);
    }
}


// index search

const searchProducts = async (req, res) => {
    try {
        const query = req.query.query;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch filter options
        const colors = await Product.distinct("color");
        const brands = await Product.distinct("brand");

        // Build query object for searching and filtering
        let searchQuery = {
            productName: { $regex: query, $options: 'i' },
            isDeleted: false
        };
        if (req.query.category) {
            searchQuery.category = req.query.category;
        }
        if (req.query.color) {
            searchQuery.color = req.query.color;
        }
        if (req.query.brand) {
            searchQuery.brand = req.query.brand;
        }

        // Sort option
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
        let products = await Product.find(searchQuery).populate('category').sort(sortOption).skip(skip).limit(limit);

        // Fetch filter options and user cart
        const userId = req.session.user_id;
        const categories = await Category.find({ is_delete: false });
        const userCarts = await Cart.findOne({ userId }).populate('cartItems.productId');
        let totalProductsInCart = 0;
        if (userCarts) {
            totalProductsInCart = userCarts.cartItems.reduce((total, item) => total + item.quantity, 0);
        }

        // Count total products for pagination
        const totalProducts = await Product.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the search results page with the fetched data
        res.render('index', {
            totalProductsInCart,
            colors,
            brands,
            userCart: userCarts,
            products: products,
            categories: categories,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Error during product search:', error);
        res.status(500).send('Internal Server Error');
    }
};


  





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