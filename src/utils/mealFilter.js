// Filter meals by preferences
export function filterMeals(meals, preferences) {
  return meals.filter(meal => {
    if (preferences.diet && !meal.tags.includes(preferences.diet)) return false;
    if (preferences.allergies && preferences.allergies.some(allergy => meal.allergens.includes(allergy))) return false;
    return true;
  });
}

// Generate a weekly plan (7 days x 3 meals)
export function generateWeeklyPlan(meals, preferences) {
  const filteredMeals = filterMeals(meals, preferences);
  const plan = [];
  for (let day = 0; day < 7; day++) {
    plan.push({
      breakfast: filteredMeals[Math.floor(Math.random() * filteredMeals.length)],
      lunch: filteredMeals[Math.floor(Math.random() * filteredMeals.length)],
      dinner: filteredMeals[Math.floor(Math.random() * filteredMeals.length)],
    });
  }
  return plan;
} 