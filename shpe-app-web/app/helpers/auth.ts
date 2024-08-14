import { auth } from "@/config/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const handleLogout = async (router: AppRouterInstance) => {
    signOut(auth).then(() => {
        router.push('/');
    }).catch((error) => {
        console.error(error);
    });
}

export const handleLogin = async (router: AppRouterInstance) => {
    const provider = new GoogleAuthProvider();
    provider.addScope("email")
    provider.setCustomParameters({
        'hd': 'tamu.edu',
        'prompt': 'select_account'
    });
    signInWithPopup(auth, provider).then((result) => {
        if (result.user?.email?.endsWith('@tamu.edu')) {
            router.push('/dashboard');
        } else {
            auth.signOut();
            alert('Please sign in with your TAMU account.');
        }
    }).catch((error) => {
        console.error(error);
    });
}



