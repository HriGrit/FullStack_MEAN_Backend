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
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true // Required for cookies
}));

// Handle malformed JSON payloads explicitly to return a clean 400 error
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            ok: false,
            code: 'BAD_JSON',
            message: 'Malformed JSON in request body'
        });
    }
    return next(err);
});

app.use( '/api/v1', userRouter );
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