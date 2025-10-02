import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import connectDB from './config/connectMongoDB.js';
import userRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js'

const app = express();
const port = process.env.PORT || 1313;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "*"
}));


app.use( '/api/v1', userRouter );
app.use('/api/v1/admin',adminRouter)
app.use('/',(res)=>{
    return res.status(401).json({
        "message":"Not exists"
    })
})

app.listen(port, function() {
    console.log("works");
})