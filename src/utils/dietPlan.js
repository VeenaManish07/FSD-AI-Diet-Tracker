// --- Fallback Local AI Plan Generator ---
export function generateFallbackPlan(profile) {
  const isWeightLoss = profile.goal.toLowerCase().includes("loss");
  const isMuscle = profile.goal.toLowerCase().includes("muscle");
  
  const calories = isWeightLoss ? 1800 : isMuscle ? 2600 : 2100;
  const protein = isMuscle ? 170 : isWeightLoss ? 135 : 115;
  const carbs = isMuscle ? 275 : isWeightLoss ? 145 : 210;
  const fats = isWeightLoss ? 50 : isMuscle ? 70 : 60;

  const restriction = (profile.dietaryRestrictions || "").toLowerCase();
  const isVeg = restriction.includes("veg") && !restriction.includes("non");
  const isKeto = restriction.includes("keto");

  return {
    id: "plan_" + Date.now(),
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    profile: { ...profile },
    summary: {
      calories,
      protein,
      carbs,
      fats,
      waterLiters: Math.round((Number(profile.weight || 70) * 0.035) * 10) / 10
    },
    meals: [
      {
        type: "Breakfast",
        time: "8:00 AM",
        name: isVeg ? "Avocado Toast & Greek Yogurt Bowl" : isKeto ? "Spinach & Mushroom Omelet with Avocado" : "Oatmeal Bowl with Berries & Scrambled Eggs",
        calories: Math.round(calories * 0.25),
        protein: isVeg ? "22g" : "30g",
        carbs: isKeto ? "10g" : "45g",
        fats: "14g",
        ingredients: isVeg ? ["Whole grain bread", "Avocado", "Greek Yogurt", "Berries", "Chia seeds"] : ["Eggs", "Spinach", "Avocado", "Olive Oil", "Berries"]
      },
      {
        type: "Lunch",
        time: "1:00 PM",
        name: isVeg ? "Quinoa Bowl with Roasted Chickpeas & Tahini" : "Grilled Chicken Quinoa Bowl with Steamed Veggies",
        calories: Math.round(calories * 0.35),
        protein: isVeg ? "28g" : "45g",
        carbs: "55g",
        fats: "18g",
        ingredients: isVeg ? ["Quinoa", "Chickpeas", "Cucumber", "Cherry tomatoes", "Tahini dressing"] : ["Chicken breast", "Quinoa", "Broccoli", "Olive oil", "Bell peppers"]
      },
      {
        type: "Afternoon Snack",
        time: "4:30 PM",
        name: "Protein Berry Smoothie & Mixed Almonds",
        calories: Math.round(calories * 0.15),
        protein: "20g",
        carbs: "25g",
        fats: "10g",
        ingredients: ["Almond milk", "Plant protein powder", "Frozen berries", "Almonds"]
      },
      {
        type: "Dinner",
        time: "7:30 PM",
        name: isVeg ? "Lentil & Vegetable Curry with Brown Rice" : "Pan-Seared Salmon with Asparagus & Sweet Potato",
        calories: Math.round(calories * 0.25),
        protein: isVeg ? "25g" : "40g",
        carbs: "40g",
        fats: "16g",
        ingredients: isVeg ? ["Lentils", "Brown Rice", "Coconut Milk", "Spinach", "Curry Spices"] : ["Salmon fillet", "Asparagus", "Sweet Potato", "Lemon", "Garlic"]
      }
    ],
    tips: [
      "Drink 500ml of fresh water upon waking up to optimize digestion.",
      `Ensure you distribute your target ${protein}g of protein evenly across all 4 meals.`,
      "Finish dinner at least 2.5 hours before sleeping for enhanced metabolic repair."
    ]
  };
}