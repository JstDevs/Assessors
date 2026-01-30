import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login(){
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const location = useNavigate();

    const handleSubmit = (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        location("private");
    }
    
    return(
        <div className="flex items-center justify-center h-screen w-screen dark:bg-emerald-600">
            <form
            onSubmit={(e)=>handleSubmit(e)}
            className="bg-white p-8 rounded-2xl shadow-lg w-96 space-y-4"
            >
                <h1 className="text-2xl font-bold text-center">Assessor Login</h1>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Username</label>
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Password</label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition"
                >
                    Login
                </button>
            </form>
        </div>
    )
}

export default Login;