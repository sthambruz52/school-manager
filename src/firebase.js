import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqpBMqKkeESZ2ygqJfjhvLrRBN-rwTXiE",
  authDomain: "sajoco-92.firebaseapp.com",
  projectId: "sajoco-92",
  storageBucket: "sajoco-92.firebasestorage.app",
  messagingSenderId: "722326370143",
  appId: "1:722326370143:web:c30fc79d1e0cc84594a8ea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);