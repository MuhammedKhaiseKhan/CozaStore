

//resend mail

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

const reSendEmail = asyncHandler(async(req,res)=>{
    // console.log(req.session.userData)
    console.log(req.session)
    const {email} = req.session.userData

    console.log(email);


    
    const otp = generateOTP();

     const otpDb = new Otp({
        userEmail:email,
        code:otp,
        expiresAt:new Date(Date.now() + (20 * 1000))
     }); 

     otpDb.save();

    // req.session.otpData2 = otp;  //storing otp to session 
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

module.exports = reSendEmail

