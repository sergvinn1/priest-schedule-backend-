// src/routes/priestRoutes.js
const express = require('express');
const router = express.Router();
const Priest = require('../models/Priest');

// GET /api/priests - Отримати всіх священників
router.get('/', async (req, res) => {
  try {
    const priests = await Priest.find();
    res.json(priests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/priests - Додати нового священника
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    let priest = await Priest.findOne({ name });
    if (priest) {
      return res.status(400).json({ msg: 'Priest with this name already exists' });
    }
    priest = new Priest({ name });
    await priest.save();
    res.status(201).json(priest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/priests/:id - Оновити священника за ID
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  try {
    let priest = await Priest.findById(req.params.id);
    if (!priest) {
      return res.status(404).json({ msg: 'Priest not found' });
    }
    priest.name = name;
    await priest.save();
    res.json(priest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/priests/:id - Видалити священника за ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await Priest.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: 'Priest not found' });
    }
    res.json({ msg: 'Priest removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;