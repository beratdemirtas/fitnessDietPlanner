const express = require('express');
const Meal = require('../models/Meal');

const router = express.Router();

// Get all meals for a user
router.get('/', async (req, res) => {
  try {
    const { userEmail, date } = req.query;
    console.log('GET /meals - Query params:', { userEmail, date });
    
    if (!userEmail) return res.status(400).json({ message: 'userEmail is required' });
    
    const filter = { userEmail };
    if (date) filter.date = date;
    
    console.log('GET /meals - Filter:', filter);
    const meals = await Meal.find(filter).sort({ createdAt: -1 });
    console.log('GET /meals - Found meals:', meals.length);
    
    res.json(meals);
  } catch (err) {
    console.error('GET /meals - Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a meal
router.post('/', async (req, res) => {
  try {
    const { userEmail, name, protein, fat, carbs, calories, date, mealType, foods } = req.body;
    console.log('POST /meals - Request body:', req.body);
    
    if (!userEmail || !name || protein == null || fat == null || carbs == null || calories == null || !date) {
      console.log('POST /meals - Missing required fields:', { userEmail, name, protein, fat, carbs, calories, date });
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const meal = new Meal({
      userEmail,
      name,
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      calories: Number(calories),
      date,
      mealType,
      foods
    });
    
    console.log('POST /meals - Creating meal:', meal);
    const savedMeal = await meal.save();
    console.log('POST /meals - Saved meal:', savedMeal);
    
    res.status(201).json(savedMeal);
  } catch (err) {
    console.error('POST /meals - Error:', err);
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
    const { name, protein, fat, carbs, calories, date } = req.body;
    const meal = await Meal.findById(id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    
    if (name) meal.name = name;
    if (protein != null) meal.protein = protein;
    if (fat != null) meal.fat = fat;
    if (carbs != null) meal.carbs = carbs;
    if (calories != null) meal.calories = calories;
    if (date) meal.date = date;
    
    await meal.save();
    res.json(meal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 