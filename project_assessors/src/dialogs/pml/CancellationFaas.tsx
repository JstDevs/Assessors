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
    Package,
    XCircle,
    AlertTriangle,
    FileWarning,
    Users
} from 'lucide-react';
import api from '../../../axiosBase.ts'; // Commented out for standalone preview

// --- MOCK API ---
// const api = {
//     get: async (url: string) => {
        
//         // 1. Fetch FAAS Record with Owners
//         if (url.includes('faas/') && !url.includes('cancellation-reasons')) {
//             await new Promise(r => setTimeout(r, 600)); 
//             return {
//                 data: {
//                     faas: {
//                         faas_id: 101,
//                         faas_no: '2023-09-001-12345',
//                         // owner_name removed in favor of owners array
//                         property_kind: 'Land',
//                         status: 'ACTIVE',
//                         effectivity_date: '2024-01-01'
//                     },
//                     owners: [
//                         {
//                             "fo_id": 10,
//                             "faas_id": 101,
//                             "last_name": "Conchas",
//                             "first_name": "Robert",
//                             "middle_name": "Chavarria",
//                             "suffix": "",
//                             "tin_no": "I HAVE NO TIN (Updated)",
//                             "email": "conchasrobert01@gmail.com",
//                             "contact_no": "09202672998 (updated)",
//                             "address_house_no": "Unit 307 Bldg. 2 Katuparan Housing Vitas St. Tondo, Manila"
//                         },
//                         {
//                             "fo_id": 11,
//                             "faas_id": 101,
//                             "last_name": "Test",
//                             "first_name": "Juan",
//                             "middle_name": "",
//                             "suffix": "",
//                             "tin_no": "999-999-999",
//                             "email": "juan@gmail.com",
//                             "contact_no": "09090990",
//                             "address_house_no": "Somewhere Juan Lives."
//                         }
//                     ],
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
//                         improvements: [
//                             { improvement_id: 5, improvement_name: 'Old Wooden Fence', qty: 10, unit_value: '150.00' }
//                         ]
//                     }
//                 }
//             };
//         }

