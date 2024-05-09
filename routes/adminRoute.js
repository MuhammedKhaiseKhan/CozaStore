const express = require("express");
const adminController = require("../controllers/adminController");
const session = require("express-session");
const adminAuth = require('../middleware/adminAuth');
const configureStorage = require('../util/multer');
const nocache = require("nocache");

// const multer = require('multer');


const admin_route = express();

// const categoryUpload = configureStorage('./public/uploads/category');
const categoryUpload = configureStorage('category');
const productUpload = configureStorage('product');
// const categoryStorage = multer({storage:categoryUpload})



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
// admin_route.use(express.static('public/assets/admin/assets'));



admin_route.get('/index.html',adminAuth,adminController.indexPage);
admin_route.get('/userManagement',adminAuth,adminController.userManage);
admin_route.get('/signin',adminController.loadLogin);
admin_route.get('/category',adminAuth,adminController.categoryPage);
admin_route.get('/product',adminAuth,adminController.productPage);
admin_route.get('/userSearch',adminAuth,adminController.userSearch);
admin_route.get('/add-category',adminAuth,adminController.addCategory);
admin_route.get('/edit-category/:id',adminAuth, adminController.editCategoryPage);
admin_route.get('/categorySearch',adminAuth,adminController.categorySearch);
admin_route.get('/add-product',adminAuth,adminController.addProduct);
admin_route.get('/productSearch',adminAuth,adminController.productSearch);
admin_route.get('/logout',adminAuth,adminController.adminLogout);
admin_route.get('/edit-product/:id',adminAuth,adminController.editProduct);



admin_route.post('/signin',adminController.verifyLogin);
admin_route.post('/toggle-block-user',adminAuth,adminController.blockAndUnblockUser);
admin_route.post('/add-category',adminAuth, categoryUpload.single('image'),adminController.newCategory);
admin_route.post('/edit-category/:id',adminAuth, categoryUpload.single('image'), adminController.updateCategory);
admin_route.post('/toggle-category',adminAuth,adminController.categoryDelete);
admin_route.post('/toggle-product',adminAuth,adminController.productDelete);
admin_route.post('/add-product/',adminAuth,productUpload.any(),adminController.newProduct);
admin_route.post('/update-product/:id',adminAuth,productUpload.any(),adminController.updateProduct);




module.exports = admin_route;

