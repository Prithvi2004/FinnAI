import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSL36ldXdneZ_l3Zn9XrvSlIxBo_OW-DA",
  authDomain: "finnai-bec75.firebaseapp.com",
  projectId: "finnai-bec75",
  storageBucket: "finnai-bec75.firebasestorage.app",
  messagingSenderId: "687564120275",
  appId: "1:687564120275:web:16c0c20f18ca8a5c89b426",
  measurementId: "G-WQP8CPHK36",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { auth };