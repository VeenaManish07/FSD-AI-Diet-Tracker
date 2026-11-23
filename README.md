
# AI Diet Tracker

AI Diet Tracker is a frontend-based diet planning application built using React.

## Features

- Personalized diet plan generation
- Gemini AI integration
- Local fallback diet-plan generator
- AI Nutrition Coach
- Context-aware local coach responses
- Daily calorie and macronutrient breakdown
- Grocery checklist generated from meal ingredients
- Grocery list PDF export
- Diet plan history
- LocalStorage persistence
- Gemini API key configuration

## Technologies Used

- HTML5
- CSS3
- JavaScript
- React 18
- Babel Standalone
- Tailwind CSS
- Lucide Icons
- jsPDF
- Gemini API
- Browser LocalStorage

## Project Structure

```text
AI-Diet-Tracker/
│
├── index.html
├── css/
│   └── styles.css
│
├── js/
│   ├── config/
│   │   └── constants.js
│   ├── components/
│   ├── services/
│   │   └── geminiService.js
│   └── utils/
│
└── README.md
```

## Running the Project

1. Clone or download this repository.
2. Open the project folder in VS Code.
3. Install or enable the Live Server extension.
4. Right-click `index.html`.
5. Select **Open with Live Server**.

No npm installation or build command is required.

## Storage

Diet plan history and the Gemini API key are stored in browser LocalStorage.

## Future Improvements

- Backend integration
- User authentication
- Database-based diet plan storage
- Secure API key handling
- User-specific diet history
