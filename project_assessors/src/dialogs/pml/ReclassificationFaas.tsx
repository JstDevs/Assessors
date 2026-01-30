import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    RefreshCcw, X, Loader2, CheckCircle, Calculator, 
    Building, Map, Settings, Info, AlertCircle, 
    ArrowRight, Search, ChevronDown, Check 
} from 'lucide-react';
import api from '../../../axiosBase.ts'; // Commented out for preview

// --- TEMPORARY MOCK API (For Preview Purposes) ---
// Replace this block with your actual API import in production
// const api = {
//     get: async (url: string, config?: any) => {
//         // Simulate network delay for loading states
//         await new Promise(resolve => setTimeout(resolve, 800));
        
//         if (url.includes('faas/')) {
//             return {
//                 data: {
//                     faas: { faas_id: 101, faas_no: '2023-01-001', property_id: 1, owner_name: 'Juan Dela Cruz', property_kind: 'Land', ry_id: 2024, lg_code: '001' },
//                     land: {
//                         appraisal: { classification: '1', subclassification: '1', area: '100', unit_value: '5000', base_market_value: '500000' },
//                         assessment: { actual_use: '1', market_value: '500000', assessment_level: '20', assessed_value: '100000' },
//                         adjustments: [], improvements: []
//                     },
//                     building: { general: {}, floors: [], appraisal: {}, assessment: {}, additionals: [] },
//                     machinery: { appraisal: {}, assessment: {} }
//                 }
//             };
//         }
//         if (url === 'lvg/list') return { data: { data: [{ lg_id: 1, code: 'LGU-001' }] } };
        
//         // Land Dropdowns
//         if (url === 'p/augetlist') return { data: [{ au_id: 1, use_name: 'Residential', code: 'RES', assessment_level: 20 }] };
//         if (url === 'p/plist') return { data: [{ pc_id: 1, classname: 'Residential', code: 'RES' }, { pc_id: 2, classname: 'Commercial', code: 'COM' }] };
//         if (url === 'p/splist') return { data: [{ psc_id: 1, subclass_name: 'First Class', code: 'R-1' }] };
        
//         // Building/Machinery Dropdowns (Empty for brevity in mock)
//         if (url === 'p/bklist') return { data: { data: [] } };
//         if (url === 'p/stlist') return { data: { data: [] } };
//         if (url === 'p/bauList') return { data: { data: [] } };
//         if (url === 'p/mtlist') return { data: { data: [] } };
//         if (url === 'p/maulist') return { data: { data: [] } };

//         // SMV
//         if (url.includes('smv/')) return { data: { data: { unit_value: '5500' } } };

//         return { data: [] };
//     },
//     post: async (url: string, data: any) => {
//         await new Promise(resolve => setTimeout(resolve, 1500));
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

// --- REUSABLE SEARCHABLE SELECT ---
interface SearchableSelectProps {
    options: { id: string | number; name: string }[];
    value: string | number;
    onChange: (value: string) => void;
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
    label, 
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

    // Handle finding the selected option safely regardless of type (string/number)
    const selectedOption = options.find(opt => String(opt.id) === String(value));

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleSelect = (id: string | number) => {
        onChange(String(id));
        setIsOpen(false);
    };

