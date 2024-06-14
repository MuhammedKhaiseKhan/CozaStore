const User = require('../model/userSchema');
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');
const Order = require('../model/orderSchema');
const ExcelJS = require('exceljs');
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

const userManage = async (req, res) => {
    try {
        const perPage = 10; // Number of users per page
        const page = req.query.page || 1; // Current page number, default to 1

        // Fetch the total count of users
        const totalUsers = await User.countDocuments({});
        
        // Fetch users for the current page
        const usersData = await User.find({})
            .skip((perPage * page) - perPage)
            .limit(perPage);

        res.render('userManagement', {
            users: usersData,
            current: page,
            pages: Math.ceil(totalUsers / perPage),
            totalUsers: totalUsers
        });
    } catch (error) {
        console.log(error.message);
    }
};

// const userManage = async(req,res)=>{
//     try {
//         const usersData = await User.find({});
//         res.render('userManagement',{users:usersData});
//     } catch (error) {
//         console.log(error.message);
//     }
// }


const indexPage = async (req, res, next) => {
    try {
        const userCount = await User.find().count();
        const productCount = await Product.find().count();
        const orderCount = await Order.find().count();
        const result = await Order.aggregate([{ $match: { orderStatus: { $in: ["Completed", "Delivered"] } } }, { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }]);
        const totalSales = result[0] ? result[0].totalSales : 0; // Check if result[0] exists before accessing totalSales

        const topCategories = await Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topProduct = await Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.productName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topBrand = await Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const salesReport = await Order.find({ orderStatus: { $in: ["Completed", "Delivered"] } });

        res.render('index', { userCount, productCount, orderCount, totalSales, salesReport, topCategories, topProduct, topBrand });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

// Controller for fetching sales report
const salesReport = async (req, res, next) => {
    try {
        const { interval, startDate, endDate } = req.query;
        let salesReport;

        if (interval === 'daily') {
            const today = new Date();
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: new Date(today.setHours(0, 0, 0, 0)),
                    $lte: endOfDay
                }
            });
        } else if (interval === 'weekly') {
            const today = new Date();
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const lastDayOfWeek = new Date(firstDayOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: firstDayOfWeek,
                    $lte: lastDayOfWeek
                }
            });
        } else if (interval === 'yearly') {
            const year = new Date().getFullYear();
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: startOfYear,
                    $lte: endOfYear
                }
            });
        } else if (startDate && endDate) {
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            });
        } else {
            salesReport = await Order.find({ orderStatus: { $in: ["Completed", "Delivered"] } });
        }

        res.json({ salesReport });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};



// Controller for downloading Excel file
const downloadExcel = async (req, res) => {
    try {
        const { data } = req.body;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Data');

        // Define the columns for the Excel sheet
        worksheet.columns = [
            { header: 'Order Id', key: 'orderId', width: 20 },
            { header: 'Order Date', key: 'orderDate', width: 20 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
            { header: 'Offer Discount', key: 'offerDiscount', width: 20 },
            { header: 'Final Price', key: 'finalPrice', width: 20 },
            { header: 'Order Status', key: 'orderStatus', width: 20 },
        ];

        // Add rows to the worksheet
        worksheet.addRows(data);

        // Helper function to sanitize and convert values to numbers
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                // Remove non-numeric characters
                value = value.replace(/[^0-9.-]+/g, '');
            }
            return parseFloat(value) || 0;
        };

        // Calculate the overall totals
        const overallTotal = data.reduce((total, row) => {
            const totalAmount = sanitizeValue(row.totalAmount);
            const couponDiscount = sanitizeValue(row.couponDiscount);
            const offerDiscount = sanitizeValue(row.offerDiscount);
            const finalPrice = sanitizeValue(row.finalPrice);

            total.totalAmount += totalAmount;
            total.couponDiscount += couponDiscount;
            total.offerDiscount += offerDiscount;
            total.finalPrice += finalPrice;

            return total;
        }, { totalAmount: 0, couponDiscount: 0, offerDiscount: 0, finalPrice: 0 });

        // Add the overall total row
        worksheet.addRow({
            orderId: 'Overall Total',
            orderDate: '',
            userName: '',
            productName: '',
            totalAmount: overallTotal.totalAmount,
            couponDiscount: overallTotal.couponDiscount,
            offerDiscount: overallTotal.offerDiscount,
            finalPrice: overallTotal.finalPrice,
            orderStatus: ''
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="salesReport.xlsx"');

        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({ error: 'Failed to download Excel file' });
    }
};

// const indexPage = async(req,res)=>{
//     try {
//         res.render('index');
//     } catch (error) {
//         console.log(error.message);
//     }
// }



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
        const perPage = 10; // Number of users per page
        const page = req.query.page || 1; // Current page number, default to 1

        // Fetch the total count of users
        const totalUsers = await User.countDocuments({});
        
        
        let users = [];
        if(req.query.search){

            users = await User.find({ $or: [{ fname: { $regex: req.query.search, $options: 'i' }}, { sname: { $regex: req.query.search, $options: 'i' }}]}).skip((perPage * page) - perPage)
            .limit(perPage);


        }
        else{
            users = await User.find();
        }
         res.render('userManagement',{ users,   current: page,
            pages: Math.ceil(totalUsers / perPage),
            totalUsers: totalUsers });

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
    salesReport,
    downloadExcel
}