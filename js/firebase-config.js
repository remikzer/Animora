// const firebaseConfig = {
//   apiKey: "AIzaSyAtOUvEgUiRJTEczdnPRGmEVVC7bGSgIo8",
//   authDomain: "animora-2d9f1.firebaseapp.com",
//   projectId: "animora-2d9f1",
//   storageBucket: "animora-2d9f1.firebasestorage.app",
//   messagingSenderId: "145575131863",
//   appId: "1:145575131863:web:0bae8fff0f298b0f8bce92",
// };

// firebase-config.js

// Initialisation
const firebaseConfig = {
  apiKey: "AIzaSyAtOUvEgUiRJTEczdnPRGmEVVC7bGSgIo8",
  authDomain: "animora-2d9f1.firebaseapp.com",
  projectId: "animora-2d9f1",
  storageBucket: "animora-2d9f1.firebasestorage.app",
  messagingSenderId: "145575131863",
  appId: "1:145575131863:web:0bae8fff0f298b0f8bce92",
};

firebase.initializeApp(firebaseConfig);

// Déclarations globales
const auth = firebase.auth();
const db = firebase.firestore();

// Expose les variables dans le scope global
window.auth = auth;
window.db = db;
