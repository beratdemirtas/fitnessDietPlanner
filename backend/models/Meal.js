const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  protein: { type: Number, required: true, default: 0 },
  fat: { type: Number, required: true, default: 0 },
  carbs: { type: Number, required: true, default: 0 },
  calories: { type: Number, required: true, default: 0 },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  mealType: { type: String, default: 'custom' }, // breakfast, lunch, dinner, snack
  foods: [{ 
    description: { type: String, required: true },
    portion: String,
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    calories: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Add index for faster queries
MealSchema.index({ userEmail: 1, date: 1 });

module.exports = mongoose.model('Meal', MealSchema); 