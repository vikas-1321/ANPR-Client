import { initializeApp } from "firebase/app";
// ADD 'getFirestore' to this import line
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBtf0g0OwWC9RzwZQbfdXN0G6m_XKflbyg",
  authDomain: "toll-project-479605.firebaseapp.com",
  projectId: "toll-project-479605",
  storageBucket: "toll-project-479605.firebasestorage.app",
  messagingSenderId: "605111517030",
  appId: "1:605111517030:web:f261ad97433dedb83dd2a7",
  measurementId: "G-TR5X9W78FD"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it
export const db = getFirestore(app);


// Keep your Google Maps key the same if it's still active
export const GOOGLE_MAPS_API_KEY = "AIzaSyBHvLh-ChOTh2iG0K3OMZZSqh5NkRsPzQw";