const Product = require('../model/admin/productSchema');
const Category = require('../model/admin/categorySchema');
const Offer = require('../model/offerSchema');


const offerManagementLoad = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of offers per page
        const skip = (page - 1) * limit;

        const totalOffers = await Offer.countDocuments();
        const offers = await Offer.find().skip(skip).limit(limit);
        

        const totalPages = Math.ceil(totalOffers / limit);

        res.render('offerManagement', {
            offers,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

const addOfferLoad = async (req, res, next) => {
    try {

        const categorys = await Category.find({ is_delete: false })
        const products = await Product.find({ isDeleted: false })

        res.render('addOffer', { categorys, products })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

// const addOffer = async (req, res, next) => {
//     try {
//         const { offer, offerType, Pname, category, expiredDate, discount, maxRedeemableAmount } = req.body;

//         // Validation
//         if (!offer || offer.trim() === '') {
//             return res.status(403).json({ message: "Enter Proper Offer Details" });
//         } else if (offerType === '') {
//             return res.status(403).json({ message: "Please select any offer Type" });
//         } else if (!expiredDate || !discount || !maxRedeemableAmount) {
//             return res.status(403).json({ message: "Must provide ExpiredDate, discount, and maximum Redeemable Amount" });
//         }

//         // Initialize newOffer object
//         let newOffer = new Offer({
//             offer: offer,
//             offerType: offerType,
//             expiredDate: expiredDate,
//             discount: discount,
//             maxRedeemableAmount: maxRedeemableAmount,
//         });

//         // Add category or product name based on offer type
//         if (offerType === 'Category Offer') {
//             const categoryDoc = await Category.findOne({ name: category });
//             if (!categoryDoc) {
//                 return res.status(404).json({ message: "Category not found" });
//             }
//             newOffer.category = categoryDoc._id;
//         } else if (offerType === 'Product Offer') {
//             newOffer.Pname = Pname;
//         }

//         // Save the new offer
//         await newOffer.save();

//         // Update products with the offer
//         const offerId = newOffer._id;
//         if (offerType === 'Product Offer') {
//             await Product.findOneAndUpdate({ productName: Pname }, { $push: { offer: offerId } });
//         } else if (offerType === 'Category Offer') {
//             await Product.updateMany({ category: newOffer.category }, { $push: { offer: offerId } });
//         }

//         res.status(200).json({ success: true });
//     } catch (error) {
//         console.log(error.message);
//         next(error);
//     }
// };


// const addOffer = async (req, res, next) => {
//     try {
//         const { offer, offerType, Pname, category, expiredDate, discount, maxRedeemableAmount } = req.body;

//         console.log(req.body);

       
//         if (!offer || offer.trim() === '') {
//             return res.status(403).json({ message: "Enter Proper Offer Details" });
//         } else if (offerType === '') {
//             return res.status(403).json({ message: "Please select any offer Type" });
//         } else if (!expiredDate || !discount || !maxRedeemableAmount) {
//             return res.status(403).json({ message: "Must provide ExpiredDate, discount, and maximum Redeemable Amount" });
//         }

//         let newOffer = new Offer({
//             offer: offer,
//             offerType: offerType,
//             expiredDate: expiredDate,
//             discount: discount,
//             maxRedeemableAmount: maxRedeemableAmount,
//             category: offerType === 'Category Offer' ? category : undefined,
//             Pname: offerType === 'Product Offer' ? Pname : undefined
//         });

//         await newOffer.save();

//         const offerId = newOffer._id;
//         if (offerType === 'Product Offer') {
//             await Product.findOneAndUpdate({ productName: Pname }, { $push: { offer: offerId } });
//         } else if (offerType === 'Category Offer') {
            
//             const categoryDoc = await Category.findOne({ name: category });
//             if (!categoryDoc) {
//                 return res.status(404).json({ message: "Category not found" });
//             }
//             const categoryId = categoryDoc._id;
//             await Product.updateMany({ category: categoryId }, { $push: { offer: offerId } });
//         }

//         res.status(200).json({ success: true });

//     } catch (error) {
//         console.log(error.message);
//         next(error);
//     }
// };

const addOffer = async (req, res, next) => {
    try {
        const { offer, offerType, Pname, category, expiredDate, discount, maxRedeemableAmount } = req.body;

        console.log(req.body);

        // Validate input
        if (!offer || offer.trim() === '') {
            return res.status(403).json({ message: "Enter Proper Offer Details" });
        } else if (!offerType) {
            return res.status(403).json({ message: "Please select any offer Type" });
        } else if (!expiredDate || discount === undefined || maxRedeemableAmount === undefined) {
            return res.status(403).json({ message: "Must provide ExpiredDate, discount, and maximum Redeemable Amount" });
        }

        // Create new offer
        let newOffer = new Offer({
            offer: offer,
            offerType: offerType,
            expiredDate: expiredDate,
            discount: discount,
            maxRedeemableAmount: maxRedeemableAmount,
            category: offerType === 'Category Offer' ? category : undefined,
            Pname: offerType === 'Product Offer' ? Pname : undefined
        });

        await newOffer.save();

        const offerId = newOffer._id;

        if (offerType === 'Product Offer') {
            // Update a specific product
            const product = await Product.findOneAndUpdate(
                { productName: Pname },
                { 
                    $set: {
                        productOffer: discount,
                        maxRedeemableAmount: maxRedeemableAmount
                    }
                },
                { new: true }
            );

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
        } else if (offerType === 'Category Offer') {
            // Update all products in a specific category
            const categoryDoc = await Category.findOne({ name: category });
            if (!categoryDoc) {
                return res.status(404).json({ message: "Category not found" });
            }
            const categoryId = categoryDoc._id;

            await Product.updateMany(
                { category: categoryId },
                { 
                    $set: {
                        categoryOffer: discount,
                        maxRedeemableAmount: maxRedeemableAmount
                    }
                }
            );
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const offerStatusChange = async (req, res) => {
    try {
        const { offerId, status } = req.query;
        const newStatus = status === 'true'; 

        const offer = await Offer.findById(offerId);
        if (offer) {
            offer.status = newStatus;
            await offer.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};






module.exports = {
    offerManagementLoad,
    addOfferLoad,
    addOffer,
    offerStatusChange
}