import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import LeftNavigation from "../common/LeftNavigation";

// In your actual environment, use this import:
// import LeftNavigation from "../common/LeftNavigation.tsx"; 

// It's good practice to export this interface so it can be shared 
export interface User {
    id: number;
    username: string;
    role_id: number;
    role_name: string;
    permission_level: number;
}

interface LandingProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function Landing({ user, setUser }: LandingProps) {
    
    // 1. Inline Error Handling
    // If the user is null, we return a full-screen error UI.
    // This prevents the LeftNavigation and Outlet from ever mounting.
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 text-slate-800">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-3xl font-bold mb-2">401 Unauthorized</h1>
                <p className="text-slate-500 mb-6 text-center max-w-md">
                    You do not have permission to view this page. Please log in with an authorized Assessor account to continue.
                </p>
                <Link 
                    to="/" 
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    Return to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            {/* Pass the setUser function to allow LeftNavigation to handle logout */}
            <LeftNavigation user={user} setUser={setUser} />
            
            {/* The main content area where child routes render */}
            <main className="flex-1 overflow-y-auto w-full relative">
                <Outlet />
            </main>
        </div>
    );
}