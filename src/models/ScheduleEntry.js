// src/models/ScheduleEntry.js
const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  servingPriest: {
    type: mongoose.Schema.Types.ObjectId, // Посилаємося на об'єкт Priest
    ref: 'Priest', // Ім'я моделі, на яку посилаємося
    required: true
  },
  churchDutyPriest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Priest',
    required: true
  },
  cityDutyPriest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Priest',
    required: true
  },
  // Можна додати інші поля, наприклад, 'notes', 'specialEvent'
}, {
  timestamps: true
});

module.exports = mongoose.model('ScheduleEntry', scheduleEntrySchema);