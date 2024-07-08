const express = require("express");
const userController = require("../controllers/userController");
const session = require("express-session");
const userAuth = require('../middleware/auth');
const nocache = require("nocache");
const orderController = require("../controllers/orderController");
const wishlistController = require("../controllers/wishlistController");
const couponController = require("../controllers/couponController");


const user_route = express();

user_route.use(session({
    secret:process.env.SESSION_KEY,
    resave:false,
    saveUninitialized:true
}));


user_route.use(nocache());


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.get('/contact.html',userController.contactPage);
user_route.get('/blog.html',userController.blogPage);
user_route.get('/about.html',userController.aboutPage);
user_route.get('/blog-detail.html',userController.blogDetailPage);
user_route.get('/index.html',userAuth,userController.homePage);
user_route.get('/product.html',userAuth,userController.productPage);

user_route.get('/product-detail.html/:id',userAuth, userController.productDetail);
user_route.get('/shoping-cart.html',userAuth,userController.cartPage);
user_route.get('/registration', userController.registrationPage);
user_route.get('/login',userController.loginPage);
user_route.get('/',userController.loginPage);
user_route.get('/otp',userController.otpPage);
user_route.get('/resentOTP',userController.resentOTP);
user_route.get('/logout',userAuth,userController.userLogout);
user_route.get('/userProfile',userAuth,userController.userProfile);
user_route.get('/manageAddress',userAuth,userController.manageAddress);
user_route.get('/removeFromCart',userAuth,userController.removeFromCart);
user_route.get('/checkoutPage',userAuth,userController.loadCheckout);
user_route.get('/search',userAuth,userController.searchProducts);



user_route.post('/register',userController.insertUser);
user_route.post('/otpVerify',userController.otpVerification);
user_route.post('/login-verify',userController.verifyLogin);
user_route.post('/updateProfile',userAuth,userController.updateUserProfile);
user_route.post('/changePassword',userAuth,userController.changePassword);
user_route.post('/newAddress',userAuth,userController.newAddress);
user_route.post('/updateAddress/:index',userAuth, userController.updateAddress);
user_route.post('/add-to-cart',userAuth,userController.addToCart);
user_route.post('/updateQuantity',userAuth,userController.updateQuantity);



user_route.delete('/deleteAddress/:addressId',userAuth,userController.deleteAddress);


//order controller
user_route.get('/orderDetails',userAuth,orderController.orderDetails);
user_route.get('/orders',userAuth,orderController.orders);
user_route.get('/cancelOrder',userAuth,orderController.cancellOrder);
user_route.get('/wallet',userAuth,orderController.loadWallet);
user_route.get('/download-invoice/:orderId',userAuth,orderController.invoiceDownload);

user_route.post('/place-order',userAuth,orderController.placeOrder);
user_route.post('/verifyPayment',userAuth,orderController.verifyPayment);
user_route.post('/returnOrder',userAuth,orderController.requestForReturn);
user_route.post('/getPaymentDetails',userAuth,orderController.getPaymentDetails);

//wishlist controller
user_route.get('/wishlist',userAuth, wishlistController.getWishlist);

user_route.post('/addToWishlist', userAuth,wishlistController.addToWishlist);
user_route.post('/removeFromWishlist',userAuth, wishlistController.removeFromWishlist);


//coupon controller

user_route.post('/apply-coupon',userAuth,couponController.applyCoupon);
user_route.post('/remove-coupon', userAuth, couponController.removeCoupon);



module.exports = user_route;