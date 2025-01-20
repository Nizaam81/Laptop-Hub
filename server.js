const express = require('express')
const app=express()
const path = require('path')
const env=require('dotenv').config()
const connectDB=require('./config/db')
connectDB()

const user=require('./routes/userRoute')
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.set('views',path.join(__dirname,"views"))
app.use(express.static(path.join(__dirname, 'public')))

app.use("/user",user) //user is a router
app.listen(3001, () => console.log('server is running'))