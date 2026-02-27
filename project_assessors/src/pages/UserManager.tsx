import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, X, UserPlus, CheckCircle2, 
    XCircle, Loader2, Key, Edit2, Power
} from 'lucide-react';
import api from '../../axiosBase';

// --- Interfaces ---
interface Role {
    id: number;
    name: string;
    description: string;
    permission_level: number;
}

interface UserRecord {
    id: number;
    username: string;
    role_id: number;
    role_name: string;
    is_active: boolean;
    permission_level: number;
    created_at: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    
    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role_id: ''
    });

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [rolesRes, usersRes] = await Promise.all([
                    api.get('user/roles'),
                    api.get('user/users') 
                ]);
                setRoles(rolesRes.data);
                setUsers(usersRes.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', role_id: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserRecord) => {
        setEditingUser(user);
        setFormData({ username: user.username, password: '', role_id: user.role_id.toString() });
        setIsModalOpen(true);
    };

    // Toggle Active Status (Optimistic UI Update)
    const handleToggleStatus = async (user: UserRecord) => {
        const newStatus = !user.is_active;
        
        // Optimistic update
        setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
        
        try {
            await api.patch(`user/users/${user.id}/status`, { is_active: newStatus });
        } catch (error) {
            console.error("Error toggling status:", error);
            // Revert on failure
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: user.is_active } : u));
            alert("Failed to update user status.");
        }
    };

    // Handle Create or Edit Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const selectedRole = roles.find(r => r.id === parseInt(formData.role_id));
        
        try {
            if (editingUser) {
                // Update existing user's role
                await api.put(`user/users/${editingUser.id}/role`, { role_id: formData.role_id });
                
                setUsers(users.map(u => u.id === editingUser.id ? {
                    ...u, 
                    role_id: parseInt(formData.role_id),
                    permission_level: selectedRole?.permission_level || u.permission_level,
                    role_name: selectedRole?.name || u.role_name
                } : u));
            } else {
                // Create new user
                const res = await api.post('/users/register', formData);
                const newUser: UserRecord = {
                    id: res.data.data.userId || Date.now(),
                    username: formData.username,
                    role_id: parseInt(formData.role_id),
                    permission_level: selectedRole?.permission_level || 1,
                    role_name: selectedRole?.name || 'Unknown',
                    is_active: true,
                    created_at: new Date().toISOString()
                };
                setUsers([newUser, ...users]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Action failed. If creating, username might be taken.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3.5 rounded-xl text-emerald-700">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Access & Roles</h1>
                            <p className="text-slate-500 text-sm font-medium">Manage user accounts and permission levels</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-colors"
                    >
                        <UserPlus size={18} />
                        Create User
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Roles Overview */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Key size={20} className="text-slate-400"/> Available Roles
                        </h2>
                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {roles.map(role => (
                                    <div key={role.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800">{role.name}</span>
                                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                                                Level {role.permission_level}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500">{role.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Users List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users size={20} className="text-slate-400"/> Active Users
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {loading ? (
                                <div className="flex justify-center items-center p-12">
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Username</th>
                                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Assigned Role</th>
                                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users.map((user:UserRecord) => (
                                                <tr key={user.id} className={`transition-colors ${user.is_active ? 'hover:bg-slate-50/50' : 'bg-slate-50 opacity-75'}`}>
                                                    <td className="px-6 py-4">
                                                        <div className={`font-bold ${user.is_active ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{user.username}</div>
                                                        <div className="text-xs text-slate-400 mt-0.5">Added: {new Date(user.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md inline-flex items-center gap-1.5 ${
                                                            user.permission_level >= 3 ? 'bg-rose-100 text-rose-700' :
                                                            user.permission_level === 2 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            <Shield size={12} /> {user.role_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                                <CheckCircle2 size={16} /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                                                <XCircle size={16} /> Disabled
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => openEditModal(user)}
                                                            title="Edit Role"
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleStatus(user)}
                                                            title={user.is_active ? "Disable User" : "Enable User"}
                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                user.is_active 
                                                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                                                : 'text-rose-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            <Power size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create/Edit User Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                                    {editingUser ? <Edit2 size={20} className="text-indigo-600"/> : <UserPlus size={20} className="text-emerald-600"/>} 
                                    {editingUser ? 'Edit User Role' : 'Create New User'}
                                </h3>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        disabled={!!editingUser} // Can't change username in edit mode
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="e.g., jdelacruz"
                                    />
                                </div>
                                
                                {/* Only require password if creating a new user */}
                                {!editingUser && (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            minLength={8}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                                            placeholder="Minimum 8 characters"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Assign Role</label>
                                    <select
                                        name="role_id"
                                        required
                                        value={formData.role_id}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                                    >
                                        <option value="" disabled>Select a role...</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name} (Level {role.permission_level})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 px-4 py-2.5 text-white font-bold rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center ${editingUser ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (editingUser ? 'Save Changes' : 'Create User')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}