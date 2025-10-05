import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import connectDB from './config/connectMongoDB.js';
import userRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import patientRouter from './routes/patientRoutes.js';
import doctorRouter from './routes/doctorRoutes.js';
import appointmentRouter from './routes/appointmentRoutes.js';

const app = express();
const port = process.env.PORT || 1313;

connectDB();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  process.env.FRONTEND_URL, // Your production URL
  'http://localhost:5173',   // Local development
  'http://localhost:3000',   // Alternative local port
  'http://localhost:5174',
  'http://localhost:4200', 
  'https://health-frontend-pi.vercel.app'          // Vite preview or other ports
     // Vite preview or other ports
].filter(Boolean); // Removes any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use('/api/v1', userRouter );
app.use('/api/v1/admin',adminRouter);
app.use('/api/v1/patient', patientRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/appointments', appointmentRouter);

app.get('/', function(req, res) {
    console.log("root");
    res.json({'status':'working'});
})

app.listen(port, function() {
    console.log("Server is running on port " + port);
})
