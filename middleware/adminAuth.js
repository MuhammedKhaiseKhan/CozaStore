// const isLogin = async(req,res,next)=>{
//     try {
    
//         if(req.session.user_id){}
//         else{
//             return res.redirect('/admin');
//         }
//         next();

//     } catch (error) {
//         console.log(error.message);
//     }
// }

// const isLogout = async(req,res,next)=>{
//     try {
    
//         if(req.session.user_id){
//             return res.redirect('/admin/index.html');
//         }
//         next();

//     } catch (error) {
//         console.log(error.message);
//     }
// }

// module.exports = {
//     isLogin,
//     isLogout
// }



const adminAuth = (req, res, next) => {
    if (req.session.isAdminAuthenticated) {
        // Admin is authenticated, allow access to the next middleware or route handler
        next();
    } else {
        // Admin is not authenticated, redirect to the login page
        res.redirect('/admin/signin');
    }
};

module.exports = adminAuth