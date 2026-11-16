export function getCategorizedGrocery(currentPlan) {
  if (!currentPlan) return {};
  const produce = new Set();
  const proteinDairy = new Set();
  const pantryGrains = new Set();

  currentPlan.meals.forEach((meal) => {
    (meal.ingredients || []).forEach((ingredient) => {
      const lower = ingredient.toLowerCase();
      if (["spinach", "avocado", "berries", "cucumber", "tomatoes", "broccoli",
        "asparagus", "sweet potato", "bell peppers", "lemon", "garlic"].some(x => lower.includes(x))) {
        produce.add(ingredient);
      } else if (["egg", "yogurt", "chicken", "salmon", "milk", "protein", "cheese"].some(x => lower.includes(x))) {
        proteinDairy.add(ingredient);
      } else {
        pantryGrains.add(ingredient);
      }
    });
  });

  return {
    "Fresh Produce & Veggies": Array.from(produce),
    "Proteins & Dairy": Array.from(proteinDairy),
    "Pantry, Grains & Oils": Array.from(pantryGrains)
  };
}
