import React, { useEffect, useState, createContext } from 'react'
import { User } from "../types/User"
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserProviderProps = {
  children: React.ReactNode;
}
type UserContextType = {
  userInfo: User | undefined;
  setUserInfo: React.Dispatch<React.SetStateAction<User | undefined>>
  userLoading: boolean;
  setUserLoading: React.Dispatch<React.SetStateAction<boolean>>
};


const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<User | undefined>(undefined)

  useEffect(() => {
    const getLocalUser = () => {
      setUserLoading(true);
      AsyncStorage.getItem("@user")
        .then(userJSON => {
          const userData = userJSON ? JSON.parse(userJSON) : undefined;
          setUserInfo(userData);
        })
        .catch((err) => console.error(err))
        .finally(() => {
          setUserLoading(false);
        });
    };
    getLocalUser()
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, userLoading, setUserLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider };
