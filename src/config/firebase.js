// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import dotenv from "dotenv"

const firebaseConfig = {
    apiKey: import.meta.env.VITE_apiKey,
    authDomain: "modern-bank-caaca.firebaseapp.com",
    projectId: "modern-bank-caaca",
    storageBucket: "modern-bank-caaca.firebasestorage.app",
    messagingSenderId: "759511262321",
    appId: "1:759511262321:web:3c9647274f2c6a1fcae7d0",
    measurementId: "G-T7ENN9D4V9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);