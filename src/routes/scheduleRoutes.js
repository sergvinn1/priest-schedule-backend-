// src/routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();
const ScheduleEntry = require("../models/ScheduleEntry");

// GET /api/schedule - Отримати розклад з фільтрацією за датами та/або священником
// Приклад: /api/schedule?startDate=2025-08-11&endDate=2025-08-24&priestId=60c72b2f9f1b2c001c8e4d2a
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, priestId } = req.query; // Отримуємо параметри запиту
    let query = {}; // Об'єкт для побудови запиту до MongoDB

    // 1. Фільтрація за діапазоном дат
    if (startDate && endDate) {
      // Перетворюємо рядки дат у об'єкти Date
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Логіка перетину: запис дійсний, якщо його діапазон (startDateEntry, endDateEntry)
      // перетинається з діапазоном запиту (start, end).
      // Це означає, що endDate запису має бути >= startDate запиту
      // І startDate запису має бути <= endDate запиту
      query.startDate = { $lte: end }; // Дата початку запису <= кінцевої дати запиту
      query.endDate = { $gte: start }; // Дата закінчення запису >= початкової дати запиту
    } else if (startDate) {
      // Якщо вказана тільки початкова дата, шукаємо записи, що починаються пізніше або дорівнюють їй
      query.endDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      // Якщо вказана тільки кінцева дата, шукаємо записи, що закінчуються раніше або дорівнюють їй
      query.startDate = { $lte: new Date(endDate) };
    }

    // 2. Фільтрація за священником
    if (priestId) {
      // Якщо вказаний priestId, шукаємо записи, де цей священник є одним з трьох
      query.$or = [
        { servingPriest: priestId },
        { churchDutyPriest: priestId },
        { cityDutyPriest: priestId },
      ];
    }

    // Виконуємо запит до бази даних з побудованим об'єктом query
    const schedule = await ScheduleEntry.find(query)
      .populate("servingPriest", "name")
      .populate("churchDutyPriest", "name")
      .populate("cityDutyPriest", "name")
      .sort({ startDate: 1 }); // Сортуємо за датою початку

    res.json(schedule);
  } catch (err) {
    console.error("Помилка при отриманні розкладу:", err.message); // Детальніше логування
    res.status(500).send("Server Error");
  }
});

// POST /api/schedule - Додати новий запис розкладу
router.post("/", async (req, res) => {
  const {
    startDate,
    endDate,
    servingPriest,
    churchDutyPriest,
    cityDutyPriest,
  } = req.body;
  try {
    // Перевірка, чи не перетинається новий запис з існуючими
    const existingEntry = await ScheduleEntry.findOne({
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (existingEntry) {
      return res
        .status(400)
        .json({
          msg: `Розклад вже існує для періоду ${new Date(
            existingEntry.startDate
          ).toLocaleDateString()} - ${new Date(
            existingEntry.endDate
          ).toLocaleDateString()}.`,
        });
    }

    const newEntry = new ScheduleEntry({
      startDate,
      endDate,
      servingPriest, // Припускаємо, що тут приходять ObjectId священників
      churchDutyPriest,
      cityDutyPriest,
    });
    await newEntry.save();

    // Повертаємо збережений запис з заповненими даними священників
    const populatedEntry = await ScheduleEntry.findById(newEntry._id)
      .populate("servingPriest", "name")
      .populate("churchDutyPriest", "name")
      .populate("cityDutyPriest", "name");

    res.status(201).json(populatedEntry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUT /api/schedule/:id - Оновити запис розкладу за ID
router.put("/:id", async (req, res) => {
  const {
    startDate,
    endDate,
    servingPriest,
    churchDutyPriest,
    cityDutyPriest,
  } = req.body;
  try {
    let entry = await ScheduleEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ msg: "Schedule entry not found" });
    }

    // Перевірка на перетин з іншими записами (крім себе)
    const existingConflict = await ScheduleEntry.findOne({
      _id: { $ne: req.params.id }, // Не враховуємо поточний запис
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (existingConflict) {
      return res
        .status(400)
        .json({
          msg: `Оновлення призведе до конфлікту з існуючим розкладом на період ${new Date(
            existingConflict.startDate
          ).toLocaleDateString()} - ${new Date(
            existingConflict.endDate
          ).toLocaleDateString()}.`,
        });
    }

    entry.startDate = startDate;
    entry.endDate = endDate;
    entry.servingPriest = servingPriest;
    entry.churchDutyPriest = churchDutyPriest;
    entry.cityDutyPriest = cityDutyPriest;

    await entry.save();

    // Повертаємо оновлений запис з заповненими даними священників
    const populatedEntry = await ScheduleEntry.findById(entry._id)
      .populate("servingPriest", "name")
      .populate("churchDutyPriest", "name")
      .populate("cityDutyPriest", "name");

    res.json(populatedEntry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/schedule/:id - Видалити запис розкладу за ID
router.delete("/:id", async (req, res) => {
  try {
    const result = await ScheduleEntry.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: "Schedule entry not found" });
    }
    res.json({ msg: "Schedule entry removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
