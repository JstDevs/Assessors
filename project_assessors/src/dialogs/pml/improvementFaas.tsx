import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Sprout, 
    X, 
    Loader2, 
    Plus, 
    Trash2, 
    CheckCircle, 
    AlertCircle, 
    TrendingUp, 
    Map, 
    Search, 
    ChevronDown, 
    Check,
    Package
} from 'lucide-react';
import api from '../../../axiosBase.ts'; // Commented out for standalone preview

// --- MOCK API ---
// const api = {
//     get: async (url: string) => {
        
//         // 1. Fetch FAAS Record
//         if (url.includes('faas/')) {
//             await new Promise(r => setTimeout(r, 600)); 
//             return {
//                 data: {
//                     faas: {
//                         faas_id: 101,
//                         faas_no: '2023-09-001-12345',
//                         owner_name: 'Maria Clara de los Santos',
//                         property_kind: 'Land',
//                         status: 'Active'
//                     },
//                     land: {
//                         appraisal: {
//                             classification: 'Residential',
//                             subclassification: 'R-1',
//                             area: '250',
//                             unit_value: '5000',
//                             base_market_value: '1250000'
//                         },
//                         assessment: {
//                             actual_use: 'Residential',
//                             market_value: '1250000',
//                             assessment_level: '20',
//                             assessed_value: '250000'
//                         },
//                         // Existing improvements on the land
//                         improvements: [
//                             { improvement_id: 5, improvement_name: 'Old Wooden Fence', qty: 10, unit_value: '150.00' }
//                         ]
//                     }
//                 }
//             };
//         }

//         // 2. Fetch Reference Table for Improvements (Items Only)
//         // Matches user instruction: "referencing from the database as land improvements now has it's own table"
//         if (url === 'loi/') {
//             await new Promise(r => setTimeout(r, 400));
//             return {
//                 data: [
//                     { improvement_id: 1, improvement_name: 'Mango Tree (Grafted)' },
//                     { improvement_id: 2, improvement_name: 'Coconut Tree (Bearing)' },
//                     { improvement_id: 3, improvement_name: 'Perimeter Fence (Concrete)' },
//                     { improvement_id: 4, improvement_name: 'Steel Gate (Standard)' },
//                     { improvement_id: 5, improvement_name: 'Water Tank (Concrete)' },
//                     { improvement_id: 6, improvement_name: 'Pavement (Concrete)' },
//                 ]
//             };
//         }

//         // 3. Fetch Unit Value by ID
//         // Matches user instruction: "router.get('/uv/:improvement_id'..."
//         const uvMatch = url.match(/loi\/uv\/(\d+)/);
//         if (uvMatch) {
//             await new Promise(r => setTimeout(r, 300)); // Quick fetch for UV
//             const id = parseInt(uvMatch[1]);
//             const values: Record<number, number> = {
//                 1: 500.00,
//                 2: 300.00,
//                 3: 2500.00,
//                 4: 5000.00,
//                 5: 8000.00,
//                 6: 850.00,
//             };
//             // Return array format as per user's backend snippet `res.json(rows)`
//             return { 
//                 data: [{ 
//                     value_id: id * 100, 
//                     improvement_id: id, 
//                     unit_value: values[id] || 0, 
//                     effective_year: 2024 
//                 }] 
//             };
//         }

//         return { data: null };
//     },
//     post: async (url: string, payload: any) => {
//         await new Promise(r => setTimeout(r, 1200));
//         console.log("POST", url, payload);
//         return { data: { success: true } };
//     }
// };

// --- HELPER HOOKS ---
function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

