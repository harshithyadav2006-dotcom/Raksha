import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCZMhdxCXZ04qWa2doYbZ3GKbC3yHHG7Bw",
  authDomain: "raksha-1426f.firebaseapp.com",
  projectId: "raksha-1426f",
  storageBucket: "raksha-1426f.firebasestorage.app",
  messagingSenderId: "337529770601",
  appId: "1:337529770601:web:a94357259f1d00de1e48f8",
  measurementId: "G-QPFZLWJCEF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
