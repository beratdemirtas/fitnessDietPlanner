const express = require('express');
const Meal = require('../models/Meal');

const router = express.Router();

// Get all meals for a user
router.get('/', async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ message: 'userEmail is required' });
    const meals = await Meal.find({ userEmail }).sort({ createdAt: -1 });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a meal
router.post('/', async (req, res) => {
  try {
    const { userEmail, name, protein, fat, carbs, calories } = req.body;
    if (!userEmail || !name || protein == null || fat == null || carbs == null || calories == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const meal = new Meal({ userEmail, name, protein, fat, carbs, calories });
    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a meal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Meal.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Meal not found' });
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a meal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, protein, fat, carbs, calories } = req.body;
    const meal = await Meal.findById(id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    if (name) meal.name = name;
    if (protein != null) meal.protein = protein;
    if (fat != null) meal.fat = fat;
    if (carbs != null) meal.carbs = carbs;
    if (calories != null) meal.calories = calories;
    await meal.save();
    res.json(meal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 