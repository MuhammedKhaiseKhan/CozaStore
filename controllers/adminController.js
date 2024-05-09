const User = require('../model/userSchema');
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');
// const productSchema = require('../model/admin/productSchema');

const loadLogin = async(req,res)=>{
    try {
        if (req.session.isAdminAuthenticated) {
            // If admin is already authenticated, redirect to the admin dashboard
            res.redirect('/admin/index.html');
        } else {
            // Otherwise, load the login page
            res.render('signin');
        }
       
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async(req,res)=>{
    try {
        email = process.env.APP_ADMIN_NAME
        password = process.env.APP_ADMIN_PASS
        typedMail = req.body.email
        typedPass = req.body.password
        if(typedMail === email && typedPass === password){

            //res.redirect('/admin/index.html');
            req.session.isAdminAuthenticated = true;
            res.redirect('/admin/index.html')
        }
        else{
            res.render('signin',{message:"Email or password is incorrect"});

            console.log("Invalid input");
        }

    } catch (error) {
        console.log(error.message);
    }
}

const userManage = async(req,res)=>{
    try {
        const usersData = await User.find({});
        res.render('userManagement',{users:usersData});
    } catch (error) {
        console.log(error.message);
    }
}

const indexPage = async(req,res)=>{
    try {
        res.render('index');
    } catch (error) {
        console.log(error.message);
    }
}

const categoryPage = async(req,res)=>{
    try {
        // res.render('categoryManagement');
        const categoryData = await Category.find();
        res.render('categoryManagement', { categoryData });
    } catch (error) {
        console.log(error.message);
    }
}

const productPage = async(req,res)=>{
    try {

        const productData = await Product.find().populate('category');
    
     

        res.render('productManagement',{productData});
    } catch (error) {
        console.log(error.message);
    }
}


const blockAndUnblockUser = async (req, res) => {
    try {
        const id = req.query.id; 
        const userData = await User.findById(id); 

        
        userData.is_verified = !userData.is_verified;
        await userData.save(); 
        
        
        let message = userData.is_verified ? "User blocked successfully" : "User unblocked successfully";

        res.status(200).json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle block status' });
    }
};

const userSearch = async(req,res)=>{
    try {
        
        let users = [];
        if(req.query.search){

            users = await User.find({ $or: [{ fname: { $regex: req.query.search, $options: 'i' }}, { sname: { $regex: req.query.search, $options: 'i' }}]});

        }
        else{
            users = await User.find();
        }
         res.render('userManagement',{ users });

    } catch (error) {
        console.log(error.message);
        res.render('error');
    }
}

const addCategory = async(req,res)=>{
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error.message);
    }
}

//Adding new category 

const newCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if the category name already exists
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.render('add-category', { message: "This category is already added" });
        }

        // If the category name is unique, proceed with adding the new category
        const imagePath = `/category/${req.file.filename}`;

        // Create a new category object
        const newCategory = new Category({
            name: name,
            description: description,
            image: imagePath
        });

        // Save the category to the database
        await newCategory.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
        // Handle error appropriately
    }
}


// loading edit category page

const editCategoryPage = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send('Category not found for ID: ' + categoryId);
        }
        
        res.render('edit-category',{category});
        
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).render('error', { message: 'Error fetching category' });
    }
}

// editing category and save
const updateCategory = async (req, res) => {
    try {
        let image;
        if (req.file) {
            const imagePath = `/category/${req.file.filename}`;
            image = imagePath;
        }
        
        const categoryId = req.params.id;
        const { name, description } = req.body;

        const categoryData = await Category.findById(categoryId);

        // Check if the updated category name already exists, excluding the current category
        const alreadyExist = await Category.findOne({ 
            _id: { $ne: categoryId }, // Exclude the current category from the search
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive match
        });

        if (alreadyExist) {
            return res.render('edit-category', { category: categoryData, message: "This category is already added" });
        }

        // Prepare update object based on fields provided
        const updateObject = {};
        if (name) updateObject.name = name;
        if (description) updateObject.description = description;
        if (image) updateObject.image = image;

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateObject, { new: true });

        res.redirect('/admin/category'); 
    } catch (error) {
        console.log(error.message);
        // Handle error appropriately
    }
}


const categorySearch = async(req,res)=>{
    try {
        
        let categoryData = [];
        if(req.query.search){

            categoryData = await Category.find({ $or: [{ name: { $regex: req.query.search, $options: 'i' }}, { sname: { $regex: req.query.search, $options: 'i' }}]});

        }
        else{
            categoryData = await Category.find();
        }
         res.render('categoryManagement', { categoryData });

    } catch (error) {
        console.log(error.message);
        res.render('error');
    }
}

const categoryDelete = async (req, res) => {
    try {
        const id = req.query.id; 
        const category = await Category.findById(id); 

        // Toggle the is_delete field
        category.is_delete = !category.is_delete;
        await category.save(); 
        
        let message = category.is_delete ? "Category deleted successfully" : "Category undeleted successfully";

        res.status(200).json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        // Handle error
    }
}