    return (
        <div className={`w-full relative group ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {label}
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
                        : 'hover:border-emerald-400 border-slate-300 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500'
                    }
                    ${isOpen ? 'ring-2 ring-emerald-100 border-emerald-500' : ''}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-700'}`}>
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
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                <Loader2 size={20} className="animate-spin mb-2 text-emerald-500" />
                                <span className="text-xs">Loading options...</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400 px-4 text-center">
                                <AlertCircle size={20} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium text-slate-500">
                                    {options.length === 0 ? "No options available" : "No results found"}
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

// 1. Land
interface LandImprovement { improvement_name: string; qty: number; unit_value: string; }
interface LandAdjustment { factor: string; adjustment: string; }
interface LandDetails {
    appraisal: { classification: string; subclassification: string; area: string; unit_value: string; base_market_value: string; };
    assessment: { actual_use: string; market_value: string; assessment_level: string; assessed_value: string; };
    adjustments: LandAdjustment[];
    improvements: LandImprovement[];
}

// 2. Building
interface BuildingFloor { floor_no: number; floor_area: string; }
interface BuildingAdditional { item_name: string; quantity: number; unit_cost: string; total_cost: string; }
interface BuildingDetails {
    general: { buildingKind: string; structuralType: string; storeys: number; };
    floors: BuildingFloor[];
    appraisal: { unit_cost: string; base_market_value: string; additional_total: string; deprication_rate: string; depreciation_cost: string; final_market_value: string; };
    assessment: { actual_use: string; assessment_level: string; market_value: string; assessed_value: string; };
    additionals: BuildingAdditional[];
}

// 3. Machinery
interface MachineryDetails {
    appraisal: { machinery_type: string; original_cost: string; conversion_factor: string; rcn: string; depreciation_value: string; year_installed: number; };
    assessment: { actual_use: string; assessment_level: string; market_value: string; assessed_value: string; };
}

// 4. Common
interface FAASData {
    faas_id: number;
    faas_no: string;
    property_id: number;
    owner_name: string;
    property_kind: 'Land' | 'Building' | 'Machinery' | string;
    ry_id: number;
    lg_code?: string;
}

// Dropdown Options
interface Option { 
    id: number | string; 
    label: string; 
    code?: string; 
    assessment_level?: number; 
    unit_value?: number; 
}

interface FAASReclassificationDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

// --- HELPER FUNCTIONS ---
const parseVal = (val: string | number | undefined) => parseFloat(String(val || 0));
const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (val: number) => `${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}%`;

export const FAASReclassificationDialog: React.FC<FAASReclassificationDialogProps> = ({
    showDialog = true, setShowDialog = () => {}, faasId = 101, setRefresh = () => {}
}) => {
    // --- STATE ---
    const [faasData, setFAASData] = useState<FAASData | null>(null);
    const [landDetails, setLandDetails] = useState<LandDetails | null>(null);
    const [buildingDetails, setBuildingDetails] = useState<BuildingDetails | null>(null);
    const [machineryDetails, setMachineryDetails] = useState<MachineryDetails | null>(null);

    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [smvLoading, setSmvLoading] = useState(false);
    
    // Additional Loading States for dependent dropdowns
    const [subclassLoading, setSubclassLoading] = useState(false);

    // Dropdowns
    const [lgOptions, setLgOptions] = useState<Option[]>([]);
    const [actualUseOptions, setActualUseOptions] = useState<Option[]>([]);
    const [buildingActualUseOptions, setBuildingActualUseOptions] = useState<Option[]>([]);
    const [machineryActualUseOption, setMachineryActualUseOption] = useState<Option[]> ([]);

    // Land Options
    const [classOptions, setClassOptions] = useState<Option[]>([]);
    const [subclassOptions, setSubclassOptions] = useState<Option[]>([]);
    
    // Building Options
    const [bldgKindOptions, setBldgKindOptions] = useState<Option[]>([]);
    const [structTypeOptions, setStructTypeOptions] = useState<Option[]>([]);
    
    // Machinery Options
    const [machTypeOptions, setMachTypeOptions] = useState<Option[]>([]);

    // Form Inputs
    const [inputs, setInputs] = useState({
        reclassification_date: new Date().toISOString().split('T')[0],
        new_actual_use: '',
        new_assessment_level: '',
        new_unit_value: '',
        remarks: '',
        // Land
        new_classification: '',
        new_subclassification: '',
        // Building
        new_building_kind: '',
        new_structural_type: '',
        // Machinery
        new_machinery_type: ''
    });

    // --- 1. FETCH MAIN DATA ---
    useEffect(() => {
        if (!showDialog) return;
        setLoading(true);
        setError(null);
        setFAASData(null);
        setLandDetails(null);
        setBuildingDetails(null);
        setMachineryDetails(null);
        // Reset Inputs
        setInputs({
            reclassification_date: new Date().toISOString().split('T')[0],
            new_classification: '', new_subclassification: '',
            new_building_kind: '', new_structural_type: '',
            new_machinery_type: '', new_unit_value: '', new_actual_use: '', new_assessment_level: '', remarks: ''
        });

        const fetchData = async () => {
            try {
                const res = await api.get(`faas/${faasId}`);
                if (!res.data.faas) throw new Error("FAAS not found");
                setFAASData(res.data.faas);

                if (res.data.faas.property_kind === 'Land') setLandDetails(res.data.land);
                else if (res.data.faas.property_kind === 'Building') setBuildingDetails(res.data.building);
                else if (res.data.faas.property_kind === 'Machinery') setMachineryDetails(res.data.machinery);
                
            } catch (err: any) {
                setError(err.message || "Failed to load FAAS data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showDialog, faasId]);

    // --- 2. FETCH DROPDOWNS (Based on Kind) ---
    useEffect(() => {
        if (!faasData) return;
        const fetchDrops = async () => {
            try {
                const ryId = faasData.ry_id || 1;
                
                // Common LG List for ID lookup
                const lgRes = await api.get('lvg/list');
                setLgOptions(lgRes.data.data.map((x:any) => ({ id: x.lg_id, label: x.code })));

                // Property Specifics
                if (faasData.property_kind === 'Land') {
                    const auRes = await api.get('p/augetlist');
                    if (auRes?.data) setActualUseOptions(auRes.data.map((x:any) => ({
                        id: x.au_id, 
                        label: x.use_name, 
                        code: x.code,
                        assessment_level: parseFloat(x.assessment_level)
                    })));

                    const cRes = await api.get('p/plist');
                    setClassOptions(cRes.data.map((x:any) => ({id: x.pc_id, label: x.classname, code: x.code})));
                } 
                else if (faasData.property_kind === 'Building') {
                    const bkRes = await api.get('p/bklist');
                    setBldgKindOptions(bkRes.data.data.map((x:any) => ({id: x.bk_id, label: x.kind_name, code: x.code})));
                    
                    const stRes = await api.get('p/stlist');
                    setStructTypeOptions(stRes.data.data.map((x:any) => ({id: x.st_id, label: x.type_name, code: x.code})));

                    const bauRes = await api.get('p/bauList');
                    setBuildingActualUseOptions(bauRes.data.data.map((x:any) => ({
                        id: x.bau_id, 
                        label: x.use_name, 
                        code: x.code,
                        assessment_level: parseFloat(x.assessment_level)
                    })));
                }
                else if (faasData.property_kind === 'Machinery') {
                    const mtRes = await api.get('p/mtlist'); 
                    setMachTypeOptions(mtRes.data.data.map((x:any) => ({id: x.mt_id, label: x.name, code: x.code})));

                    const mauRes = await api.get('p/maulist');
                    setMachineryActualUseOption(mauRes.data.data.map((x:any) => ({
                        id: x.mau_id, 
                        label: x.use_name, 
                        code: x.code,
                        assessment_level: parseFloat(x.assessment_level)
                    })));
                }

            } catch (e) { console.error("Dropdown fetch error", e); }
        };
        fetchDrops();
    }, [faasData]);

    // Land: Fetch Subclass when Class changes
    useEffect(() => {
        if (inputs.new_classification && faasData?.property_kind === 'Land') {
            setSubclassLoading(true);
            setSubclassOptions([]); // Clear previous options
            
            api.get('p/splist', { params: { pc_id: inputs.new_classification } })
                .then(res => setSubclassOptions(res.data.map((x:any) => ({id: x.psc_id, label: x.subclass_name, code: x.code}))))
                .catch(() => setSubclassOptions([]))
                .finally(() => setSubclassLoading(false));
        } else {
            setSubclassOptions([]);
        }
    }, [inputs.new_classification, faasData]);

    // --- 3. SMV LOOKUP ---
    useEffect(() => {
        if (!faasData) return;
        const ryId = faasData.ry_id || 1;
        const lgId = lgOptions.find(o => o.label === faasData.lg_code)?.id || 1;

        const fetchSMV = async () => {
            setSmvLoading(true);
            try {
                let res;
                // LAND SMV: lg_id + psc_id
                if (faasData.property_kind === 'Land' && inputs.new_subclassification) {
                    res = await api.get('smv/landSMV', { params: { ry_id: ryId, lg_id: lgId, psc_id: inputs.new_subclassification }});
                    if (res.data?.data?.unit_value) setInputs(p => ({...p, new_unit_value: res.data.data.unit_value}));
                    else setInputs(p => ({...p, new_unit_value: '0'}));
                }
                // BUILDING SMV: st_id + bk_id
                else if (faasData.property_kind === 'Building' && inputs.new_building_kind && inputs.new_structural_type) {
                    res = await api.get('smv/buildingSMV', { params: { ry_id: ryId, bk_id: inputs.new_building_kind, st_id: inputs.new_structural_type }});
                    if (res.data?.data?.unit_value) setInputs(p => ({...p, new_unit_value: res.data.data.unit_value}));
                    else setInputs(p => ({...p, new_unit_value: '0'}));
                }
                // MACHINERY SMV: mt_id
                else if (faasData.property_kind === 'Machinery' && inputs.new_machinery_type) {
                    res = await api.get('smv/machinerySMV', { params: { ry_id: ryId, mt_id: inputs.new_machinery_type }});
                    const val = res.data?.data?.original_cost || res.data?.data?.unit_value;
                    if (val) setInputs(p => ({...p, new_unit_value: val}));
                    else setInputs(p => ({...p, new_unit_value: '0'}));
                }
            } catch (e) {
                console.error("SMV Fetch failed", e);
            } finally {
                setSmvLoading(false);
            }
        };

        const shouldFetchLand = faasData.property_kind === 'Land' && inputs.new_subclassification;
        const shouldFetchBldg = faasData.property_kind === 'Building' && inputs.new_building_kind && inputs.new_structural_type;
        const shouldFetchMach = faasData.property_kind === 'Machinery' && inputs.new_machinery_type;

        if (shouldFetchLand || shouldFetchBldg || shouldFetchMach) {
            const timer = setTimeout(() => fetchSMV(), 300);
            return () => clearTimeout(timer);
        }
    }, [
        faasData, 
        inputs.new_subclassification, 
        inputs.new_building_kind, 
        inputs.new_structural_type, 
        inputs.new_machinery_type,
        lgOptions
    ]);

    // Auto-populate Assessment Level based on Actual Use
    useEffect(() => {
        let level = '';
        if(faasData?.property_kind === 'Land'){
            const selectedAU = actualUseOptions.find(o => String(o.id) === inputs.new_actual_use);
            if (selectedAU?.assessment_level !== undefined) level = String(selectedAU.assessment_level);
        } else if(faasData?.property_kind === 'Building'){
            const selectedAU = buildingActualUseOptions.find(o => String(o.id) === inputs.new_actual_use);
            if (selectedAU?.assessment_level !== undefined) level = String(selectedAU.assessment_level);
        } else if(faasData?.property_kind === 'Machinery'){
            const selectedAU = machineryActualUseOption.find(o => String(o.id) === inputs.new_actual_use);
            if (selectedAU?.assessment_level !== undefined) level = String(selectedAU.assessment_level);
        }

        if(level) {
            setInputs(prev => ({ ...prev, new_assessment_level: level }));
        }
    }, [inputs.new_actual_use, actualUseOptions, buildingActualUseOptions, machineryActualUseOption, faasData?.property_kind]);


    // --- 4. CALCULATION ENGINE ---
    const computed = useMemo(() => {
        if (!faasData) return null;

        const kind = faasData.property_kind;
        const inputUV = inputs.new_unit_value !== '' ? parseVal(inputs.new_unit_value) : null;
        const inputAL = inputs.new_assessment_level !== '' ? parseVal(inputs.new_assessment_level) : null;

        // --- LAND ---
        if (kind === 'Land' && landDetails) {
            const area = parseVal(landDetails.appraisal.area);
            const oldUV = parseVal(landDetails.appraisal.unit_value);
            const usedUV = inputUV !== null ? inputUV : oldUV;
            const usedAL = inputAL !== null ? inputAL : parseVal(landDetails.assessment.assessment_level);
            
            // 1. Base MV
            const baseMV = area * usedUV;

            // 2. Adjustments (Total Percentage)
            const totalAdjPercent = landDetails.adjustments.reduce((sum, adj) => sum + parseVal(adj.adjustment), 0);
            const adjValue = baseMV * (totalAdjPercent / 100);

            // 3. Improvements
            const impValue = landDetails.improvements.reduce((sum, imp) => sum + (imp.qty * parseVal(imp.unit_value)), 0);

            const finalMV = baseMV + adjValue + impValue;
            const finalAV = finalMV * (usedAL / 100);

            return { kind, area, baseMV, adjValue, impValue, finalMV, finalAV, usedUV, usedAL, totalAdjPercent, 
                currentMV: parseVal(landDetails.assessment.market_value), currentAV: parseVal(landDetails.assessment.assessed_value) 
            };
        }

        // --- BUILDING ---
        if (kind === 'Building' && buildingDetails) {
            const oldUnitCost = parseVal(buildingDetails.appraisal.unit_cost);
            const usedUV = inputUV !== null ? inputUV : oldUnitCost;
            const usedAL = inputAL !== null ? inputAL : parseVal(buildingDetails.assessment.assessment_level);
            
            // 1. Base MV
            const totalFloorArea = buildingDetails.floors.reduce((sum, floor) => sum + parseVal(floor.floor_area), 0);
            const baseMV = totalFloorArea * usedUV;

            // 2. Additionals
            const additionalsValue = buildingDetails.additionals.reduce((sum, item) => sum + parseVal(item.total_cost), 0);

            // 3. Depreciation
            const grossValue = baseMV + additionalsValue;
            const depRate = parseVal(buildingDetails.appraisal.deprication_rate);
            const depValue = grossValue * (depRate / 100);

            const finalMV = grossValue - depValue;
            const finalAV = finalMV * (usedAL / 100);

            return { kind, totalFloorArea, baseMV, additionalsValue, depRate, depValue, finalMV, finalAV, usedUV, usedAL,
                currentMV: parseVal(buildingDetails.assessment.market_value), currentAV: parseVal(buildingDetails.assessment.assessed_value)
            };
        }

        // --- MACHINERY ---
        if (kind === 'Machinery' && machineryDetails) {
            const oldOrigCost = parseVal(machineryDetails.appraisal.original_cost);
            const usedUV = inputUV !== null ? inputUV : oldOrigCost;
            const usedAL = inputAL !== null ? inputAL : parseVal(machineryDetails.assessment.assessment_level);

            // 1. RCN
            const convFactor = parseVal(machineryDetails.appraisal.conversion_factor) || 1;
            const rcn = usedUV * convFactor;
            const baseMV = rcn; 

            // 2. Depreciation
            const oldRCN = parseVal(machineryDetails.appraisal.rcn);
            const oldDepVal = parseVal(machineryDetails.appraisal.depreciation_value);
            let impliedDepRate = 0;
            if (oldRCN > 0) impliedDepRate = oldDepVal / oldRCN;
            const depValue = rcn * impliedDepRate;

            const finalMV = rcn - depValue;
            const finalAV = finalMV * (usedAL / 100);

            return { kind, rcn, convFactor, impliedDepRate, depValue, finalMV, finalAV, usedUV, usedAL,
                currentMV: parseVal(machineryDetails.assessment.market_value), currentAV: parseVal(machineryDetails.assessment.assessed_value)
            };
        }

        return null;
    }, [inputs, faasData, landDetails, buildingDetails, machineryDetails]);


    // --- HANDLERS ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setInputs(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async () => {
        if (!computed) return;
        setSubmitLoading(true);
        try {
            // Get Readable Labels for selected IDs
            let selectedActualUse, selectedClassification, selectedSubClass;

            if (faasData?.property_kind === 'Land') {
                const cls = classOptions.find(i => String(i.id) === inputs.new_classification);
                selectedClassification = cls ? `${cls.label} (${cls.code})` : undefined;
                
                const sub = subclassOptions.find(i => String(i.id) === inputs.new_subclassification);
                selectedSubClass = sub ? `${sub.label} (${sub.code})` : undefined;
                
                const au = actualUseOptions.find(i => String(i.id) === inputs.new_actual_use);
                selectedActualUse = au ? `${au.label} (${au.code})` : undefined;

            } else if (faasData?.property_kind === 'Building') {
                const au = buildingActualUseOptions.find(i => String(i.id) === inputs.new_actual_use);
                selectedActualUse = au?.code; 
            } else if (faasData?.property_kind === 'Machinery') {
                const au = machineryActualUseOption.find(i => String(i.id) === inputs.new_actual_use);
                selectedActualUse = au?.code; 
            }

            const payload = {
                faas_id: faasId,
                ...inputs,
                new_actual_use: selectedActualUse, // Send Label/Code
                new_classification: selectedClassification,
                new_subclassification: selectedSubClass,
                
                // Calculated values to save
                new_market_value: computed.finalMV,
                new_assessed_value: computed.finalAV,
                new_assessment_level: computed.usedAL
            };
            
            await api.post('faas/reclassify', payload);
            setSubmissionSuccessful(true);
            setRefresh((prev: any) => !prev);
        } catch (e: any) {
            console.error(e)
            setError(e.response?.data?.message || e.message || "Reclassification failed.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSubmissionSuccessful(false);
    };

    const getIcon = () => {
        if (faasData?.property_kind === 'Land') return <Map className="text-emerald-600 w-6 h-6 mr-2" />;
        if (faasData?.property_kind === 'Building') return <Building className="text-blue-600 w-6 h-6 mr-2" />;
        return <Settings className="text-amber-600 w-6 h-6 mr-2" />;
    };

    // If faasId or showDialog are not provided correctly or running in standalone mode
    if (!showDialog) return ;

    if (submissionSuccessful) return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full">
                <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold text-slate-800">Success!</h2>
                <p className="text-slate-600 text-center mt-2 mb-6">Property reclassified successfully.</p>
                <button onClick={handleClose} className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold">Close</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                    <div className="flex items-center">
                        {getIcon()}
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Reclassify {faasData?.property_kind || 'Property'}</h2>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                {faasData?.faas_no ? `${faasData.faas_no} • ${faasData.owner_name}` : 'Loading details...'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
                            <p>Loading FAAS data...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* LEFT: INPUTS (Col 5) */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">New Parameters</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Reclassification Date</label>
                                            <input type="date" name="reclassification_date" value={inputs.reclassification_date} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                                        </div>

                                        {/* COMMON: ACTUAL USE - USING SEARCHABLE SELECT */}
                                        <div>
                                            <SearchableSelect
                                                label="New Actual Use"
                                                value={inputs.new_actual_use}
                                                onChange={(val) => handleSelectChange('new_actual_use', val)}
                                                options={
                                                    faasData?.property_kind === 'Land' 
                                                        ? actualUseOptions.map(opt => ({ id: opt.id, name: `${opt.code} - ${opt.label}` }))
                                                        : faasData?.property_kind === 'Building'
                                                            ? buildingActualUseOptions.map(opt => ({ id: opt.id, name: `${opt.code} - ${opt.label}` }))
                                                            : machineryActualUseOption.map(opt => ({ id: opt.id, name: `${opt.code} - ${opt.label}` }))
                                                }
                                            />
                                        </div>

                                        {/* --- DYNAMIC DROPDOWNS BASED ON KIND --- */}
                                        
                                        {/* LAND: Class/Subclass */}
                                        {faasData?.property_kind === 'Land' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <SearchableSelect
                                                        label="New Class"
                                                        value={inputs.new_classification}
                                                        onChange={(val) => handleSelectChange('new_classification', val)}
                                                        options={classOptions.map(opt => ({ id: opt.id, name: `${opt.code} - ${opt.label}` }))}
                                                    />
                                                </div>
                                                <div>
                                                    <SearchableSelect
                                                        label="New Subclass"
                                                        value={inputs.new_subclassification}
                                                        onChange={(val) => handleSelectChange('new_subclassification', val)}
                                                        // Pass the loading state here!
                                                        isLoading={subclassLoading}
                                                        disabled={!inputs.new_classification}
                                                        options={subclassOptions.map(opt => ({ id: opt.id, name: `${opt.label}` }))}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* BUILDING: Kind/StructType */}
                                        {faasData?.property_kind === 'Building' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <SearchableSelect
                                                        label="New Building Kind"
                                                        value={inputs.new_building_kind}
                                                        onChange={(val) => handleSelectChange('new_building_kind', val)}
                                                        options={bldgKindOptions.map(opt => ({ id: opt.id, name: opt.label }))}
                                                    />
                                                </div>
                                                <div>
                                                    <SearchableSelect
                                                        label="New Structural Type"
                                                        value={inputs.new_structural_type}
                                                        onChange={(val) => handleSelectChange('new_structural_type', val)}
                                                        options={structTypeOptions.map(opt => ({ id: opt.id, name: opt.label }))}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* MACHINERY: Type */}
                                        {faasData?.property_kind === 'Machinery' && (
                                            <div>
                                                <SearchableSelect
                                                    label="New Machinery Type"
                                                    value={inputs.new_machinery_type}
                                                    onChange={(val) => handleSelectChange('new_machinery_type', val)}
                                                    options={machTypeOptions.map(opt => ({ id: opt.id, name: opt.label }))}
                                                />
                                            </div>
                                        )}

                                        {/* UNIT VALUE / COST (Auto-Populated via SMV) */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                                                <span>
                                                    {faasData?.property_kind === 'Building' ? 'New Unit Cost' : 
                                                    faasData?.property_kind === 'Machinery' ? 'New Original Cost' : 'New Unit Value'}
                                                </span>
                                                {smvLoading && <span className="text-emerald-600 italic font-normal text-[10px] animate-pulse flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Fetching...</span>}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400">₱</span>
                                                <input 
                                                    type="number" 
                                                    name="new_unit_value" 
                                                    value={inputs.new_unit_value} 
                                                    onChange={handleInputChange} 
                                                    className="w-full border border-slate-300 rounded-lg pl-7 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                                                    placeholder={formatCurrency(computed?.usedUV || 0).replace('₱','')}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 italic">
                                                {faasData?.property_kind === 'Land' ? 'Based on LGU Schedule + Subclass' : 
                                                faasData?.property_kind === 'Building' ? 'Based on Bldg Kind + Structural Type' : 
                                                'Based on Machinery Type'}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Assessment Level (%)</label>
                                            <input type="number" name="new_assessment_level" value={inputs.new_assessment_level} readOnly className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2.5 text-sm text-slate-500 cursor-not-allowed font-mono" placeholder={String(computed?.usedAL || 0)} />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                                            <textarea name="remarks" value={inputs.remarks} onChange={handleInputChange} rows={3} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Reason for reclassification..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: PREVIEW (Col 7) */}
                            <div className="lg:col-span-7">
                                <div className="bg-white border border-slate-200 rounded-xl p-6 h-full flex flex-col shadow-sm">
                                    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                                        <Calculator className="w-5 h-5 text-emerald-600 mr-2" />
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Valuation Preview</h3>
                                    </div>

                                    {computed ? (
                                        <div className="flex-1 space-y-6">
                                            
                                            {/* --- 1. LAND PREVIEW --- */}
                                            {computed.kind === 'Land' && landDetails && (
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                                                        <span className="text-slate-600">Base Market Value <span className="text-xs text-slate-400">({computed.area} sqm × {formatCurrency(computed.usedUV)})</span></span>
                                                        <span className="font-mono font-medium text-slate-800">{formatCurrency(computed.baseMV)}</span>
                                                    </div>
                                                    
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Adjustments (Sum)</p>
                                                        {landDetails.adjustments.map((adj, i) => (
                                                            <div key={`adj-${i}`} className="flex justify-between items-center text-xs text-slate-600 mb-1 pl-2 border-l-2 border-emerald-200">
                                                                <span>{adj.factor}</span>
                                                                <span className="font-mono">{adj.adjustment}%</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 font-semibold text-xs text-slate-800">
                                                            <span>Total Adjustment</span>
                                                            <span className="text-emerald-600">+{computed.totalAdjPercent}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center py-1 pl-4 border-b border-slate-100 border-dashed">
                                                        <span className="text-slate-500 text-xs">Adjustment Amount</span>
                                                        <span className="text-emerald-600 font-mono font-medium text-xs">+{formatCurrency(computed.adjValue)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-1 pl-4">
                                                        <span className="text-slate-500 text-xs">Improvements</span>
                                                        <span className="text-amber-600 font-mono font-medium text-xs">+{formatCurrency(computed.impValue)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- 2. BUILDING PREVIEW --- */}
                                            {computed.kind === 'Building' && buildingDetails && (
                                                <div className="space-y-2 text-sm">
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Floors Breakdown</p>
                                                        {buildingDetails.floors.map((f, i) => (
                                                            <div key={i} className="flex justify-between text-xs text-slate-600 mb-1">
                                                                <span>Floor {f.floor_no}</span>
                                                                <span className="font-mono">{f.floor_area} sqm</span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between text-xs font-bold text-slate-800">
                                                            <span>Total Area</span>
                                                            <span>{computed.totalFloorArea} sqm</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                                                        <span className="text-slate-600">Base Market Value <span className="text-xs text-slate-400">({computed.totalFloorArea} sqm × {formatCurrency(computed.usedUV)})</span></span>
                                                        <span className="font-mono font-medium text-slate-800">{formatCurrency(computed.baseMV)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-1 pl-4">
                                                        <span className="text-slate-600 text-sm">Additional Items</span>
                                                        <span className="font-mono text-emerald-600">+{formatCurrency(computed.additionalsValue)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-1 pl-4 border-b border-slate-100 border-dashed text-red-500">
                                                        <span className="text-sm">Depreciation ({computed.depRate}%)</span>
                                                        <span className="font-mono">-{formatCurrency(computed.depValue)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- 3. MACHINERY PREVIEW --- */}
                                            {computed.kind === 'Machinery' && machineryDetails && (
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                                                        <span className="text-slate-600">Original Cost</span>
                                                        <span className="font-mono font-medium text-slate-800">{formatCurrency(computed.usedUV)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-1 pl-4 text-xs text-slate-500">
                                                        <span>Conversion Factor</span>
                                                        <span className="font-mono">x {computed.convFactor}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 pl-4 font-bold bg-slate-50 rounded px-2">
                                                        <span className="text-slate-700">RCN (Replacement Cost New)</span>
                                                        <span className="font-mono text-slate-900">{formatCurrency(computed.rcn as number)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-1 pl-4 text-red-500">
                                                        <span>Depreciation ({formatPercent((computed.impliedDepRate as number) * 100)})</span>
                                                        <span className="font-mono">-{formatCurrency(computed.depValue)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- SUMMARY TOTALS --- */}
                                            <div className="mt-8 pt-6 border-t border-slate-200">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">New Market Value</span>
                                                    <div className="text-right">
                                                        <span className="block text-xs text-slate-400 line-through mr-1 decoration-slate-300">{formatCurrency(computed.currentMV)}</span>
                                                        <span className="text-xl font-bold text-slate-800">{formatCurrency(computed.finalMV)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-sm text-slate-500">Assessment Level</span>
                                                    <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{formatPercent(computed.usedAL)}</span>
                                                </div>

                                                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl p-5 text-white shadow-lg flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                                                    <div>
                                                        <span className="block text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1">New Assessed Value</span>
                                                        <span className="text-xs text-emerald-200 line-through opacity-75">{formatCurrency(computed.currentAV)}</span>
                                                    </div>
                                                    <span className="text-2xl font-extrabold tracking-tight font-mono">{formatCurrency(computed.finalAV)}</span>
                                                </div>
                                                
                                                <div className="mt-4 flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                    <Info className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-amber-800 leading-snug">
                                                        Confirming this will create a new FAAS revision. The current record (FAAS-{faasData?.faas_id}) will be archived.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                            <Calculator size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">Calculating valuation...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end space-x-3 rounded-b-2xl">
                    <button onClick={handleClose} disabled={submitLoading} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitLoading || !computed} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition flex items-center disabled:opacity-70 disabled:cursor-not-allowed">
                        {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm Reclassification
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FAASReclassificationDialog;