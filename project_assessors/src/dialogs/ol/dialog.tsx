import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, User, Phone, MapPin, FileText, History, AlertCircle, ArrowRight, Clock, User as UserIcon } from 'lucide-react';
import api from '../../../axiosBase.ts';

type DialogMode = 'add' | 'edit' | 'preview';

interface Owner {
    owner_id?: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    suffix: string;
    tin_no: string;
    email: string;
    contact_no: string;
    address_house_no: string;
    is_active: number; // 1 or 0
    remarks: string;
}

interface OwnerHistory {
    history_id: number;
    owner_id: number;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE'; 
    changed_at: string;
    changed_by: string;
}

interface OwnerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode: DialogMode;
    ownerId?: number;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialOwnerState: Owner = {
    last_name: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    tin_no: '',
    email: '',
    contact_no: '',
    address_house_no: '',
    is_active: 1,
    remarks: ''
};

export default function OwnerDialog({ isOpen, onClose, mode, ownerId, setRefresh }: OwnerDialogProps) {
    const [formData, setFormData] = useState<Owner>(initialOwnerState);
    const [historyData, setHistoryData] = useState<OwnerHistory[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showHistory, setShowHistory] = useState(false); 

    // Reset state when dialog opens/closes or ID changes
    useEffect(() => {
        if (isOpen) {
            setError('');
            setShowHistory(false); 
            setHistoryData([]);
            
            if (mode !== 'add' && ownerId) {
                fetchOwnerDetails(ownerId);
            } else {
                setFormData(initialOwnerState);
            }
        }
    }, [isOpen, mode, ownerId]);

    // Fetch History when toggled
    useEffect(() => {
        if (showHistory && ownerId) {
            fetchHistory(ownerId);
        }
    }, [showHistory, ownerId]);

    // Group history items by transaction (same time, action, and user)
    const groupedHistory = useMemo(() => {
        const groups: {
            id: string;
            action: string;
            date: string;
            user: string;
            items: OwnerHistory[];
        }[] = [];

        historyData.forEach((log) => {
            const lastGroup = groups[groups.length - 1];
            // Check if this log belongs to the previous group (same transaction)
            if (lastGroup && 
                lastGroup.date === log.changed_at && 
                lastGroup.action === log.action_type && 
                lastGroup.user === log.changed_by) {
                lastGroup.items.push(log);
            } else {
                // Start a new group
                groups.push({
                    id: `group-${log.history_id}`,
                    action: log.action_type,
                    date: log.changed_at,
                    user: log.changed_by,
                    items: [log]
                });
            }
        });
        return groups;
    }, [historyData]);

    const fetchOwnerDetails = async (id: number) => {
        setLoading(true);
        try {
            const res = await api.get(`ol/${id}`);
            const data = res.data.data || res.data;
            
            setFormData({
                ...initialOwnerState,
                ...data,
                middle_name: data.middle_name || '',
                suffix: data.suffix || '',
                tin_no: data.tin_no || '',
                email: data.email || '',
                contact_no: data.contact_no || '',
                address_house_no: data.address_house_no || '',
                remarks: data.remarks || ''
            }); 
        } catch (err: any) {
            setError('Failed to fetch owner details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (id: number) => {
        setLoadingHistory(true);
        try {
            const res = await api.get(`ol/history/${id}`);
            setHistoryData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleActive = () => {
        if (mode === 'preview') return;
        setFormData(prev => ({ ...prev, is_active: prev.is_active === 1 ? 0 : 1 }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (mode === 'add') {
                await api.post('ol/', formData);
            } else if (mode === 'edit' && ownerId) {
                await api.put(`ol/${ownerId}`, formData);
            }
            setRefresh(prev => !prev);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (!isOpen) return null;

    const isReadOnly = mode === 'preview';

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {mode === 'add' ? 'Register New Owner' : mode === 'edit' ? 'Edit Owner Information' : 'Owner Details'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-slate-500">Loading information...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
                            <AlertCircle size={20} /> {error}
                        </div>
                    ) : showHistory ? (
                        // History View
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setShowHistory(false)} 
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                                    >
                                        ← Back to Details
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <History size={16} /> Audit Logs
                                    </h3>
                                </div>
                            </div>

                            {loadingHistory ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                                </div>
                            ) : groupedHistory.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p>No history records found.</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                    {groupedHistory.map((group) => (
                                        <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                            {/* Group Header */}
                                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${getActionColor(group.action)}`}>
                                                        {group.action}
                                                    </span>
                                                    <div className="flex items-center text-xs text-slate-500 gap-1">
                                                        <Clock size={14} />
                                                        <span>{formatDate(group.date)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-400 gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                    <UserIcon size={12} />
                                                    <span className="font-medium">{group.user}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Group Items */}
                                            <div className="p-0 divide-y divide-slate-100">
                                                {group.action === 'CREATE'? <p className='text-emerald-900 font-bold text-center p-1 bg-emerald-200'>Newly Created Owner!</p> :
                                                <>
                                                    {group.items.map((log) => (
                                                        <div key={log.history_id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                                                            <div className="sm:w-1/4 min-w-[140px]">
                                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                                                                    {log.field_name.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 flex items-center gap-3 text-sm">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1 text-slate-400 text-xs mb-0.5">Old Value</div>
                                                                    <div className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 text-xs font-mono break-all">
                                                                        {log.old_value === null ? 'null' : log.old_value === '' ? '""' : log.old_value}
                                                                    </div>
                                                                </div>
                                                                <ArrowRight size={16} className="text-slate-300 shrink-0 mt-4" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1 text-slate-400 text-xs mb-0.5">New Value</div>
                                                                    <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 text-xs font-mono break-all">
                                                                        {log.new_value === null ? 'null' : log.new_value === '' ? '""' : log.new_value}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form id="owner-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* ... (Form content remains unchanged) ... */}
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">First Name <span className="text-red-500">*</span></label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} disabled={isReadOnly} required className="form-input" placeholder="First Name" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Middle Name</label>
                                        <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Middle Name" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} disabled={isReadOnly} required className="form-input" placeholder="Last Name" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Suffix</label>
                                        <input type="text" name="suffix" value={formData.suffix} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Jr, Sr, III" />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Identification */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3 flex items-center gap-2">
                                    <Phone size={14} /> Contact & Identification
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">TIN No.</label>
                                        <input type="text" name="tin_no" value={formData.tin_no} onChange={handleChange} disabled={isReadOnly} className="form-input font-mono" placeholder="000-000-000" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Number</label>
                                        <input type="text" name="contact_no" value={formData.contact_no} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="0912..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="email@example.com" />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3 flex items-center gap-2">
                                    <MapPin size={14} /> Address
                                </h3>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">House No. / Street / Location</label>
                                    <textarea name="address_house_no" value={formData.address_house_no} onChange={handleChange} disabled={isReadOnly} rows={2} className="form-input" placeholder="Full Address" />
                                </div>
                            </div>

                            {/* Meta & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-2">
                                        <FileText size={14} /> Remarks
                                    </label>
                                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} disabled={isReadOnly} rows={2} className="form-input bg-white" placeholder="Additional notes..." />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Record Status</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleToggleActive}
                                            disabled={isReadOnly}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                        <span className={`text-sm font-medium ${formData.is_active ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-xl">
                    <div>
                        {mode === 'preview' && !showHistory && (
                            <button 
                                onClick={() => setShowHistory(true)}
                                className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                            >
                                <History size={16} /> Show Changes
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium transition">
                            {mode === 'preview' ? 'Close' : 'Cancel'}
                        </button>
                        {mode !== 'preview' && (
                            <button 
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {mode === 'add' ? 'Save Owner' : 'Update Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Simple CSS for Inputs */}
            <style>{`
                .form-input {
                    @apply w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500;
                }
            `}</style>
        </div>
    );
}