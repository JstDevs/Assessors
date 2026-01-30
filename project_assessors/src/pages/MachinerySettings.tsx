import React, { useState, useEffect } from 'react';
import { 
    Factory, 
    ScrollText, 
    Plus, 
    Search, 
    Edit, 
    Eye, 
    X, 
    Loader2, 
    AlertCircle, 
} from 'lucide-react';
import api from '../../axiosBase';

// --- Interfaces ---

interface MachineryType {
    mt_id: number;
    code: string;
    name: string;
    description: string | null;
}

interface MachineryActualUse {
    mau_id: number;
    ry_id: number; // Link to Revision Year
    pc_id: number; // Link to Property Classification
    use_name: string;
    use_code: string;
    assessment_level: number;
    taxable: number; // 1 or 0
    effective_date: string;
    ordinance_no: string | null;
    remarks: string | null;
}

type TabType = 'MACHINERY_TYPE' | 'ACTUAL_USE';
type DialogMode = 'ADD' | 'EDIT' | 'PREVIEW';

// --- Configuration Dialog Component ---

interface ConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: TabType;
    mode: DialogMode;
    data?: any;
    onSuccess: () => void;
}

const ConfigDialog: React.FC<ConfigDialogProps> = ({ isOpen, onClose, type, mode, data, onSuccess }) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (mode !== 'ADD' && data) {
                setFormData({ ...data });
            } else {
                // Reset defaults based on type
                if (type === 'ACTUAL_USE') {
                    setFormData({ taxable: 1, assessment_level: 0, ry_id: '', pc_id: '' });
                } else {
                    setFormData({});
                }
            }
        }
    }, [isOpen, mode, data, type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type: inputType } = e.target;
        let finalValue: any = value;

        if (inputType === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked ? 1 : 0;
        } else if (inputType === 'number') {
            finalValue = value === '' ? '' : parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Adjust endpoints to match your backend routes
            const endpointMap = {
                'MACHINERY_TYPE': 'machinery-type',
                'ACTUAL_USE': 'machinery-actual-use'
            };
            const url = endpointMap[type];

            if (mode === 'ADD') {
                await api.post(`${url}/create`, formData);
            } else if (mode === 'EDIT') {
                const id = type === 'MACHINERY_TYPE' ? formData.mt_id : formData.mau_id;
                await api.put(`${url}/update/${id}`, formData);
            }
            
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isReadOnly = mode === 'PREVIEW';
    const titleMap = {
        'MACHINERY_TYPE': 'Machinery Type',
        'ACTUAL_USE': 'Machinery Actual Use'
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-slate-800">
                        {mode === 'ADD' ? 'Add' : mode === 'EDIT' ? 'Edit' : 'View'} {titleMap[type]}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form id="config-form" onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* --- MACHINERY TYPE FORM --- */}
                        {type === 'MACHINERY_TYPE' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Code <span className="text-red-500">*</span></label>
                                    <input type="text" name="code" value={formData.code || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" placeholder="e.g. GEN" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" placeholder="e.g. Generator Set" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                                    <textarea name="description" value={formData.description || ''} onChange={handleChange} disabled={isReadOnly} rows={3} className="form-input" />
                                </div>
                            </>
                        )}

                        {/* --- ACTUAL USE FORM --- */}
                        {type === 'ACTUAL_USE' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Revision Year ID <span className="text-red-500">*</span></label>
                                        <input type="number" name="ry_id" value={formData.ry_id || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">PC ID (Class) <span className="text-red-500">*</span></label>
                                        <input type="number" name="pc_id" value={formData.pc_id || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Use Code <span className="text-red-500">*</span></label>
                                        <input type="text" name="use_code" value={formData.use_code || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Assessment Level (%) <span className="text-red-500">*</span></label>
                                        <input type="number" step="0.01" name="assessment_level" value={formData.assessment_level || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Use Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="use_name" value={formData.use_name || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Effective Date <span className="text-red-500">*</span></label>
                                        <input type="date" name="effective_date" value={formData.effective_date ? formData.effective_date.split('T')[0] : ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Ordinance No.</label>
                                        <input type="text" name="ordinance_no" value={formData.ordinance_no || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 py-2">
                                    <input 
                                        type="checkbox" 
                                        id="taxable" 
                                        name="taxable" 
                                        checked={formData.taxable === 1} 
                                        onChange={handleChange} 
                                        disabled={isReadOnly}
                                        className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" 
                                    />
                                    <label htmlFor="taxable" className="text-sm text-slate-700 font-medium">Is Taxable?</label>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                                    <textarea name="remarks" value={formData.remarks || ''} onChange={handleChange} disabled={isReadOnly} rows={2} className="form-input" />
                                </div>
                            </>
                        )}

                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium transition">
                        {mode === 'PREVIEW' ? 'Close' : 'Cancel'}
                    </button>
                    {mode !== 'PREVIEW' && (
                        <button 
                            type="submit" 
                            form="config-form"
                            disabled={loading}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export default function MachinerySettings() {
    const [activeTab, setActiveTab] = useState<TabType>('MACHINERY_TYPE');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<DialogMode>('ADD');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Fetch Data based on Active Tab
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setData([]);
            try {
                // Replace with your actual list endpoints
                const endpointMap = {
                    'MACHINERY_TYPE': 'bkmt/mtlist', 
                    'ACTUAL_USE': 'bkmt/maulist'
                };
                const res = await api.get(endpointMap[activeTab]);
                
                // Safe case: Ensure list is an array
                const list = res.data.data ?? res.data;
                if (Array.isArray(list)) {
                    setData(list);
                } else {
                    console.error("Fetched data is not an array:", list);
                    setData([]); 
                }
            } catch (err) {
                console.error(`Failed to fetch ${activeTab}`, err);
                setData([]); 
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, refresh]);

    const filteredData = Array.isArray(data) ? data.filter(item => {
        const search = searchTerm.toLowerCase();
        if (activeTab === 'MACHINERY_TYPE') {
            return item.name?.toLowerCase().includes(search) || item.code?.toLowerCase().includes(search);
        } else {
            return item.use_name?.toLowerCase().includes(search) || item.use_code?.toLowerCase().includes(search);
        }
    }) : [];

    const handleOpenDialog = (mode: DialogMode, item?: any) => {
        setDialogMode(mode);
        setSelectedItem(item || null);
        setIsDialogOpen(true);
    };

    const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
        <button
            onClick={() => { setActiveTab(id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id 
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans w-full text-slate-900">
            <div className="w-full max-w-full space-y-6">
                
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Machinery Configuration</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage machinery types and actual use codes.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenDialog('ADD')}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all gap-2"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add New {activeTab === 'MACHINERY_TYPE' ? 'Type' : 'Actual Use'}
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 px-2 overflow-x-auto">
                        <TabButton id="MACHINERY_TYPE" label="Machinery Types" icon={Factory} />
                        <TabButton id="ACTUAL_USE" label="Actual Uses" icon={ScrollText} />
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by code or name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="flex-1 overflow-auto w-full max-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p>Loading records...</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 w-24">Code</th>
                                        <th className="px-6 py-3">Name / Description</th>
                                        {activeTab === 'ACTUAL_USE' && (
                                            <>
                                                <th className="px-6 py-3 text-right">Assess Level</th>
                                                <th className="px-6 py-3 text-center">Taxable</th>
                                            </>
                                        )}
                                        <th className="px-6 py-3 text-right w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredData && filteredData.length > 0 ? (
                                        filteredData.map((item, idx) => {
                                            const code = activeTab === 'ACTUAL_USE' ? item.use_code : item.code;
                                            const name = activeTab === 'ACTUAL_USE' ? item.use_name : item.name;
                                            
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-4 font-mono text-slate-600 text-xs font-bold">
                                                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{code}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{name}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-md text-wrap">{item.description || item.remarks}</div>
                                                    </td>
                                                    {activeTab === 'ACTUAL_USE' && (
                                                        <>
                                                            <td className="px-6 py-4 text-right font-mono text-slate-700">
                                                                {item.assessment_level}%
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {item.taxable === 1 ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                        YES
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                        NO
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenDialog('PREVIEW', item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md" title="View">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button onClick={() => handleOpenDialog('EDIT', item)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md" title="Edit">
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={activeTab === 'ACTUAL_USE' ? 5 : 3} className="px-6 py-12 text-center text-slate-400">
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
                        Showing {filteredData?.length || 0} records
                    </div>
                </div>
            </div>

            <ConfigDialog 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                type={activeTab}
                mode={dialogMode}
                data={selectedItem}
                onSuccess={() => setRefresh(prev => !prev)}
            />

            <style>{`
                .form-input {
                    @apply w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500;
                }
            `}</style>
        </div>
    );
}