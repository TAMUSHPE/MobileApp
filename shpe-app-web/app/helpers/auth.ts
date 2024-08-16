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
    provider.addScope("email");
    provider.setCustomParameters({
        'hd': 'tamu.edu',
        'prompt': 'select_account',
    });

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const idTokenResult = await user.getIdTokenResult();

        const hasRequiredRole = idTokenResult.claims.admin || idTokenResult.claims.officer || idTokenResult.claims.developer || idTokenResult.claims.lead || idTokenResult.claims.representative;

        if (!hasRequiredRole) {
            await signOut(auth);
            alert('Access denied. You do not have the required role to access this application.');
        } else {
            router.push('/dashboard');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    }
};
