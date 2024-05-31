/**
 * IMPORTANT NOTE
 * When a change is made to a user then the following 
 * changes to our data management system must be made:
 * 
 * 1. **Firebase**: All persistent changes to user document are made here. (setDoc)
 * 2. **AsyncStorage**: Used for quick access to user data.                (setItem("@user", JSON.stringify(user:User)))
 * 3. **useContext**: Real-time state management across components.        (setUserInfo(user:User))
 */

import React, { useEffect, useState, createContext, ReactNode } from 'react'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/user"
import { removeExpoPushToken } from '../helpers/pushNotification';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * This component serves as a global state manager for user-related data across the app.
 * 
 * It retrieves user data from AsyncStorage and provides real-time state management
 * for user-related information that needs to using the useContext hook.
 * 
 * @param props - The props for the UserProvider component.
 * @returns The UserProvider component wrapping its children.
 */
const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<User | undefined>(undefined)

  const signOutUser = async (hasExpoPushToken: boolean) => {
    try {
      if (hasExpoPushToken) {
        await removeExpoPushToken();
      }
      await signOut(auth);
    } catch (error) {
      console.error(error);
    } finally {
      await AsyncStorage.removeItem('@user');
      setUserInfo(undefined);
    }
  };


  useEffect(() => {
    const getLocalUser = async () => {
      try {
        setUserLoading(true);
        const userJSON = await AsyncStorage.getItem("@user");
        const userData = userJSON ? JSON.parse(userJSON) : undefined;
        setUserInfo(userData);
      } catch (error) {
        console.error('Error while fetching user data:', error);
      } finally {
        setUserLoading(false);
      }
    };

    getLocalUser()
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, userLoading, setUserLoading, signOutUser }}>
      {children}
    </UserContext.Provider>
  );
}

type UserProviderProps = {
  children: ReactNode;
};

type UserContextType = {
  userInfo: User | undefined;
  setUserInfo: React.Dispatch<React.SetStateAction<User | undefined>>
  userLoading: boolean;
  setUserLoading: React.Dispatch<React.SetStateAction<boolean>>
  signOutUser: (hasExpoPushToken: boolean) => Promise<void>;
};

export { UserContext, UserProvider };
