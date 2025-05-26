const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dailyCalories: { type: Number, required: true },
  meals: [
    {
      name: { type: String, required: true },
      calories: { type: Number, required: true },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', DietPlanSchema);