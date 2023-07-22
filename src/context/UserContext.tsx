import React, { useEffect, useState, createContext } from 'react'
import { PublicUserInfo } from "../types/User"
import { getPublicUserData } from '../api/firebaseUtils'
import { auth } from '../config/firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserProviderProps = {
  children: React.ReactNode;
}
type UserContextType = {
  userInfo: Partial<PublicUserInfo> | undefined;
  setUserInfo: React.Dispatch<React.SetStateAction<Partial<PublicUserInfo> | undefined>>
  userLoading: boolean;
  setUserLoading: React.Dispatch<React.SetStateAction<boolean>>
};


const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<Partial<PublicUserInfo> | undefined>(undefined)

  useEffect(() => {
    const getLocalUser = async () => {
      try {
        setUserLoading(true);
        const userJSON = await AsyncStorage.getItem("@user");
        const userData = userJSON ? JSON.parse(userJSON) : null;
        if (userData !== null) {
          // Updated Data From Firebase 
          // const userData = await getPublicUserData(auth.currentUser?.uid!);
          setUserInfo(userData);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setUserLoading(false);
      }
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
