// server.js
require('dotenv').config(); // Завантажуємо змінні оточення з .env файлу
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Для дозволу крос-доменних запитів

const app = express();
const PORT = process.env.PORT || 5000; // Порт для сервера, за замовчуванням 5000

// Middleware
app.use(cors()); // Дозволити запити з будь-якого домену (для розробки)
app.use(express.json()); // Дозволяє Express парсити JSON-тіла запитів

// Підключення до MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Проста перевірка роботи сервера
app.get('/', (req, res) => {
  res.send('Priest Schedule Backend API is running!');
});

// Підключаємо маршрути для священників та розкладу (будуть створені пізніше)
const priestRoutes = require('./src/routes/priestRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');

app.use('/api/priests', priestRoutes);
app.use('/api/schedule', scheduleRoutes);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});