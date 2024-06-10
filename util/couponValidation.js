function validateCouponForm() {
    const couponCode = document.getElementById('couponCode').value;
    const discountPercentage = document.getElementById('discount').value;
    const expiredDate = document.getElementById('expiredDate').value;
    const minPurchaseAmt = document.getElementById('minmPrchsAmt').value;
    const maxRedeemableAmount = document.getElementById('maxRedimabelAmount').value;
    const validationMessage = document.getElementById('validationMessages');

    const couponCodePattern = /^[a-zA-Z0-9]+$/;

    if (!couponCodePattern.test(couponCode)) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Coupon code can only contain alphabets and numbers.';
        return false;
    }

    if (discountPercentage < 1 || discountPercentage > 99) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Discount percentage must be between 1 and 99.';
        return false;
    }

    if (!expiredDate) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Expire date is required.';
        return false;
    }

    if (minPurchaseAmt < 1) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Minimum purchase amount must be at least 1.';
        return false;
    }

    if (maxRedeemableAmount < 1) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Maximum redeemable amount must be at least 1.';
        return false;
    }

    validationMessage.style.display = 'none';
    return true;
}
