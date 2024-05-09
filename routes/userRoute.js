const express = require("express");
const userController = require("../controllers/userController");
const session = require("express-session");
// const auth = require('../middleware/auth');
// const nocache = require("nocache");

const user_route = express();

user_route.use(session({
    secret:process.env.SESSION_KEY,
    resave:false,
    saveUninitialized:true
}));


// user_route.use(nocache());


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.get('/contact.html',userController.contactPage);
user_route.get('/blog.html',userController.blogPage);
user_route.get('/about.html',userController.aboutPage);
user_route.get('/blog-detail.html',userController.blogDetailPage);
user_route.get('/index.html',userController.homePage);
user_route.get('/product.html',userController.productPage);
user_route.get('/product-detail.html/:id', userController.productDetail);
user_route.get('/shoping-cart.html',userController.cartPage);
user_route.get('/registration',userController.registrationPage);
user_route.get('/login',userController.loginPage);
user_route.get('/otp',userController.otpPage);
user_route.get('/resentOTP',userController.resentOTP);
user_route.get('/logout',userController.userLogout);
user_route.get('/userProfile',userController.userProfile);
user_route.get('/manageAddress',userController.manageAddress);



user_route.post('/register',userController.insertUser);
user_route.post('/otpVerify',userController.otpVerification);
user_route.post('/login-verify',userController.verifyLogin);
user_route.post('/updateProfile',userController.updateUserProfile);
user_route.post('/changePassword',userController.changePassword);
user_route.post('/newAddress',userController.newAddress);
user_route.post('/updateAddress/:index', userController.updateAddress);
user_route.post('/add-to-cart',userController.addToCart);



user_route.delete('/deleteAddress/:addressId',userController.deleteAddress);


module.exports = user_route;