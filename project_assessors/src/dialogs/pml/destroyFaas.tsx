import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Trash2, 
    X, 
    Loader2, 
    AlertTriangle, 
    CheckCircle, 
    Search, 
    ChevronDown, 
    Check, 
    Building, 
    AlertOctagon,
    FileWarning 
} from 'lucide-react';
import api from '../../../axiosBase.ts'; // Commented out for standalone preview

// --- MOCK API ---
// const api = {
//     get: async (url: string) => {
//         // Fetch FAAS Record (Building Context)
//         if (url.includes('faas/')) {
//             await new Promise(r => setTimeout(r, 600)); 
//             return {
//                 data: {
//                     faas: {
//                         faas_id: 205,
//                         faas_no: '2023-10-BLDG-0088',
//                         property_id: 5002,
//                         owner_name: 'Skyline Properties Inc.',
//                         property_kind: 'Building',
//                         status: 'ACTIVE',
//                         effectivity_date: '2024-01-01'
//                     },
//                     // Building specific details for context
//                     building: {
//                         kind: 'Commercial',
//                         structure_type: 'Reinforced Concrete',
//                         storeys: 5,
//                         total_floor_area: 1200
//                     }
//                 }
//             };
//         }
//         return { data: null };
//     },
//     post: async (url: string, payload: any) => {
//         if (url === 'faas/destroy') {
//             await new Promise(r => setTimeout(r, 1500));
//             console.log("POST /faas/destroy payload:", payload);
//             if (!payload.destruction_reason) {
//                 throw new Error("Reason is required");
//             }
//             return { data: { success: true } };
//         }
//         return { data: { success: false } };
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
    options: { id: string | number; name: string; }[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select...", 
    label, 
    isLoading = false,
    disabled = false,
    className = "",
    required = false
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

    const handleSelect = (id: string | number) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className={`w-full relative group ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2.5 text-left text-sm
                    bg-white border rounded-lg transition-all duration-200
                    ${disabled 
                        ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-400' 
                        : 'hover:border-red-400 border-slate-300 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                    }
                    ${isOpen ? 'ring-2 ring-red-200 border-red-500' : ''}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}>
                    {isLoading ? "Loading..." : (selectedOption?.name || placeholder)}
                </span>
                <div className="flex items-center gap-2">
                    {isLoading && <Loader2 size={14} className="animate-spin text-slate-500" />}
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
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-slate-400"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                <Loader2 size={20} className="animate-spin mb-2 text-slate-500" />
                                <span className="text-xs">Loading options...</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400 px-4 text-center">
                                <AlertOctagon size={20} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium text-slate-500">
                                    {options.length === 0 ? "No available items" : "No results found"}
                                </span>
                            </div>
                        ) : (
                            <ul className="py-1">
                                {filteredOptions.map((option) => (
                                    <li 
                                        key={option.id}
                                        onClick={() => handleSelect(option.id)}
                                        className={`
                                            px-3 py-2 text-xs cursor-pointer flex items-center justify-between group transition-colors
                                            ${String(value) === String(option.id) ? 'bg-red-50 text-red-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                                        `}
                                    >
                                        <span>{option.name}</span>
                                        {String(value) === String(option.id) && <Check size={14} className="text-red-600" />}
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

// --- TYPES & INTERFACES ---

interface FAASDestroyDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    faasNo?: string; // Optional for display
    setRefresh: (refresh: any) => void;
}

interface FAASInfo {
    faas_id: number;
    faas_no: string;
    property_kind: string;
    status: string;
}

interface BuildingInfo {
    kind: string;
    structure_type: string;
    storeys: number;
}

// --- COMPONENT ---

export const FAASDestroyDialog: React.FC<FAASDestroyDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    const [destructionDate, setDestructionDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');
    const [otherReason, setOtherReason] = useState('');
    const [remarks, setRemarks] = useState('');
    
    // Additional Data state for context
    const [faasInfo, setFaasInfo] = useState<FAASInfo | null>(null);
    const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
    const [dataLoading, setDataLoading] = useState(false);

    const [loading, setLoading] = useState(false); // Action loading
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Common reasons for property destruction
    const REASONS = [
        "Voluntary Demolition",
        "LGU Order / Condemned",
        "Fire Damage",
        "Typhoon / Natural Calamity",
        "Total Dilapidation",
        "Earthquake Damage",
        "Renovation / Reconstruction",
        "Other"
    ];

    // Fetch initial data for context
    useEffect(() => {
        const fetchInfo = async () => {
            if (!showDialog) return;
            setDataLoading(true);
            setFaasInfo(null);
            setBuildingInfo(null);
            try {
                const res = await api.get(`faas/${faasId}`);
                if (res.data?.faas) {
                    setFaasInfo(res.data.faas);
                }
                if (res.data?.building) {
                    setBuildingInfo(res.data.building);
                }
            } catch (e) {
                console.error("Failed to fetch info", e);
            } finally {
                setDataLoading(false);
            }
        };
        fetchInfo();
    }, [showDialog, faasId]);

    const handleClose = () => {
        setShowDialog(false);
        // Reset state after a short delay
        setTimeout(() => {
            setSuccess(false);
            setError(null);
            setReason('');
            setOtherReason('');
            setRemarks('');
            setDestructionDate(new Date().toISOString().split('T')[0]);
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Final reason logic
        const finalReason = reason === 'Other' ? otherReason : reason;

        if (!finalReason) {
            setError("Please provide a reason for destruction.");
            setLoading(false);
            return;
        }

        try {
            await api.post('faas/destroy', {
                faas_id: faasId,
                destruction_reason: finalReason,
                destruction_date: destructionDate,
                remarks: remarks
            });

            setSuccess(true);
            setRefresh((prev: any) => !prev);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to destroy property record.");
        } finally {
            setLoading(false);
        }
    };

    if (!showDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                
                {success ? (
                    <div className="p-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Property Destroyed</h2>
                        <p className="text-gray-500 mb-8">
                            The FAAS has been cancelled and the property status updated to <span className="font-bold text-red-600">DESTROYED</span>.
                        </p>
                        <button 
                            onClick={handleClose}
                            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors w-full"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-3 bg-red-100 rounded-xl shadow-sm">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-red-900">Destroy Property</h2>
                                    <p className="text-sm text-red-700 mt-1 flex items-center gap-2">
                                        FAAS: <span className="font-mono font-medium bg-red-100 px-1 rounded">{faasInfo?.faas_no || faasId}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleClose}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {dataLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-red-500" />
                                    <span className="text-sm">Retrieving building details...</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    
                                    {/* Building Context Info */}
                                    {faasInfo?.property_kind === 'Building' && buildingInfo && (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm flex items-start gap-3">
                                            <Building className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-gray-700">Target Building</p>
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    {buildingInfo.kind} • {buildingInfo.structure_type} • {buildingInfo.storeys} Storey(s)
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-800 leading-relaxed">
                                            <strong>Warning:</strong> This action creates a permanent history record. The current FAAS will be <span className="font-bold underline">CANCELLED</span> and the property marked as <span className="font-bold underline">DESTROYED</span>.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                            <AlertOctagon size={16} />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Date of Destruction
                                            </label>
                                            <input 
                                                type="date" 
                                                required
                                                value={destructionDate}
                                                onChange={(e) => setDestructionDate(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm p-2.5 border"
                                            />
                                        </div>

                                        <div>
                                            {/* REPLACED SELECT WITH SEARCHABLE SELECT */}
                                            <SearchableSelect 
                                                label="Reason for Destruction"
                                                required={true}
                                                value={reason}
                                                onChange={(val) => setReason(String(val))}
                                                options={REASONS.map(r => ({ id: r, name: r }))}
                                                placeholder="Select a reason..."
                                            />
                                        </div>

                                        {reason === 'Other' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Specify Reason <span className="text-red-500">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={otherReason}
                                                    onChange={(e) => setOtherReason(e.target.value)}
                                                    placeholder="Please specify the reason..."
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm p-2.5 border"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Remarks (Optional)
                                            </label>
                                            <textarea 
                                                rows={3}
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm p-2.5 border resize-none"
                                                placeholder="Additional notes about the destruction..."
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-2">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            disabled={loading}
                                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center shadow-lg shadow-red-200"
                                        >
                                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Confirm Destruction
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- WRAPPER FOR PREVIEW ---
export default FAASDestroyDialog;