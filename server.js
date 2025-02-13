
const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');


const app = express();
connectDB();

const user = require('./routes/userRoute');
const admin =require('./routes/adminRoutes')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));


app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false, 
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000, 
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user', user);
app.use('/admin',admin);

app.listen(3001, () => console.log('Server is running on port 3001'));
