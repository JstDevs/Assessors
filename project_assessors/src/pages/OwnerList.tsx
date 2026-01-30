import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, Filter, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';
import api from '../../axiosBase';
import OwnerDialog from '../dialogs/ol/dialog.tsx';

interface OwnerSummary {
    owner_id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    tin_no: string;
    contact_no: string;
    is_active: number;
    created_at: string;
}

export default function OwnerManagement() {
    const [owners, setOwners] = useState<OwnerSummary[]>([]);
    const [filteredOwners, setFilteredOwners] = useState<OwnerSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refresh, setRefresh] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'preview'>('add');
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

    useEffect(() => {
        fetchOwners();
    }, [refresh]);

    // Local Filter Logic
    useEffect(() => {
        let result = owners;

        // 1. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(o => 
                o.last_name.toLowerCase().includes(lower) ||
                o.first_name.toLowerCase().includes(lower) ||
                o.tin_no?.includes(searchTerm)
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL') {
            const isActive = statusFilter === 'ACTIVE' ? 1 : 0;
            result = result.filter(o => o.is_active === isActive);
        }

        setFilteredOwners(result);
    }, [owners, searchTerm, statusFilter]);

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const res = await api.get('ol/'); 
            setOwners(res.data|| []); // Adjust based on actual API response structure
        } catch (err) {
            console.error("Failed to fetch owners", err);
            setError("Unable to retrieve owner list.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setDialogMode('add');
        setSelectedId(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (id: number) => {
        setDialogMode('edit');
        setSelectedId(id);
        setIsDialogOpen(true);
    };

    const handlePreview = (id: number) => {
        setDialogMode('preview');
        setSelectedId(id);
        setIsDialogOpen(true);
    };

    const getFullName = (owner: OwnerSummary) => {
        return `${owner.last_name}, ${owner.first_name} ${owner.middle_name ? owner.middle_name[0] + '.' : ''}`;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 w-full font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Owner Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Create and manage property owner profiles and contact information.</p>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all gap-2"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Register Owner
                    </button>
                </div>

                {/* Controls & List Container */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                    
                    {/* Filters */}
                    <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name or TIN..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="border border-slate-200 rounded-lg py-2 pl-2 pr-8 text-sm bg-slate-50 focus:bg-white outline-none cursor-pointer"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active Only</option>
                                <option value="INACTIVE">Inactive Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p>Loading records...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                <p>{error}</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 w-16">ID</th>
                                        <th className="px-6 py-3">Owner Name</th>
                                        <th className="px-6 py-3">TIN</th>
                                        <th className="px-6 py-3">Contact</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOwners.length > 0 ? (
                                        filteredOwners.map((owner) => (
                                            <tr key={owner.owner_id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                                    {String(owner.owner_id).padStart(4, '0')}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                    {getFullName(owner)}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-bold">
                                                    {owner.tin_no || <span className="text-black italic">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-bold">
                                                    {owner.contact_no || <span className="text-black italic">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {owner.is_active === 1 ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <UserCheck size={12} className="mr-1" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            <UserX size={12} className="mr-1" /> Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100">
                                                        <button 
                                                            onClick={() => handlePreview(owner.owner_id)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEdit(owner.owner_id)}
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors" 
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                No owners found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {/* Table Footer */}
                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
                        <span>Showing {filteredOwners.length} records</span>
                    </div>
                </div>
            </div>

            {/* Dialog */}
            <OwnerDialog 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                mode={dialogMode}
                ownerId={selectedId}
                setRefresh={setRefresh}
            />
        </div>
    );
}