# Fitforge

Fitforge is a comprehensive mobile fitness application built with the **MERN stack** (MongoDB, Express, Node.js, and React Native). It is designed to help users take full control of their fitness journey through personalized workout scheduling, nutrition management, and real-time progress tracking.

## 🚀 Features

*   **Authentication & Security**: Secure user login and registration with JWT-based authentication.
*   **Workout Plan Management**: Create, view, and customize workout routines tailored to your fitness level.
*   **Nutrition & Diet Management**: Log daily meals and track nutritional intake to stay on top of your diet goals.
*   **Progress Tracking**: Visualize your fitness journey with data-driven progress logs.
*   **Workout Scheduler**: Plan your week effectively with an integrated calendar for your exercises.
*   **Exercise Library**: A centralized hub to manage and browse different types of exercises.
*   **Goals & Achievements**: Set personal milestones and track your success as you hit new heights.


## 🛠 Tech Stack

**Frontend:**
*   React Native (Expo)
*   React Navigation
*   Axios for API requests

**Backend:**
*   Node.js & Express.js
*   MongoDB (Database)
*   JWT (Authentication)

**Deployment:**
*   **Backend:** Hosted on [Railway](https://railway.app/)
*   **Frontend:** Android APK generated via [Expo EAS](https://expo.dev/eas)


## 📦 Installation & Setup

### 1. Prerequisites
*   Node.js (v16 or higher)
*   Expo Go app on your mobile device (to test locally)
*   MongoDB Atlas account or local MongoDB instance

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/MithilaDissanayaka14/Workout-App.git

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create a .env file and add your credentials:
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key

# Brevo SMTP Settings
SMTP_USER=
SENDER_EMAIL=
SMTP_PASS=

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo project
npx expo start
```


## 📱 Deployment

*   **Backend**: The API is live and hosted on **Railway**.
*   **Android**: not yet released


## 👨‍💻 Authors

**Y2S2.SE.01.01 Group 08 Students in SLIIT**
*   GitHub: [@MithilaDissanayaka14](https://github.com/MithilaDissanayaka14)


