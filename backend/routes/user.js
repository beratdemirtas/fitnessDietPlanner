const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Meal = require('../models/Meal'); 
const DietPlan = require('../models/DietPlan');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, surname, email, password, gender, height, weight, photo, birthDate } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Calculate BMI
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    const bmi = (w / (h * h)).toFixed(2);

    // Calculate age
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, surname, email, password: hashedPassword, gender, height, weight, photo, birthDate, bmi, age
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
    // JWT optional, for now we will only return user
    res.json({
      user: {
        name: user.name,
        surname: user.surname,
        email: user.email,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        photo: user.photo,
        birthDate: user.birthDate,
        bmi: user.bmi,
        age: user.age
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      name: user.name,
      surname: user.surname,
      email: user.email,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      photo: user.photo,
      birthDate: user.birthDate,
      bmi: user.bmi,
      age: user.age
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const { email, name, surname, height, weight, photo } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (photo) user.photo = photo;
    // Update BMI
    if (height || weight) {
      const h = parseFloat(user.height) / 100;
      const w = parseFloat(user.weight);
      user.bmi = (w / (h * h)).toFixed(2);
    }
    user.updatedAt = new Date();
    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Profile
router.delete('/profile', async (req, res) => {
  try {
    const { email } = req.body; // Ensure email is coming from the request body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await User.deleteOne({ email }); // Delete the user by email
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile deleted successfully' }); // Success response
  } catch (err) {
    console.error('Error deleting profile:', err);
    res.status(500).json({ message: 'Internal server error' }); // Error response
  }
});

// Daily total macros endpoint
router.get('/daily-macros', async (req, res) => {
  try {
    const { email, date } = req.query;
    if (!email || !date) {
      return res.status(400).json({ message: 'email and date are mandatory' });
    }
    const meals = await Meal.find({ userEmail: email, date });
    const totals = meals.reduce(
      (acc, meal) => {
        acc.protein += meal.protein || 0;
        acc.fat += meal.fat || 0;
        acc.carbs += meal.carbs || 0;
        acc.calories += meal.calories || 0;
        return acc;
      },
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );
    res.json(totals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start your diet plan
router.post('/initialize-diet-plan', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check your diet plan
    const existingPlan = await DietPlan.findOne({ userId: user._id });
    if (existingPlan) {
      return res.json({ message: 'Diet plan already exists', dietPlan: existingPlan });
    }

    // Create a default diet plan
    const defaultPlan = new DietPlan({
      userId: user._id,
      dailyCalories: 2000,
      meals: [
        { name: 'Breakfast', calories: 500 },
        { name: 'Lunch', calories: 700 },
        { name: 'Dinner', calories: 800 },
      ],
    });

    await defaultPlan.save();
    res.json({ message: 'Diet plan created', dietPlan: defaultPlan });
  } catch (err) {
    console.error('Error initializing diet plan:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if there is a diet plan
router.get('/has-diet-plan', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const dietPlan = await DietPlan.findOne({ userId: user._id });
    if (dietPlan) {
      return res.json({ hasDietPlan: true });
    } else {
      return res.json({ hasDietPlan: false });
    }
  } catch (err) {
    console.error('Error checking diet plan:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;