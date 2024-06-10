const Coupon = require('../model/couponSchema');
const Order = require('../model/orderSchema');
const User =  require('../model/userSchema');

const couponManagementLoad = async (req, res, next) => {
    try {
        
        const currentPage = parseInt(req.query.page)
        const couponPerPage = 10
        const skip = (currentPage - 1) * couponPerPage;

        const coupons = await Coupon.find().skip(skip).limit(couponPerPage).sort({createdDate:-1});

        const totalProduct = await Coupon.countDocuments()
        const totalPages = Math.ceil(totalProduct / couponPerPage)

        res.render('couponManagement', { coupons: coupons , currentPage, totalPages })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const addCouponLoad = async (req, res, next) => {
    try {
        res.render('addCoupon')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const addCoupon = async (req, res, next) => {
    try {
        const { couponCode, discountPercentage, expiredDate, minPurchaseAmt, maxRedeemableAmount } = req.body


        const isExist = await Coupon.findOne({ couponCode: couponCode })
        if (isExist) {
            return res.status(403).json({ message: "This CODE is already exist, please enter another one" })
        } else if (couponCode[0] == ' ') {
            return res.status(403).json({ message: "Enter Proper Coupon Code" })

        }

        const coupon = new Coupon({
            couponCode: couponCode,
            discountPercentage: discountPercentage,
            expiredDate: expiredDate,
            minPurchaseAmt: minPurchaseAmt,
            maxRedeemableAmount: maxRedeemableAmount
        })

        await coupon.save()
        res.status(200).json({ success: true })

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const couponStatusChange = async (req, res, next) => {
    try {
        const id = req.query.couponId;
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid input: Coupon ID is required" });
        }
        
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        
        coupon.status = !coupon.status;
        await coupon.save();

        let message = coupon.status ? "Coupon Activated successfully" : "Coupon Inactivated successfully";
        res.status(200).json({ success: true, message });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const applyCoupon = async (req, res, next) => {
    try {
        const { couponCode, totalAmount } = req.body;
        const coupon = await Coupon.findOne({ status: true, couponCode: couponCode });

        if (!coupon) {
            return res.status(400).json({ message: "Coupon code is incorrect!" });
        }

        if (coupon.minPurchaseAmt > totalAmount) {
            return res.status(400).json({ message: `This coupon is only valid for Purchases Over ${coupon.minPurchaseAmt}` });
        }

        // Calculate the discount
        const discountAmount = (totalAmount * coupon.discountPercentage) / 100;
        const couponDiscount = Math.min(discountAmount, coupon.maxRedeemableAmount);

        // Save coupon details in session
        req.session.coupon = {
            id: coupon._id,
            discountPercentage: coupon.discountPercentage,
            maxRedeemableAmount: coupon.maxRedeemableAmount,
            discountAmount: couponDiscount // Save calculated discount amount
        };

        res.status(200).json({ success: true, discount: couponDiscount });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};





// const applyCoupon = async (req, res, next) => {
//     try {
//         const { couponCode, totalAmount } = req.body
//         const data = await Coupon.findOne({ status: true, couponCode: couponCode })

//         if (data !== null && data.minPurchaseAmt > totalAmount) {
//             res.status(400).json({ message: `This coupon is only valid for Purchases Over ${data.minPurchaseAmt}` })
//         } else if (data !== null) {
//             req.session.coupon = data.discountPercentage;
//             req.session.couponId = data._id
//             res.status(200).json({ success: true, discount: data.discountPercentage })
//         } else {
//             res.status(400).json({ message: "coupon code is incorrect!" })
//         }
//     } catch (error) {
//         console.log(error.message);
//         next(error)
//     }
// }


module.exports = {
    couponManagementLoad,
    addCouponLoad,
    addCoupon,
    couponStatusChange,
    // listCouponsInUserSide,
    applyCoupon
}