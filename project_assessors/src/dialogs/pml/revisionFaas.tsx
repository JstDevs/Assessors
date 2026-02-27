import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
    Landmark, 
    Save, 
    X, 
    Loader2, 
    ClipboardList, 
    LandPlot, 
    Building as BuildingIcon, 
    Factory, 
    Trash2, 
    History, 
    Calculator, 
    Plus, 
    UserPlus, 
    Users, 
    AlertCircle, 
    Search, 
    ChevronDown, 
    Check 
} from 'lucide-react';

// Commented out to prevent compilation errors in this preview environment.
import api from '../../../axiosBase';
// const api: any = { get: async () => ({ data: { data: [] } }), post: async () => ({ data: {} }), put: async () => ({ data: {} }) };

type PropertyKind = 'Land' | 'Building' | 'Machinery';
type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
type MachineryCondition = 'NEW' | 'SECOND_HAND';

// --- Interfaces ---

interface OwnerOption {
    owner_id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    address_house_no?: string;
    contact_no?: string;
    tin_no?: string;
}

interface LandImprovementOption {
    value_id: number;
    item_id: number;
    improvement_name: string;
    unit_value: number;
}

interface BuildingItemOption {
    value_id: number;
    item_id: number;
    item_name: string;
    unit_value: number;
}

interface LandImprovement {
    id: number;
    improvement_name: string;
    item_id?: number;
    value_id?: number;
    quantity: number;
    unit_value: number;
    base_market_value: number;
    remarks: string;
}

interface AdjustmentFactor {
    id: number;
    factor_name: string;
    percent_adjustment: number;
    remarks: string;
}

interface BuildingFloorArea {
    floor_no: number;
    floor_area: number | '';
}

interface BuildingStructuralMaterial {
    id: number;
    part: 'ROOF' | 'FLOORING' | 'WALLS_PARTITIONS' | '';
    floor_no: number | '';
    material: string;
}

interface BuildingAdditionalItem {
    id: number;
    item_id?: number;
    item_name?: string;
    quantity: number | '';
    unit_cost: number | '';
    total_cost: number;
}

interface MasterData {
    arp_no: string;
    pin: string;
    lg_code: string;
    barangay: string;
    lot_no: string;
    block_no: string;
    property_kind: PropertyKind;
    description: string;
    status: PropertyStatus;
}

interface LandSpecificData {
    pc_code: string;
    au_code: string;
    psc_code: string;
    lot_area: number | '';
    remarks: string;
}

interface BuildingSpecificData {
    bk_id: string;
    st_id: string;
    bau_id: string;
    no_of_storeys: number | '';
    year_constructed: number | '';
    depreciation_rate: number | '';
    additional_adj_factor: number | '';
    remarks: string;
    floor_areas: BuildingFloorArea[];
    structural_materials: BuildingStructuralMaterial[];
    additional_items: BuildingAdditionalItem[];
}

interface MachinerySpecificData {
    mt_id: string;
    mau_id: string;
    brand_model: string;
    capacity_hp: string;
    date_acquired: string;
    condition: MachineryCondition;
    economic_life: number | '';
    remaining_life: number;
    year_installed: number | '';
    year_initial_operation: number | '';
    original_cost: number | '';
    conversion_factor: number | '';
    rcn: number;
    years_used: number;
    depreciation_rate: number;
    total_depreciation_value: number;
    depreciated_value: number;
    remarks: string;
}

interface FAASRevisionDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    faasId: number; // Mandatory for revision
}

const BSM_PARTS = ['ROOF', 'FLOORING', 'WALLS_PARTITIONS'];
const CONDITION_ENUM_MACHINERY: MachineryCondition[] = ['NEW', 'SECOND_HAND'];

const initialMasterData: MasterData = {
    arp_no: '',
    pin: '',
    lg_code: '',
    barangay: '',
    lot_no: '',
    block_no: '',
    property_kind: 'Land',
    description: '',
    status: 'ACTIVE',
};

const initialLandData: LandSpecificData = {
    pc_code: '',
    psc_code: '',
    au_code: '',
    lot_area: '',
    remarks: '',
};

const initialBuildingData: BuildingSpecificData = {
    bk_id: '',
    st_id: '',
    bau_id: '',
    no_of_storeys: 1,
    year_constructed: '',
    depreciation_rate: 0.00,
    additional_adj_factor: 1.0000,
    remarks: '',
    floor_areas: [{ floor_no: 1, floor_area: '' }],
    structural_materials: [],
    additional_items: [],
};

const initialMachineryData: MachinerySpecificData = {
    mt_id: '',
    mau_id: '',
    brand_model: '',
    capacity_hp: '',
    date_acquired: '',
    condition: 'NEW',
    economic_life: 10,
    remaining_life: 10,
    year_installed: '',
    year_initial_operation: new Date().getFullYear(),
    original_cost: 0.00,
    conversion_factor: 1.00,
    rcn: 0.00,
    years_used: 0,
    depreciation_rate: 0.00,
    total_depreciation_value: 0.00,
    depreciated_value: 0.00,
    remarks: '',
};

// --- Helpers ---

const parseNumericValue = (value: string): string | number => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '' : numValue;
};

const extractCode = (str: string | undefined | null) => {
    if (!str) return '';
    const match = str.match(/\(([^)]+)\)$/); 
    return match ? match[1] : str; 
};

const getSafeDateValue = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string' && val.length === 10 && val.includes('-')) return val;
    const date = new Date(val);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-CA');
};

const calculateMachineryValues = (data: MachinerySpecificData): MachinerySpecificData => {
    const today = new Date().getFullYear();
    const economicLife = (data.economic_life as number) || 0;
    const yearInitialOperation = (data.year_initial_operation as number) || today;
    
    let yearsUsed = 0;
    if (economicLife > 0 && yearInitialOperation > 0) {
        yearsUsed = Math.max(0, today - yearInitialOperation);
    }
    
    const remainingLife = Math.max(0, economicLife - yearsUsed);

    return {
        ...data,
        years_used: yearsUsed,
        remaining_life: remainingLife,
    };
};

