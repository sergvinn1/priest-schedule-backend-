// src/routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const ScheduleEntry = require('../models/ScheduleEntry');

// GET /api/schedule - Отримати весь розклад
// Можна додати фільтрацію за датами в майбутньому
router.get('/', async (req, res) => {
  try {
    // populate('field') замінює ObjectID на повний об'єкт з моделі Priest
    const schedule = await ScheduleEntry.find()
      .populate('servingPriest', 'name') // Вибираємо лише поле 'name'
      .populate('churchDutyPriest', 'name')
      .populate('cityDutyPriest', 'name')
      .sort({ startDate: 1 }); // Сортуємо за датою початку

    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/schedule/range - Отримати розклад за діапазоном дат
// Приклад: /api/schedule/range?start=2025-07-01&end=2025-07-31
router.get('/range', async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ msg: 'Будь ласка, надайте початкову та кінцеву дати (start, end).' });
  }

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const schedule = await ScheduleEntry.find({
      $or: [ // Перевіряємо перетин діапазонів
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    })
      .populate('servingPriest', 'name')
      .populate('churchDutyPriest', 'name')
      .populate('cityDutyPriest', 'name')
      .sort({ startDate: 1 });

    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// POST /api/schedule - Додати новий запис розкладу
router.post('/', async (req, res) => {
  const { startDate, endDate, servingPriest, churchDutyPriest, cityDutyPriest } = req.body;
  try {
    // Перевірка, чи не перетинається новий запис з існуючими
    const existingEntry = await ScheduleEntry.findOne({
        $or: [
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
        ]
    });

    if (existingEntry) {
        return res.status(400).json({ msg: `Розклад вже існує для періоду ${existingEntry.startDate.toISOString().split('T')[0]} - ${existingEntry.endDate.toISOString().split('T')[0]}.` });
    }

    const newEntry = new ScheduleEntry({
      startDate,
      endDate,
      servingPriest, // Припускаємо, що тут приходять ObjectId священників
      churchDutyPriest,
      cityDutyPriest
    });
    await newEntry.save();

    // Повертаємо збережений запис з заповненими даними священників
    const populatedEntry = await ScheduleEntry.findById(newEntry._id)
      .populate('servingPriest', 'name')
      .populate('churchDutyPriest', 'name')
      .populate('cityDutyPriest', 'name');

    res.status(201).json(populatedEntry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/schedule/:id - Оновити запис розкладу за ID
router.put('/:id', async (req, res) => {
  const { startDate, endDate, servingPriest, churchDutyPriest, cityDutyPriest } = req.body;
  try {
    let entry = await ScheduleEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ msg: 'Schedule entry not found' });
    }

    // Перевірка на перетин з іншими записами (крім себе)
    const existingConflict = await ScheduleEntry.findOne({
      _id: { $ne: req.params.id }, // Не враховуємо поточний запис
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (existingConflict) {
      return res.status(400).json({ msg: `Оновлення призведе до конфлікту з існуючим розкладом на період ${existingConflict.startDate.toISOString().split('T')[0]} - ${existingConflict.endDate.toISOString().split('T')[0]}.` });
    }


    entry.startDate = startDate;
    entry.endDate = endDate;
    entry.servingPriest = servingPriest;
    entry.churchDutyPriest = churchDutyPriest;
    entry.cityDutyPriest = cityDutyPriest;

    await entry.save();

    // Повертаємо оновлений запис з заповненими даними священників
    const populatedEntry = await ScheduleEntry.findById(entry._id)
      .populate('servingPriest', 'name')
      .populate('churchDutyPriest', 'name')
      .populate('cityDutyPriest', 'name');

    res.json(populatedEntry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/schedule/:id - Видалити запис розкладу за ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await ScheduleEntry.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: 'Schedule entry not found' });
    }
    res.json({ msg: 'Schedule entry removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;