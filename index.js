require('dotenv').config();
const express = require("express");
const path = require("path");
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
const mongoose = require('mongoose');
const errorMiddleware = require('./middleware/errorHandlingMiddleware');



mongoose.connect(process.env.DATABASE_URL).then(()=>{console.log("connected to db");}).catch((err)=>{console.log(err);})
const app = express();

// view engine 
app.set('view engine', 'ejs');

// Static files
app.use(express.static('public/assets'));
app.use(express.static('public/uploads'));

//for user routes

app.use('/',userRoute);

//for admin routes

app.use('/admin',adminRoute);

app.set('views','./views/admin')

// Use centralized error handling middleware

app.use(errorMiddleware);
// 404
app.all('*', (req, res) => {
    res.status(404).render('404', { status: 404, error: '' });
  });

const PORT = process.env.PORT


app.listen(PORT,()=>{
    console.log(`Listening on http://localhost:${PORT}`);
});

