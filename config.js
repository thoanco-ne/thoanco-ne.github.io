// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4lM0Eu9N0j2kBx7NqNiCh-EnxTNUIdts",
  authDomain: "thoanco3o.firebaseapp.com",
  databaseURL: "https://thoanco3o-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "thoanco3o",
  storageBucket: "thoanco3o.firebasestorage.app",
  messagingSenderId: "769082148341",
  appId: "1:769082148341:web:b0c455fe5bc329fa438cbc",
  measurementId: "G-HBZFHJK0B8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
