// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Імпортуємо cors

const app = express();
const PORT = process.env.PORT || 5000;

// ----- ОНОВЛЕНО: Налаштування CORS -----
const allowedOrigins = [
  'http://localhost:5173', // Для локальної розробки React
  'priest-schedule-frontend-v8r3.vercel.app', // Для продакшн версії на Vercel
 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Застосовуємо CORS з нашими опціями
app.use(express.json());

// Підключення до MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Priest Schedule Backend API is running!');
});

const priestRoutes = require('./src/routes/priestRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');

app.use('/api/priests', priestRoutes);
app.use('/api/schedule', scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});