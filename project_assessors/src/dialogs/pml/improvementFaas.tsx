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
    RotateCcw
} from 'lucide-react';

import api from '../../../axiosBase.ts'; 

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
}

interface FetchedImprovement {
    improvement_id: number;
    improvement_name: string;
    qty: number;
}

interface LandDetails {
    appraisal: {
        classification: string;
        subclassification: string;
        area: string;
    };
    assessment: {
        actual_use: string;
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
}

interface FAASImprovementDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

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
        { improvement_name: '', qty: 1 }
    ]);
    const [removedImprovements, setRemovedImprovements] = useState<number[]>([]);
    
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
            setNewItems([{ improvement_name: '', qty: 1 }]);
            setRemovedImprovements([]);
            setRemarks('');
            setImprovementDate(new Date().toISOString().split('T')[0]);
            setSuccess(false);

            try {
                // Parallel fetch: FAAS Data + Improvement Items List
                const [resFaas, resRef] = await Promise.all([
                    api.get(`faas/${faasId}`),
                    api.get(`loi/`)
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

    const handleSelectionChange = (index: number, id: string | number, originalItem: ReferenceItem) => {
        setNewItems(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                improvement_id: Number(id),
                improvement_name: originalItem.improvement_name
            };
            return updated;
        });
    };

    const addItem = () => {
        setNewItems([...newItems, { improvement_name: '', qty: 1 }]);
    };

    const removeItem = (index: number) => {
        if (newItems.length > 1) {
            setNewItems(newItems.filter((_, i) => i !== index));
        } else {
            // If it's the last item, just clear it instead of removing the row entirely
            setNewItems([{ improvement_name: '', qty: 1 }]);
        }
    };

    const toggleRemoveExisting = (improvementId: number) => {
        setRemovedImprovements(prev => 
            prev.includes(improvementId) 
                ? prev.filter(id => id !== improvementId) 
                : [...prev, improvementId]
        );
    };

    const handleSubmit = async () => {
        setError(null);
        
        // Validation
        const validItems = newItems.filter(i => i.improvement_name.trim() !== '');
        
        if (validItems.length === 0 && removedImprovements.length === 0) {
            setError("No changes detected. Please add new improvements or remove existing ones.");
            return;
        }

        setSubmitLoading(true);
        
        try {
            // console.log({
            //     faas_id: faasId,
            //     improvement_items: validItems, // New items to add
            //     removed_improvements: removedImprovements, // Items to delete
            //     improvement_date: improvementDate,
            //     remarks: remarks
            // })
            await api.post('faas/improvement', {
                faas_id: faasId,
                improvement_items: validItems, // New items to add
                removed_improvements: removedImprovements, // Items to delete
                improvement_date: improvementDate,
                remarks: remarks
            });


            // setSuccess(true);
            // setRefresh((prev: any) => !prev);
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
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* 2. EXISTING IMPROVEMENTS (With Removal Option) */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                                            Existing Improvements
                                        </div>
                                        {removedImprovements.length > 0 && (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full normal-case font-medium">
                                                Removing {removedImprovements.length}
                                            </span>
                                        )}
                                    </h3>
                                    
                                    {landData?.improvements && landData.improvements.length > 0 ? (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-gray-500 font-semibold border-b">
                                                    <tr>
                                                        <th className="px-4 py-2">Item</th>
                                                        <th className="px-4 py-2 text-center w-16">Qty</th>
                                                        <th className="px-4 py-2 text-center w-16">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {landData.improvements.map((imp) => {
                                                        const isRemoved = removedImprovements.includes(imp.improvement_id);
                                                        
                                                        return (
                                                            <tr key={imp.improvement_id} className={`transition-colors ${isRemoved ? 'bg-red-50/50' : 'hover:bg-gray-100'}`}>
                                                                <td className={`px-4 py-2 ${isRemoved ? 'text-red-400 line-through' : 'text-gray-700'}`}>
                                                                    {imp.improvement_name}
                                                                </td>
                                                                <td className={`px-4 py-2 text-center ${isRemoved ? 'text-red-400 line-through' : 'text-gray-500'}`}>
                                                                    {imp.qty}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <button 
                                                                        onClick={() => toggleRemoveExisting(imp.improvement_id)}
                                                                        className={`p-1.5 rounded transition-colors ${
                                                                            isRemoved 
                                                                                ? 'text-red-600 hover:bg-red-100' 
                                                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                                        }`}
                                                                        title={isRemoved ? "Undo Removal" : "Remove Improvement"}
                                                                    >
                                                                        {isRemoved ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 text-center italic border-t border-gray-200">
                                                Unmarked items will be carried over to the new FAAS.
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
                                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        Add New Improvements
                                    </h3>

                                    <div className="space-y-3">
                                        {newItems.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                                                <div className="flex-1 grid grid-cols-12 gap-2">
                                                    
                                                    {/* SEARCHABLE SELECT */}
                                                    <div className="col-span-9">
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

                                                    <div className="col-span-3">
                                                        <input 
                                                            type="number" 
                                                            placeholder="Qty" 
                                                            min="1"
                                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-center focus:ring-2 focus:ring-green-500 outline-none"
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeItem(index)}
                                                    className={`p-2 rounded-lg transition ${newItems.length > 1 || item.improvement_name !== '' ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`}
                                                    disabled={newItems.length <= 1 && item.improvement_name === ''}
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