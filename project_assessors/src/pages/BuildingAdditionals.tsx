import React, { useState, useEffect } from 'react';
import { 
    Package, 
    Calculator, 
    Plus, 
    Search, 
    Edit, 
    Eye, 
    X, 
    Loader2, 
    AlertCircle, 
    CheckCircle,
    Archive,
    CheckSquare,
    Calendar,
    DollarSign,
    Filter
} from 'lucide-react';
import api from '../../axiosBase';

// --- Interfaces ---

interface BuildingItem {
    item_id: number;
    item_name: string;
    is_active: number; // 1 or 0
    description: string | null;
}

interface UnitValue {
    value_id: number;
    item_id: number;
    item_name?: string; // Joined from backend or mapped
    unit_value: number;
    effective_year: number;
}

type TabType = 'ITEMS' | 'VALUES';
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
    
    // For Values dropdown
    const [itemOptions, setItemOptions] = useState<BuildingItem[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (mode !== 'ADD' && data) {
                setFormData({ ...data });
            } else {
                // Reset defaults
                if (type === 'ITEMS') {
                    setFormData({ is_active: 1 });
                } else {
                    setFormData({ effective_year: new Date().getFullYear() });
                }
            }

            // Fetch Items for Dropdown if in VALUES mode
            if (type === 'VALUES') {
                fetchFilteredItemOptions();
            }
        }
    }, [isOpen, mode, data, type]);

    const fetchFilteredItemOptions = async () => {
        setLoadingOptions(true);
        try {
            // 1. Fetch all items
            const itemsRes = await api.get('bai/'); 
            const allItems = itemsRes.data.data ?? itemsRes.data;

            // 2. Fetch existing unit values to filter out already assigned items
            const uvRes = await api.get('bai/uv/'); 
            const existingUVs = uvRes.data.data ?? uvRes.data;

            if (Array.isArray(allItems) && Array.isArray(existingUVs)) {
                const availableItems = allItems.filter((item: BuildingItem) => {
                    // Check if item already has a unit value
                    const isTaken = existingUVs.some((uv: UnitValue) => uv.item_id === item.item_id);
                    // If we are editing, allow the current item to be selected (it's "taken" by itself)
                    const isSelf = mode !== 'ADD' && item.item_id === data?.item_id;
                    
                    // Only show active items that are not taken (or are self)
                    return item.is_active === 1 && (!isTaken || isSelf);
                });
                setItemOptions(availableItems);
            }
        } catch (err) {
            console.error("Failed to load options", err);
            setError("Failed to load available items for selection.");
        } finally {
            setLoadingOptions(false);
        }
    };

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
            if (type === 'ITEMS') {
                if (mode === 'ADD') {
                    await api.post('bai', formData);
                } else if (mode === 'EDIT') {
                    await api.put(`bai/${formData.item_id}`, formData);
                }
            } else {
                // Unit Values
                const url = 'bai/uv'; 
                if (mode === 'ADD') {
                    await api.post(`${url}/`, formData);
                } else if (mode === 'EDIT') {
                    await api.put(`${url}/${formData.value_id}`, formData);
                }
            }
            
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isReadOnly = mode === 'PREVIEW';
    const titleMap = {
        'ITEMS': 'Building Additional Item',
        'VALUES': 'Unit Value Configuration'
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'ITEMS' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {type === 'ITEMS' ? <Package size={20} /> : <Calculator size={20} />}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {mode === 'ADD' ? 'Create' : mode === 'EDIT' ? 'Update' : 'View'} {titleMap[type]}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" /> 
                            <p>{error}</p>
                        </div>
                    )}

                    <form id="config-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* --- BUILDING ITEMS FORM --- */}
                        {type === 'ITEMS' && (
                            <>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Item Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="item_name" value={formData.item_name || ''} onChange={handleChange} disabled={isReadOnly} required className="form-input" placeholder="e.g. Swimming Pool" />
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                    <textarea name="description" value={formData.description || ''} onChange={handleChange} disabled={isReadOnly} rows={3} className="form-input resize-none" placeholder="Optional details..." />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id="is_active" 
                                            name="is_active" 
                                            checked={formData.is_active === 1} 
                                            onChange={handleChange} 
                                            disabled={isReadOnly}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500/20" 
                                        />
                                        <CheckSquare className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                                    </div>
                                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                        Set as Active Item
                                    </label>
                                </div>
                            </>
                        )}

                        {/* --- UNIT VALUES FORM --- */}
                        {type === 'VALUES' && (
                            <>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Select Item <span className="text-red-500">*</span></label>
                                    <select 
                                        name="item_id" 
                                        value={formData.item_id || ''} 
                                        onChange={handleChange} 
                                        disabled={isReadOnly || loadingOptions || mode === 'EDIT'} 
                                        required 
                                        className="form-input disabled:bg-slate-100 disabled:text-slate-500"
                                    >
                                        <option value="">{loadingOptions ? 'Loading available items...' : '-- Select Item --'}</option>
                                        {itemOptions.map(item => (
                                            <option key={item.item_id} value={item.item_id}>{item.item_name}</option>
                                        ))}
                                    </select>
                                    {mode === 'ADD' && itemOptions.length === 0 && !loadingOptions && (
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} /> All active items already have unit values assigned.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Value <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₱</span>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                name="unit_value" 
                                                value={formData.unit_value || ''} 
                                                onChange={handleChange} 
                                                disabled={isReadOnly} 
                                                required 
                                                className="form-input pl-8 font-mono" 
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Effective Year <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                type="number" 
                                                name="effective_year" 
                                                value={formData.effective_year || ''} 
                                                onChange={handleChange} 
                                                disabled={isReadOnly} 
                                                required 
                                                className="form-input pl-9" 
                                                placeholder="YYYY"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-semibold transition shadow-sm"
                    >
                        {mode === 'PREVIEW' ? 'Close' : 'Cancel'}
                    </button>
                    {mode !== 'PREVIEW' && (
                        <button 
                            type="submit" 
                            form="config-form"
                            disabled={loading || (type === 'VALUES' && mode === 'ADD' && itemOptions.length === 0)}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {mode === 'ADD' ? 'Create Record' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export default function BuildingAdditionals() {
    const [activeTab, setActiveTab] = useState<TabType>('ITEMS');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<DialogMode>('ADD');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setData([]);
            try {
                let url = '';
                if (activeTab === 'ITEMS') {
                    url = 'bai/';
                } else {
                    url = 'bai/uv/'; 
                }
                const res = await api.get(url);
                
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
        if (activeTab === 'ITEMS') {
            return item.item_name?.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search);
        } else {
            // For Values, filter by item name 
            return (item.item_name || '').toLowerCase().includes(search);
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
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === id 
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
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
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <Archive className="text-emerald-600" /> Building Additionals
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage extra items (pools, fences, etc.) and their standard unit values.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenDialog('ADD')}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all gap-2 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Add New {activeTab === 'ITEMS' ? 'Item' : 'Value'}
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[650px]">
                    
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 px-2 bg-white sticky top-0 z-20">
                        <TabButton id="ITEMS" label="Additional Items" icon={Package} />
                        <TabButton id="VALUES" label="Unit Values" icon={Calculator} />
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/30 sticky top-[49px] z-20">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder={activeTab === 'ITEMS' ? "Search items by name or description..." : "Search values by item name..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white shadow-sm transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <button className="p-2.5 text-slate-500 hover:bg-white hover:text-emerald-600 rounded-lg border border-transparent hover:border-slate-200 transition-all" title="Filter">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="flex-1 overflow-auto w-full relative">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/80 z-30">
                                <Loader2 className="w-10 h-10 animate-spin mb-3 text-emerald-500" />
                                <p className="font-medium text-slate-500">Loading records...</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {activeTab === 'ITEMS' ? (
                                            <>
                                                <th className="px-6 py-4 w-20">ID</th>
                                                <th className="px-6 py-4">Item Name</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-center w-32">Status</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4 w-20">ID</th>
                                                <th className="px-6 py-4">Item Name</th>
                                                <th className="px-6 py-4 text-right">Unit Value</th>
                                                <th className="px-6 py-4 text-center">Effective Year</th>
                                            </>
                                        )}
                                        <th className="px-6 py-4 text-right w-32 sticky right-0 bg-slate-50 shadow-l">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredData && filteredData.length > 0 ? (
                                        filteredData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                {activeTab === 'ITEMS' ? (
                                                    <>
                                                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">{String(item.item_id).padStart(3, '0')}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-800">{item.item_name}</td>
                                                        <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={item.description}>{item.description || <span className="text-slate-300 italic">-</span>}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            {item.is_active === 1 ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 tracking-wide">
                                                                    ACTIVE
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 tracking-wide">
                                                                    INACTIVE
                                                                </span>
                                                            )}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">{String(item.value_id).padStart(3, '0')}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                                            <Package size={14} className="text-slate-400" />
                                                            {item.item_name || `Item #${item.item_id}`}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-emerald-700 font-bold bg-emerald-50/30">
                                                            ₱{item.unit_value?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-600">
                                                                {item.effective_year}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                                
                                                <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors">
                                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenDialog('PREVIEW', item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="View">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleOpenDialog('EDIT', item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100" title="Edit">
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={activeTab === 'ITEMS' ? 5 : 5} className="px-6 py-16 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search size={40} className="mb-3 opacity-20" />
                                                    <p className="font-medium text-slate-500">No records found</p>
                                                    <p className="text-xs mt-1">Try adjusting your search filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs font-medium text-slate-500 flex justify-between items-center">
                        <span>Showing {filteredData?.length || 0} records</span>
                        <div className="flex gap-2">
                            {/* Pagination Placeholder */}
                            <span className="px-2 py-1 bg-white border rounded text-slate-400 cursor-not-allowed">Prev</span>
                            <span className="px-2 py-1 bg-white border rounded text-slate-800 font-bold">1</span>
                            <span className="px-2 py-1 bg-white border rounded text-slate-400 cursor-not-allowed">Next</span>
                        </div>
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
                    @apply w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 placeholder:text-slate-400;
                }
            `}</style>
        </div>
    );
}