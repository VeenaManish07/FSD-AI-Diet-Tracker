# AI Health & Diet Tracker

Refactored from the supplied single-file HTML/React code into a Vite + React project.

## Structure

- `index.html` — HTML document shell.
- `src/main.jsx` — React entry point and mounting.
- `src/App.jsx` — main application state, event handlers, navigation, and screen UI.
- `src/styles.css` — global styles and custom visual styling.
- `src/components/Icon.jsx` — reusable Lucide icon component.
- `src/utils/dietPlan.js` — local fallback diet-plan generation.
- `src/utils/grocery.js` — grocery ingredient categorization.

The Gemini API request logic remains in `src/App.jsx` alongside the form/chat event handlers so the original behavior is preserved without a risky rewrite of the request flow.

## Run

Install Node.js 18+ and run:

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Important

The original source included duplicate React mounting code and repeated closing HTML tags. This project uses a single React 18 `createRoot` entry point.

The Gemini API key is stored in browser local storage, as in the original. For production use, route Gemini API requests through a backend rather than exposing the key in client-side code.