// --- SEARCHABLE SELECT COMPONENT ---
interface SearchableSelectProps {
    options: { id: string | number; name: string; original?: any }[];
    value: string | number;
    onChange: (value: string | number, originalItem?: any) => void;
    placeholder?: string;
    label?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select...", 
    isLoading = false,
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useOnClickOutside(containerRef, () => setIsOpen(false));

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!isOpen) {
            setSearchTerm("");
        }
    }, [isOpen]);

    const selectedOption = options.find(opt => String(opt.id) === String(value));

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleSelect = (option: any) => {
        onChange(option.id, option.original);
        setIsOpen(false);
    };

    return (
        <div className={`w-full relative group ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2 text-left text-sm
                    bg-white border rounded-lg transition-all duration-200
                    ${disabled 
                        ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-400' 
                        : 'hover:border-emerald-400 border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }
                    ${isOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500' : ''}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}>
                    {isLoading ? "Loading..." : (selectedOption?.name || placeholder)}
                </span>
                <div className="flex items-center gap-2">
                    {isLoading && <Loader2 size={14} className="animate-spin text-emerald-500" />}
                    <ChevronDown 
                        size={16} 
                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </div>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top left-0">
                    
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                                placeholder="Search improvements..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                <Loader2 size={20} className="animate-spin mb-2 text-emerald-500" />
                                <span className="text-xs">Loading options...</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400 px-4 text-center">
                                <AlertCircle size={20} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium text-slate-500">
                                    {options.length === 0 ? "No available items" : "No results found"}
                                </span>
                            </div>
                        ) : (
                            <ul className="py-1">
                                {filteredOptions.map((option) => (
                                    <li 
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            px-3 py-2 text-xs cursor-pointer flex items-center justify-between group transition-colors
                                            ${String(value) === String(option.id) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                                        `}
                                    >
                                        <span>{option.name}</span>
                                        {String(value) === String(option.id) && <Check size={14} className="text-emerald-600" />}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- INTERFACES ---

interface ImprovementItem {
    improvement_id?: number; // Optional link to reference table
    improvement_name: string;
    qty: number;
    unit_value: number;
    isLoadingUV?: boolean; // Track loading state for UV fetch
}

interface FetchedImprovement {
    improvement_id: number;
    improvement_name: string;
    qty: number;
    unit_value: string;
}

interface LandDetails {
    appraisal: {
        classification: string;
        subclassification: string;
        area: string;
        unit_value: string;
        base_market_value: string;
    };
    assessment: {
        actual_use: string;
        market_value: string;
        assessment_level: string;
        assessed_value: string;
    };
    improvements: FetchedImprovement[];
}

interface FAASData {
    faas_id: number;
    faas_no: string;
    owner_name: string;
    property_kind: string;
    status: string;
}

interface FetchResponse {
    faas: FAASData;
    land: LandDetails | null;
}

interface ReferenceItem {
    improvement_id: number;
    improvement_name: string;
    // unit_value removed from here as it is fetched separately
}

interface FAASImprovementDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

// --- HELPER ---
const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const FAASImprovementDialog: React.FC<FAASImprovementDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    // Data State
    const [faasData, setFaasData] = useState<FAASData | null>(null);
    const [landData, setLandData] = useState<LandDetails | null>(null);
    const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
    
    // Form State
    const [improvementDate, setImprovementDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');
    const [newItems, setNewItems] = useState<ImprovementItem[]>([
        { improvement_name: '', qty: 1, unit_value: 0 }
    ]);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // --- FETCH DATA ---
    useEffect(() => {
        if (!showDialog) return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setFaasData(null);
            setLandData(null);
            // Reset form
            setNewItems([{ improvement_name: '', qty: 1, unit_value: 0 }]);
            setRemarks('');
            setImprovementDate(new Date().toISOString().split('T')[0]);
            setSuccess(false);

            try {
                // Parallel fetch: FAAS Data + Improvement Items List (only list)
                const [resFaas, resRef] = await Promise.all([
                    api.get(`faas/${faasId}`),
                    api.get(`loi/`) // Updated to fetch just the list
                ]);

                const data: FetchResponse = resFaas.data;
                const refs: ReferenceItem[] = resRef.data || [];

                setReferenceItems(refs);

                if (!data.faas) throw new Error("FAAS Record not found.");
                
                setFaasData(data.faas);
                
                if (data.faas.property_kind !== 'Land') {
                    throw new Error(`Invalid Property Type: ${data.faas.property_kind}. Improvements are only for Land.`);
                }
                
                if (data.land) {
                    setLandData(data.land);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load property details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showDialog, faasId]);

    // --- FORM HANDLERS ---
    const handleItemChange = (index: number, field: keyof ImprovementItem, value: any) => {
        const updated = [...newItems];
        updated[index] = { ...updated[index], [field]: value };
        setNewItems(updated);
    };

    // Updated handler: Fetch Unit Value when an item is selected
    const handleSelectionChange = async (index: number, id: string | number, originalItem: ReferenceItem) => {
        // 1. Update name & ID immediately, clear unit value, set loading
        setNewItems(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                improvement_id: Number(id),
                improvement_name: originalItem.improvement_name,
                unit_value: 0,
                isLoadingUV: true
            };
            return updated;
        });

        // 2. Fetch Unit Value from database
        try {
            const res = await api.get(`loi/uv/${id}`);
            // Assuming response matches snippet: [{ ... unit_value: ... }]
            const fetchedUV = res.data && res.data[0] ? parseFloat(res.data[0].unit_value) : 0;

            // 3. Update state with fetched value
            setNewItems(prev => {
                const updated = [...prev];
                // Only update if the row hasn't changed identity (basic check)
                if (updated[index] && updated[index].improvement_id === Number(id)) {
                    updated[index] = {
                        ...updated[index],
                        unit_value: fetchedUV,
                        isLoadingUV: false
                    };
                }
                return updated;
            });
        } catch (error) {
            console.error("Failed to load unit value", error);
            setNewItems(prev => {
                const updated = [...prev];
                if (updated[index]) {
                    updated[index] = { ...updated[index], isLoadingUV: false };
                }
                return updated;
            });
        }
    };

    const addItem = () => {
        setNewItems([...newItems, { improvement_name: '', qty: 1, unit_value: 0 }]);
    };

    const removeItem = (index: number) => {
        if (newItems.length > 1) {
            setNewItems(newItems.filter((_, i) => i !== index));
        }
    };

    // Calculate Total Added Value
    const totalAddedValue = useMemo(() => {
        return newItems.reduce((sum, item) => sum + (item.qty * item.unit_value), 0);
    }, [newItems]);

    const handleSubmit = async () => {
        setError(null);
        
        // Validation
        const validItems = newItems.filter(i => i.improvement_name.trim() !== '' && i.unit_value > 0);
        
        if (validItems.length === 0) {
            setError("No new items detected or unit values are missing. Please check your entries.");
            return;
        }

        setSubmitLoading(true);

        try {
            await api.post('faas/improvement', {
                faas_id: faasId,
                improvement_items: validItems, // New items to add
                improvement_date: improvementDate,
                remarks: remarks
            });

            setSuccess(true);
            setRefresh((prev: any) => !prev);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to process improvement transaction.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSuccess(false);
    };

    if (!showDialog) return;

    if (success) return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Success!</h2>
                <p className="text-gray-500 text-center mt-2 mb-6">
                    New FAAS created with updated improvements.
                </p>
                <button onClick={handleClose} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Close
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Sprout className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Land Improvements</h2>
                            {faasData ? (
                                <p className="text-xs text-gray-500">{faasData.faas_no} • {faasData.owner_name}</p>
                            ) : (
                                <p className="text-xs text-gray-400">Loading details...</p>
                            )}
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                        </div>
                    ) : error && !faasData ? (
                         <div className="h-40 flex flex-col items-center justify-center text-red-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p>{error}</p>
                            <button onClick={handleClose} className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 text-gray-700">Close</button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* 1. CURRENT PROPERTY INFO */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-start gap-3">
                                    <Map className="w-5 h-5 text-blue-600 mt-1" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Property Details</p>
                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            {landData?.appraisal.classification} - {landData?.appraisal.subclassification}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Area: {landData?.appraisal.area} sqm | Actual Use: {landData?.assessment.actual_use}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Current Market Value</p>
                                    <p className="text-lg font-bold text-blue-900">{formatCurrency(parseFloat(landData?.assessment.market_value || '0'))}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* 2. EXISTING IMPROVEMENTS (Read Only) */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                                        Existing Improvements
                                    </h3>
                                    
                                    {landData?.improvements && landData.improvements.length > 0 ? (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-gray-500 font-semibold border-b">
                                                    <tr>
                                                        <th className="px-4 py-2">Item</th>
                                                        <th className="px-4 py-2 text-center">Qty</th>
                                                        <th className="px-4 py-2 text-right">Unit Val</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {landData.improvements.map((imp) => {
                                                        return (
                                                            <tr key={imp.improvement_id}>
                                                                <td className="px-4 py-2 text-gray-700">
                                                                    {imp.improvement_name}
                                                                </td>
                                                                <td className="px-4 py-2 text-center text-gray-500">
                                                                    {imp.qty}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-gray-500">
                                                                    {formatCurrency(parseFloat(imp.unit_value))}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 text-center italic">
                                                These items will automatically be carried over to the new FAAS.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-gray-400 text-sm">
                                            No existing improvements found.
                                        </div>
                                    )}
                                </div>

                                {/* 3. NEW IMPROVEMENTS FORM */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide flex items-center justify-between">
                                        <div className="flex items-center">
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            Add New Improvements
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full normal-case">
                                            Total Added: {formatCurrency(totalAddedValue)}
                                        </span>
                                    </h3>

                                    <div className="space-y-3">
                                        {newItems.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                                                <div className="flex-1 grid grid-cols-12 gap-2">
                                                    
                                                    {/* SEARCHABLE SELECT REPLACEMENT */}
                                                    <div className="col-span-6">
                                                        <SearchableSelect 
                                                            options={referenceItems.map(ref => ({
                                                                id: ref.improvement_id,
                                                                name: ref.improvement_name,
                                                                original: ref
                                                            }))}
                                                            value={item.improvement_id || ''}
                                                            onChange={(id, original) => handleSelectionChange(index, id, original)}
                                                            placeholder="Search Item..."
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <input 
                                                            type="number" 
                                                            placeholder="Qty" 
                                                            min="1"
                                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-center focus:ring-2 focus:ring-green-500 outline-none"
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-2 text-gray-400 text-xs">₱</span>
                                                            <input 
                                                                type="number" 
                                                                placeholder="Unit Val" 
                                                                min="0"
                                                                step="0.01"
                                                                className={`w-full border border-gray-300 rounded-lg p-2 pl-5 text-sm text-right focus:ring-2 focus:ring-green-500 outline-none font-mono ${item.isLoadingUV ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                                                                value={item.unit_value}
                                                                onChange={(e) => handleItemChange(index, 'unit_value', parseFloat(e.target.value) || 0)}
                                                                readOnly={item.isLoadingUV}
                                                            />
                                                            {item.isLoadingUV && (
                                                                <div className="absolute right-2 top-2">
                                                                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeItem(index)}
                                                    className={`p-2 rounded-lg transition ${newItems.length > 1 ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`}
                                                    disabled={newItems.length <= 1}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={addItem}
                                        className="w-full py-2 border border-dashed border-green-300 text-green-600 rounded-lg hover:bg-green-50 text-sm font-medium flex items-center justify-center transition"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Another Item
                                    </button>
                                    
                                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction Date</label>
                                            <input 
                                                type="date" 
                                                value={improvementDate} 
                                                onChange={(e) => setImprovementDate(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
                                            <input 
                                                type="text" 
                                                value={remarks} 
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Optional notes..."
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        {error && <span className="text-red-600 font-medium">{error}</span>}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleClose} disabled={submitLoading} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={submitLoading || !faasData || loading}
                            className="px-6 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Improvements
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};