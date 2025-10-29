import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBgHA2-tU_51o_BibH2_KHghJvTxzj5GYc",
  authDomain: "a-invoice-generator.firebaseapp.com",
  projectId: "a-invoice-generator",
  storageBucket: "a-invoice-generator.firebasestorage.app",
  messagingSenderId: "91125357249",
  appId: "1:91125357249:web:77b7de9fdf5fc27d4d9240",
  measurementId: "G-LWSXP8FVQ2"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);