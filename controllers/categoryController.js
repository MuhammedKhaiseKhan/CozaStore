const User = require('../model/userSchema');
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');



const categoryPage = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of categories per page
        const skip = (page - 1) * limit;

        const categoryData = await Category.find().skip(skip).limit(limit);
        const totalCategories = await Category.countDocuments();

        res.render('categoryManagement', {
            categoryData,
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit)
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}


const addCategory = async(req,res, next)=>{
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

// loading edit category page

const editCategoryPage = async (req, res, next) => {
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
        next(error);
    }
}

const categorySearch = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of categories per page
        const skip = (page - 1) * limit;

        let categoryData = [];
        if (req.query.search) {
            const searchQuery = {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } }
                ]
            };
            categoryData = await Category.find(searchQuery).skip(skip).limit(limit);
            const totalCategories = await Category.countDocuments(searchQuery);

            res.render('categoryManagement', {
                categoryData,
                currentPage: page,
                totalPages: Math.ceil(totalCategories / limit)
            });
        } else {
            categoryData = await Category.find().skip(skip).limit(limit);
            const totalCategories = await Category.countDocuments();

            res.render('categoryManagement', {
                categoryData,
                currentPage: page,
                totalPages: Math.ceil(totalCategories / limit)
            });
        }
    } catch (error) {
        console.log(error.message);
        res.render('error');
        next(error);
    }
}


//Adding new category 

const newCategory = async (req, res, next) => {
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
        next(error);
    }
}


// editing category and save
const updateCategory = async (req, res, next) => {
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
        next(error);
    }
}

const categoryDelete = async (req, res, next) => {
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
        next(error);
    }
}



module.exports = {
    categoryPage,
    addCategory,
    newCategory,
    editCategoryPage,
    updateCategory,
    categorySearch,
    categoryDelete
}