//Load add product page

const addProduct = async(req,res)=>{
    try {

        const allCatagories = await Category.find()
        

        res.render('add-product',{category:allCatagories})
    } catch (error) {
        console.log(error.message);
    }
}

// Adding new product

const newProduct = async (req, res) => {
    try {
        const { productName, brandName, size, color, category, inStock, originalPrice, discountPrice, discount, description } = req.body;

        // // Convert product name to case-insensitive regular expression
        // const regexPattern = new RegExp(`^${productName}$`, 'i');
        
        // // Check if a product with the same name already exists
        // const alreadyExist = await Product.findOne({ productName: regexPattern });

        // if (alreadyExist) {
        //     return res.render('add-product', { message: "This product is already added" });
        // }

        // Create an array to store the image paths
        const imagePaths = [];

        req.files.forEach(file => {
            imagePaths.push(`/product/${file.filename}`);
        });

        // Creating a new product object
        const newProduct = new Product({
            productName: productName,
            brand: brandName,
            size: size,
            color: color,
            category: category,
            description: description,
            price: originalPrice,
            discountPrice: discountPrice,
            discount: discount,
            image: imagePaths,
            inStock: inStock
        });

        await newProduct.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error.message);
        res.sendStatus(500);
    }
}

// Product Soft delete 

const productDelete = async (req, res) => {
    try {
        const id = req.query.id; 
        const product = await Product.findById(id); 

        // Toggle the is_delete field
        product.isDeleted = !product.isDeleted;
        await product.save(); 
        
        let message = product.isDeleted ? "Product deleted successfully" : "Product undeleted successfully";

        res.status(200).json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        // Handle error
    }
}

// Product search 

const productSearch = async (req, res) => {
    try {
        let productData = [];
        if (req.query.search) {
            const searchTerm = new RegExp(req.query.search, 'i');
            const category = await Category.findOne({ name: searchTerm });
            if (category) {
                productData = await Product.find({
                    $or: [
                        { productName: searchTerm },
                        { category: category._id } 
                    ]
                });
            } else {
               
                productData = await Product.find({ productName: searchTerm });
            }
        } else {
            productData = await Product.find();
        }
        res.render('productManagement', { productData });
    } catch (error) {
        console.log(error.message);
    }
};


const adminLogout = (req, res) => {
    
    req.session.destroy()
       
     res.redirect('/admin/signin');
}

// loading edit product page

const editProduct = async(req,res)=>{
    try {
  
        const ProductId = req.params.id;
        
        
        const product = await Product.findById(ProductId).populate('category');
        
    
        if (!product) {
            return res.status(404).send('product not found for ID: ' + ProductId);
        }
        const categories = await Category.find(); // Assuming Category is your category model

        // Pass both product and category data to the template
        res.render('edit-product', { product, category: categories });
        
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).render('error', { message: 'Error fetching category' });
    }
}

//edit and save product

const updateProduct = async (req, res) => {
    try {
        // Check if there's a file uploaded for image
        let image;
        if (req.file) {
            const imagePath = `/product/${req.file.filename}`;
            image = imagePath;
        }
        
        const productId = req.params.id;
        const { productName, brandName, size, color, category, inStock, originalPrice, discountPrice, discount, description } = req.body;

        const productData = await Product.findById(productId);

        // Check if the updated product name already exists, excluding the current product
        const alreadyExist = await Product.findOne({ 
            _id: { $ne: productId }, // Exclude the current product from the search
            productName: { $regex: new RegExp(`^${productName}$`, 'i') } // Case-insensitive match
        });

        if (alreadyExist) {
            return res.render('edit-product', { product: productData, message: "This product is already added" });
        }

        //  const categoryObject = await Category.findOne({ name: category });

        // if (!categoryObject) {
        //     // Handle case where category is not found
        //     return res.render('edit-product', { product: productData, message: "Category not found" });
        // }

        // Prepare update object based on fields provided
        const updateObject = {};
        if (productName) updateObject.productName = productName;
        if (brandName) updateObject.brand = brandName;
        if (size) updateObject.size = size;
        if (color) updateObject.color = color;
        // if (category) updateObject.category = category;
        if (description) updateObject.description = description;
        if (originalPrice) updateObject.price = originalPrice;
        if (discountPrice) updateObject.discountPrice = discountPrice;
        if (discount) updateObject.discount = discount;
        if (image) updateObject.image = image;
        if (inStock) updateObject.inStock = inStock;

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateObject, { new: true });

        res.redirect('/admin/product'); 
    } catch (error) {
        console.log(error.message);
        // Handle error appropriately
    }
}





module.exports = {
    userManage,
    indexPage,
    loadLogin,
    verifyLogin,
    categoryPage,
    productPage,
    blockAndUnblockUser,
    userSearch,
    addCategory,
    newCategory,
    editCategoryPage,
    updateCategory,
    categorySearch,
    categoryDelete,
    addProduct,
    newProduct,
    productDelete,
    productSearch,
    adminLogout,
    editProduct,
    updateProduct


}