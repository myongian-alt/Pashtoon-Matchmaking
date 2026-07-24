import React, { createContext, useState, ReactNode } from 'react';

interface UserContextType {
  selectedGender: 'male' | 'female' | null;
  setSelectedGender: (gender: 'male' | 'female') => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  userPhone: string | null;
  setUserPhone: (phone: string | null) => void;
  profileCompleted: boolean;
  setProfileCompleted: (value: boolean) => void;
  paymentCompleted: boolean;
  setPaymentCompleted: (value: boolean) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  return (
    <UserContext.Provider value={{
      selectedGender,
      setSelectedGender,
      isAuthenticated,
      setIsAuthenticated,
      isGuest,
      setIsGuest,
      userEmail,
      setUserEmail,
      userPhone,
      setUserPhone,
      profileCompleted,
      setProfileCompleted,
      paymentCompleted,
      setPaymentCompleted,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
