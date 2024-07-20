const User = require('../model/userSchema');
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');


const productPage = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of products per page
        const skip = (page - 1) * limit;

        const productData = await Product.find().populate('category').skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments();

        res.render('productManagement', {
            productData,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            search: ''
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}


//Load add product page
const addProduct = async(req, res, next)=>{
    try {

        const allCatagories = await Category.find()
        

        res.render('add-product',{category:allCatagories})
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

// Product search 
const productSearch = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of products per page
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';
        const searchTerm = new RegExp(searchQuery, 'i');

        let productData = [];
        let totalProducts = 0;

        if (searchQuery) {
            const category = await Category.findOne({ name: searchTerm });
            if (category) {
                productData = await Product.find({
                    $or: [
                        { productName: searchTerm },
                        { category: category._id }
                    ]
                }).skip(skip).limit(limit);
                totalProducts = await Product.countDocuments({
                    $or: [
                        { productName: searchTerm },
                        { category: category._id }
                    ]
                });
            } else {
                productData = await Product.find({ productName: searchTerm }).skip(skip).limit(limit);
                totalProducts = await Product.countDocuments({ productName: searchTerm });
            }
        } else {
            productData = await Product.find().skip(skip).limit(limit);
            totalProducts = await Product.countDocuments();
        }

        res.render('productManagement', {
            productData,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            search: searchQuery
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


// loading edit product page
const editProduct = async(req, res, next)=>{
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
        next(error);
    }
}

// Adding new product
const newProduct = async (req, res, next) => {
    try {
        const { productName, brandName, size, color, category, inStock, originalPrice, discountPrice, discount, description } = req.body;

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
        next(error);
    }
}

//edit and save product
const updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const { productName, brandName, size, color, category, inStock, originalPrice, discountPrice, discount, description } = req.body;

        // Fetch the existing product data
        const productData = await Product.findById(productId);

        // Check if the updated product name already exists, excluding the current product
        const alreadyExist = await Product.findOne({ 
            _id: { $ne: productId },
            productName: { $regex: new RegExp(`^${productName}$`, 'i') }
        });

        if (alreadyExist) {
            return res.render('edit-product', { product: productData, message: "This product name is already in use." });
        }

        // Prepare update object based on fields provided
        const updateObject = {};
        if (productName) updateObject.productName = productName;
        if (brandName) updateObject.brand = brandName;
        if (size) updateObject.size = size;
        if (color) updateObject.color = color;
        if (category) updateObject.category = category;
        if (description) updateObject.description = description;
        if (originalPrice) updateObject.price = originalPrice;
        if (discountPrice) updateObject.discountPrice = discountPrice;
        if (discount) updateObject.discount = discount;
        if (inStock) updateObject.inStock = inStock;

        // Handle image updates if new files are provided
        if (req.files && req.files.length > 0) {
            // Get the current images
            const currentImages = productData.image || [];
            
            // Update images based on their index
            req.files.forEach((file, index) => {
                const newImagePath = `/product/${file.filename}`;
                if (index < currentImages.length) {
                    // Replace existing image
                    currentImages[index] = newImagePath;
                } else {
                    // Add new image
                    currentImages.push(newImagePath);
                }
            });

            // Update the image array in the updateObject
            updateObject.image = currentImages;
        }

        // Update the product in the database
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateObject, { new: true });

        // Redirect or send response as per your application's logic
        res.redirect('/admin/product'); 
    } catch (error) {
        console.error('Error while updating product:', error);
        next(error);
    }
}


// Product Soft delete 
const productDelete = async (req, res, next) => {
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
        next(error);
    }
}



module.exports = {
    productPage,
    addProduct,
    newProduct,
    productDelete,
    productSearch,
    editProduct,
    updateProduct
}
