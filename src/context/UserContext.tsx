import React, { createContext, useState, ReactNode } from 'react';

interface UserContextType {
  selectedGender: 'male' | 'female' | null;
  setSelectedGender: (gender: 'male' | 'female') => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  return (
    <UserContext.Provider value={{ selectedGender, setSelectedGender }}>
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