// --- Reusable UI Components ---

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

    const selectedOption = options.find(o => String(o.value) === String(value));
    const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);
    
    const filtered = options.filter(o => 
        o.label.toString().toLowerCase().includes(search.toLowerCase())
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
                    w-full border rounded-lg px-3 py-2 text-sm flex items-center justify-between cursor-pointer bg-white transition-all
                    ${isOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
                `}
            >
                <span className={`truncate ${!value && !selectedOption ? "text-slate-400" : "text-slate-800"}`}>
                    {displayLabel}
                </span>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400 flex-shrink-0" />
                ) : (
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
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
                                        px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50 flex items-center justify-between
                                        ${String(opt.value) === String(value) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'}
                                    `}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {String(opt.value) === String(value) && <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const YearSelect: React.FC<any> = ({ label, name, value, onChange, required = false, isFullWidth = false, readOnly = false, startYear = 1950, endYear = new Date().getFullYear() + 5 }) => {
    const years = useMemo(() => {
        const yearArray = [];
        for (let i = endYear; i >= startYear; i--) yearArray.push(i);
        return yearArray;
    }, [startYear, endYear]);

    return (
        <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <SearchableSelect
                options={years.map(y => ({ label: String(y), value: y }))}
                value={value}
                onChange={(val) => onChange({ target: { name, value: val } } as any, val)}
                disabled={readOnly}
                placeholder="Select Year"
            />
        </div>
    );
};

const DatePickerField: React.FC<any> = ({ label, name, value, onChange, required = false, isFullWidth = false, readOnly = false, min = undefined, max = undefined }) => (
    <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type="date"
            name={name}
            value={getSafeDateValue(value)}
            onChange={(e) => onChange(e, e.target.value)}
            required={required}
            readOnly={readOnly}
            min={min}
            max={max}
            className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500 placeholder:text-slate-400
            ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'} [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
        />
    </div>
);

const InputField: React.FC<any> = ({ label, name, value, onChange, type = 'text', required = false, isFullWidth = false, readOnly = false, min = undefined, step = undefined, placeholder = '' }) => (
    <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value === undefined || value === null ? '' : value}
            onChange={(e) => {
                const val = type === 'number' ? parseNumericValue(e.target.value) : e.target.value;
                onChange(e, val);
            }}
            required={required}
            readOnly={readOnly}
            min={min}
            step={step}
            placeholder={placeholder}
            className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500 placeholder:text-slate-400
            ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
        />
    </div>
);

const SelectField: React.FC<any> = ({ label, name, value, values, onChange, options, required = false, readOnly = false, isFullWidth = false }) => {
    const mappedOptions = options.map((opt: string, index: number) => ({
        label: opt,
        value: values ? values[index] : opt
    }));

    return (
        <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <SearchableSelect
                options={mappedOptions}
                value={value}
                onChange={(val) => {
                    onChange({ target: { name, value: val } } as any, val);
                }}
                disabled={readOnly || options.length === 0}
                placeholder={options.length === 0 ? `Loading...` : `Select ${label.replace('*', '').trim()}`}
            />
        </div>
    );
};

const TextAreaField: React.FC<any> = ({ label, name, value, onChange, required = false, readOnly = false, isFullWidth = false }) => (
    <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            rows={2}
            readOnly={readOnly}
            className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500
            ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
        />
    </div>
);

// --- Sub-Form Components ---

const BuildingFloorAreaInput: React.FC<{ floor: BuildingFloorArea; onChange: (floorNo: number, value: number) => void; }> = ({ floor, onChange }) => (
    <InputField key={`floor-${floor.floor_no}`} label={`Area - Floor ${floor.floor_no}`} name={`floor_area_${floor.floor_no}`} value={floor.floor_area} onChange={(_e: any, val: number) => onChange(floor.floor_no, val)} type="number" min="0.01" step="0.01" required />
);

const BuildingStructuralMaterialForm: React.FC<any> = ({ bsm, floorCount, onChange, onRemove }) => (
    <div key={bsm.id} className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm mb-3">
        <div className="col-span-4"><SelectField label="Part" name="part" value={bsm.part} onChange={(_e: any) => onChange(bsm.id, 'part', _e.target.value)} options={BSM_PARTS} required /></div>
        <div className="col-span-3"><SelectField label="Floor (Opt)" name="floor_no" value={bsm.floor_no} onChange={(_e: any) => onChange(bsm.id, 'floor_no', _e.target.value)} options={Array.from({ length: floorCount }, (_, i) => (i + 1).toString())} /></div>
        <div className="col-span-4"><InputField label="Material" name="material" value={bsm.material} onChange={(_e: any, val: string) => onChange(bsm.id, 'material', val)} required /></div>
        <div className="col-span-1 flex justify-end"><button type="button" onClick={() => onRemove(bsm.id)} className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition self-end"><Trash2 className="w-5 h-5" /></button></div>
    </div>
);

const BuildingAdditionalItemForm: React.FC<any> = ({ bai, onChange, onRemove, options }) => (
    <div key={bai.id} className="grid grid-cols-12 gap-3 items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm mb-3">
        <div className="col-span-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Item Name <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
                options={options.map((opt: any) => ({ label: opt.item_name, value: opt.item_name }))}
                value={bai.item_name}
                onChange={(val) => onChange(bai.id, 'item_name', val)}
                placeholder="Select Item"
            />
        </div>
        <div className="col-span-2">
            <InputField label="Qty" name="quantity" value={bai.quantity} onChange={(_e: any, val: number) => onChange(bai.id, 'quantity', val)} type="number" min="1" step="1" required />
        </div>
        <div className="col-span-3">
            <InputField label="Unit Cost" name="unit_cost" value={bai.unit_cost} onChange={(_e: any, val: number) => onChange(bai.id, 'unit_cost', val)} type="number" min="0" step="0.01" required />
        </div>
        <div className="col-span-1 flex justify-end items-end pb-1">
            <button type="button" onClick={() => onRemove(bai.id)} className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition"><Trash2 className="w-5 h-5" /></button>
        </div>
    </div>
);

// --- Main Revision Component ---

export const FAASRevisionDialog: React.FC<FAASRevisionDialogProps> = ({
    showDialog,
    setShowDialog,
    setRefresh,
    faasId,
}) => {
    // Dropdown Options States
    const [LG_OPTIONS, setLG_OPTIONS] = useState<{id: number, code: string}[]>([]); 
    const [LG_CODES, setLG_CODES] = useState<string[]>([]);
    const [BARANGAY_CODES, setBARANGAY_CODES] = useState<string[]>([]);
    
    const [PC_CODES, setPC_CODES] = useState<string[]>([]);
    const [PC_NAMES, setPC_NAMES] = useState<string[]>([]);
    const [LAND_PSC_CODES, setLAND_PSC_CODES] = useState<string[]>([]);
    const [LAND_PSC_IDS, setLAND_PSC_IDS] = useState<{[key: string]: number}>({}); 
    
    const [LAND_AU_OPTIONS, setLAND_AU_OPTIONS] = useState<any[]>([]); 
    const [LAND_AU_CODES, setLAND_AU_CODES] = useState<string[]>([]);
    
    const [BK_CODES, setBK_CODES] = useState<string[]>([]);
    const [BK_VALUES, setBK_VALUES] = useState<number[]>([]);
    const [STRUCTURAL_TYPES, setSTRUCTURAL_TYPES] = useState<string[]>([]);
    const [STRUCTURAL_VALUES, setSTRUCTURAL_VALUES] = useState<number[]>([]);
    
    const [BUILDING_AU_OPTIONS, setBUILDING_AU_OPTIONS] = useState<any[]>([]);
    const [BUILDING_AU_CODES_LIST, setBUILDING_AU_CODES_LIST] = useState<string[]>([]);
    const [BUILDING_AU_VALUES, setBUILDING_AU_VALUES] = useState<string[]>([]);

    const [MT_CODES, setMT_CODES] = useState([]);
    const [MT_VALUES, setMT_VALUES] = useState([]);
    
    const [MAU_OPTIONS, setMAU_OPTIONS] = useState<any[]>([]);
    const [MAU_CODES, setMAU_CODES] = useState([]);
    const [MAU_VALUES, setMAU_VALUES] = useState([]); 
    
    const [revisionYears, setRevisionYears] = useState<any[]>([]);

    // Owner Management States
    const [availableOwners, setAvailableOwners] = useState<OwnerOption[]>([]);
    const [selectedOwners, setSelectedOwners] = useState<OwnerOption[]>([]);
    const [selectedOwnerToAdd, setSelectedOwnerToAdd] = useState<string>(''); 

    // Land Improvement & Building Additionals Options
    const [landImprovementOptions, setLandImprovementOptions] = useState<LandImprovementOption[]>([]);
    const [buildingItemOptions, setBuildingItemOptions] = useState<BuildingItemOption[]>([]);

    const [selectedLGCode, setSelectedLGCode] = useState('');
    const [selectedPCCode, setSelectedPCCode] = useState('');

    // Property Data States
    const [masterData, setMasterData] = useState<MasterData>(initialMasterData);
    const [landData, setLandData] = useState<LandSpecificData>(initialLandData);
    const [buildingData, setBuildingData] = useState<BuildingSpecificData>(initialBuildingData);
    const [machineryData, setMachineryData] = useState<MachinerySpecificData>(initialMachineryData);
    const [improvements, setImprovements] = useState<LandImprovement[]>([]);
    const [adjustmentFactors, setAdjustmentFactors] = useState<AdjustmentFactor[]>([]);

    // FAAS Specifics
    const [faasDataState, setFaasDataState] = useState({
        ry_id: '',
        effectivity_date: new Date().toISOString().split('T')[0],
        unit_value: 0,
        area: 0,
        taxable: 1,
        approved_by: '',
        depreciation_rate: 0,
        remarks: '',
        lg_code: '' 
    });
    const [assessmentLevel, setAssessmentLevel] = useState<number>(0);

    // Transaction States
    const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split('T')[0]);
    const [revisionRemarks, setRevisionRemarks] = useState('');

    // UI States
    const [submitLoading, setSubmitLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [smvLoading, setSmvLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);

    const [nextLandImprovementId, setNextLandImprovementId] = useState(1);
    const [nextAdjustmentId, setNextAdjustmentId] = useState(1);
    const [nextBSMId, setNextBSMId] = useState(1);
    const [nextBAIId, setNextBAIId] = useState(1);

    // Load existing FAAS data
    useEffect(() => {
        const loadPropertyData = async () => {
            if (faasId && showDialog) {
                setLoadingData(true);
                try {
                    const response = await api.get(`faas/${faasId}`);
                    const data = response.data;
                    const faas = data.faas;

                    // 1. Map Master Data
                    setMasterData({
                        arp_no: faas.faas_no,
                        pin: faas.pin || '',
                        lg_code: faas.lg_code || '',
                        barangay: faas.barangay || '',
                        lot_no: faas.lot_no || '',
                        block_no: faas.block_no || '',
                        property_kind: faas.property_kind,
                        description: faas.description || '',
                        status: faas.status,
                    });
                    setSelectedLGCode(faas.lg_code);

                    if (data.owners && Array.isArray(data.owners)) {
                        setSelectedOwners([...data.owners]);
                    }

                    // 2. Initialize Variables
                    let initUnitVal = 0;
                    let initArea = 0;
                    let initAssLevel = 0;
                    let initDeprRate = 0;

                    // 3. Map Specific Data
                    if (faas.property_kind === 'Land' && data.land) {
                        const app = data.land.appraisal;
                        const ass = data.land.assessment;
                        
                        initUnitVal = parseFloat(app.unit_value || '0');
                        initArea = parseFloat(app.area || '0');
                        initAssLevel = parseFloat(ass.assessment_level || '0');

                        const pcCode = extractCode(app.classification);
                        setLandData({
                            pc_code: pcCode,
                            au_code: extractCode(ass.actual_use),
                            psc_code: extractCode(app.subclassification),
                            lot_area: initArea,
                            remarks: '', 
                        });
                        setSelectedPCCode(pcCode);

                        if (data.land.improvements && Array.isArray(data.land.improvements)) {
                            const loadedImprovements = data.land.improvements.map((imp: any, idx: number) => ({
                                id: idx + 1,
                                improvement_name: imp.improvement_name,
                                quantity: parseFloat(imp.qty),
                                unit_value: parseFloat(imp.unit_value),
                                base_market_value: parseFloat(imp.qty) * parseFloat(imp.unit_value),
                                remarks: ''
                            }));
                            setImprovements(loadedImprovements);
                            setNextLandImprovementId(loadedImprovements.length + 1);
                        }

                        if (data.land.adjustments && Array.isArray(data.land.adjustments)) {
                             const loadedAdj = data.land.adjustments.map((adj: any, idx: number) => ({
                                id: idx + 1,
                                factor_name: adj.factor,
                                percent_adjustment: parseFloat(adj.adjustment || '0'),
                                remarks: ''
                             }));
                             setAdjustmentFactors(loadedAdj);
                             setNextAdjustmentId(loadedAdj.length + 1);
                        }

                    } else if (faas.property_kind === 'Building' && data.building) {
                        const gen = data.building.general;
                        const app = data.building.appraisal;
                        const ass = data.building.assessment;
                        
                        initUnitVal = parseFloat(app.unit_cost || '0');
                        initDeprRate = parseFloat(app.deprication_rate || app.depreciation_rate || '0');
                        initAssLevel = parseFloat(ass.assessment_level || '0');

                        const floorAreas = data.building.floors?.map((f: any) => ({
                            floor_no: f.floor_no,
                            floor_area: parseFloat(f.floor_area)
                        })) || [];
                        
                        initArea = floorAreas.reduce((sum: number, f: any) => sum + f.floor_area, 0);

                        const structuralMaterials = data.building.materials?.map((m: any, idx: number) => ({
                            id: idx + 1,
                            part: m.part,
                            floor_no: m.floor_no,
                            material: m.material
                        })) || [];

                        const additionalItems = data.building.additionals?.map((a: any, idx: number) => ({
                            id: idx + 1,
                            item_name: a.item_name,
                            quantity: parseFloat(a.quantity),
                            unit_cost: parseFloat(a.unit_cost),
                            total_cost: parseFloat(a.total_cost)
                        })) || [];

                        const bau_id = await api.get(`p/bauID/${extractCode(ass.actual_use)}`);
                        const st_id = await api.get(`p/stID/${extractCode(gen.structuralType)}`);
                        const bk_id = await api.get(`p/bkID/${extractCode(gen.buildingKind)}`);

                        setBuildingData({
                            bk_id: bk_id.data,
                            st_id: st_id.data,
                            bau_id: bau_id.data,
                            no_of_storeys: gen.storeys,
                            year_constructed: gen.buildingAge,
                            depreciation_rate: initDeprRate,
                            additional_adj_factor: 1.0,
                            remarks: '',
                            floor_areas: floorAreas,
                            structural_materials: structuralMaterials,
                            additional_items: additionalItems
                        });
                        setNextBSMId(structuralMaterials.length + 1);
                        setNextBAIId(additionalItems.length + 1);

                    } else if (faas.property_kind === 'Machinery' && data.machinery) {
                        const app = data.machinery.appraisal;
                        const ass = data.machinery.assessment;
                        
                        initUnitVal = parseFloat(app.original_cost || '0');
                        initArea = 1; 
                        initAssLevel = parseFloat(ass.assessment_level || '0');
                        initDeprRate = parseFloat(app.depreciation_rate || '0');

                        const mau_id = await api.get(`p/mauID/${extractCode(ass.actual_use)}`);

                        setMachineryData({
                            ...initialMachineryData,
                            mt_id: extractCode(app.machinery_type) || app.machinery_type,
                            mau_id: mau_id.data,
                            brand_model: app.brand_model,
                            capacity_hp: app.capacity_hp,
                            date_acquired: app.date_acquired ? app.date_acquired.split('T')[0] : '',
                            condition: app.machinery_condition,
                            economic_life: parseFloat(app.estimated_life || '0'),
                            remaining_life: parseFloat(app.remaining_life || '0'),
                            year_installed: app.year_installed || '',
                            year_initial_operation: parseFloat(app.initial_operation || '0'),
                            original_cost: initUnitVal,
                            conversion_factor: parseFloat(app.conversion_factor || '1'),
                            rcn: parseFloat(app.rcn || '0'),
                            depreciation_rate: initDeprRate,
                            total_depreciation_value: parseFloat(app.depreciation_value || '0'),
                            depreciated_value: parseFloat(app.rcn || '0') - parseFloat(app.depreciation_value || '0'),
                            remarks: ''
                        });
                    }

                    setFaasDataState({
                        ry_id: faas.ry_id?.toString() || '',
                        effectivity_date: faas.effectivity_date ? faas.effectivity_date.split('T')[0] : new Date().toISOString().split('T')[0],
                        unit_value: initUnitVal,
                        area: initArea,
                        taxable: faas.taxable,
                        approved_by: '',
                        depreciation_rate: initDeprRate,
                        remarks: '',
                        lg_code: faas.lg_code || ''
                    });
                    setAssessmentLevel(initAssLevel);

                } catch (error) {
                    console.error('Error loading FAAS data:', error);
                    setSubmitError('Failed to load current FAAS data');
                } finally {
                    setLoadingData(false);
                }
            }
        };

        loadPropertyData();
    }, [faasId, showDialog]);

    // Initial Lookups
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [lgRes, pcRes, auRes, bkRes, stRes, bauRes, mtRes, mauRes, ownersRes, landImpRes, baiRes, ryRes] = await Promise.all([
                    api.get('lvg/list'),
                    api.get('p/plist'),
                    api.get('p/augetlist'),
                    api.get('p/bklist'),
                    api.get('p/stlist'),
                    api.get('p/baulist'),
                    api.get('p/mtlist'),
                    api.get('p/maulist'),
                    api.get('ol/'),
                    api.get('loi/uv/'), 
                    api.get('bai/uv/'),
                    api.get('ry/list')
                ]);

                setLG_OPTIONS(lgRes.data.data.map((item: any) => ({ id: item.lg_id, code: item.code })));
                setLG_CODES(lgRes.data.data.map((item: any) => item.code));

                setPC_CODES(pcRes.data.map((item: any) => item.code));
                setPC_NAMES(pcRes.data.map((item: any) => item.classname));

                setLAND_AU_OPTIONS(auRes.data);
                setLAND_AU_CODES(auRes.data.map((item: any) => item.code));

                setBK_CODES(bkRes.data.data.map((item: any) => item.code));
                setBK_VALUES(bkRes.data.data.map((item: any) => item.bk_id));

                setSTRUCTURAL_TYPES(stRes.data.data.map((item: any) => item.code));
                setSTRUCTURAL_VALUES(stRes.data.data.map((item: any) => item.st_id));

                setBUILDING_AU_OPTIONS(bauRes.data.data);
                setBUILDING_AU_CODES_LIST(bauRes.data.data.map((item: any) => item.code));
                setBUILDING_AU_VALUES(bauRes.data.data.map((item: any) => item.bau_id));

                setMT_CODES(mtRes.data.data.map((item: any) => item.code));
                setMT_VALUES(mtRes.data.data.map((item: any) => item.mt_id));

                setMAU_OPTIONS(mauRes.data.data);
                setMAU_CODES(mauRes.data.data.map((item: any) => item.code));
                setMAU_VALUES(mauRes.data.data.map((item: any) => item.mau_id));

                const ownersList = ownersRes.data.data || ownersRes.data;
                if(Array.isArray(ownersList)) setAvailableOwners(ownersList);
                
                const landImps = landImpRes.data.data || landImpRes.data;
                if(Array.isArray(landImps)) setLandImprovementOptions(landImps);

                const baiItems = baiRes.data.data || baiRes.data;
                if(Array.isArray(baiItems)) setBuildingItemOptions(baiItems);

                const ryList = ryRes.data.data || ryRes.data;
                if(Array.isArray(ryList)) setRevisionYears(ryList);

            } catch (error) {
                console.error("Error fetching initial lookup data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // --- AUTO UPDATE LOADED ITEMS WITH LATEST UNIT VALUES ---
    
    // For Land Improvements
    useEffect(() => {
        if (landImprovementOptions.length > 0 && improvements.length > 0) {
            setImprovements(prev => {
                let hasChanges = false;
                const updated = prev.map(imp => {
                    const matchedOpt = landImprovementOptions.find(opt => opt.improvement_name === imp.improvement_name);
                    // If matched and the unit value differs, update it with the latest reference data
                    if (matchedOpt && matchedOpt.unit_value !== imp.unit_value) {
                        hasChanges = true;
                        return {
                            ...imp,
                            item_id: matchedOpt.item_id,
                            value_id: matchedOpt.value_id,
                            unit_value: matchedOpt.unit_value,
                            base_market_value: imp.quantity * matchedOpt.unit_value
                        };
                    }
                    return imp;
                });
                return hasChanges ? updated : prev;
            });
        }
    }, [landImprovementOptions]);

    // For Building Additional Items
    useEffect(() => {
        if (buildingItemOptions.length > 0 && buildingData.additional_items.length > 0) {
            setBuildingData(prev => {
                let hasChanges = false;
                const updatedItems = prev.additional_items.map(bai => {
                    const matchedOpt = buildingItemOptions.find(opt => opt.item_name === bai.item_name);
                    // If matched and the unit value differs, update it with the latest reference data
                    if (matchedOpt && matchedOpt.unit_value !== bai.unit_cost) {
                        hasChanges = true;
                        return {
                            ...bai,
                            item_id: matchedOpt.item_id,
                            unit_cost: matchedOpt.unit_value,
                            total_cost: Number(bai.quantity || 0) * matchedOpt.unit_value
                        };
                    }
                    return bai;
                });
                return hasChanges ? { ...prev, additional_items: updatedItems } : prev;
            });
        }
    }, [buildingItemOptions]);

    // Dependent Dropdowns
    useEffect(() => {
        const fetchBarangays = async () => {
            if (!selectedLGCode) { setBARANGAY_CODES([]); return; }
            try {
                const lgIdRes = await api.get('lvg/getID', { params: { code: selectedLGCode } });
                const brgyRes = await api.get('lvg/barangayList', { params: { lg_id: lgIdRes.data.lg_id } });
                setBARANGAY_CODES(brgyRes.data.map((item: any) => item.barangay_name));
            } catch (error) { console.error("Error fetching barangays:", error); }
        };
        fetchBarangays();
    }, [selectedLGCode]);

    useEffect(() => {
        const fetchSubClass = async () => {
            if (!selectedPCCode) { setLAND_PSC_CODES([]); return; }
            try {
                const pcIdRes = await api.get('p/getCID', { params: { code: selectedPCCode } });
                const pc_id = pcIdRes.data.pc_id;
                const pscRes = await api.get('p/splist', { params: { pc_id } });
                setLAND_PSC_CODES(pscRes.data.map((item: any) => item.code));
                
                const idMap: {[key: string]: number} = {};
                pscRes.data.forEach((item: any) => { idMap[item.code] = item.psc_id; });
                setLAND_PSC_IDS(idMap);
            } catch (error) { console.error("Error fetching subclasses:", error); }
        };
        fetchSubClass();
    }, [selectedPCCode]);

    // Update FAAS Area when Land Area changes
    useEffect(() => {
        if (masterData.property_kind === 'Land') {
            setFaasDataState(prev => ({ ...prev, area: Number(landData.lot_area) || 0 }));
        }
    }, [landData.lot_area, masterData.property_kind]);

    // SMV Fetch Logic
    useEffect(() => {
        const fetchSMV = async () => {
            if (!faasDataState.ry_id) return;
            const ryId = faasDataState.ry_id;
            let newUnitValue = null;
            try {
                setSmvLoading(true);
                
                if (masterData.property_kind === 'Land') {
                    const lgObj = LG_OPTIONS.find(l => l.code === faasDataState.lg_code);
                    const pscId = LAND_PSC_IDS[landData.psc_code];
                    if (lgObj && pscId) {
                        const res = await api.get('smv/landSMV', { params: { lg_id: lgObj.id, psc_id: pscId, ry_id: ryId } });
                        if (res.data?.data?.unit_value) newUnitValue = parseFloat(res.data.data.unit_value);
                    }
                } else if (masterData.property_kind === 'Building') {
                    if (buildingData.bk_id && buildingData.st_id) {
                        const res = await api.get('smv/buildingSMV', { params: { bk_id: buildingData.bk_id, st_id: buildingData.st_id, ry_id: ryId } });
                        if (res.data?.data?.unit_value) newUnitValue = parseFloat(res.data.data.unit_value);
                    }
                } else if (masterData.property_kind === 'Machinery') {
                    if (machineryData.mt_id) {
                        const res = await api.get('smv/machinerySMV', { params: { mt_id: machineryData.mt_id, ry_id: ryId } });
                        const val = res.data?.data?.original_cost || res.data?.data?.unit_value;
                        if (val) newUnitValue = parseFloat(val);
                    }
                }

                if (newUnitValue !== null) setFaasDataState(prev => ({ ...prev, unit_value: newUnitValue as number }));
            } catch (error) { console.error("SMV Fetch Error:", error); } finally { setSmvLoading(false); }
        };

        const timeoutId = setTimeout(() => fetchSMV(), 500);
        return () => clearTimeout(timeoutId);
    }, [faasDataState.ry_id, faasDataState.lg_code, landData.psc_code, buildingData.bk_id, buildingData.st_id, machineryData.mt_id, masterData.property_kind, LG_OPTIONS, LAND_PSC_IDS]);

    // Machinery Calculations
    useEffect(() => {
        const calculatedData = calculateMachineryValues(machineryData);
        if (machineryData.rcn !== calculatedData.rcn || machineryData.depreciated_value !== calculatedData.depreciated_value || machineryData.remaining_life !== calculatedData.remaining_life) {
            setMachineryData(calculatedData);
        }
    }, [machineryData.original_cost, machineryData.conversion_factor, machineryData.economic_life, machineryData.year_initial_operation]);

    // --- Valuation Calculations (useMemo) ---
    const calculations = useMemo(() => {
        const propertyKind = masterData.property_kind;
        
        if (propertyKind === 'Land') {
            const baseUnitValue = faasDataState.unit_value;
            const area = faasDataState.area;
            const baseMarketValue = baseUnitValue * area;
            
            const totalAdjustmentPercent = adjustmentFactors.reduce((sum, adj) => sum + adj.percent_adjustment, 0);
            const adjustmentFactor = 1 + (totalAdjustmentPercent / 100);
            const adjustedUnitValue = baseUnitValue * adjustmentFactor;
            const adjustedMarketValue = baseMarketValue * adjustmentFactor;
            const landMarketValue = adjustedMarketValue; 
            
            const improvementsValue = improvements.reduce((sum, imp) => sum + imp.base_market_value, 0);
            
            const totalMarketValue = landMarketValue + improvementsValue;
            const assessedValue = totalMarketValue * (assessmentLevel / 100);
            
            return {
                baseUnitValue, baseMarketValue, adjustedMarketValue, totalAdjustmentPercent, adjustmentFactor, adjustedUnitValue,
                landMarketValue, improvementsValue, totalMarketValue, assessedValue,
            };
        } else if (propertyKind === 'Building') {
            const totalFloorArea = buildingData.floor_areas?.reduce((sum, floor) => sum + parseFloat(String(floor.floor_area || '0')), 0) || 0;
            const baseMarketValue = faasDataState.unit_value * totalFloorArea; 
            const additionalItemsValue = buildingData.additional_items?.reduce((sum, item) => sum + item.total_cost, 0) || 0;
            const marketValueAdditionals = baseMarketValue + additionalItemsValue;
            
            const depreciationRate = parseFloat(String(faasDataState.depreciation_rate) || '0') / 100;
            const marketValue = marketValueAdditionals * (1 - depreciationRate);
            const depreciationValue = marketValueAdditionals - marketValue;
            
            const assessedValue = marketValue * (assessmentLevel / 100);
            
            return {
                baseUnitValue: faasDataState.unit_value, baseMarketValue, marketValueAdditionals, 
                depreciationValue, totalMarketValue: marketValue, assessedValue, 
                depreciationRate: depreciationRate * 100, totalFloorArea, 
                improvementsValue: additionalItemsValue,
                totalAdjustmentPercent: 0, adjustedMarketValue: 0 
            };
        } else if (propertyKind === 'Machinery') {
            const original = faasDataState.unit_value; 
            const rcn = original * parseFloat(String(machineryData.conversion_factor) || '1');
            const depreciationRate = parseFloat(String(faasDataState.depreciation_rate) || '0');
            const depreciatedValue = rcn * (1 - (depreciationRate / 100));
            const deprValueAmount = rcn - depreciatedValue;
            const assessedValue = depreciatedValue * (assessmentLevel / 100);
            
            return {
                baseMarketValue: original, converted: rcn, depreciationValue: deprValueAmount, depreciationRate: depreciationRate,
                totalMarketValue: depreciatedValue, assessedValue, originalCost: original, rcn: rcn,
                landMarketValue: 0, improvementsValue: 0, totalAdjustmentPercent: 0, adjustedMarketValue: 0
            };
        }
        return { baseUnitValue: 0, baseMarketValue: 0, adjustedMarketValue: 0, totalAdjustmentPercent: 0, adjustmentFactor: 1, adjustedUnitValue: 0, landMarketValue: 0, improvementsValue: 0, totalMarketValue: 0, assessedValue: 0 };
    }, [faasDataState.unit_value, faasDataState.area, faasDataState.depreciation_rate, adjustmentFactors, assessmentLevel, masterData.property_kind, improvements, buildingData, machineryData]);

    // Handlers
    const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: string | number) => {
        const { name } = e.target;
        const finalValue = value !== undefined ? value : e.target.value;
        setMasterData(prev => ({ ...prev, [name]: finalValue as any }));
        if (name === 'lg_code') {
            setSelectedLGCode(finalValue as string);
            setFaasDataState(prev => ({ ...prev, lg_code: finalValue as string }));
            setMasterData(prev => ({ ...prev, barangay: '' }));
        }
    };

    const handleFAASChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFaasDataState(prev => ({ ...prev, [name]: value }));
        if (name === 'lg_code') {
            setSelectedLGCode(value as string);
            setMasterData(prev => ({ ...prev, lg_code: value as string, barangay: '' }));
        }
    };

    const handleSpecificChange = (setter: React.Dispatch<React.SetStateAction<any>>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: string | number) => {
            const { name } = e.target;
            const finalValue = value !== undefined ? value : e.target.value;

            if (masterData.property_kind === 'Land' && name === 'pc_code') {
                setSelectedPCCode(finalValue as string);
                setter((prev: LandSpecificData) => ({ ...prev, [name]: finalValue as any, psc_code: '' }));
            } else {
                setter((prev: any) => {
                    const newState = { ...prev, [name]: finalValue as any };
                    if (masterData.property_kind === 'Machinery') return calculateMachineryValues(newState);
                    return newState;
                });
            }

            // UPDATE ASSESSMENT LEVEL on Actual Use Change
            if (name === 'au_code') { 
                const found = LAND_AU_OPTIONS.find(opt => opt.code === finalValue);
                if (found) setAssessmentLevel(parseFloat(found.assessment_level || '0'));
            } else if (name === 'bau_id') { 
                const found = BUILDING_AU_OPTIONS.find(opt => opt.code === finalValue);
                if (found) setAssessmentLevel(parseFloat(found.assessment_level || '0'));
            } else if (name === 'mau_id') { 
                const found = MAU_OPTIONS.find(opt => opt.code === finalValue);
                if (found) setAssessmentLevel(parseFloat(found.assessment_level || '0'));
            }
        };

    // Owner Handlers
    const handleAddOwner = () => {
        if (!selectedOwnerToAdd) return;
        const ownerToAdd = availableOwners.find(o => String(o.owner_id) === selectedOwnerToAdd);
        if (ownerToAdd && !selectedOwners.some(o => o.owner_id === ownerToAdd.owner_id)) {
            setSelectedOwners(prev => [...prev, ownerToAdd]);
        }
        setSelectedOwnerToAdd('');
    };

    const handleRemoveOwner = (id: number) => {
        setSelectedOwners(prev => prev.filter(o => o.owner_id !== id));
    };

    // Building Sub-handlers
    const handleFloorAreaChange = useCallback((floorNo: number, value: number) => {
        setBuildingData(prev => ({ ...prev, floor_areas: prev.floor_areas.map(fa => fa.floor_no === floorNo ? { ...fa, floor_area: value } : fa), }));
    }, []);
    
    useEffect(() => {
        if (masterData.property_kind === 'Building') {
            const total = buildingData.floor_areas.reduce((sum, f) => sum + parseFloat(String(f.floor_area || 0)), 0);
            setFaasDataState(prev => ({ ...prev, area: total }));
        }
    }, [buildingData.floor_areas, masterData.property_kind]);
    
    useEffect(() => {
        const newStoreys = parseInt(buildingData.no_of_storeys as string, 10);
        if (isNaN(newStoreys) || newStoreys < 1) return;
        if (newStoreys !== buildingData.floor_areas.length) {
            setBuildingData(prev => {
                const currentCount = prev.floor_areas.length;
                let newAreas = [...prev.floor_areas];
                if (newStoreys > currentCount) {
                    for (let i = currentCount + 1; i <= newStoreys; i++) { newAreas.push({ floor_no: i, floor_area: '' }); }
                } else if (newStoreys < currentCount) { newAreas = newAreas.slice(0, newStoreys); }
                return { ...prev, floor_areas: newAreas };
            });
        }
    }, [buildingData.no_of_storeys]);

    const handleAddBSM = useCallback(() => { setBuildingData(prev => ({ ...prev, structural_materials: [...prev.structural_materials, { id: nextBSMId, part: '', floor_no: '', material: '' }] })); setNextBSMId(prev => prev + 1); }, [nextBSMId]);
    const handleRemoveBSM = useCallback((id: number) => setBuildingData(prev => ({ ...prev, structural_materials: prev.structural_materials.filter(bsm => bsm.id !== id) })), []);
    const handleBSMChange = useCallback((id: number, name: keyof BuildingStructuralMaterial, value: string) => setBuildingData(prev => ({ ...prev, structural_materials: prev.structural_materials.map(bsm => bsm.id === id ? { ...bsm, [name]: value } : bsm) })), []);
    
    const handleAddBAI = useCallback(() => { setBuildingData(prev => ({ ...prev, additional_items: [...prev.additional_items, { id: nextBAIId, quantity: '', unit_cost: '', total_cost: 0 }] })); setNextBAIId(prev => prev + 1); }, [nextBAIId]);
    const handleRemoveBAI = useCallback((id: number) => setBuildingData(prev => ({ ...prev, additional_items: prev.additional_items.filter(bai => bai.id !== id) })), []);
    const handleBAIChange = useCallback((id: number, name: keyof BuildingAdditionalItem, value: string | number) => { 
        setBuildingData(prev => ({ ...prev, additional_items: prev.additional_items.map(bai => { 
            if (bai.id !== id) return bai; 
            if (name === 'item_name') {
                const selectedOpt = buildingItemOptions.find(opt => opt.item_name === value);
                if (selectedOpt) {
                    return { ...bai, item_id: selectedOpt.item_id, item_name: selectedOpt.item_name, unit_cost: selectedOpt.unit_value, total_cost: (bai.quantity as number || 0) * selectedOpt.unit_value };
                }
            }
            const newBai: BuildingAdditionalItem = { ...bai, [name]: value }; 
            const quantity = newBai.quantity as number || 0; 
            const unit_cost = newBai.unit_cost as number || 0; 
            newBai.total_cost = quantity * unit_cost; 
            return newBai; 
        }) })); 
    }, [buildingItemOptions]);

    // Land Improvement Handlers
    const handleAddImprovement = useCallback(() => { setImprovements(prev => [...prev, { id: nextLandImprovementId, improvement_name: '', quantity: 1, unit_value: 0, base_market_value: 0, remarks: '' }]); setNextLandImprovementId(prev => prev + 1); }, [nextLandImprovementId]);
    const handleRemoveImprovement = useCallback((id: number) => setImprovements(prev => prev.filter(imp => imp.id !== id)), []);
    const handleImprovementChange = useCallback((id: number, name: keyof LandImprovement, value: string | number) => { 
        setImprovements(prev => prev.map(imp => { 
            if (imp.id !== id) return imp; 
            const newImp: LandImprovement = { ...imp, [name]: value as any }; 
            
            // Auto-populate unit value if a new predefined improvement is selected
            if (name === 'improvement_name') {
                const selectedOpt = landImprovementOptions.find(o => o.improvement_name === value);
                if (selectedOpt) {
                    newImp.unit_value = selectedOpt.unit_value;
                    newImp.base_market_value = newImp.quantity * selectedOpt.unit_value;
                }
            }

            if (name === 'quantity' || name === 'unit_value') { 
                const quantity = newImp.quantity as number || 0; 
                const unit_value = newImp.unit_value as number || 0; 
                newImp.base_market_value = quantity * unit_value; 
            } 
            return newImp; 
        })); 
    }, [landImprovementOptions]);

    // Adjustment Handlers
    const handleAddAdjustment = () => { setAdjustmentFactors(prev => [...prev, { id: nextAdjustmentId, factor_name: '', percent_adjustment: 0, remarks: '' }]); setNextAdjustmentId(prev => prev + 1); };
    const handleRemoveAdjustment = (id: number) => setAdjustmentFactors(prev => prev.filter(adj => adj.id !== id));
    const handleAdjustmentChange = (id: number, field: keyof AdjustmentFactor, value: string | number) => { setAdjustmentFactors(prev => prev.map(adj => adj.id === id ? { ...adj, [field]: value } : adj)); };

    const handleRevisionSubmit = async () => {
        setSubmitError(null);
        setSubmitLoading(true);
        try {
            const payload = {
                faas_id: faasId,
                revision_date: revisionDate,
                remarks: revisionRemarks,
                owner_ids: selectedOwners.map(o => o.owner_id),
                master_data: masterData,
                faas_core: { ...faasDataState, ry_id: parseInt(faasDataState.ry_id) },
                specific_data: masterData.property_kind === 'Land' ? { ...landData, property_kind: 'Land' } : masterData.property_kind === 'Building' ? { ...buildingData, property_kind: 'Building'} : { ...machineryData, property_kind: 'Machinery'},
                improvements: masterData.property_kind === 'Land' ? improvements : [],
                adjustments: adjustmentFactors,
                calculations: {
                    base_market_value: calculations.baseMarketValue,
                    final_market_value: calculations.totalMarketValue,
                    assessed_value: calculations.assessedValue,
                    assessment_level: assessmentLevel
                }
            };
            console.log(payload);
            await api.post('faas/revision', payload);
            // setSubmissionSuccessful(true);
            // setRefresh(prev => !prev);
        } catch (error: any) {
            console.error("Revision failed:", error);
            setSubmitError(error.response?.data?.message || 'Failed to submit revision.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCancel = () => setShowDialog(false);
    const handleCloseOnSuccess = () => setShowDialog(false);

    const PropertyIcon = ({ kind }: { kind: PropertyKind }) => {
        switch (kind) {
            case 'Land': return <LandPlot className="w-6 h-6 text-emerald-600 mr-3" />;
            case 'Building': return <BuildingIcon className="w-6 h-6 text-emerald-600 mr-3" />;
            case 'Machinery': return <Factory className="w-6 h-6 text-emerald-600 mr-3" />;
            default: return <Landmark className="w-6 h-6 text-emerald-600 mr-3" />;
        }
    };

    if (!showDialog) return null;

    if (submissionSuccessful) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Revision Successful!</h2>
                    <p className="text-slate-600 mb-8">The FAAS has been successfully revised and recorded.</p>
                    <button onClick={handleCloseOnSuccess} className="px-8 py-3 text-sm font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg transition duration-200">Close</button>
                </div>
            </div>
        );
    }

    if (loadingData) return <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl p-8 flex flex-col items-center shadow-lg"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" /><p className="text-slate-600 font-medium">Loading property data...</p></div></div>;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
                <div className="px-8 py-5 flex justify-between items-center border-b border-slate-100 bg-white">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <PropertyIcon kind={masterData.property_kind} />
                        Revise {masterData.property_kind} Record
                    </h2>
                    <button onClick={handleCancel} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50" disabled={submitLoading}><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleRevisionSubmit(); }}>
                        
                        {/* Revision Specifics */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100"><History className="w-4 h-4 mr-2 text-emerald-600" /> Revision Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <DatePickerField label="Revision Date" name="revision_date" value={revisionDate} onChange={(_e: any, val: string) => setRevisionDate(val)} required />
                                <div className="sm:col-span-2"><TextAreaField label="Reason for Revision / Remarks" name="remarks" value={revisionRemarks} onChange={(_e: any, val: string) => setRevisionRemarks(_e.target.value)} required isFullWidth /></div>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100">
                                <Users className="w-4 h-4 mr-2 text-emerald-600" /> Owner Information
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Owner</label>
                                        <SearchableSelect
                                            options={availableOwners.filter(o => !selectedOwners.some(sel => sel.owner_id === o.owner_id)).map(o => ({
                                                label: `${o.last_name}, ${o.first_name} ${o.middle_name ? `${o.middle_name}.` : ''}`,
                                                value: o.owner_id
                                            }))}
                                            value={selectedOwnerToAdd}
                                            onChange={(val) => setSelectedOwnerToAdd(String(val))}
                                            placeholder="Search/Select Owner..."
                                        />
                                    </div>
                                    <button type="button" onClick={handleAddOwner} disabled={!selectedOwnerToAdd} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 h-[38px]"><UserPlus size={16} /> Add</button>
                                </div>
                                {selectedOwners.length > 0 ? (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold">
                                                <tr>
                                                    <th className="px-4 py-2">Name</th>
                                                    <th className="px-4 py-2">Address</th>
                                                    <th className="px-4 py-2 text-center w-20">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedOwners.map(owner => (
                                                    <tr key={owner.owner_id} className="bg-white">
                                                        <td className="px-4 py-2 font-medium text-slate-900">{owner.last_name}, {owner.first_name} {owner.middle_name}</td>
                                                        <td className="px-4 py-2 text-slate-600 truncate max-w-xs" title={owner.address_house_no}>{owner.address_house_no || '-'}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button type="button" onClick={() => handleRemoveOwner(owner.owner_id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition"><Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm">No owners selected. Please add at least one owner.</div>}
                            </div>
                        </div>

                        {/* Identifiers */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100">
                                <ClipboardList className="w-4 h-4 mr-2 text-emerald-600" /> Property Identifiers
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <InputField label="ARP No." name="arp_no" value={masterData.arp_no} onChange={handleMasterChange} required />
                                <InputField label="PIN (Parcel ID)" name="pin" value={masterData.pin} onChange={handleMasterChange} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                                <SelectField label="LGU Code" name="lg_code" value={faasDataState.lg_code} onChange={handleFAASChange} options={LG_CODES} required />
                                <SelectField label="Barangay" name="barangay" value={masterData.barangay} onChange={handleMasterChange} options={BARANGAY_CODES} required readOnly={!faasDataState.lg_code || BARANGAY_CODES.length === 0} />
                                <InputField label="Lot No." name="lot_no" value={masterData.lot_no} onChange={handleMasterChange} />
                                <InputField label="Block No." name="block_no" value={masterData.block_no} onChange={handleMasterChange} />
                                <div className="sm:col-span-4"><TextAreaField label="Description" name="description" value={masterData.description} onChange={handleMasterChange} isFullWidth /></div>
                            </div>
                        </div>

                        {/* Appraisal Parameters */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100"><Landmark className="w-4 h-4 mr-2 text-emerald-600" /> Appraisal Parameters</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <SelectField label="Revision Year" name="ry_id" value={faasDataState.ry_id} onChange={handleFAASChange} options={revisionYears.map(r=>r.year)} values={revisionYears.map(r=>r.ry_id)} required />
                                <DatePickerField label="Effectivity Date" name="effectivity_date" value={faasDataState.effectivity_date} onChange={handleFAASChange} required />
                                
                                <div className="relative">
                                    <InputField label="Unit Value (Base)" type="number" name="unit_value" value={faasDataState.unit_value} onChange={handleFAASChange} step="0.01" />
                                    {smvLoading && <span className="absolute right-2 top-8 text-xs text-emerald-500 animate-pulse">Fetching...</span>}
                                </div>

                                <InputField label={masterData.property_kind === 'Building' ? 'Total Floor Area' : masterData.property_kind === 'Land' ? 'Lot Area' : 'Quantity'} type="number" name="area" value={faasDataState.area} onChange={handleFAASChange} step="0.01" readOnly={masterData.property_kind === 'Building'} />
                            </div>
                        </div>

                        {/* Specific Details */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-emerald-200/50">
                                {masterData.property_kind} Specific Details
                            </h3>
                            
                            <div className="mb-4">
                                <InputField label="Property Kind" name="property_kind" value={masterData.property_kind} onChange={handleMasterChange} readOnly />
                            </div>

                            {/* Land Details */}
                            {masterData.property_kind === 'Land' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField label="Land Class (PC)" name="pc_code" value={landData.pc_code} onChange={handleSpecificChange(setLandData)} options={PC_NAMES} values={PC_CODES} required />
                                        <SelectField label="Sub-Class (PSC)" name="psc_code" value={landData.psc_code} onChange={handleSpecificChange(setLandData)} options={LAND_PSC_CODES} required readOnly={!landData.pc_code} />
                                        <SelectField label="Actual Use (AU)" name="au_code" value={landData.au_code} onChange={handleSpecificChange(setLandData)} options={LAND_AU_CODES} required />
                                        <InputField label="Lot Area (sqm)" name="lot_area" value={landData.lot_area} onChange={handleSpecificChange(setLandData)} type="number" min="0.01" step="0.01" required />
                                        <div className="sm:col-span-4"><TextAreaField label="Remarks" name="remarks" value={landData.remarks} onChange={handleSpecificChange(setLandData)} isFullWidth /></div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-emerald-200 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-emerald-700 uppercase">Other Improvements</h4>
                                            <button type="button" onClick={handleAddImprovement} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-xs font-bold transition flex items-center"><Plus className="w-3 h-3 mr-1"/> Add Item</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-emerald-50 text-emerald-700">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Name</th>
                                                        <th className="px-3 py-2 text-center w-24">Qty</th>
                                                        <th className="px-3 py-2 text-right">Unit Val</th>
                                                        <th className="w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-50">
                                                    {improvements.map(imp => (
                                                        <tr key={imp.id}>
                                                            <td className="p-2">
                                                                <SearchableSelect 
                                                                    options={landImprovementOptions.map(opt => ({ label: opt.improvement_name, value: opt.improvement_name }))}
                                                                    value={imp.improvement_name}
                                                                    onChange={(val) => handleImprovementChange(imp.id, 'improvement_name', val)}
                                                                    placeholder="Select Improvement..."
                                                                />
                                                            </td>
                                                            <td className="p-2"><input className="w-full border border-slate-300 rounded p-1.5 text-sm text-center outline-none focus:border-emerald-500" type="number" value={imp.quantity} onChange={e=>handleImprovementChange(imp.id, 'quantity', parseInt(e.target.value)||0)} /></td>
                                                            <td className="p-2"><input className="w-full border border-slate-300 rounded p-1.5 text-sm text-right outline-none focus:border-emerald-500 bg-slate-50 cursor-not-allowed" type="number" step="0.01" value={imp.unit_value} readOnly /></td>
                                                            <td className="p-2 text-center"><button type="button" onClick={()=>handleRemoveImprovement(imp.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                                        </tr>
                                                    ))}
                                                    {improvements.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-slate-400 italic">No improvements added.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase">Adjustment Factors</h4>
                                            <button type="button" onClick={handleAddAdjustment} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-bold transition flex items-center"><Plus className="w-3 h-3 mr-1"/> Add</button>
                                        </div>
                                        {adjustmentFactors.map(adj => (
                                            <div key={adj.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                                <div className="col-span-8"><InputField placeholder="Factor (e.g. Corner Lot)" value={adj.factor_name} onChange={(_e:any, v:string) => handleAdjustmentChange(adj.id, 'factor_name', v)} /></div>
                                                <div className="col-span-3"><InputField type="number" placeholder="%" value={adj.percent_adjustment} onChange={(_e:any, v:number) => handleAdjustmentChange(adj.id, 'percent_adjustment', v)} /></div>
                                                <div className="col-span-1 text-right"><button type="button" onClick={() => handleRemoveAdjustment(adj.id)} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 className="w-4 h-4"/></button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Building Details */}
                            {masterData.property_kind === 'Building' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField label="Building Kind" name="bk_id" value={buildingData.bk_id} onChange={handleSpecificChange(setBuildingData)} options={BK_CODES} values={BK_VALUES} required />
                                        <SelectField label="Struct Type" name="st_id" value={buildingData.st_id} onChange={handleSpecificChange(setBuildingData)} options={STRUCTURAL_TYPES} values={STRUCTURAL_VALUES} required />
                                        <SelectField label="Actual Use" name="bau_id" value={buildingData.bau_id} onChange={handleSpecificChange(setBuildingData)} options={BUILDING_AU_CODES_LIST} values={BUILDING_AU_VALUES} required />
                                        <InputField label="Storeys" name="no_of_storeys" value={buildingData.no_of_storeys} onChange={handleSpecificChange(setBuildingData)} type="number" min="1" required />
                                        <InputField label="Year Built" name="year_constructed" value={buildingData.year_constructed} onChange={handleSpecificChange(setBuildingData)} type="number" min="1900" />
                                        <InputField label="Depreciation Rate %" name="depreciation_rate" value={faasDataState.depreciation_rate} onChange={handleFAASChange} type="number" step="0.01" />
                                        <div className="sm:col-span-2"><TextAreaField label="Remarks" name="remarks" value={buildingData.remarks} onChange={handleSpecificChange(setBuildingData)} isFullWidth /></div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Floor Areas</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {buildingData.floor_areas.map(f => <BuildingFloorAreaInput key={f.floor_no} floor={f} onChange={handleFloorAreaChange} />)}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-slate-600 uppercase">Structural Materials</h4>
                                            <button type="button" onClick={handleAddBSM} className="text-xs bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold flex items-center"><Plus className="w-3 h-3 mr-1"/> Add</button>
                                        </div>
                                        {buildingData.structural_materials.map(bsm => <BuildingStructuralMaterialForm key={bsm.id} bsm={bsm} floorCount={buildingData.no_of_storeys as number} onChange={handleBSMChange} onRemove={handleRemoveBSM} />)}
                                        {buildingData.structural_materials.length===0 && <p className="text-xs text-slate-400 italic text-center py-2">No materials added.</p>}
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-slate-600 uppercase">Additional Items</h4>
                                            <button type="button" onClick={handleAddBAI} className="text-xs bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold flex items-center"><Plus className="w-3 h-3 mr-1"/> Add</button>
                                        </div>
                                        {buildingData.additional_items.map(bai => 
                                            <BuildingAdditionalItemForm 
                                                key={bai.id} 
                                                bai={bai} 
                                                onChange={handleBAIChange} 
                                                onRemove={handleRemoveBAI} 
                                                options={buildingItemOptions} 
                                            />)}
                                        {buildingData.additional_items.length===0 && <p className="text-xs text-slate-400 italic text-center py-2">No items added.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Machinery Form */}
                            {masterData.property_kind === 'Machinery' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField label="Type" name="mt_id" value={machineryData.mt_id} onChange={handleSpecificChange(setMachineryData)} options={MT_CODES} values={MT_VALUES} required />
                                        <SelectField label="Actual Use" name="mau_id" value={machineryData.mau_id} onChange={handleSpecificChange(setMachineryData)} options={MAU_CODES} values={MAU_VALUES} required />
                                        <InputField label="Brand" name="brand_model" value={machineryData.brand_model} onChange={handleSpecificChange(setMachineryData)} />
                                        <InputField label="Capacity" name="capacity_hp" value={machineryData.capacity_hp} onChange={handleSpecificChange(setMachineryData)} />
                                        <DatePickerField label="Date Acquired" name="date_acquired" value={machineryData.date_acquired} onChange={handleSpecificChange(setMachineryData)} required/>
                                        <SelectField label="Condition" name="condition" value={machineryData.condition} onChange={handleSpecificChange(setMachineryData)} options={CONDITION_ENUM_MACHINERY} />
                                        <InputField label="Economic Life" name="economic_life" value={machineryData.economic_life} onChange={handleSpecificChange(setMachineryData)} type="number" min="1" />
                                        <YearSelect label="Year Installed" name="year_installed" value={machineryData.year_installed} onChange={handleSpecificChange(setMachineryData)} type="number" />
                                        <YearSelect label="Year Op" name="year_initial_operation" value={machineryData.year_initial_operation} onChange={handleSpecificChange(setMachineryData)} type="number" required />
                                        <InputField label="Orig Cost" name="original_cost" value={machineryData.original_cost} onChange={handleSpecificChange(setMachineryData)} type="number" step="0.01" />
                                        <InputField label="Conv. Factor" name="conversion_factor" value={machineryData.conversion_factor} onChange={handleSpecificChange(setMachineryData)} type="number" step="0.01" />
                                        <InputField label="Depr Rate %" name="depreciation_rate" value={faasDataState.depreciation_rate} onChange={handleFAASChange} type="number" step="0.01" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Valuation Preview */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-100 overflow-hidden">
                            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center">
                                <Calculator className="w-5 h-5 text-emerald-600 mr-2" />
                                <h3 className="font-bold text-emerald-800 uppercase tracking-wide text-sm">Valuation Summary</h3>
                            </div>
                            <div className="p-6 space-y-3 text-sm text-slate-700">
                                <div className="flex justify-between">
                                    <span className="font-medium">Base Market Value</span>
                                    <span className="font-semibold text-slate-900">₱{calculations.baseMarketValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                </div>
                                {calculations.totalAdjustmentPercent !== 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>Adjustments ({calculations.totalAdjustmentPercent}%)</span>
                                        <span>{calculations.totalAdjustmentPercent > 0 ? '+' : ''}₱{(calculations.adjustedMarketValue - calculations.baseMarketValue).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                    </div>
                                )}
                                {calculations.improvementsValue > 0 && (
                                    <div className="flex justify-between text-orange-600">
                                        <span>Improvements/Additionals</span>
                                        <span>+₱{calculations.improvementsValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                    </div>
                                )}
                                {(calculations.depreciationValue || 0) > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Depreciation ({calculations.depreciationRate?.toFixed(2)}%)</span>
                                        <span>-₱{calculations.depreciationValue?.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between font-bold text-lg text-slate-900">
                                    <span>Total Market Value</span>
                                    <span>₱{calculations.totalMarketValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3">
                                    <span className="font-medium text-slate-600">Assessment Level</span>
                                    <div className="relative">
                                        <input type="number" className="w-24 border border-slate-300 rounded-md text-right py-1.5 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={assessmentLevel} onChange={(e)=>setAssessmentLevel(parseFloat(e.target.value)||0)} />
                                        <span className="absolute right-3 top-1.5 text-slate-400">%</span>
                                    </div>
                                </div>
                                <div className="bg-emerald-100 p-4 rounded-xl flex justify-between items-center font-extrabold text-xl text-emerald-900 mt-4 shadow-inner">
                                    <span>ASSESSED VALUE</span>
                                    <span>₱{calculations.assessedValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {submitError && (
                            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center border border-red-100">
                                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                                {submitError}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={handleCancel} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-300 rounded-lg transition" disabled={submitLoading}>
                        Cancel
                    </button>
                    <button 
                        onClick={handleRevisionSubmit} 
                        disabled={submitLoading || selectedOwners.length === 0}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Confirm Revision
                    </button>
                </div>
            </div>
        </div>
    );
};