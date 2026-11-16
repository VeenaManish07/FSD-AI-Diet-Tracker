import { useEffect, useRef, useState } from "react";
import Icon from "./components/Icon.jsx";
import { generateFallbackPlan } from "./utils/dietPlan.js";
import { getCategorizedGrocery } from "./utils/grocery.js";
import "./styles.css";

// --- Main React Application Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState("generator");

  // API Key & Key Modal State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_user_api_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  // Fluid Form Input State
  const [formData, setFormData] = useState({
    age: "26",
    weight: "72",
    height: "178",
    goal: "Weight Loss",
    activity: "Moderate Exercise (3-4 days/wk)",
    dietaryRestrictions: "Vegetarian"
  });

  // Application Data State
  const [currentPlan, setCurrentPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your AI Health & Nutrition Coach powered by Gemini 1.5 Flash. Ask me anything about meal swaps, recipe ideas, or adjusting your macro targets!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Grocery Checklist Checked Items State
  const [groceryChecked, setGroceryChecked] = useState({});
  const chatEndRef = useRef(null);

  useEffect(() => {
    const storedPlans = localStorage.getItem("ai_diet_plans");
    if (storedPlans) {
      try {
        const parsed = JSON.parse(storedPlans);
        setSavedPlans(parsed);
        if (parsed.length > 0) setCurrentPlan(parsed[0]);
      } catch (err) {
        console.error("Failed to parse local history:", err);
      }
    } else {
      const initialPlan = generateFallbackPlan({
        age: 26, weight: 72, height: 178, goal: "Weight Loss", dietaryRestrictions: "Vegetarian"
      });
      setCurrentPlan(initialPlan);
      setSavedPlans([initialPlan]);
      localStorage.setItem("ai_diet_plans", JSON.stringify([initialPlan]));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatThinking]);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    localStorage.setItem("gemini_user_api_key", trimmed);
    setShowKeyModal(false);
    setStatusNotice(trimmed ? "Custom Gemini API Key saved!" : "Using built-in/fallback generator mode.");
    setTimeout(() => setStatusNotice(""), 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Call Gemini 1.5 Flash API to Generate Diet Plan
  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusNotice("");

    const profileData = {
      age: Number(formData.age) || 25,
      weight: Number(formData.weight) || 70,
      height: Number(formData.height) || 175,
      goal: formData.goal,
      activity: formData.activity,
      dietaryRestrictions: formData.dietaryRestrictions || "None"
    };

    if (apiKey) {
      try {
        const promptText = `Generate a structured daily diet and nutrition plan for a person with this profile:
- Age: ${profileData.age} years
- Weight: ${profileData.weight} kg
- Height: ${profileData.height} cm
- Fitness Goal: ${profileData.goal}
- Activity Level: ${profileData.activity}
- Dietary Restrictions/Preferences: ${profileData.dietaryRestrictions}

Return ONLY a valid JSON object with this EXACT structure (no markdown fences around the json, just raw json):
{
  "summary": {
"calories": number,
"protein": number,
"carbs": number,
"fats": number,
"waterLiters": number
  },
  "meals": [
{
  "type": "Breakfast",
  "time": "8:00 AM",
  "name": "Meal name",
  "calories": number,
  "protein": "30g",
  "carbs": "40g",
  "fats": "12g",
  "ingredients": ["item 1", "item 2", "item 3"]
},
{
  "type": "Lunch",
  "time": "1:00 PM",
  "name": "Meal name",
  "calories": number,
  "protein": "45g",
  "carbs": "50g",
  "fats": "15g",
  "ingredients": ["item 1", "item 2"]
},
{
  "type": "Afternoon Snack",
  "time": "4:30 PM",
  "name": "Meal name",
  "calories": number,
  "protein": "20g",
  "carbs": "20g",
  "fats": "8g",
  "ingredients": ["item 1", "item 2"]
},
{
  "type": "Dinner",
  "time": "7:30 PM",
  "name": "Meal name",
  "calories": number,
  "protein": "40g",
  "carbs": "35g",
  "fats": "14g",
  "ingredients": ["item 1", "item 2"]
}
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawJsonText) {
          const parsedAI = JSON.parse(rawJsonText);
          const formattedPlan = {
            id: "plan_" + Date.now(),
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            profile: profileData,
            summary: parsedAI.summary,
            meals: parsedAI.meals,
            tips: parsedAI.tips
          };

          setCurrentPlan(formattedPlan);
          const updatedHistory = [formattedPlan, ...savedPlans];
          setSavedPlans(updatedHistory);
          localStorage.setItem("ai_diet_plans", JSON.stringify(updatedHistory));
          setIsGenerating(false);
          setActiveTab("plan");
          return;
        }
      } catch (err) {
        console.warn("Gemini API call failed. Falling back to local engine:", err);
        setStatusNotice("Note: Gemini API call failed. Used local AI engine fallback.");
      }
    }

    // Fallback flow
    setTimeout(() => {
      const fallbackPlan = generateFallbackPlan(profileData);
      setCurrentPlan(fallbackPlan);
      const updatedHistory = [fallbackPlan, ...savedPlans];
      setSavedPlans(updatedHistory);
      localStorage.setItem("ai_diet_plans", JSON.stringify(updatedHistory));
      setIsGenerating(false);
      setActiveTab("plan");
    }, 1000);
  };

  // Call Gemini 1.5 Flash for the AI Nutritionist Coach Chat
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsChatThinking(true);

    if (apiKey) {
      try {
        const systemPrompt = `You are an expert, highly empathetic, and professional AI Nutritionist and Health Coach. Give clear, concise, practical, and customized advice using bullet points where helpful. 
Current User Context: Goal=${currentPlan?.profile?.goal || 'Health'}, Weight=${currentPlan?.profile?.weight || 70}kg, Dietary Restrictions=${currentPlan?.profile?.dietaryRestrictions || 'None'}. Keep responses under 200 words.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            setChatMessages(prev => [...prev, { sender: "ai", text: replyText }]);
            setIsChatThinking(false);
            return;
          }
        }
      } catch (err) {
        console.error("Chat API error:", err);
      }
    }

    // Local Smart Chatbot Fallback
    setTimeout(() => {
      let reply = "That is a great nutrition question! ";
      const lower = userText.toLowerCase();

      if (lower.includes("swap") || lower.includes("substitute") || lower.includes("replace")) {
        reply += "For high-protein breakfasts, you can swap eggs with silken tofu scrambled with turmeric, or Greek yogurt mixed with plant protein. For chicken, roasted chickpeas or paneer/tofu make ideal nutritional substitutes!";
      } else if (lower.includes("budget") || lower.includes("cheap") || lower.includes("cost")) {
        reply += "To keep your meals budget-friendly, buy staples like lentils, oats, frozen berries, canned beans, and seasonal green veggies in bulk.";
      } else if (lower.includes("snack") || lower.includes("hungry") || lower.includes("cravings")) {
        reply += "If you feel hungry between meals, opt for low-calorie high-volume options like sliced cucumbers with hummus, a hand of raw almonds, or a cup of green tea.";
      } else {
        reply += `To maximize your goal of ${currentPlan?.profile?.goal || "overall fitness"}, focus on meeting your target ${currentPlan?.summary?.protein || 120}g of protein daily and drinking ${currentPlan?.summary?.waterLiters || 2.5}L of water.`;
      }

      setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
      setIsChatThinking(false);
    }, 800);
  };

  const handleDeletePlan = (id, e) => {
    e.stopPropagation();
    const filtered = savedPlans.filter(p => p.id !== id);
    setSavedPlans(filtered);
    localStorage.setItem("ai_diet_plans", JSON.stringify(filtered));
    if (currentPlan?.id === id) {
      setCurrentPlan(filtered[0] || null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("generator")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Icon name="heart-pulse" size={22} />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">AI Health Tracker</span>
              <span className="hidden md:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                Gemini 1.5 Powered
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {[
              { id: "generator", label: "Generator", icon: "sparkles" },
              { id: "plan", label: "Diet Plan", icon: "utensils" },
              { id: "chat", label: "AI Coach", icon: "bot" },
              { id: "grocery", label: "Grocery List", icon: "shopping-bag" },
              { id: "history", label: "History", icon: "history" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}

            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setShowKeyModal(true);
              }}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                apiKey
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
              }`}
              title="Configure Gemini API Key"
            >
              <Icon name="key" size={16} />
              <span className="hidden lg:inline">{apiKey ? "API Key Set" : "Add Key"}</span>
            </button>
          </nav>
        </div>
      </header>

      {statusNotice && (
        <div className="bg-emerald-600 text-white text-xs sm:text-sm font-medium py-2 px-4 text-center transition">
          {statusNotice}
        </div>
      )}

      {/* --- MAIN CONTENT ROUTING CONTAINER --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. DIET PLAN GENERATOR FORM */}
        {activeTab === "generator" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Generate Your AI Diet Plan
              </h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Provide your biometric details and nutrition goals to instantly receive a personalized meal breakdown.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl">
              <form onSubmit={handleGeneratePlan} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Age (years)</label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="120"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      min="30"
                      max="300"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Height (cm)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      max="250"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fitness Goal</label>
                    <select
                      value={formData.goal}
                      onChange={(e) => handleInputChange("goal", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-semibold text-slate-800"
                    >
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Maintain Weight & Stay Fit">Maintain Weight & Stay Fit</option>
                      <option value="Heart Health & Lower Cholesterol">Heart Health & Lower Cholesterol</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Activity Level</label>
                    <select
                      value={formData.activity}
                      onChange={(e) => handleInputChange("activity", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-semibold text-slate-800"
                    >
                      <option value="Sedentary (Little exercise)">Sedentary (Little exercise)</option>
                      <option value="Moderate Exercise (3-4 days/wk)">Moderate Exercise (3-4 days/wk)</option>
                      <option value="High Intensity (5-7 days/wk)">High Intensity (5-7 days/wk)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dietary Restrictions & Preferences</label>
                  <input
                    type="text"
                    placeholder="e.g. Vegetarian, Vegan, Keto, Gluten-Free, High Protein"
                    value={formData.dietaryRestrictions}
                    onChange={(e) => handleInputChange("dietaryRestrictions", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-medium text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 text-base mt-4"
                >
                  {isGenerating ? (
                    <>
                      <Icon name="loader-2" size={20} className="animate-spin" />
                      <span>Generating Plan via Gemini 1.5 Flash...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="sparkles" size={20} />
                      <span>Generate & Save Diet Plan</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. DIET PLAN RENDER VIEW */}
        {activeTab === "plan" && (
          currentPlan ? (
            <div className="space-y-8 max-w-5xl mx-auto">
              
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">
                      <Icon name="check-circle-2" size={14} />
                      <span>Active Diet Plan</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold">{currentPlan.profile.goal} Blueprint</h2>
                    <p className="text-emerald-100 text-sm mt-1">
                      Created on {currentPlan.date} • {currentPlan.profile.age} yrs, {currentPlan.profile.weight} kg ({currentPlan.profile.dietaryRestrictions || "Standard Diet"})
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition flex items-center space-x-1.5"
                    >
                      <Icon name="bot" size={16} />
                      <span>Ask AI Coach</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("grocery")}
                      className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md"
                    >
                      <Icon name="shopping-bag" size={16} />
                      <span>Grocery Checklist</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: "Daily Calories", val: `${currentPlan.summary.calories} kcal`, icon: "flame", color: "text-amber-600 bg-amber-50" },
                  { label: "Protein Target", val: `${currentPlan.summary.protein}g`, icon: "dumbbell", color: "text-emerald-600 bg-emerald-50" },
                  { label: "Carbohydrates", val: `${currentPlan.summary.carbs}g`, icon: "wheat", color: "text-blue-600 bg-blue-50" },
                  { label: "Healthy Fats", val: `${currentPlan.summary.fats}g`, icon: "droplet", color: "text-purple-600 bg-purple-50" },
                  { label: "Water Intake", val: `${currentPlan.summary.waterLiters} L`, icon: "glass-water", color: "text-cyan-600 bg-cyan-50" }
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                      <Icon name={stat.icon} size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{stat.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meals Breakdown Cards */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Today's Scheduled Meals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentPlan.meals.map((meal, idx) => (
                    <div key={idx} className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full">
                            {meal.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                            <Icon name="clock" size={14} />
                            <span>{meal.time}</span>
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-slate-900 mb-2">{meal.name}</h4>

                        <div className="flex flex-wrap gap-2 my-3 text-xs font-semibold">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">🔥 {meal.calories} kcal</span>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">💪 Protein: {meal.protein}</span>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">🌾 Carbs: {meal.carbs}</span>
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">🥑 Fats: {meal.fats}</span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Key Ingredients:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {(meal.ingredients || []).map((ing, iIdx) => (
                              <span key={iIdx} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutritionist Tips */}
              {currentPlan.tips && currentPlan.tips.length > 0 && (
                <div className="glass-card rounded-2xl p-6 border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold mb-3">
                    <Icon name="lightbulb" size={20} />
                    <h3 className="text-base">AI Nutritionist Expert Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {currentPlan.tips.map((tip, tIdx) => (
                      <li key={tIdx} className="flex items-start space-x-2 text-sm text-slate-700">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-600">No active diet plan found. Create one using the Generator tab!</p>
            </div>
          )
        )}

        {/* 3. AI NUTRITIONIST CHATBOT VIEW */}
        {activeTab === "chat" && (
          <div className="max-w-3xl mx-auto h-[75vh] flex flex-col glass-card rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            
            {/* Chat Header */}
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon name="bot" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">AI Nutrition Coach</h3>
                  <p className="text-xs text-emerald-200">Personalized answers based on your active profile</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-800 px-2.5 py-1 rounded-full text-emerald-100 font-semibold">Gemini 1.5 Flash</span>
            </div>

            {/* Messages Window */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatThinking && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center space-x-2">
                    <Icon name="loader-2" size={16} className="animate-spin text-emerald-600" />
                    <span>Coach is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto custom-scrollbar">
              {[
                "Suggest healthy ingredient swaps",
                "How can I stay on budget?",
                "Quick high-protein snack ideas",
                "Tips to curb late-night cravings"
              ].map((preset, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setChatInput(preset)}
                  className="whitespace-nowrap px-3 py-1 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 text-xs rounded-full font-medium shadow-2xs transition"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask anything about your diet or nutrition..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-800"
              />
              <button
                type="submit"
                disabled={isChatThinking || !chatInput.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md transition flex items-center justify-center"
              >
                <Icon name="send" size={18} />
              </button>
            </form>

          </div>
        )}

        {/* 4. GROCERY CHECKLIST VIEW */}
        {activeTab === "grocery" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Smart Grocery Checklist</h2>
              <p className="text-slate-600 text-sm mt-1">Ingredients automatically extracted from your active diet plan.</p>
            </div>

            {currentPlan ? (
              <div className="space-y-6">
                {Object.entries(getCategorizedGrocery(currentPlan)).map(([category, items], cIdx) => (
                  <div key={cIdx} className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center space-x-2 pb-2 border-b border-slate-100">
                      <Icon name="shopping-bag" size={18} className="text-emerald-600" />
                      <span>{category}</span>
                    </h3>
                    {items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((item, iIdx) => {
                          const isChecked = groceryChecked[item] || false;
                          return (
                            <div
                              key={iIdx}
                              onClick={() => setGroceryChecked(prev => ({ ...prev, [item]: !isChecked }))}
                              className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                                isChecked
                                  ? "bg-emerald-50/60 border-emerald-200 text-slate-400 line-through"
                                  : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              />
                              <span className="text-sm font-semibold">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No items in this category for the current plan.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-600">Please generate a diet plan first to view your grocery list.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. HISTORY VIEW */}
        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Saved Diet Plans History</h2>
              <p className="text-slate-600 text-sm mt-1">Review, switch between, or delete your previous health blueprints.</p>
            </div>

            {savedPlans.length > 0 ? (
              <div className="space-y-4">
                {savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setCurrentPlan(plan);
                      setActiveTab("plan");
                    }}
                    className={`glass-card rounded-2xl p-5 shadow-sm border cursor-pointer transition flex items-center justify-between ${
                      currentPlan?.id === plan.id ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Icon name="utensils" size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{plan.profile.goal} Blueprint</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Created: {plan.date} • {plan.summary.calories} kcal • {plan.profile.weight} kg ({plan.profile.dietaryRestrictions || "Standard"})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleDeletePlan(plan.id, e)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete plan"
                      >
                        <Icon name="trash-2" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-600">No saved plans found in your browser history.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- API KEY CONFIGURATION MODAL --- */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
                <Icon name="key" size={20} className="text-emerald-600" />
                <span>Gemini API Key Settings</span>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="x" size={20} />
              </button>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
              Enter your Google Gemini API Key to enable live AI generation and the AI Nutrition Coach. Your key is securely stored only in your browser's local storage.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-800 font-mono"
              />

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}