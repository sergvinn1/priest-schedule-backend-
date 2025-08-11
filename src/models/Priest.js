// src/models/Priest.js
const mongoose = require('mongoose');

const priestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Видаляє пробіли на початку/кінці
    unique: true // Ім'я священника має бути унікальним
  },
  // Можна додати інші поля, наприклад, 'phone', 'email', 'avatarUrl'
}, {
  timestamps: true // Додає поля createdAt та updatedAt автоматично
});

module.exports = mongoose.model('Priest', priestSchema);