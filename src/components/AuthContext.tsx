 "use client";

import * as React from "react";
import {
  getFirebaseAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "@/lib/firebaseClient";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignIn = React.useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const handleSignUp = React.useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const handleSignOut = React.useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOutUser: handleSignOut,
    }),
    [user, loading, handleSignIn, handleSignUp, handleSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>.");
  }
  return ctx;
}

