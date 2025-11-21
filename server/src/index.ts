import express, { Application } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import chatRoutes from './routes/chatRoutes';
import aiRoutes from './routes/aiRoutes';
import connectDB from './config/db';

// Load env vars
dotenv.config();
// Also try loading .env.local for local development overrides
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' }); // Check root directory

const app: Application = express();
const PORT = process.env.PORT || 5001;

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:3000,http://localhost:3001,http://192.168.1.7:3001')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Database Connection
connectDB();

import recurringRoutes from './routes/recurringRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recurring', recurringRoutes);

app.get('/', (req, res) => {
  res.send('Hasala API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