//         // 2. Fetch Improvements Reference
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
//         const uvMatch = url.match(/loi\/uv\/(\d+)/);
//         if (uvMatch) {
//             await new Promise(r => setTimeout(r, 300));
//             const id = parseInt(uvMatch[1]);
//             const values: Record<number, number> = {
//                 1: 500.00, 2: 300.00, 3: 2500.00, 4: 5000.00, 5: 8000.00, 6: 850.00,
//             };
//             return { 
//                 data: [{ value_id: id * 100, improvement_id: id, unit_value: values[id] || 0, effective_year: 2024 }] 
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

    const handleSelect = (option: any) => {
        onChange(option.id, option.original);
        setIsOpen(false);
    };

    return (
        <div className={`w-full relative group ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
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
                        : 'hover:border-slate-400 border-slate-300 focus:ring-2 focus:ring-slate-200 focus:border-slate-500'
                    }
                    ${isOpen ? 'ring-2 ring-slate-200 border-slate-500' : ''}
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
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 placeholder:text-slate-400"
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
                                            ${String(value) === String(option.id) ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                                        `}
                                    >
                                        <span>{option.name}</span>
                                        {String(value) === String(option.id) && <Check size={14} className="text-slate-600" />}
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

// --- TYPES ---

interface CancellationData {
    cancellation_reason: string;
    cancellation_date: string;
    remarks: string;
}

interface FAASData {
    faas_id: number;
    faas_no: string;
    property_id: number;
    // owner_name: string; // Removed from here
    property_kind: string;
    effectivity_date: string;
    status: string;
}

interface OwnerData {
    fo_id: number;
    faas_id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    suffix: string;
    address_house_no: string;
    // Other fields omitted for display brevity
}

interface PropertyData {
    market_value: number;
    assessed_value: number;
    assessment_level?: number;
    actual_use?: string;
}

interface FAASCancellationDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

// --- COMPONENT: FAASCancellationDialog ---

export const FAASCancellationDialog: React.FC<FAASCancellationDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    const [faasData, setFAASData] = useState<FAASData | null>(null);
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    const [ownersData, setOwnersData] = useState<OwnerData[]>([]);
    const [cancellationData, setCancellationData] = useState<CancellationData>({
        cancellation_reason: '',
        cancellation_date: new Date().toISOString().split('T')[0],
        remarks: '',
    });

    const [loading, setLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
    
    // Static Cancellation Reasons (Database Reference)
    const cancellationReasons = [
        { value: 'DUPLICATE', label: 'Duplicate Entry' },
        { value: 'ERROR', label: 'Data Entry Error' },
        { value: 'PROPERTY_DEMOLISHED', label: 'Property Demolished' },
        { value: 'PROPERTY_DESTROYED', label: 'Property Destroyed' },
        { value: 'ILLEGAL_CONSTRUCTION', label: 'Illegal Construction' },
        { value: 'COURT_ORDER', label: 'Court Order' },
        { value: 'TAX_EXEMPTION', label: 'Tax Exemption Granted' },
        { value: 'SUPERSEDED', label: 'Superseded by New FAAS' },
        { value: 'OTHER', label: 'Other' },
    ];

    useEffect(() => {
        const loadData = async () => {
            if (!showDialog) return;
            
            setLoading(true);
            setLoadingError(null);
            setFAASData(null);
            setPropertyData(null);
            setOwnersData([]);
            
            try {
                const response = await api.get(`faas/${faasId}`);
                const data = response.data;

                if (data.faas) {
                    setFAASData(data.faas);
                }

                if (data.owners && Array.isArray(data.owners)) {
                    setOwnersData(data.owners);
                }

                // Extract property-specific assessment data
                let extractedPropertyData: PropertyData | null = null;

                if (data.faas.property_kind === 'Land' && data.land?.assessment) {
                    extractedPropertyData = {
                        market_value: parseFloat(data.land.assessment.market_value),
                        assessed_value: parseFloat(data.land.assessment.assessed_value),
                        assessment_level: parseFloat(data.land.assessment.assessment_level),
                        actual_use: data.land.assessment.actual_use
                    };
                } else if (data.faas.property_kind === 'Building' && data.building?.assessment) {
                    extractedPropertyData = {
                        market_value: parseFloat(data.building.assessment.market_value),
                        assessed_value: parseFloat(data.building.assessment.assessed_value),
                        assessment_level: parseFloat(data.building.assessment.assessment_level),
                        actual_use: data.building.assessment.actual_use
                    };
                } else if (data.faas.property_kind === 'Machinery' && data.machinery?.assessment) {
                    extractedPropertyData = {
                        market_value: parseFloat(data.machinery.assessment.market_value),
                        assessed_value: parseFloat(data.machinery.assessment.assessed_value),
                        assessment_level: parseFloat(data.machinery.assessment.assessment_level),
                        actual_use: data.machinery.assessment.actual_use
                    };
                }

                setPropertyData(extractedPropertyData);
                
            } catch (error) {
                console.error('Error loading FAAS data:', error);
                // @ts-ignore
                setLoadingError(error.response?.data?.message || 'Failed to load FAAS data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [showDialog, faasId]);

    const handleCancellationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCancellationData(prev => ({ ...prev, [name]: value }));
    };

    const handleReasonChange = (value: string | number) => {
        setCancellationData(prev => ({ ...prev, cancellation_reason: String(value) }));
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        setSubmitLoading(true);
        
        try {
            if (!cancellationData.cancellation_reason.trim()) {
                setSubmitError('Cancellation reason is required');
                setSubmitLoading(false);
                return;
            }

            if (!cancellationData.cancellation_date) {
                setSubmitError('Cancellation date is required');
                setSubmitLoading(false);
                return;
            }
            
            const payload = {
                faas_id: faasId,
                ...cancellationData,
            };
            
            console.log('Cancellation payload:', payload);
            await api.post('faas/cancel', payload);
            setSubmissionSuccessful(true);
            setRefresh((prev: boolean) => !prev);
            
        } catch (error) {
            console.error('Cancellation failed:', error);
            // @ts-ignore
            setSubmitError(error.response?.data?.message || 'Failed to cancel FAAS');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSubmissionSuccessful(false);
        setCancellationData({
            cancellation_reason: '',
            cancellation_date: new Date().toISOString().split('T')[0],
            remarks: '',
        });
        setSubmitError(null);
        setLoadingError(null);
        setFAASData(null);
        setPropertyData(null);
        setOwnersData([]);
    };

    if (!showDialog) return null;

    if (submissionSuccessful) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">FAAS Cancelled Successfully!</h2>
                    <p className="text-lg text-gray-600 mb-2">
                        Reason: <strong>{cancellationReasons.find(r => r.value === cancellationData.cancellation_reason)?.label}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                        FAAS No: <strong>{faasData?.faas_no}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        The FAAS has been marked as cancelled in the system
                    </p>
                    <button
                        onClick={handleClose}
                        type="button"
                        className="px-8 py-3 text-lg font-medium text-white rounded-xl shadow-lg transition bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Loading FAAS data...</p>
                    <p className="text-sm text-gray-500 mt-2">FAAS ID: {faasId}</p>
                </div>
            </div>
        );
    }

    if (loadingError) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading FAAS</h2>
                    <p className="text-gray-600 mb-6">{loadingError}</p>
                    <button
                        onClick={handleClose}
                        type="button"
                        className="px-6 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition bg-red-600 hover:bg-red-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b border-gray-200 bg-red-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <XCircle className="w-6 h-6 text-red-600 mr-3" />
                            Cancel FAAS
                        </h2>
                        <p className="text-sm text-gray-600 mt-1 font-mono">
                            {faasData?.faas_no} • {faasData?.property_kind}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition"
                        disabled={submitLoading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Current FAAS Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center text-sm uppercase tracking-wide">
                            <FileWarning className="w-4 h-4 mr-2 text-gray-500" />
                            Target Property Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-sm">
                            
                            {/* NEW: OWNERS LIST DISPLAY */}
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <span className="text-xs text-gray-500 uppercase font-semibold flex items-center mb-2">
                                    <Users size={14} className="mr-1.5"/> Registered Owner(s)
                                </span>
                                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {ownersData.map((owner) => (
                                        <div key={owner.fo_id} className="flex flex-col sm:flex-row sm:items-baseline border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                            <p className="font-medium text-gray-900 mr-2">
                                                {`${owner.first_name} ${owner.middle_name ? owner.middle_name + ' ' : ''}${owner.last_name}${owner.suffix ? ' ' + owner.suffix : ''}`}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate sm:ml-auto">
                                                {owner.address_house_no}
                                            </p>
                                        </div>
                                    ))}
                                    {ownersData.length === 0 && <p className="text-gray-400 italic">No owner information available.</p>}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">FAAS No</span>
                                <p className="font-medium text-gray-900 font-mono">{faasData?.faas_no || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Property ID</span>
                                <p className="font-medium text-gray-900 font-mono">{faasData?.property_id || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Property Kind</span>
                                <p className="font-medium text-gray-900">{faasData?.property_kind || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Current Status</span>
                                <div className="mt-0.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${faasData?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {faasData?.status || '-'}
                                    </span>
                                </div>
                            </div>
                            {propertyData?.actual_use && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Actual Use</span>
                                    <p className="font-medium text-gray-900">{propertyData.actual_use}</p>
                                </div>
                            )}
                            {propertyData?.market_value !== undefined && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Market Value</span>
                                    <p className="font-medium text-gray-900">
                                        ₱{propertyData.market_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                            {propertyData?.assessed_value !== undefined && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Assessed Value</span>
                                    <p className="font-medium text-gray-900">
                                        ₱{propertyData.assessed_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cancellation Information */}
                    <div className="border border-red-200 rounded-xl p-5 bg-red-50/50">
                        <h3 className="font-bold text-red-900 mb-4 text-sm uppercase tracking-wide">Cancellation Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                {/* Searchable Select for Reason - Sourced from Static List */}
                                <SearchableSelect
                                    label="Cancellation Reason"
                                    required={true}
                                    placeholder="Select a reason..."
                                    value={cancellationData.cancellation_reason}
                                    onChange={handleReasonChange}
                                    options={cancellationReasons.map(r => ({ id: r.value, name: r.label }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cancellation Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="cancellation_date"
                                        value={cancellationData.cancellation_date}
                                        onChange={handleCancellationChange}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 text-sm p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks / Justification
                                </label>
                                <textarea
                                    name="remarks"
                                    value={cancellationData.remarks}
                                    onChange={handleCancellationChange}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 text-sm p-3 border resize-none"
                                    placeholder="Provide additional details regarding the cancellation request..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Critical Warning */}
                    <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">Critical Action - Proceed with Caution</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>This action will mark the FAAS as <strong>CANCELLED</strong> permanently.</li>
                                        <li>The property will no longer be considered active for tax purposes.</li>
                                        <li>A permanent audit trail will be created in the transaction history.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                        {submitError && (
                            <p className="text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                {submitError}
                            </p>
                        )}
                    </div>

                    <div className="flex space-x-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleClose}
                            type="button"
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
                            disabled={submitLoading}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSubmit}
                            type="button"
                            disabled={submitLoading || loading}
                            className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center
                                bg-red-600 hover:bg-red-700
                                ${submitLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {submitLoading && (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            )}
                            Confirm Cancellation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- WRAPPER FOR PREVIEW ---
export default FAASCancellationDialog;