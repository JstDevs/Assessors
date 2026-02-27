import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../axiosBase'; // Adjust path if necessary

// Define the User shape based on what the backend returns
interface User {
    id: number;
    username: string;
    role_id: number;
    role_name: string;
    permission_level: number;
}

interface LoginProps {
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function Login({ setUser }: LoginProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Standard convention is to name this 'navigate'
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Call the actual backend route we just created
            const res = await api.post('/user/login', { username, password });
            
            // Lift the state up to the parent component (e.g., App.tsx)
            setUser(res.data.user);
            
            // Redirect to the private dashboard
            navigate("/private");
        } catch (err: any) {
            // Handle expected API errors (401, 400, 403) or network errors
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Network error. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="flex items-center justify-center h-screen w-screen dark:bg-emerald-600 bg-emerald-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-lg w-96 space-y-4"
            >
                <h1 className="text-2xl font-bold text-center text-slate-800">Assessor Login</h1>

                {/* Fixed height for error container prevents UI jumping */}
                <div className="min-h-[20px]">
                    {error && <p className="text-red-600 text-sm font-medium text-center">{error}</p>}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        disabled={isLoading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 text-white p-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        "Login"
                    )}
                </button>
            </form>
        </div>
    );
}