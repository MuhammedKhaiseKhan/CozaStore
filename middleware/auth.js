// const isLogin = async(req,res,next)=>{
//     try {
    
//         if(req.session.user_id){}
//         else{
//             return res.redirect('/');
//         }
//         next();

//     } catch (error) {
//         console.log(error.message);
//     }
// }

// const isLogout = async(req,res,next)=>{
//     try {
    
//         if(req.session.user_id){
//             return res.redirect('/login');
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


const userAuth = (req, res, next) => {
    if (req.session.isUserAuthenticated) {
        // User is authenticated, allow access to the next middleware or route handler
        next();
    } else {
        // USer is not authenticated, redirect to the login page
        res.redirect('/login');
    }
};

module.exports = userAuth