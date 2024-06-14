const express = require("express");
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");
const session = require("express-session");
const adminAuth = require('../middleware/adminAuth');
const configureStorage = require('../util/multer');
const nocache = require("nocache");

const admin_route = express();

//multer upload folders
const categoryUpload = configureStorage('category');
const productUpload = configureStorage('product');


admin_route.use(session({
    secret:process.env.SESSION_KEY,
    resave:false,
    saveUninitialized:true
}));

admin_route.use(nocache());

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));



// admin controller 
admin_route.get('/index.html',adminAuth,adminController.indexPage);
admin_route.get('/userManagement',adminAuth,adminController.userManage);
admin_route.get('/signin',adminController.loadLogin);
admin_route.get('/userSearch',adminAuth,adminController.userSearch);
admin_route.get('/logout',adminAuth,adminController.adminLogout);
admin_route.get('/salesReport',adminAuth,adminController.salesReport);

admin_route.post('/signin',adminController.verifyLogin);
admin_route.post('/toggle-block-user',adminAuth,adminController.blockAndUnblockUser);
admin_route.post('/downloadExcel',adminAuth,adminController.downloadExcel);


//category Controller
admin_route.get('/category',adminAuth,categoryController.categoryPage);
admin_route.get('/add-category',adminAuth,categoryController.addCategory);
admin_route.get('/edit-category/:id',adminAuth, categoryController.editCategoryPage);
admin_route.get('/categorySearch',adminAuth,categoryController.categorySearch);

admin_route.post('/add-category',adminAuth, categoryUpload.single('image'),categoryController.newCategory);
admin_route.post('/edit-category/:id',adminAuth, categoryUpload.single('image'), categoryController.updateCategory);
admin_route.post('/toggle-category',adminAuth,categoryController.categoryDelete);


// product controller
admin_route.get('/product',adminAuth,productController.productPage);
admin_route.get('/add-product',adminAuth,productController.addProduct);
admin_route.get('/productSearch',adminAuth,productController.productSearch);
admin_route.get('/edit-product/:id',adminAuth,productController.editProduct);

admin_route.post('/add-product/',adminAuth,productUpload.any(),productController.newProduct);
admin_route.post('/update-product/:id',adminAuth,productUpload.any(),productController.updateProduct);
admin_route.post('/toggle-product',adminAuth,productController.productDelete);


// order controller
admin_route.get('/orderManagement',adminAuth,orderController.orderManagement);
admin_route.post('/updateOrderStatus',adminAuth,orderController.updateOrderStatus);
admin_route.post('/approveReturn',adminAuth,orderController.approveReturn);


//coupon controller
admin_route.get('/couponManagement',adminAuth,couponController.couponManagementLoad);
admin_route.get('/addCoupon',adminAuth,couponController.addCouponLoad);

admin_route.post('/addCoupon',adminAuth,couponController.addCoupon);
admin_route.post('/couponStatusChange',adminAuth,couponController.couponStatusChange);


module.exports = admin_route;

