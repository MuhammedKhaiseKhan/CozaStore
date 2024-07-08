const Wishlist = require('../model/wishlistSchema');
const Product = require('../model/admin/productSchema');
const User = require('../model/userSchema')
const { default: mongoose } = require("mongoose");



const getWishlist = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const userData = await User.findById({ _id: userId });

        const userWishlist = await Wishlist.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$wishlistItems' },
            {
                $lookup: {
                    from: 'products', 
                    localField: 'wishlistItems',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $project: {
                    // wishlistItems: 1,
                    productDetails: 1
                }
            }
        ]);

        if (userWishlist.length === 0) {
            return res.render('wishlist', { user: userData, userWishlist: [] });
        }

        res.render('wishlist', { user: userData, userWishlist: userWishlist });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user_id;

        if (!userId) {
            return res.status(401).json({ redirectUrl: '/login' });
        }

        let wishlist = await Wishlist.findOne({ userId: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                userId: userId,
                wishlistItems: productId
            });
            await wishlist.save();
            return res.status(200).json({ message: "Added to Wishlist" });
        } else {
            const index = wishlist.wishlistItems.indexOf(productId);
            if (index > -1) {
                wishlist.wishlistItems.splice(index, 1);
                await wishlist.save();
                return res.status(200).json({ message: "Product removed from wishlist" });
            } else {
                wishlist.wishlistItems.push(productId);
                await wishlist.save();
                return res.status(200).json({ message: "Product added to wishlist" });
            }
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to update wishlist", error });
        next(error);
    }
};


const removeFromWishlist = async (req, res, next) => {
    try {
        const { productId } = req.query;
        const userId = req.session.user_id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            wishlist.wishlistItems = wishlist.wishlistItems.filter(item => item.toString() !== productId);
            await wishlist.save();
        }

        res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ message: 'Failed to remove product from wishlist', error });
        next(error);
    }
};



module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
}