# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# 📸 ANPR Gantry & Toll Processing Backend

The core processing engine of the Hybrid Toll System. This module handles image capture at the gantry, license plate recognition via the Plate Recognizer API, and payment processing via Node.js.

## ⚙️ How it Works
1. **Detection:** A vehicle passes through the gantry, triggering a camera capture.
2. **Recognition:** The image is sent to the **Plate Recognizer API** (No custom model training required).
3. **Validation:** The recognized plate is sent to the Node.js backend.
4. **Processing:** The backend looks up the plate in **Firebase**, calculates the toll, and initiates a charge via the **Payment Gateway**.

## 🛠️ Tech Stack
* **Language:** Node.js (Express.js)
* **Computer Vision:** [Plate Recognizer API](https://platerecognizer.com/)
* **Database Management:** Firebase Admin SDK
* **Server:** Hosted on Heroku / AWS / DigitalOcean

## 🔑 Environment Variables (.env)
Create a `.env` file in the root directory:
```env
PORT=3000
PLATE_REC_API_KEY=your_plate_recognizer_key
STRIPE_SECRET_KEY=your_stripe_key
FIREBASE_SERVICE_ACCOUNT_JSON=path_to_your_json