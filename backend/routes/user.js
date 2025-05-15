const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    // JWT opsiyonel, şimdilik sadece user döneceğiz
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
    // BMI güncelle
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
    const { email } = req.body;
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 