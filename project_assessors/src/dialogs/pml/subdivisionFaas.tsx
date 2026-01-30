import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Layers, 
    X, 
    Loader2, 
    Plus, 
    Trash2, 
    CheckCircle, 
    AlertCircle, 
    PieChart, 
    Home, 
    ArrowRight, 
    User, 
    Search, 
    MapPin,
    Users,
    ChevronDown,
    Check
} from 'lucide-react';
import api from '../../../axiosBase';

// --- REUSABLE COMPONENTS ---

interface SelectOption {
    label: string;
    value: string | number;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string | number | undefined;
    onChange: (val: any) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    isLoading = false,
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Get selected label for display
    const selectedOption = options.find(o => o.value === value);
    
    // Filter options
    const filtered = options.filter(o => 
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset search when opening
    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full border rounded-lg p-2 text-sm flex items-center justify-between cursor-pointer bg-white transition-all
                    ${isOpen ? 'ring-2 ring-indigo-100 border-indigo-400' : 'border-gray-200 hover:border-gray-300'}
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
                `}
            >
                <span className={`truncate ${!selectedOption ? "text-gray-400" : "text-gray-800"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading data...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">
                                No results found.
                            </div>
                        ) : (
                            filtered.map(opt => (
                                <div 
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 flex items-center justify-between
                                        ${opt.value === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}
                                    `}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {opt.value === value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- INTERFACES ---

interface OwnerOption {
    owner_id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    address_house_no?: string;
}

interface SubdividedLot {
    id: number; // UI temp id
    lot_no: string;
    block_no: string;
    lg_code: string; // LGU Code
    barangay: string;
    arp_no: string;
    pin: string;
    area: number;
    owners: OwnerOption[]; // Supports multiple owners
}

interface Improvement {
    improvement_id: number;
    improvement_name: string;
    qty: number;
    unit_value: string;
}

interface LandDetails {
    appraisal: { area: string; };
    improvements?: Improvement[];
}

interface FAASData {
    faas_id: number;
    faas_no: string;
    property_kind: string;
    barangay?: string; 
    lg_code?: string; // Local Government Code
}

interface FAASSubdivisionDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

// --- MULTI-OWNER SELECTOR COMPONENT ---
const MultiOwnerSelector = ({ 
    selectedOwners,
    onUpdateOwners,
    options 
}: { 
    selectedOwners: OwnerOption[],
    onUpdateOwners: (owners: OwnerOption[]) => void,
    options: OwnerOption[] 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter options: Exclude already selected owners & match search term
    const filteredOptions = options.filter(o => {
        const isSelected = selectedOwners.some(sel => sel.owner_id === o.owner_id);
        const fullName = `${o.last_name}, ${o.first_name}`.toLowerCase();
        return !isSelected && fullName.includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (owner: OwnerOption) => {
        onUpdateOwners([...selectedOwners, owner]);
        setSearchTerm("");
    };

    const handleRemove = (id: number) => {
        onUpdateOwners(selectedOwners.filter(o => o.owner_id !== id));
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="min-h-[42px] border border-gray-200 rounded-lg p-1.5 flex flex-wrap gap-1.5 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all bg-white">
                
                {/* Selected Tags */}
                {selectedOwners.map(owner => (
                    <div key={owner.owner_id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 animate-in fade-in zoom-in duration-100">
                        <span>{owner.last_name}, {owner.first_name[0]}.</span>
                        <button 
                            type="button"
                            onClick={() => handleRemove(owner.owner_id)}
                            className="hover:text-red-500 rounded-full p-0.5 hover:bg-indigo-100 transition"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Input */}
                <div className="flex-1 min-w-[120px] relative">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="w-full h-full p-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                        placeholder={selectedOwners.length === 0 ? "Search Owner..." : "Add another..."}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(owner => (
                            <button
                                key={owner.owner_id}
                                onClick={() => handleSelect(owner)}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-gray-50 last:border-0 group transition-colors"
                                type="button"
                            >
                                <div className="text-sm font-bold text-gray-700 group-hover:text-indigo-700">
                                    {owner.last_name}, {owner.first_name} {owner.middle_name}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{owner.address_house_no || 'No Address'}</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
                            No matching owners found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN DIALOG COMPONENT ---

export const FAASSubdivisionDialog: React.FC<FAASSubdivisionDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    // Data State
    const [faasData, setFaasData] = useState<FAASData | null>(null);
    const [landData, setLandData] = useState<LandDetails | null>(null);
    const [currentOwners, setCurrentOwners] = useState<OwnerOption[]>([]); // Parent owners
    const [availableOwners, setAvailableOwners] = useState<OwnerOption[]>([]); // Searchable pool
    
    // LGU & Barangay Management State
    const [lguOptions, setLguOptions] = useState<SelectOption[]>([]);
    const [barangayCache, setBarangayCache] = useState<Record<string, SelectOption[]>>({});
    const [loadingCache, setLoadingCache] = useState<Record<string, boolean>>({});

    // Form State
    const [subdivisionDate, setSubdivisionDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');
    const [lots, setLots] = useState<SubdividedLot[]>([]);
    
    // Improvement Allocation State: { [improvement_id]: lot_temp_id }
    const [improvementAllocations, setImprovementAllocations] = useState<Record<number, string>>({});

    // UI State
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Helper to fetch barangays for a given LGU code (with caching)
    const fetchBarangaysForLgCode = async (code: string) => {
        if (!code || barangayCache[code] || loadingCache[code]) return;

        setLoadingCache(prev => ({ ...prev, [code]: true }));
        try {
            // Step 1: Get LGU ID
            const lgIdRes = await api.get('lvg/getID', { params: { code } });
            const lgId = lgIdRes.data.lg_id || lgIdRes.data.data?.lg_id;

            if (lgId) {
                // Step 2: Get List
                const brgyRes = await api.get('lvg/barangayList', { params: { lg_id: lgId } });
                const list = brgyRes.data.data || brgyRes.data || [];
                const options = list.map((b: any) => ({
                    label: b.barangay_name || b.name || b,
                    value: b.barangay_name || b.name || b
                }));
                setBarangayCache(prev => ({ ...prev, [code]: options }));
            } else {
                setBarangayCache(prev => ({ ...prev, [code]: [] }));
            }
        } catch (err) {
            console.error("Error fetching barangays for " + code, err);
            setBarangayCache(prev => ({ ...prev, [code]: [] }));
        } finally {
            setLoadingCache(prev => ({ ...prev, [code]: false }));
        }
    };

    // --- FETCH DATA ---
    useEffect(() => {
        if (!showDialog) return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setSuccess(false);
            setImprovementAllocations({});
            setBarangayCache({});

            try {
                // Parallel fetch: FAAS, Owners, LGU List
                const [resFaas, resOwners, resLgus] = await Promise.all([
                    api.get(`faas/${faasId}`),
                    api.get('ol/'),
                    api.get('lvg/list')
                ]);

                const data = resFaas.data;

                if (!data.faas) throw new Error("FAAS Record not found.");
                if (data.faas.property_kind !== 'Land') throw new Error("Only Land properties can be subdivided.");
                
                setFaasData(data.faas);
                setLandData(data.land);
                
                // Store parent owners
                const parentOwners = data.owners || [];
                setCurrentOwners(parentOwners);

                // Set Available Owners
                const ownersList = resOwners.data.data || resOwners.data;
                if(Array.isArray(ownersList)) setAvailableOwners(ownersList);

                // Set LGU Options
                const lgList = resLgus.data.data || resLgus.data || [];
                setLguOptions(lgList.map((lg: any) => ({ 
                    label: `${lg.code} - ${lg.name}`, 
                    value: lg.code 
                })));

                // Default LGU and Barangay
                const defaultLgCode = data.faas.lg_code || '';
                const defaultBarangay = data.faas.barangay || '';

                // Initialize lots
                setLots([
                    { 
                        id: 1, 
                        lot_no: 'Lot 1', 
                        block_no: '', 
                        lg_code: defaultLgCode,
                        barangay: defaultBarangay, 
                        arp_no: '', 
                        pin: '', 
                        area: 0, 
                        owners: [...parentOwners] 
                    },
                    { 
                        id: 2, 
                        lot_no: 'Lot 2', 
                        block_no: '', 
                        lg_code: defaultLgCode,
                        barangay: defaultBarangay, 
                        arp_no: '', 
                        pin: '', 
                        area: 0, 
                        owners: [...parentOwners]
                    }
                ]);

                // Initial barangay fetch for the parent's LGU
                if (defaultLgCode) {
                    fetchBarangaysForLgCode(defaultLgCode);
                }

            } catch (err: any) {
                setError(err.message || "Failed to load details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showDialog, faasId]);

    // --- COMPUTED VALUES ---
    const originalArea = landData ? parseFloat(landData.appraisal.area) : 0;
    
    const totalAllocatedArea = useMemo(() => {
        return lots.reduce((sum, lot) => sum + (lot.area || 0), 0);
    }, [lots]);

    const remainingArea = originalArea - totalAllocatedArea;
    const isBalanced = Math.abs(remainingArea) < 0.01;

    // --- HANDLERS ---
    const updateLot = (id: number, field: keyof SubdividedLot, value: any) => {
        // If updating LGU, trigger fetch for barangays
        if (field === 'lg_code' && value) {
            fetchBarangaysForLgCode(value);
            // Also reset barangay when LGU changes to avoid mismatch
            setLots(prev => prev.map(lot => lot.id === id ? { ...lot, [field]: value, barangay: '' } : lot));
        } else {
            setLots(prev => prev.map(lot => lot.id === id ? { ...lot, [field]: value } : lot));
        }
    };

    const updateLotOwners = (id: number, newOwners: OwnerOption[]) => {
        setLots(prev => prev.map(lot => lot.id === id ? { ...lot, owners: newOwners } : lot));
    };

    const addLot = () => {
        const nextId = lots.length > 0 ? Math.max(...lots.map(l => l.id)) + 1 : 1;
        // Inherit from parent or the first lot to keep consistency
        const defaultLgCode = faasData?.lg_code || '';
        const defaultBarangay = faasData?.barangay || '';

        setLots([...lots, { 
            id: nextId, 
            lot_no: `Lot ${lots.length + 1}`, 
            block_no: '', 
            lg_code: defaultLgCode,
            barangay: defaultBarangay, 
            arp_no: '', 
            pin: '', 
            area: 0,
            owners: [...currentOwners] 
        }]);

        if (defaultLgCode) fetchBarangaysForLgCode(defaultLgCode);
    };

    const removeLot = (id: number) => {
        if (lots.length > 2) {
            setLots(prev => prev.filter(l => l.id !== id));
            setImprovementAllocations(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    if (next[parseInt(key)] === String(id)) delete next[parseInt(key)];
                });
                return next;
            });
        }
    };

    const handleAllocationChange = (improvementId: number, lotIdStr: string) => {
        setImprovementAllocations(prev => ({
            ...prev,
            [improvementId]: lotIdStr
        }));
    };

    const handleSubmit = async () => {
        if (!isBalanced) return;
        
        const invalidLot = lots.find(l => l.owners.length === 0);
        if (invalidLot) {
            setError(`Please assign at least one owner to ${invalidLot.lot_no}`);
            return;
        }

        setSubmitLoading(true);
        setError(null);

        const payloadLots = lots.map(lot => {
            const assignedImprovements = landData?.improvements?.filter(imp => 
                improvementAllocations[imp.improvement_id] === String(lot.id)
            ).map(imp => imp.improvement_id) || [];

            return {
                lot_no: lot.lot_no,
                block_no: lot.block_no,
                lg_code: lot.lg_code, // Pass LGU
                barangay: lot.barangay, 
                arp_no: lot.arp_no,
                pin: lot.pin,
                area: lot.area,
                owner_ids: lot.owners.map(o => o.owner_id),
                improvements: assignedImprovements
            };
        });

        try {
            console.log(payloadLots)
            await api.post('faas/subdivision', { 
                faas_id: faasId,
                subdivision_date: subdivisionDate,
                remarks,
                subdivided_lots: payloadLots
            });
            // setSuccess(true);
            // setRefresh((p: any) => !p);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Subdivision failed.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSuccess(false);
    };

    if (!showDialog) return null;

    if (success) return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Subdivision Complete!</h2>
                <p className="text-gray-500 text-center mt-2 mb-6">
                    Original property marked as Subdivided. New FAAS records created for the {lots.length} lots.
                </p>
                <button onClick={handleClose} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Close</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Layers className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Subdivide Land</h2>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{faasData?.faas_no}</span>
                                {faasData?.lg_code && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>LGU: {faasData.lg_code}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleClose}><X className="text-gray-400 hover:text-red-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
                    ) : error && !faasData ? (
                        <div className="h-40 flex flex-col items-center justify-center text-red-500"><AlertCircle className="w-8 h-8 mb-2" /><p>{error}</p></div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* Current Owners Section */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                    <Users className="w-4 h-4 mr-1.5" /> Current Registered Owner(s)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {currentOwners.length > 0 ? (
                                        currentOwners.map((owner) => (
                                            <div key={owner.owner_id} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {owner.last_name}, {owner.first_name} {owner.middle_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{owner.address_house_no}</p>
                                                </div>
                                                <div className="ml-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        ID: {owner.owner_id}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No owners recorded.</p>
                                    )}
                                </div>
                            </div>

                            {/* Original Property Stats */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <PieChart className="w-8 h-8 text-indigo-500" />
                                    <div>
                                        <p className="text-xs font-bold text-indigo-800 uppercase">Original Land Area</p>
                                        <p className="text-2xl font-bold text-gray-900">{originalArea.toLocaleString()} <span className="text-sm font-normal text-gray-500">sqm</span></p>
                                    </div>
                                </div>
                                <div className={`text-right ${remainingArea < 0 ? 'text-red-600' : remainingArea > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    <p className="text-xs font-semibold uppercase">Remaining to Allocate</p>
                                    <p className="text-xl font-bold">{remainingArea.toLocaleString()} sqm</p>
                                </div>
                            </div>

                            {/* Lots Configuration */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase">Resulting Lots Configuration</h3>
                                    <button onClick={addLot} className="text-xs flex items-center text-indigo-600 font-semibold hover:text-indigo-800">
                                        <Plus className="w-3 h-3 mr-1" /> Add Lot
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {lots.map((lot, idx) => (
                                        <div key={lot.id} className="flex flex-col lg:flex-row gap-4 items-start bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-left-2 duration-200 hover:border-indigo-200 transition-colors relative">
                                            
                                            {/* Index Badge */}
                                            <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md z-10">
                                                {idx + 1}
                                            </div>

                                            {/* Left Column: Identifiers */}
                                            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3 border-b lg:border-b-0 lg:border-r border-gray-100 pb-3 lg:pb-0 lg:pr-3">
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Lot Description</label>
                                                    <input type="text" placeholder="e.g. Lot 1-A" value={lot.lot_no} onChange={e => updateLot(lot.id, 'lot_no', e.target.value)} className="w-full border border-gray-200 bg-gray-50 rounded p-1.5 text-sm focus:bg-white focus:border-indigo-300 focus:outline-none" />
                                                </div>
                                                
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">ARP No.</label>
                                                    <input type="text" value={lot.arp_no} onChange={e => updateLot(lot.id, 'arp_no', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-sm focus:border-indigo-300 focus:outline-none" placeholder="New ARP" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">PIN</label>
                                                    <input type="text" value={lot.pin} onChange={e => updateLot(lot.id, 'pin', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-sm focus:border-indigo-300 focus:outline-none" placeholder="New PIN" />
                                                </div>
                                                
                                                {/* LGU Selection */}
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">LG Code</label>
                                                    <SearchableSelect 
                                                        options={lguOptions}
                                                        value={lot.lg_code}
                                                        onChange={(val) => updateLot(lot.id, 'lg_code', val)}
                                                        placeholder="Select LGU"
                                                    />
                                                </div>

                                                {/* Barangay Selection (Dependent on LGU) */}
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Barangay</label>
                                                    <SearchableSelect 
                                                        options={barangayCache[lot.lg_code] || []}
                                                        value={lot.barangay}
                                                        onChange={(val) => updateLot(lot.id, 'barangay', val)}
                                                        placeholder={loadingCache[lot.lg_code] ? "Loading..." : "Select Barangay"}
                                                        isLoading={loadingCache[lot.lg_code]}
                                                        disabled={!lot.lg_code}
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Block No.</label>
                                                    <input type="text" placeholder="Block..." value={lot.block_no} onChange={e => updateLot(lot.id, 'block_no', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-sm focus:border-indigo-300 focus:outline-none" />
                                                </div>

                                                <div className="relative">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Area (sqm)</label>
                                                    <input type="number" value={lot.area || ''} onChange={e => updateLot(lot.id, 'area', parseFloat(e.target.value) || 0)} className={`w-full border rounded p-1.5 text-right text-sm focus:outline-none focus:ring-2 ${lot.area <= 0 ? 'border-red-300 ring-red-100' : 'border-gray-300 ring-indigo-100'}`} />
                                                </div>
                                            </div>

                                            {/* Right Column: Ownership (Using MultiOwnerSelector) */}
                                            <div className="lg:w-1/3 w-full flex flex-col justify-start pt-1">
                                                <div className="mb-1 text-[10px] uppercase font-bold text-gray-400 flex items-center justify-between">
                                                    <span className="flex items-center"><User className="w-3 h-3 mr-1" /> Ownership</span>
                                                    <span className="text-indigo-600 bg-indigo-50 px-1 rounded">{lot.owners.length} Selected</span>
                                                </div>
                                                
                                                <MultiOwnerSelector 
                                                    selectedOwners={lot.owners}
                                                    onUpdateOwners={(newOwners) => updateLotOwners(lot.id, newOwners)}
                                                    options={availableOwners}
                                                />
                                            </div>

                                            <button 
                                                onClick={() => removeLot(lot.id)}
                                                disabled={lots.length <= 2}
                                                className={`p-2 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition self-center ${lots.length <= 2 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Improvements Allocation (Only if improvements exist) */}
                            {landData?.improvements && landData.improvements.length > 0 && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Home className="w-5 h-5 text-orange-600" />
                                        <h3 className="text-sm font-bold text-orange-800 uppercase">Allocate Existing Improvements</h3>
                                    </div>
                                    <p className="text-xs text-orange-700">Select which new lot inherits the existing improvements. Unallocated improvements will not be carried over.</p>
                                    
                                    <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-orange-100 text-orange-800 text-xs uppercase font-semibold">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Improvement</th>
                                                    <th className="px-4 py-2 text-center">Qty</th>
                                                    <th className="px-4 py-2 text-right">Value</th>
                                                    <th className="px-4 py-2 text-left pl-8"><ArrowRight className="w-4 h-4 inline mr-1"/> Assign To</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-orange-100">
                                                {landData.improvements.map(imp => (
                                                    <tr key={imp.improvement_id} className="hover:bg-orange-50/50 transition-colors">
                                                        <td className="px-4 py-2 font-medium text-gray-700">{imp.improvement_name}</td>
                                                        <td className="px-4 py-2 text-center text-gray-500">{imp.qty}</td>
                                                        <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(parseFloat(imp.unit_value) * imp.qty)}</td>
                                                        <td className="px-4 py-2">
                                                            <select 
                                                                className="w-full border border-gray-300 rounded p-1.5 text-sm focus:border-orange-400 focus:outline-none"
                                                                value={improvementAllocations[imp.improvement_id] || ""}
                                                                onChange={(e) => handleAllocationChange(imp.improvement_id, e.target.value)}
                                                            >
                                                                <option value="">-- Unallocated --</option>
                                                                {lots.map(lot => (
                                                                    <option key={lot.id} value={lot.id}>
                                                                        {lot.lot_no || `Lot ${lot.id}`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Date of Subdivision</label>
                                    <input type="date" value={subdivisionDate} onChange={e => setSubdivisionDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-indigo-100 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Remarks</label>
                                    <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Reason/Details..." />
                                </div>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center border border-red-100">
                                    <AlertCircle className="w-4 h-4 mr-2" /> {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        {!isBalanced && (
                            <span className="text-orange-600 font-medium flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1"/>
                                Total area mismatch ({formatCurrency(remainingArea).replace('₱','')} sqm remaining)
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleClose} disabled={submitLoading} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all">Cancel</button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={submitLoading || !isBalanced || loading}
                            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg transition-all"
                        >
                            {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Process Subdivision
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};