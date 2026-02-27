import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Merge, 
    X, 
    Loader2, 
    Plus, 
    Trash2, 
    CheckCircle, 
    AlertTriangle, 
    Search, 
    MapPin, 
    FileText,
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

    const selectedOption = options.find(o => o.value === value);
    
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

    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full border rounded-lg p-2 text-sm flex items-center justify-between cursor-pointer bg-white transition-all
                    ${isOpen ? 'ring-2 ring-blue-100 border-blue-400' : 'border-gray-300 hover:border-gray-400'}
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
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading...
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
                                        px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between
                                        ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
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

interface Improvement {
    improvement_id: number;
    improvement_name: string;
    qty: number;
    unit_value: string;
}

interface OwnerOption {
    owner_id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    suffix?: string;
    address_house_no?: string;
    tin_no?: string;
}

interface PropertyDetails {
    faas_id: number;
    faas_no: string;
    owner_name: string;
    owner_address: string;
    lg_code?: string;
    property_kind: string;
    barangay?: string;
    land?: {
        appraisal: {
            area: string;
            unit_value: string;
            classification: string;
            subclassification: string;
        };
        improvements?: Improvement[];
    };
    owners?: OwnerOption[]; // Added owners array
}

interface FAASConsolidationDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number; // The starting property
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
            <div className="min-h-[42px] border border-gray-300 rounded-lg p-1.5 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all bg-white">
                {selectedOwners.map(owner => (
                    <div key={owner.owner_id} className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 animate-in fade-in zoom-in duration-100">
                        <span>{owner.last_name}, {owner.first_name}</span>
                        <button 
                            type="button"
                            onClick={() => handleRemove(owner.owner_id)}
                            className="hover:text-red-500 rounded-full p-0.5 hover:bg-blue-100 transition"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
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
                        placeholder={selectedOwners.length === 0 ? "Search Owner..." : "Add owner..."}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(owner => (
                            <button
                                key={owner.owner_id}
                                onClick={() => handleSelect(owner)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 last:border-0 group transition-colors"
                                type="button"
                            >
                                <div className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
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

// --- PROPERTY SEARCH COMPONENT ---
const PropertySelector = ({
    searchTerm,
    onSearchChange,
    onSelect,
    options = [],
    disabled
}: {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onSelect: (id: string) => void;
    options: PropertyDetails[];
    disabled: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filtered = options.filter(p => 
        (p.faas_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (prop: PropertyDetails) => {
        onSearchChange(`${prop.faas_no} - ${prop.owner_name}`);
        onSelect(prop.faas_id.toString());
        setIsOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
        setIsOpen(true);
        onSelect(''); 
    };

    return (
        <div className="relative flex-1" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-400 bg-white transition-all"
                    placeholder={disabled ? "Loading..." : "Search FAAS No. or Owner..."}
                    value={searchTerm}
                    onChange={handleChange}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            {isOpen && !disabled && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filtered.length > 0 ? (
                        filtered.map(prop => (
                            <button
                                key={prop.faas_id}
                                onClick={() => handleSelect(prop)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors group"
                            >
                                <div className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{prop.faas_no}</div>
                                <div className="text-xs text-gray-500 truncate">{prop.owner_name}</div>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
                            No matching properties found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const FAASConsolidationDialog: React.FC<FAASConsolidationDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    // State - Selection
    const [selectedProperties, setSelectedProperties] = useState<PropertyDetails[]>([]);
    
    // State - New Property Details
    const [consolidationDate, setConsolidationDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');
    const [newArp, setNewArp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newLotNo, setNewLotNo] = useState('');
    const [newBlockNo, setNewBlockNo] = useState('');
    
    // Location Details State
    const [newLgCode, setNewLgCode] = useState('');
    const [newBarangay, setNewBarangay] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newOwners, setNewOwners] = useState<OwnerOption[]>([]);

    // Dropdown/Search State
    const [availableProperties, setAvailableProperties] = useState<PropertyDetails[]>([]);
    const [availableOwners, setAvailableOwners] = useState<OwnerOption[]>([]); 
    const [lguOptions, setLguOptions] = useState<SelectOption[]>([]);
    const [barangayOptions, setBarangayOptions] = useState<SelectOption[]>([]);
    
    const [selectedDropdownId, setSelectedDropdownId] = useState<string>('');
    const [propertySearchTerm, setPropertySearchTerm] = useState('');
    
    // Loading States
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [barangaysLoading, setBarangaysLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    
    // Result states
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // --- INITIAL LOAD (References) ---
    useEffect(() => {
        if (showDialog) {
            // Reset Form on open
            setSelectedProperties([]);
            setSuccess(false);
            setSubmitError(null);
            setRemarks('');
            setSelectedDropdownId('');
            setPropertySearchTerm('');
            setNewOwners([]);
            setNewArp('');
            setNewPin('');
            setNewLotNo('');
            setNewBlockNo('');
            setNewLgCode('');
            setNewBarangay('');
            setNewAddress('');
            
            // Load base lists
            fetchAvailableProperties();
            fetchOwners();
            fetchLgus();

            // Load the primary property
            if (faasId) {
                loadPropertyById(faasId, true);
            }
        }
    }, [showDialog, faasId]);

    // --- COMPUTED ---
    const primaryProperty = selectedProperties.find(p => p.faas_id === faasId);

    // Auto-fill defaults from primary property
    useEffect(() => {
        if (primaryProperty) {
            const pLgCode = primaryProperty.lg_code || '';
            const pBarangay = primaryProperty.barangay || '';
            const pOwnerAddr = primaryProperty.owner_address || '';

            if (!newAddress) setNewAddress(pOwnerAddr);
            if (!newLgCode && pLgCode) setNewLgCode(pLgCode);
            // newBarangay will be set safely after options resolve
            if (!newBarangay && pBarangay) setNewBarangay(pBarangay);
        }
    }, [primaryProperty]); 

    // --- FETCH BARANGAYS DEPENDENT ON LGU ---
    useEffect(() => {
        const fetchBarangays = async () => {
            if (!newLgCode) {
                setBarangayOptions([]);
                return;
            }
            setBarangaysLoading(true);
            try {
                // 1. Get LG ID from LG Code
                const lgIdRes = await api.get('lvg/getID', { params: { code: newLgCode } });
                const lgId = lgIdRes.data.lg_id || lgIdRes.data.data?.lg_id;
                
                if (lgId) {
                    // 2. Fetch Barangays with LG ID
                    const brgyRes = await api.get('lvg/barangayList', { params: { lg_id: lgId } });
                    const list = brgyRes.data.data || brgyRes.data || [];
                    
                    const options = list.map((item: any) => ({
                        label: item.barangay_name || item.name || item,
                        value: item.barangay_name || item.name || item
                    }));
                    setBarangayOptions(options);
                } else {
                    setBarangayOptions([]);
                }
            } catch (error) {
                console.error("Error fetching barangays:", error);
                setBarangayOptions([]);
            } finally {
                setBarangaysLoading(false);
            }
        };
        fetchBarangays();
    }, [newLgCode]);

    const totalArea = useMemo(() => {
        return selectedProperties.reduce((sum, p) => sum + parseFloat(p.land?.appraisal.area || '0'), 0);
    }, [selectedProperties]);

    const consolidatedImprovements = useMemo(() => {
        const allImps: Improvement[] = [];
        selectedProperties.forEach(p => {
            if (p.land?.improvements) {
                allImps.push(...p.land.improvements);
            }
        });
        return allImps;
    }, [selectedProperties]);


    // --- API CALLS ---
    const fetchLgus = async () => {
        try {
            const res = await api.get('lvg/list');
            const list = res.data.data || res.data || [];
            setLguOptions(list.map((lg: any) => ({
                label: `${lg.code} - ${lg.name || lg.lg_name || ''}`,
                value: lg.code
            })));
        } catch (err) {
            console.error("Failed to load LGU list", err);
        }
    };

    const fetchAvailableProperties = async () => {
        setLoadingCandidates(true);
        try {
            const res = await api.get('faas/list', { 
                params: { status: 'ACTIVE', property_kind: 'Land' } 
            });
            setAvailableProperties(res.data.data || res.data || []);
        } catch (err) {
            console.error("Failed to load property list", err);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const fetchOwners = async () => {
        try {
            const res = await api.get('ol/');
            setAvailableOwners(res.data.data || res.data || []);
        } catch (err) {
            console.error("Failed to load owners", err);
        }
    };

    const loadPropertyById = async (id: number, isPrimary: boolean = false) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            // Fetch Property Details
            const res = await api.get(`faas/${id}`);
            // Fetch Property Owners
            const ownersRes = await api.get(`faas/${id}/owners`);

            const data = res.data;
            const propertyOwners = ownersRes.data || [];

            if (!data.faas) throw new Error("Property not found.");
            if (data.faas.property_kind !== 'Land') throw new Error("Only Land properties can be consolidated.");
            if (data.faas.status !== 'ACTIVE') throw new Error("Only Active properties can be consolidated.");

            const newProp: PropertyDetails = {
                ...data.faas,
                land: data.land,
                owners: propertyOwners // Attach fetched owners
            };

            // Duplicate check
            setSelectedProperties(prev => {
                if (prev.some(p => p.faas_id === newProp.faas_id)) {
                    if (!isPrimary) setSearchError("Property already added.");
                    return prev;
                }
                return [...prev, newProp];
            });

        } catch (err: any) {
            setSearchError(err.message || "Error loading property.");
        } finally {
            setIsSearching(false);
        }
    };

    // --- HANDLERS ---
    const handleAddFromDropdown = () => {
        if (!selectedDropdownId) return;
        loadPropertyById(parseInt(selectedDropdownId));
        setSelectedDropdownId('');
        setPropertySearchTerm('');
    };

    const removeProperty = (id: number) => {
        if (id === faasId) return; // Can't remove primary
        setSelectedProperties(prev => prev.filter(p => p.faas_id !== id));
    };

    const handleSubmit = async () => {
        if (selectedProperties.length < 2) {
            setSubmitError("At least 2 properties are required for consolidation.");
            return;
        }
        if (!newArp || newOwners.length === 0) {
            setSubmitError("New ARP Number and at least one Owner are required.");
            return;
        }

        setSubmitLoading(true);
        setSubmitError(null);

        try {
            const payload = {
                faas_ids: selectedProperties.map(p => p.faas_id),
                consolidation_date: consolidationDate,
                remarks: remarks,
                new_arp_no: newArp,
                new_pin: newPin,
                new_lot_no: newLotNo,
                new_block_no: newBlockNo,
                new_lg_code: newLgCode,
                new_barangay: newBarangay,
                owner_ids: newOwners.map(o => o.owner_id),
                owner_address: newAddress,
                // Inherit classification from primary for defaults
                new_unit_value: primaryProperty?.land?.appraisal.unit_value,
                new_classification: primaryProperty?.land?.appraisal.classification,
                new_subclassification: primaryProperty?.land?.appraisal.subclassification
            };

            console.log(payload);

            await api.post('faas/consolidation', payload);
            setSuccess(true);
            setRefresh((p: any) => !p);
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || "Consolidation failed.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
    };

    if (!showDialog) return null;

    if (success) return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full animate-in zoom-in duration-200">
                <CheckCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Consolidation Successful!</h2>
                <p className="text-gray-500 text-center mt-2 mb-6">
                    {selectedProperties.length} properties have been merged. A new FAAS record with ARP <strong>{newArp}</strong> has been created.
                </p>
                <button onClick={handleClose} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Close</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Merge className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Consolidate Land Properties</h2>
                            <p className="text-xs text-gray-500">Merge multiple lots into a single property</p>
                        </div>
                    </div>
                    <button onClick={handleClose}><X className="text-gray-400 hover:text-red-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT: SELECTION LIST (Col 5) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        
                        {/* Dropdown Selection */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Select Property to Merge</label>
                            <div className="flex gap-2">
                                <PropertySelector
                                    searchTerm={propertySearchTerm}
                                    onSearchChange={setPropertySearchTerm}
                                    onSelect={setSelectedDropdownId}
                                    options={availableProperties.filter(p => !selectedProperties.some(sp => sp.faas_id === p.faas_id))}
                                    disabled={loadingCandidates}
                                />
                                <button 
                                    onClick={handleAddFromDropdown}
                                    disabled={isSearching || !selectedDropdownId}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-semibold flex items-center"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                                    Add
                                </button>
                            </div>
                            {searchError && <p className="text-xs text-red-500 mt-2 ml-1">{searchError}</p>}
                        </div>

                        {/* List */}
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-700">Selected ({selectedProperties.length})</h3>
                            </div>
                            
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-500 font-semibold border-b sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-2">FAAS No.</th>
                                            <th className="px-4 py-2">Owner(s)</th>
                                            <th className="px-4 py-2">Area</th>
                                            <th className="px-4 py-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedProperties.map((prop) => (
                                            <tr key={prop.faas_id} className="hover:bg-white transition-colors">
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-medium text-gray-800">{prop.faas_no}</div>
                                                    {prop.faas_id === faasId && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 inline-block">PRIMARY</span>}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    {prop.owners && prop.owners.length > 0 ? (
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-800">
                                                                {prop.owners[0].last_name}, {prop.owners[0].first_name}
                                                            </div>
                                                            {prop.owners.length > 1 && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 cursor-help" title={prop.owners.slice(1).map(o => `${o.last_name}, ${o.first_name}`).join('\n')}>
                                                                        +{prop.owners.length - 1} more
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-700 font-medium">{prop.owner_name}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-700 align-top">
                                                    {prop.land?.appraisal.area} <span className="text-xs text-gray-400">sqm</span>
                                                </td>
                                                <td className="px-4 py-3 text-center align-top">
                                                    {prop.faas_id !== faasId && (
                                                        <button onClick={() => removeProperty(prop.faas_id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {selectedProperties.length === 0 && (
                                    <div className="p-8 text-center text-gray-400 text-sm">Loading primary property...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: NEW PROPERTY DETAILS (Col 7) */}
                    <div className="lg:col-span-7 bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col">
                        <div className="flex items-center mb-4 pb-4 border-b border-blue-200">
                            <FileText className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">New Consolidated Property Details</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Land Area</p>
                                    <div className="flex items-baseline">
                                        <span className="text-3xl font-bold text-blue-900">{totalArea.toLocaleString()}</span>
                                        <span className="ml-1 text-xs text-gray-500">sqm</span>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Merged Improvements</p>
                                    <span className="text-2xl font-bold text-blue-900">{consolidatedImprovements.length}</span>
                                    <span className="ml-1 text-xs text-gray-500">items</span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-800 uppercase border-b border-blue-200 pb-1">Ownership & Location</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    
                                    {/* Multi-Owner Selection */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Registered Owner(s)</label>
                                        <MultiOwnerSelector 
                                            selectedOwners={newOwners}
                                            onUpdateOwners={setNewOwners}
                                            options={availableOwners}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Owner Address</label>
                                        <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Address" />
                                    </div>

                                    {/* LGU & Barangay Pickers */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">LGU Code</label>
                                        <SearchableSelect 
                                            options={lguOptions}
                                            value={newLgCode}
                                            onChange={(val) => {
                                                setNewLgCode(val);
                                                setNewBarangay(''); // Reset barangay when LGU changes
                                            }}
                                            placeholder="Select LGU"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Barangay</label>
                                        <SearchableSelect 
                                            options={barangayOptions}
                                            value={newBarangay}
                                            onChange={setNewBarangay}
                                            placeholder={barangaysLoading ? "Loading..." : "Select Barangay"}
                                            isLoading={barangaysLoading}
                                            disabled={!newLgCode || barangaysLoading}
                                        />
                                    </div>
                                </div>

                                <h4 className="text-xs font-bold text-blue-800 uppercase border-b border-blue-200 pb-1 pt-2">Property Identifiers</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">New ARP No.</label>
                                        <input type="text" value={newArp} onChange={e => setNewArp(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="New ARP" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">New PIN</label>
                                        <input type="text" value={newPin} onChange={e => setNewPin(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="New PIN" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">New Lot No.</label>
                                        <input type="text" value={newLotNo} onChange={e => setNewLotNo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Lot No." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">New Block No.</label>
                                        <input type="text" value={newBlockNo} onChange={e => setNewBlockNo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Block No." />
                                    </div>
                                </div>

                                <h4 className="text-xs font-bold text-blue-800 uppercase border-b border-blue-200 pb-1 pt-2">Transaction Info</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Consolidation Date</label>
                                        <input type="date" value={consolidationDate} onChange={e => setConsolidationDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
                                        <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Notes about this consolidation..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {submitError && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-start">
                                <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button onClick={handleClose} disabled={submitLoading} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitLoading || selectedProperties.length < 2}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm Consolidation
                    </button>
                </div>
            </div>
        </div>
    );
};