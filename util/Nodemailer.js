const nodemailer = require('nodemailer');
require('dotenv').config();
const asyncHandler = require('express-async-handler');
const generateOTP = require('./genereteOTP');
const Otp = require("../model/otpSchema");


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_MAIL, 
        pass: process.env.APP_PASSWORD 
    }
});

const sendEmail = asyncHandler(async(req,res)=>{
    const {email} = req.body;
    console.log(email);

    const otp = generateOTP();

     const otpDb = new Otp({
        userEmail:email,
        code:otp,
        expiresAt:new Date(Date.now() + (10 * 1000))
     }); 

     otpDb.save();

//    req.session.otpData = otp;  //storing otp to session 
    console.log(otp);


    let mailOptions = {
        from: process.env.SMTP_MAIL, 
        to: email, 
        subject: 'OTP  from  COZA - STORE ', 
        text: `OTP for verify your account is : ${otp}` 
    };

    // Send email
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

});

module.exports = sendEmail

