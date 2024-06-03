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



const blockAndUnblockUser = async (req, res) => {
    try {
        const id = req.query.id; 
        const userData = await User.findById(id); 

        
        userData.is_verified = !userData.is_verified;
        await userData.save(); 
        
        
        let message = userData.is_verified ? "User blocked successfully" : "User unblocked successfully";
        req.session.isUserAuthenticated = false;

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

const adminLogout = (req, res) => {
    
    req.session.destroy()
       
     res.redirect('/admin/signin');
}


module.exports = {
    userManage,
    indexPage,
    loadLogin,
    verifyLogin,
    blockAndUnblockUser,
    userSearch,
    adminLogout,
}