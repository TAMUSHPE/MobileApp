import { auth } from "@/app/api/firebaseConfig";
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


export const checkAuthAndRedirect = async (router: AppRouterInstance): Promise<void> => {
    if (!auth.currentUser) {
        router.push('/');
    } else {
        const token = await auth.currentUser.getIdTokenResult();
        if (!token.claims.admin && !token.claims.developer && !token.claims.officer) {
            alert("You do not have permission to this website. Please sign in with an authorized account.")
            auth.signOut();
            router.push('/');
        }
    }
};


