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
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
  const [userInfo, setUserInfo] = useState<User | undefined>(undefined);
  const [cacheReady, setCacheReady] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authenticatedUid, setAuthenticatedUid] = useState<string | undefined>(undefined);

  const signOutUser = async (deleteExpoPushToken: boolean) => {
    try {
      if (deleteExpoPushToken) {
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
        const userJSON = await AsyncStorage.getItem("@user");
        const userData = userJSON ? JSON.parse(userJSON) : undefined;
        setUserInfo(userData);
      } catch (error) {
        console.error('[UserContext] failed to hydrate user from AsyncStorage', error);
      } finally {
        setCacheReady(true);
      }
    };

    getLocalUser();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      setAuthenticatedUid(firebaseUser?.uid);
      setAuthReady(true);
    }, error => {
      console.error('[UserContext] Firebase authentication restoration failed', error);
      setAuthenticatedUid(undefined);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!cacheReady || !authReady) return;

    let cancelled = false;

    const reconcileCachedUser = async () => {
      const cachedUid = userInfo?.publicInfo?.uid;
      if (userInfo && authenticatedUid && !cachedUid) {
        // Caches created before publicInfo.uid was added can safely adopt the
        // restored Firebase session's uid. The next refresh replaces this data.
        const repairedUser = {
          ...userInfo,
          publicInfo: {
            ...userInfo.publicInfo,
            uid: authenticatedUid,
          },
        };

        try {
          await AsyncStorage.setItem('@user', JSON.stringify(repairedUser));
          if (!cancelled) setUserInfo(repairedUser);
        } catch (error) {
          console.error('[UserContext] failed to repair legacy cached user', error);
        }
      } else if (userInfo && (!authenticatedUid || cachedUid !== authenticatedUid)) {
        console.warn('[UserContext] clearing cached user because it does not match Firebase authentication');
        try {
          await AsyncStorage.removeItem('@user');
        } catch (error) {
          console.error('[UserContext] failed to clear mismatched cached user', error);
        } finally {
          if (!cancelled) setUserInfo(undefined);
        }
      }

      if (!cancelled) setUserLoading(false);
    };

    reconcileCachedUser();

    return () => {
      cancelled = true;
    };
  }, [authReady, authenticatedUid, cacheReady]);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, userLoading, setUserLoading, authReady, authenticatedUid, signOutUser }}>
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
  authReady: boolean;
  authenticatedUid: string | undefined;
  signOutUser: (deleteExpoPushToken: boolean) => Promise<void>;
};

export { UserContext, UserProvider };
