import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Landmark, Plus, X, Loader2, ClipboardList, LandPlot, Building as BuildingIcon, Factory, Trash2, Layers, HardHat, Hammer, CheckCircle, UserPlus, Users, AlertCircle, Pencil } from 'lucide-react';
import api from '../../../axiosBase';

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
    improvement_name: string; // Display name
    item_id?: number;         // Backend ID reference
    value_id?: number;        // Backend Value ID reference
    quantity: number;
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
    quantity: number | '';
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

interface PropertyCreationDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    editMode?: boolean;
    selectedPropertyId?: number;
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

const parseNumericValue = (value: string): string | number => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '' : numValue;
};

// --- Components ---
const formatToLocalDate = (value: any) => {
    if (!value) return '';
    
    // If it's already a simple string like "2026-01-04", just return it
    if (typeof value === 'string' && value.length === 10 && value.includes('-')) {
        return value; 
    }

    const date = new Date(value);
    // Check if valid date
    if (isNaN(date.getTime())) return '';

    // 'en-CA' outputs YYYY-MM-DD in LOCAL time (PH time for you)
    return date.toLocaleDateString('en-CA');
};
const YearSelect: React.FC<any> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    required = false, 
    isFullWidth = false, 
    readOnly = false,
    startYear = 1950, // Default start
    endYear = new Date().getFullYear() + 5 // Default to 5 years in future
}) => {

    // Generate the array of years based on start/end props
    const years = useMemo(() => {
        const yearArray = [];
        for (let i = endYear; i >= startYear; i--) {
            yearArray.push(i);
        }
        return yearArray;
    }, [startYear, endYear]);

    return (
        <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <select
                    name={name}
                    value={value || ''}
                    onChange={(e) => onChange(e, e.target.value)}
                    required={required}
                    disabled={readOnly}
                    // Matches your InputField styling exactly
                    className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500 appearance-none bg-white
                    ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                >
                    <option value="" disabled>Select Year</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
                
                {/* Custom Chevron Icon to match the styling (Optional, removes default browser arrow) */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

const DatePickerField: React.FC<any> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    required = false, 
    isFullWidth = false, 
    readOnly = false, 
    min = undefined, 
    max = undefined 
}) => {

    // 1. FORCE THE VALUE TO STAY LOCAL
    // This function ignores timezones completely. 
    // It says: "If the computer says it's Jan 4, return '2026-01-04', period."
    const getSafeDateValue = (val: any) => {
        if (!val) return '';
        
        // If it's already a clean string like "2026-01-04", just use it.
        if (typeof val === 'string' && val.length === 10) return val;

        const date = new Date(val);
        if (isNaN(date.getTime())) return '';

        // Trick: We use 'en-CA' because it outputs YYYY-MM-DD
        // We do NOT use toISOString() because that converts to UTC (Jan 3)
        return date.toLocaleDateString('en-CA');
    };

    return (
        <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type="date"
                    name={name}
                    // 2. APPLY THE FIX HERE
                    value={getSafeDateValue(value)}
                    onChange={(e) => onChange(e, e.target.value)}
                    required={required}
                    readOnly={readOnly}
                    min={min}
                    max={max}
                    className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500 placeholder:text-slate-400
                    ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}
                    [&::-webkit-calendar-picker-indicator]:opacity-50 
                    [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                    [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                />
            </div>
        </div>
    );
};


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

const SelectField: React.FC<any> = ({ label, name, value, values, onChange, options, required = false, readOnly = false, isFullWidth = false }) => (
    <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={readOnly || options.length === 0}
            className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500
            ${readOnly ? 'cursor-not-allowed' : 'bg-white'} ${options.length === 0 ? 'opacity-70' : ''}`}
        >
            {options.length === 0 && <option value="" disabled>{`Loading ${label.replace('*', '').trim()}...`}</option>}
            <option value="" disabled>{`Select ${label.replace('*', '').trim()}`}</option>
            {options.map((opt: string, index: number) => {
                const optValue = values ? values[index] : opt;
                return (
                    <option key={optValue} value={optValue}>{opt}</option>
                );
            })}
        </select>
    </div>
);

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

// ... (Building Sub-components remain same) ...
const BuildingFloorAreaInput: React.FC<{ floor: BuildingFloorArea; onChange: (floorNo: number, value: number) => void; }> = ({ floor, onChange }) => (
    <InputField key={`floor-${floor.floor_no}`} label={`Floor Area - Floor ${floor.floor_no}`} name={`floor_area_${floor.floor_no}`} value={floor.floor_area} onChange={(_e: any, val: number) => onChange(floor.floor_no, val)} type="number" min="0.01" step="0.01" required />
);
const BuildingStructuralMaterialForm: React.FC<any> = ({ bsm, floorCount, onChange, onRemove }) => (
    <div key={bsm.id} className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm mb-3">
        <div className="col-span-4"><SelectField label="Part" name="part" value={bsm.part} onChange={(_e: any) => onChange(bsm.id, 'part', _e.target.value)} options={BSM_PARTS} required /></div>
        <div className="col-span-3"><SelectField label="Floor (Optional)" name="floor_no" value={bsm.floor_no} onChange={(_e: any) => onChange(bsm.id, 'floor_no', _e.target.value)} options={Array.from({ length: floorCount }, (_, i) => (i + 1).toString())} /></div>
        <div className="col-span-4"><InputField label="Material" name="material" value={bsm.material} onChange={(_e: any, val: string) => onChange(bsm.id, 'material', val)} required /></div>
        <div className="col-span-1 flex justify-end"><button type="button" onClick={() => onRemove(bsm.id)} className="p-1 text-red-500 hover:text-red-700 transition self-end"><Trash2 className="w-5 h-5" /></button></div>
    </div>
);
const BuildingAdditionalItemForm: React.FC<any> = ({ bai, onChange, onRemove, options }) => (
    <div key={bai.id} className="grid grid-cols-12 gap-3 items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm mb-3">
        <div className="col-span-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Item Name <span className="text-red-500">*</span>
            </label>
            <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                value={bai.item_id}
                onChange={(e) => onChange(bai.id, 'item_id', e.target.value)}
            >
                <option value="">Select Item</option>
                {options && options.map((opt: any) => (
                    <option key={opt.item_id} value={opt.item_id}>{opt.item_name}</option>
                ))}
            </select>
        </div>
        <div className="col-span-3">
            <InputField 
                label="Qty" 
                name="quantity" 
                value={bai.quantity} 
                onChange={(_e: any, val: number) => 
                            onChange(bai.id, 'quantity', val)
                        } 
                type="number" 
                min="1" 
                step="1" 
                required />
        </div>
        <button type="button" onClick={() => onRemove(bai.id)} className="m-auto col-span-1p-1 text-red-500 hover:text-red-700 transition">
            <Trash2 className="w-5 h-5" />
        </button>
    </div>
);

const calculateMachineryValues = (data: MachinerySpecificData): MachinerySpecificData => {
    const today = new Date().getFullYear();
    const economicLife = (data.economic_life as number) || 0;
    const yearInitialOperation = (data.year_initial_operation as number) || today;
    let yearsUsed = 0;
    if (economicLife > 0 && yearInitialOperation > 0) yearsUsed = Math.max(0, today - yearInitialOperation);
    return { ...data, years_used: yearsUsed, remaining_life: Math.max(0, economicLife - yearsUsed) };
};

export const PropertyCreationDialog: React.FC<PropertyCreationDialogProps> = ({ showDialog, setShowDialog, setRefresh, editMode = false, selectedPropertyId }) => {
    // Lookup States
    const [LG_CODES, setLG_CODES] = useState<string[]>([]);
    const [BARANGAY_CODES, setBARANGAY_CODES] = useState<string[]>([]);
    const [PC_CODES, setPC_CODES] = useState<string[]>([]);
    const [PC_NAMES, setPC_NAMES] = useState<string[]>([]);
    const [LAND_PSC_CODES, setLAND_PSC_CODES] = useState<string[]>([]);
    const [LAND_AU_CODES, setLAND_AU_CODES] = useState<string[]>([]);
    const [BK_CODES, setBK_CODES] = useState<string[]>([]);
    const [BK_VALUES, setBK_VALUES] = useState<number[]>([]);
    const [STRUCTURAL_TYPES, setSTRUCTURAL_TYPES] = useState<string[]>([]);
    const [STRUCTURAL_VALUES, setSTRUCTURAL_VALUES] = useState<number[]>([]);
    const [BUILDING_AU_CODES_LIST, setBUILDING_AU_CODES_LIST] = useState<string[]>([]);
    const [BUILDING_AU_VALUES, setBUILDING_AU_VALUES] = useState<number[]>([]);
    const [MT_CODES, setMT_CODES] = useState([]);
    const [MT_VALUES, setMT_VALUES] = useState([]);
    const [MAU_CODES, setMAU_CODES] = useState([]);
    const [MAU_VALUES, setMAU_VALUES] = useState([]);

    const [selectedLGCode, setSelectedLGCode] = useState('');
    const [selectedPCCode, setSelectedPCCode] = useState('');

    // Form Data States
    const [masterData, setMasterData] = useState<MasterData>(initialMasterData);
    const [landData, setLandData] = useState<LandSpecificData>(initialLandData);
    const [buildingData, setBuildingData] = useState<BuildingSpecificData>(initialBuildingData);
    const [machineryData, setMachineryData] = useState<MachinerySpecificData>(initialMachineryData);
    const [improvements, setImprovements] = useState<LandImprovement[]>([]);
    
    // Owner Management States
    const [availableOwners, setAvailableOwners] = useState<OwnerOption[]>([]);
    const [selectedOwners, setSelectedOwners] = useState<OwnerOption[]>([]);
    const [selectedOwnerToAdd, setSelectedOwnerToAdd] = useState<string>(''); 

    // Land Improvement Options (New)
    const [landImprovementOptions, setLandImprovementOptions] = useState<LandImprovementOption[]>([]);
    // Building Additional Item Options (New)
    const [buildingItemOptions, setBuildingItemOptions] = useState<BuildingItemOption[]>([]);

    const [submitLoading, setSubmitLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);

    const [nextLandImprovementId, setNextLandImprovementId] = useState(1);
    const [nextBSMId, setNextBSMId] = useState(1);
    const [nextBAIId, setNextBAIId] = useState(1);

    // Initial Lookups & Owners List
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [lgRes, pcRes, auRes, bkRes, stRes, bauRes, mtRes, mauRes, ownersRes, landImpRes, baiRes] = await Promise.all([
                    api.get('lvg/list'),
                    api.get('p/plist'),
                    api.get('p/augetlist'),
                    api.get('p/bklist'),
                    api.get('p/stlist'),
                    api.get('p/baulist'),
                    api.get('p/mtlist'),
                    api.get('p/maulist'),
                    api.get('ol/'),
                    api.get('loi/uv/'), // Fetch Land Improvement Unit Values
                    api.get('bai/uv/') // Fetch Building Additional Item Unit Values
                ]);

                setLG_CODES(lgRes.data.data.map((item: any) => item.code));
                setPC_CODES(pcRes.data.map((item: any) => item.code));
                setPC_NAMES(pcRes.data.map((item: any) => item.classname));
                setLAND_AU_CODES(auRes.data.map((item: any) => item.code));
                setBK_CODES(bkRes.data.data.map((item: any) => item.code));
                setBK_VALUES(bkRes.data.data.map((item: any) => item.bk_id));
                setSTRUCTURAL_TYPES(stRes.data.data.map((item: any) => item.code));
                setSTRUCTURAL_VALUES(stRes.data.data.map((item: any) => item.st_id));
                setBUILDING_AU_CODES_LIST(bauRes.data.data.map((item: any) => item.code));
                setBUILDING_AU_VALUES(bauRes.data.data.map((item: any) => item.bau_id));
                setMT_CODES(mtRes.data.data.map((item: any) => item.code));
                setMT_VALUES(mtRes.data.data.map((item: any) => item.mt_id));
                setMAU_CODES(mauRes.data.data.map((item: any) => item.code));
                setMAU_VALUES(mauRes.data.data.map((item: any) => item.mau_id));

                const ownersList = ownersRes.data.data || ownersRes.data;
                if(Array.isArray(ownersList)) setAvailableOwners(ownersList);
                
                const landImps = landImpRes.data.data || landImpRes.data;
                if(Array.isArray(landImps)) setLandImprovementOptions(landImps);

                const baiItems = baiRes.data.data || baiRes.data;
                if(Array.isArray(baiItems)) setBuildingItemOptions(baiItems);

            } catch (error) {
                console.error("Error fetching initial lookup data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Load property data for edit mode
    useEffect(() => {
        const loadPropertyData = async () => {
            if (editMode && selectedPropertyId && showDialog) {
                setLoadingData(true);
                try {
                    const response = await api.get(`pml/property/${selectedPropertyId}`);
                    const property = response.data;

                    setMasterData({
                        arp_no: property.arp_no,
                        pin: property.pin,
                        lg_code: property.lg_code,
                        barangay: property.barangay,
                        lot_no: property.lot_no,
                        block_no: property.block_no,
                        property_kind: property.property_kind,
                        description: property.description,
                        status: property.status,
                    });

                    setSelectedLGCode(property.lg_code);

                    if (property.owners && Array.isArray(property.owners)) {
                        setSelectedOwners([...property.owners]);
                    }

                    if (property.property_kind === 'Land') {
                        const details = property.details;
                        setLandData({
                            pc_code: details.pc_code || '',
                            au_code: details.au_code,
                            psc_code: details.psc_code,
                            lot_area: parseFloat(details.lot_area),
                            remarks: details.remarks || '',
                        });
                        setSelectedPCCode(details.pc_code || '');

                        if (details.other_improvements?.length > 0) {
                            const loadedImprovements = details.other_improvements.map((imp: any, idx: number) => ({
                                id: idx + 1,
                                i_id: imp.i_id,
                                quantity: parseInt(imp.quantity),
                            }));
                            setImprovements(loadedImprovements);
                            setNextLandImprovementId(loadedImprovements.length + 1);
                        }
                    } else if (property.property_kind === 'Building') {
                        const details = property.details;
                         setBuildingData({
                            bk_id: details.bk_id?.toString() || '',
                            st_id: details.st_id?.toString() || '',
                            bau_id: details.bau_id?.toString() || '',
                            no_of_storeys: details.no_of_storeys,
                            year_constructed: details.year_constructed,
                            depreciation_rate: parseFloat(details.depreciation_rate),
                            additional_adj_factor: parseFloat(details.additional_adj_factor),
                            remarks: details.remarks || '',
                            floor_areas: details.floor_areas.map((fa:any) => ({ floor_no: fa.floor_no, floor_area: parseFloat(fa.floor_area) })),
                            structural_materials: details.structural_materials.map((sm:any, idx:number) => ({ id: idx+1, part: sm.part, floor_no: sm.floor_no||'', material: sm.material })),
                            additional_items: details.additional_items.map((ai:any, idx:number) => ({ id: idx+1, item_id: ai.item_id, quantity: parseInt(ai.quantity) }))
                        });
                    } else if (property.property_kind === 'Machinery') {
                        const details = property.details;
                         setMachineryData({
                            mt_id: details.mt_id?.toString() || '',
                            mau_id: details.mau_id?.toString() || '',
                            brand_model: details.brand_model,
                            capacity_hp: details.capacity_hp,
                            date_acquired: details.date_acquired,
                            condition: details.condition,
                            economic_life: details.economic_life,
                            remaining_life: details.remaining_life,
                            year_installed: details.year_installed,
                            year_initial_operation: details.year_initial_operation,
                            original_cost: parseFloat(details.original_cost),
                            conversion_factor: parseFloat(details.conversion_factor),
                            rcn: parseFloat(details.rcn),
                            years_used: details.years_used,
                            depreciation_rate: parseFloat(details.depreciation_rate),
                            total_depreciation_value: parseFloat(details.total_depreciation_value),
                            depreciated_value: parseFloat(details.depreciated_value),
                            remarks: details.remarks || '',
                        });
                    }
                } catch (error) {
                    console.error('Error loading property data:', error);
                    setSubmitError('Failed to load property data');
                } finally {
                    setLoadingData(false);
                }
            }
        };
        loadPropertyData();
    }, [editMode, selectedPropertyId, showDialog]);

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
                const pscRes = await api.get('p/splist', { params: { pc_id: pcIdRes.data.pc_id } });
                setLAND_PSC_CODES(pscRes.data.map((item: any) => item.code));
            } catch (error) { console.error("Error fetching subclasses:", error); }
        };
        fetchSubClass();
    }, [selectedPCCode]);

    useEffect(() => {
        const calculatedData = calculateMachineryValues(machineryData);
        if (machineryData.rcn !== calculatedData.rcn || machineryData.depreciated_value !== calculatedData.depreciated_value || machineryData.remaining_life !== calculatedData.remaining_life) {
            setMachineryData(calculatedData);
        }
    }, [machineryData.original_cost, machineryData.conversion_factor, machineryData.economic_life, machineryData.year_initial_operation]);

    // Handlers
    const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: string | number) => {
        const { name } = e.target;
        const finalValue = value !== undefined ? value : e.target.value;
        setMasterData(prev => ({ ...prev, [name]: finalValue as any }));
        if (name === 'lg_code') { setSelectedLGCode(finalValue as string); setMasterData(prev => ({ ...prev, barangay: '' })); }
        if (name === 'property_kind' && !editMode) {
            setSelectedPCCode('');
            setLandData(initialLandData); setBuildingData(initialBuildingData); setMachineryData(initialMachineryData);
        }
    };

    const handleSpecificChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: string | number) => {
        const { name } = e.target;
        // console.log(name, e.target.value)
        const finalValue = value !== undefined ? value : e.target.value;
        if (masterData.property_kind === 'Land' && name === 'pc_code') {
            setSelectedPCCode(finalValue as string);
            setter((prev: LandSpecificData) => ({ ...prev, [name]: finalValue as any, psc_code: '' }));
        } else {
            setter((prev: any) => {
                const newState = { ...prev, [name]: finalValue as any };
                return masterData.property_kind === 'Machinery' ? calculateMachineryValues(newState) : newState;
            });
        }
    };

    // Owner Handlers
    const handleAddOwner = () => {
        if (!selectedOwnerToAdd) return;
        
        const ownerToAdd = availableOwners.find(o => String(o.owner_id) === selectedOwnerToAdd);
        console.log(ownerToAdd);
        if (ownerToAdd && !selectedOwners.some(o => o.owner_id === ownerToAdd.owner_id)) {
            setSelectedOwners(prev => [...prev, ownerToAdd]);
        }
        setSelectedOwnerToAdd('');
    };

    const handleRemoveOwner = (id: number) => {
        setSelectedOwners(prev => prev.filter(o => o.owner_id !== id));
    };

    // ... (Building logic) ...
    const handleFloorAreaChange = useCallback((floorNo: number, value: number) => { setBuildingData(prev => ({ ...prev, floor_areas: prev.floor_areas.map(fa => fa.floor_no === floorNo ? { ...fa, floor_area: value } : fa), })); }, []);
    useEffect(() => { if (masterData.property_kind === 'Building') { const newStoreys = parseInt(buildingData.no_of_storeys as string, 10); if (!isNaN(newStoreys) && newStoreys > 0 && newStoreys !== buildingData.floor_areas.length) { setBuildingData(prev => { const current = prev.floor_areas; let next = [...current]; if (newStoreys > current.length) { for (let i = current.length + 1; i <= newStoreys; i++) next.push({ floor_no: i, floor_area: '' }); } else { next = next.slice(0, newStoreys); } return { ...prev, floor_areas: next }; }); } } }, [buildingData.no_of_storeys, masterData.property_kind]);
    const handleAddBSM = () => { setBuildingData(p => ({...p, structural_materials: [...p.structural_materials, {id: nextBSMId, part: '', floor_no: '', material: ''}]})); setNextBSMId(n=>n+1); };
    const handleRemoveBSM = (id:number) => setBuildingData(p => ({...p, structural_materials: p.structural_materials.filter(x=>x.id!==id)}));
    const handleBSMChange = (id:number, k:string, v:string) => setBuildingData(p => ({...p, structural_materials: p.structural_materials.map(x=>x.id===id?{...x,[k]:v}:x)}));
    const handleAddBAI = () => { setBuildingData(p => ({...p, additional_items: [...p.additional_items, {id: nextBAIId, quantity:''}]})); setNextBAIId(n=>n+1); };
    const handleRemoveBAI = (id:number) => setBuildingData(p => ({...p, additional_items: p.additional_items.filter(x=>x.id!==id)}));
    
    // UPDATED: handleBAIChange to auto-populate unit_cost
    const handleBAIChange = (id:number, k:string, v:string|number) => {
        setBuildingData(p => ({
            ...p,
            additional_items: p.additional_items.map(x=> { 
                if(x.id!==id) return x; 
                
                // Logic for item selection from dropdown
                if (k === 'item_name') {
                    const selectedOpt = buildingItemOptions.find(opt => opt.item_name === v);
                    if (selectedOpt) {
                        return {
                            ...x,
                            item_id: selectedOpt.item_id,
                        };
                    }
                }

                const nx={...x,[k]:v};
                return nx; 
            })
        }));
    };

    // Land Improvement Handlers
    const handleAddImprovement = () => { 
        setImprovements(p => [...p, {id: nextLandImprovementId, i_id:0, quantity:1, remarks:''}]); 
        setNextLandImprovementId(n=>n+1); 
    };
    
    const handleRemoveImprovement = (id:number) => setImprovements(p => p.filter(x=>x.id!==id));
    
    const handleImprovementChange = (id:number, k:string, v:string|number) => {
        setImprovements(p => p.map(x=> { 
            if(x.id!==id) return x; 
            
            // Logic for improvement selection from dropdown
            if (k === 'improvement_name') {
                const selectedOpt = landImprovementOptions.find(opt => opt.improvement_id === v);
                if (selectedOpt) {
                    return {
                        ...x,
                        i_id: selectedOpt.improvement_id,
                    };
                }
            }
            
            const nx={...x,[k]:v}; 
            if(k==='quantity') {
                nx.base_market_value=(Number(nx.quantity)||0)*(Number(nx.unit_value)||0); 
            }
            return nx; 
        }));
    };
    
    const handleResetAllStates = useCallback(() => {
        setMasterData(initialMasterData); setLandData(initialLandData); setBuildingData(initialBuildingData); setMachineryData(initialMachineryData);
        setImprovements([]); setSelectedOwners([]); setSubmitError(null); setSubmitLoading(false); setSubmissionSuccessful(false); setSelectedLGCode(''); setSelectedPCCode('');
    }, []);
    const handleCancel = () => { handleResetAllStates(); setShowDialog(false); };
    const handleCloseOnSuccess = () => { setShowDialog(false); setRefresh(prev => !prev); handleResetAllStates(); };


    // Submission!
    const handleInternalSubmit = async () => {
        setSubmitError(null); setSubmitLoading(true);
        try {
            const dataToSubmit = {
                ...masterData,
                owners: selectedOwners.map(o => o.owner_id), 
                details: masterData.property_kind === 'Land' ? landData :
                    masterData.property_kind === 'Building' ? { ...buildingData, floor_areas: buildingData.floor_areas, structural_materials: buildingData.structural_materials, additional_items: buildingData.additional_items } :
                    machineryData,
                improvements: masterData.property_kind === 'Land' ? improvements : []
            };
            console.log(dataToSubmit)
            if (editMode && selectedPropertyId) {
                await api.put(`pml/set/${selectedPropertyId}`, dataToSubmit);
            } else {
                await api.post('pml/add', dataToSubmit);
            }
            setSubmissionSuccessful(true);
            setRefresh(prev=>!prev);
        } catch (error: any) {
            console.error("Submission failed:", error);
            setSubmitError(`Failed to ${editMode ? 'update' : 'save'} property.`);
        } finally {
            setSubmitLoading(false);
        }
    };

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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Success!</h2>
                    <p className="text-slate-600 mb-8">The {masterData.property_kind} Property record ({masterData.arp_no}) has been successfully {editMode ? 'updated' : 'created'}.</p>
                    <button onClick={handleCloseOnSuccess} className="px-8 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition duration-200 bg-emerald-600 hover:bg-emerald-700">Close and View List</button>
                </div>
            </div>
        );
    }

    if (loadingData) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 flex flex-col items-center shadow-lg">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Loading property data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-5 flex justify-between items-center border-b border-slate-100 bg-white">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <PropertyIcon kind={masterData.property_kind} />
                        {editMode ? 'Edit' : 'Create New'} {masterData.property_kind} Property
                    </h2>
                    <button onClick={handleCancel} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50" disabled={submitLoading}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleInternalSubmit(); }}>
                        
                        {/* 1. Owners Section */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100">
                                <Users className="w-4 h-4 mr-2 text-emerald-600" /> Owner Information
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Owner</label>
                                        <select value={selectedOwnerToAdd} onChange={(e) => setSelectedOwnerToAdd(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                                            <option value="">-- Search/Select Owner --</option>
                                            {availableOwners.filter(o => !selectedOwners.some(sel => sel.owner_id === o.owner_id)).map(owner => (
                                                <option key={owner.owner_id} value={owner.owner_id}>{owner.last_name}, {owner.first_name} {owner.middle_name ? `${owner.middle_name}.` : ''}</option>
                                            ))}
                                        </select>
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

                        {/* 2. Location & Identifiers */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100">
                                <ClipboardList className="w-4 h-4 mr-2 text-emerald-600" /> Property Identifiers
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <InputField label="ARP No." name="arp_no" value={masterData.arp_no} onChange={handleMasterChange} required />
                                <InputField label="PIN (Parcel ID)" name="pin" value={masterData.pin} onChange={handleMasterChange} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                                <SelectField label="LGU Code" name="lg_code" value={masterData.lg_code} onChange={handleMasterChange} options={LG_CODES} required />
                                <SelectField label="Barangay" name="barangay" value={masterData.barangay} onChange={handleMasterChange} options={BARANGAY_CODES} required readOnly={!selectedLGCode || BARANGAY_CODES.length === 0} />
                                <InputField label="Status" name="status" value="ACTIVE" onChange={handleMasterChange} readOnly />
                                <InputField label="Lot No." name="lot_no" value={masterData.lot_no} onChange={handleMasterChange} />
                                <InputField label="Block No." name="block_no" value={masterData.block_no} onChange={handleMasterChange} />
                                <div className="sm:col-span-3"><TextAreaField label="Description" name="description" value={masterData.description} onChange={handleMasterChange} isFullWidth /></div>
                            </div>
                        </div>

                        {/* 3. Specific Details */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-emerald-200/50">
                                {masterData.property_kind} Specific Details
                            </h3>
                            
                            <div className="mb-4">
                                <SelectField label="Property Kind" name="property_kind" value={masterData.property_kind} onChange={handleMasterChange} options={['Land', 'Building', 'Machinery']} required readOnly={editMode} />
                            </div>

                            {/* Conditional Forms based on Kind */}
                            {masterData.property_kind === 'Land' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField label="Land Class (PC)" name="pc_code" value={landData.pc_code} onChange={handleSpecificChange(setLandData)} options={PC_NAMES} values={PC_CODES} required />
                                        <SelectField label="Sub-Class (PSC)" name="psc_code" value={landData.psc_code} onChange={handleSpecificChange(setLandData)} options={LAND_PSC_CODES} required readOnly={!landData.pc_code} />
                                        <SelectField label="Actual Use (AU)" name="au_code" value={landData.au_code} onChange={handleSpecificChange(setLandData)} options={LAND_AU_CODES} required />
                                        <InputField label="Lot Area (sqm)" name="lot_area" value={landData.lot_area} onChange={handleSpecificChange(setLandData)} type="number" min="0.01" step="0.01" required />
                                        <div className="sm:col-span-4"><TextAreaField label="Remarks" name="remarks" value={landData.remarks} onChange={handleSpecificChange(setLandData)} isFullWidth /></div>
                                    </div>
                                    {/* Improvements Table */}
                                    <div className="bg-white rounded-lg border border-emerald-200 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-emerald-700 uppercase">Other Improvements</h4>
                                            <button type="button" onClick={handleAddImprovement} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-xs font-bold transition flex items-center"><Plus className="w-3 h-3 mr-1"/> Add Item</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-emerald-50 text-emerald-700">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">
                                                            Name
                                                        </th>
                                                        <th className="px-3 py-2 text-center">
                                                            Qty
                                                        </th>
                                                        <th className="w-10">
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-50">
                                                    {improvements.map(imp => (
                                                        <tr key={imp.id}>
                                                            <td className="p-2">
                                                                <select 
                                                                    className="w-full border border-slate-300 rounded p-1 text-sm outline-none focus:border-emerald-500"
                                                                    value={imp.i_id} 
                                                                    onChange={(e) => handleImprovementChange(imp.id, 'i_id', e.target.value)}
                                                                >
                                                                    <option value="">Select Improvement</option>
                                                                    {landImprovementOptions.map(opt => (
                                                                        <option key={opt.value_id} value={opt.improvement_id}>{opt.improvement_name}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="p-2"><input className="w-full border rounded p-1 text-sm text-center" type="number" value={imp.quantity} onChange={e=>handleImprovementChange(imp.id, 'quantity', parseInt(e.target.value)||0)} /></td>
                                                            <td className="p-2 text-center"><button type="button" onClick={()=>handleRemoveImprovement(imp.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                                        </tr>
                                                    ))}
                                                    {improvements.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-slate-400 italic">No improvements added.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Building Form */}
                            {masterData.property_kind === 'Building' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField label="Building Kind" name="bk_id" value={buildingData.bk_id} onChange={handleSpecificChange(setBuildingData)} options={BK_CODES} values={BK_VALUES} required />
                                        <SelectField label="Struct Type" name="st_id" value={buildingData.st_id} onChange={handleSpecificChange(setBuildingData)} options={STRUCTURAL_TYPES} values={STRUCTURAL_VALUES} required />
                                        <SelectField label="Actual Use" name="bau_id" value={buildingData.bau_id} onChange={handleSpecificChange(setBuildingData)} options={BUILDING_AU_CODES_LIST} values={BUILDING_AU_VALUES} required />
                                        <InputField label="Storeys" name="no_of_storeys" value={buildingData.no_of_storeys} onChange={handleSpecificChange(setBuildingData)} type="number" min="1" required />
                                        <InputField label="Year Built" name="year_constructed" value={buildingData.year_constructed} onChange={handleSpecificChange(setBuildingData)} type="number" min="1900" />
                                        <div className="sm:col-span-3"><TextAreaField label="Remarks" name="remarks" value={buildingData.remarks} onChange={handleSpecificChange(setBuildingData)} isFullWidth /></div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Floor Areas</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {buildingData.floor_areas.map(f => <BuildingFloorAreaInput key={f.floor_no} floor={f} onChange={handleFloorAreaChange} />)}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <div className="flex justify-between mb-3"><h4 className="text-xs font-bold text-slate-600 uppercase">Structural Materials</h4><button type="button" onClick={handleAddBSM} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600 font-bold">+ Add</button></div>
                                        {buildingData.structural_materials.map(bsm => <BuildingStructuralMaterialForm key={bsm.id} bsm={bsm} floorCount={buildingData.no_of_storeys as number} onChange={handleBSMChange} onRemove={handleRemoveBSM} />)}
                                        {buildingData.structural_materials.length===0 && <p className="text-xs text-slate-400 italic text-center">No materials added.</p>}
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <div className="flex justify-between mb-3"><h4 className="text-xs font-bold text-slate-600 uppercase">Additional Items</h4><button type="button" onClick={handleAddBAI} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600 font-bold">+ Add</button></div>
                                        {buildingData.additional_items.map(bai => 
                                            <BuildingAdditionalItemForm 
                                                key={bai.id} 
                                                bai={bai} 
                                                onChange={handleBAIChange} 
                                                onRemove={handleRemoveBAI} 
                                                options={buildingItemOptions} 
                                            />)}
                                        {buildingData.additional_items.length===0 ? 
                                            <p className="text-xs text-slate-400 italic text-center">
                                                No items added.
                                            </p> : 
                                            <>{/*No need for total*/}</>
                                        }
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
                                        <InputField label="Orig Cost" name="original_cost" value={machineryData.original_cost} onChange={handleSpecificChange(setMachineryData)} type="number" />
                                        <InputField label="Conv. Factor" name="conversion_factor" value={machineryData.conversion_factor} onChange={handleSpecificChange(setMachineryData)} type="number" />
                                        <InputField label="Depr Rate" name="depreciation_rate" value={machineryData.depreciation_rate} onChange={handleSpecificChange(setMachineryData)} type="number" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Remarks if it's edit LMAO */}
                        {
                        editMode?
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4 pb-2 border-b border-slate-100">
                                    <Pencil className="w-4 h-4 mr-2 text-emerald-600" /> Edit Purpose
                                </h3>
                                <div className="sm:col-span-4">
                                    <TextAreaField label="Remarks" name="editRemarks" value={masterData.editRemarks} onChange={handleMasterChange} isFullWidth required />
                                </div>
                            </div>
                            :<></>}

                        {/* Error Message */}
                        {submitError && (
                            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center border border-red-100">
                                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                                {submitError}
                            </div>
                        )}

                    </form>
                </div>

                <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={handleCancel} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-300 rounded-lg transition" disabled={submitLoading}>
                        Cancel
                    </button>
                    <button 
                        onClick={handleInternalSubmit} 
                        disabled={submitLoading || selectedOwners.length === 0}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {editMode ? 'Update Property' : 'Create Property'}
                    </button>
                </div>
            </div>
        </div>
    );
};