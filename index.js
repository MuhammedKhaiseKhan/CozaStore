require('dotenv').config();
const express = require("express");
const path = require("path");
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
const mongoose = require('mongoose');




mongoose.connect(process.env.DATABASE_URL)
const app = express();


//for user routes

app.use('/',userRoute);

//for admin routes

app.use('/admin',adminRoute);

const PORT = process.env.PORT

app.use(express.static('public/assets'));
app.use(express.static('public/uploads'));


app.listen(PORT,()=>{
    console.log(`Listening on http://localhost:${PORT}`);
});

