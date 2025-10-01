import 'dotenv/config';
import cors from 'cors';
import express from 'express';
// import cookieParser from 'cookie-parser';

// import connectDB from './config/mongodb.js';
// import userRouter from './routes/userRouter.js';

const app = express();
const port = process.env.PORT || 1313;

// connectDB();

app.use(express.json());
// app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173"
}));

app.listen(port, function() {
    console.log("works");
})

// app.use( '/api/user', userRouter );
 
app.get('/', function(req, res) {
    console.log("root"); 
    res.json({'status':'working'});
})