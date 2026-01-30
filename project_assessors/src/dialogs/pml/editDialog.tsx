import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Landmark, X, Loader2, ClipboardList, LandPlot, Building as BuildingIcon, Factory, AlertTriangle, CheckCircle, Plus, Trash2, Layers, HardHat, Hammer, MapPin } from 'lucide-react';
// MOCK API IMPORT: Replace with actual import in your environment
// import api from '../../../axiosBase.ts';
const api = { 
    get: async (url: string, params?: any) => {
        // Mock data logic for lookups (LG_CODES, MT_CODES, etc.)
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        if (url.includes('lvg/list')) return { data: { data: [{ code: 'PRIME-01', name: 'Prime LGU' }] } };
        if (url.includes('p/plist')) return { data: [{ code: 'RES', classname: 'Residential' }, { code: 'COM', classname: 'Commercial' }] };
        if (url.includes('p/mtlist')) return { data: { data: [{ code: 'GEN-100', mt_id: 100 }, { code: 'HVAC-300', mt_id: 101 }] } };
        if (url.includes('p/maulist')) return { data: { data: [{ code: 'INDUSTRIAL', mau_id: 200 }, { code: 'COMMERCIAL', mau_id: 201 }] } };
        if (url.includes('p/bklist')) return { data: { data: [{ code: 'CONC', bk_id: 10 }, { code: 'WOOD', bk_id: 20 }] } };
        if (url.includes('p/stlist')) return { data: { data: [{ code: 'TYPE1', st_id: 30 }, { code: 'TYPE2', st_id: 40 }] } };
        if (url.includes('p/baulist')) return { data: { data: [{ code: 'RES', bau_id: 50 }, { code: 'COMM', bau_id: 60 }] } };
        if (url.includes('p/augetlist')) return { data: [{ code: 'AGRI', name: 'Agricultural' }] };
        if (url.includes('lvg/getID')) return { data: { lg_id: 10 } };
        if (url.includes('lvg/barangayList')) return { data: [{ barangay_name: 'Brgy A' }, { barangay_name: 'Brgy B' }] };
        if (url.includes('p/getCID')) return { data: { pc_id: 1 } };
        if (url.includes('p/splist')) return { data: [{ code: 'R1' }] };

        return { data: { data: [] } };
    }, 
    put: async (url: string, data: any) => ({ status: 200 }), // Mock PUT for update
    post: async (url: string, data: any) => ({ status: 200 }) // Mock POST for create
} as any;


// --- INTERFACE DEFINITIONS ---

type PropertyKind = 'Land' | 'Building' | 'Machinery';
type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
type OperationalCondition = 'OPERATIVE' | 'INOPERATIVE';
type MachineryCondition = 'NEW' | 'SECOND_HAND';

interface LandImprovement { id: number; improvement_name: string; quantity: number | ''; unit_value: number | ''; base_market_value: number; remarks: string; improvement_id?: number; }
interface BuildingFloorArea { floor_no: number; floor_area: number | ''; bfa_id?: number; building_id?: number; }
interface BuildingStructuralMaterial { id: number; part: 'ROOF' | 'FLOORING' | 'WALLS_PARTITIONS' | ''; floor_no: number | ''; material: string; bsm_id?: number; building_id?: number; }
interface BuildingAdditionalItem { id: number; item_name: string; quantity: number | ''; unit_cost: number | ''; total_cost: number; bai_id?: number; building_id?: number; }
interface MasterData { property_id?: number; arp_no: string; pin: string; owner_name: string; owner_address: string; lg_code: string; barangay: string; lot_no: string; block_no: string; property_kind: PropertyKind; description: string; status: PropertyStatus; owner_id?: number; barangay_id?: number; }
interface LandSpecificData { land_id?: number; pc_code: string; au_code: string; psc_code: string; lot_area: number | ''; remarks: string; shape?: string; topography?: string; corner_lot?: string; road_access?: string; additional_adj_factor?: string; }
interface BuildingSpecificData { building_id?: number; bk_id: string; st_id: string; bau_id: string; no_of_storeys: number | ''; year_constructed: number | ''; depreciation_rate: number | ''; additional_adj_factor: number | ''; remarks: string; floor_areas: BuildingFloorArea[]; structural_materials: BuildingStructuralMaterial[]; additional_items: BuildingAdditionalItem[]; }
interface MachinerySpecificData { machinery_id?: number; mt_id: string; mau_id: string; brand_model: string; capacity_hp: string; date_acquired: string; condition: MachineryCondition; economic_life: number | ''; remaining_life: number; year_installed: number | ''; year_initial_operation: number | ''; original_cost: number | ''; conversion_factor: number | ''; rcn: number; years_used: number; depreciation_rate: number; total_depreciation_value: number; depreciated_value: number; remarks: string; }

type SubmissionPayload = 
    | { kind: 'Land', master: MasterData, land: LandSpecificData, improvements: LandImprovement[] }
    | { kind: 'Building', master: MasterData, building: Omit<BuildingSpecificData, 'floor_areas' | 'structural_materials' | 'additional_items'>, floor_areas: BuildingFloorArea[], structural_materials: BuildingStructuralMaterial[], additional_items: BuildingAdditionalItem[] }
    | { kind: 'Machinery', master: MasterData, machinery: MachinerySpecificData };

interface PropertyFormProps { // Reused for the internal form body
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    isEdit: boolean;
    propertyToEditData?: any;
}

interface PropertyEditDialogProps { // Original props for the outer dialog
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    propertyId: number | null; 
}


// --- CONSTANTS AND INITIAL STATES ---
const BSM_PARTS = ['ROOF', 'FLOORING', 'WALLS_PARTITIONS']; 
const CONDITION_ENUM_MACHINERY: MachineryCondition[] = ['NEW', 'SECOND_HAND'];
const MACHINERY_SMV: { [key: string]: number } = {
    'GEN-100': 200000.00, 'HVAC-300': 150000.00, 'COMPR-50': 75000.00, '': 0.00,
};

const initialMasterData: MasterData = { arp_no: '', pin: '', owner_name: '', owner_address: '', lg_code: '', barangay: '', lot_no: '', block_no: '', property_kind: 'Land', description: '', status: 'ACTIVE' };
const initialLandData: LandSpecificData = { pc_code: '', psc_code: '', au_code: '', lot_area: '', remarks: '' };
const initialBuildingData: BuildingSpecificData = { bk_id: '', st_id: '', bau_id: '', no_of_storeys: 1, year_constructed: '', depreciation_rate: 0.00, additional_adj_factor: 1.0000, remarks: '', floor_areas: [{ floor_no: 1, floor_area: '' }], structural_materials: [], additional_items: [] };
const initialMachineryData: MachinerySpecificData = { mt_id: '', mau_id: '', brand_model: '', capacity_hp: '', date_acquired: '', condition: 'NEW', economic_life: 10, remaining_life: 10, year_installed: '', year_initial_operation: new Date().getFullYear(), original_cost: 0.00, conversion_factor: 1.00, rcn: 0.00, years_used: 0, depreciation_rate: 0.00, total_depreciation_value: 0.00, depreciated_value: 0.00, remarks: '' };


// --- UTILITY/HELPER COMPONENTS ---

const parseNumericValue = (value: string): string | number => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '' : numValue;
};

// --- CALCULATIONS ---
const calculateMachineryValues = (data: MachinerySpecificData): MachinerySpecificData => {
    const today = new Date().getFullYear();
    const originalCost = (data.original_cost as number) || 0;
    const conversionFactor = (data.conversion_factor as number) || 1.00;
    const economicLife = (data.economic_life as number) || 0;
    const yearInitialOperation = (data.year_initial_operation as number) || today;
    
    const rcn = originalCost * conversionFactor;
    let yearsUsed = 0;
    if (economicLife > 0 && yearInitialOperation > 0) {
        yearsUsed = Math.max(0, today - yearInitialOperation);
    }
    const depreciationRate = economicLife > 0 ? (100 / economicLife) : 0;
    const totalDepreciation = (rcn * (depreciationRate / 100)) * yearsUsed;
    const totalDepreciationValue = parseFloat(Math.min(rcn, totalDepreciation).toFixed(2));
    const depreciatedValue = parseFloat(Math.max(0, rcn - totalDepreciationValue).toFixed(2));
    const remainingLife = Math.max(0, economicLife - yearsUsed);

    return { ...data, rcn: parseFloat(rcn.toFixed(2)), years_used: yearsUsed, depreciation_rate: parseFloat(depreciationRate.toFixed(2)), total_depreciation_value: totalDepreciationValue, depreciated_value: depreciatedValue, remaining_life: remainingLife };
};

// --- INPUT FIELD COMPONENTS (Defined inside the file for compilation) ---

const InputField: React.FC<any> = ({ label, name, value, onChange, type = 'text', required = false, isFullWidth = false, readOnly = false, min = undefined, step = undefined, placeholder = '' }) => (
    <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
        <label className="block text-xs font-medium text-gray-700 mb-1">
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
            className={`mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-2 transition
            ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
        />
    </div>
);

const SelectField: React.FC<any> = ({ label, name, value, values, onChange, options, required = false, readOnly = false, isFullWidth = false }) => (
    <div className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
        <label className="block text-xs font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={readOnly || options.length === 0}
            className={`mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-2 transition
            ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'} ${options.length === 0 ? 'opacity-70' : ''}`}
        >
            {options.length === 0 && <option value="" disabled>{`Loading ${label.replace('', '').trim()}...`}</option>}
            <option value="" disabled>{`Select ${label.replace('', '').trim()}`}</option>
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
        <label className="block text-xs font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            rows={2}
            readOnly={readOnly}
            className={`mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-2 transition
            ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
        />
    </div>
);

const BuildingFloorAreaInput: React.FC<{ floor: BuildingFloorArea; onChange: (floorNo: number, value: number) => void; }> = ({ floor, onChange }) => (
    <InputField 
        key={`floor-${floor.floor_no}`}
        label={`Floor Area - Floor ${floor.floor_no}`}
        name={`floor_area_${floor.floor_no}`}
        value={floor.floor_area} 
        onChange={(_e: any, val: number) => onChange(floor.floor_no, val)} 
        type="number" 
        min="0.01"
        step="0.01"
        required
    />
);

const BuildingStructuralMaterialForm: React.FC<{ bsm: BuildingStructuralMaterial, floorCount: number, onChange: (id: number, name: keyof BuildingStructuralMaterial, value: string) => void, onRemove: (id: number) => void }> = ({ bsm, floorCount, onChange, onRemove }) => (
    <div key={bsm.id} className="grid grid-cols-12 gap-2 items-center bg-white border border-gray-200 p-3 rounded-md shadow-sm mb-3">
        {/* Part (ROOF, FLOORING, WALLS) */}
        <div className="col-span-4">
            <SelectField
                label="Part"
                name="part"
                value={bsm.part}
                onChange={(_e: any, val: string) => onChange(bsm.id, 'part', _e.target.value)}
                options={BSM_PARTS}
                required
            />
        </div>
        {/* Floor No. (Optional) */}
        <div className="col-span-3">
            <SelectField
                label="Floor (Optional)"
                name="floor_no"
                value={bsm.floor_no}
                onChange={(_e: any, val: string) => onChange(bsm.id, 'floor_no', _e.target.value)}
                options={Array.from({ length: floorCount }, (_, i) => (i + 1).toString())}
            />
        </div>
        {/* Material */}
        <div className="col-span-4">
            <InputField
                label="Material"
                name="material"
                value={bsm.material}
                onChange={(_e: any, val: string) => onChange(bsm.id, 'material', val)}
                required
            />
        </div>
        {/* Remove Button */}
        <div className="col-span-1 flex justify-end">
             <button
                type="button"
                onClick={() => onRemove(bsm.id)}
                className="p-1 text-red-500 hover:text-red-700 transition self-end"
                title="Remove Material"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const BuildingAdditionalItemForm: React.FC<{ bai: BuildingAdditionalItem, onChange: (id: number, name: keyof BuildingAdditionalItem, value: string | number) => void, onRemove: (id: number) => void }> = ({ bai, onChange, onRemove }) => (
    <div key={bai.id} className="grid grid-cols-12 gap-3 items-center bg-white border border-gray-200 p-3 rounded-md shadow-sm mb-3">
        {/* Item Name */}
        <div className="col-span-5">
            <InputField
                label="Item Name"
                name="item_name"
                value={bai.item_name}
                onChange={(_e: any, val: string) => onChange(bai.id, 'item_name', val)}
                required
            />
        </div>
        {/* Quantity */}
        <div className="col-span-2">
            <InputField
                label="Qty"
                name="quantity"
                value={bai.quantity}
                onChange={(_e: any, val: number) => onChange(bai.id, 'quantity', val)}
                type="number"
                min="1"
                step="1"
                required
            />
        </div>
        {/* Unit Cost */}
        <div className="col-span-3">
            <InputField
                label="Unit Cost"
                name="unit_cost"
                value={bai.unit_cost}
                onChange={(_e: any, val: number) => onChange(bai.id, 'unit_cost', val)}
                type="number"
                min="0"
                step="0.01"
                required
            />
        </div>
        {/* Total Cost / Remove Button */}
        <div className="col-span-2 flex justify-between items-end">
            <p className="text-sm font-medium text-gray-700 ml-2">
                {bai.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <button
                type="button"
                onClick={() => onRemove(bai.id)}
                className="p-1 text-red-500 hover:text-red-700 transition"
                title="Remove Item"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    </div>
);


// --- START: PROPERTY FORM BODY (Contains all state, logic, and rendering) ---
const PropertyFormBody: React.FC<PropertyFormProps> = ({
    showDialog,
    setShowDialog,
    setRefresh,
    isEdit,
    propertyToEditData,
}) => {
    // --- LOOKUP DATA STATES ---
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
    const [selectedLGCode, setSelectedLGCode] = useState('');
    const [selectedPCCode, setSelectedPCCode] = useState('');
    const [MT_CODES, setMT_CODES] = useState([]);
    const [MT_VALUES, setMT_VALUES] = useState([]);
    const [MAU_CODES, setMAU_CODES] = useState([]);
    const [MAU_VALUES, setMAU_VALUES] = useState([]);

    // --- FORM DATA STATES ---
    const [masterData, setMasterData] = useState<MasterData>(initialMasterData);
    const [landData, setLandData] = useState<LandSpecificData>(initialLandData);
    const [buildingData, setBuildingData] = useState<BuildingSpecificData>(initialBuildingData);
    const [machineryData, setMachineryData] = useState<MachinerySpecificData>(initialMachineryData); 
    const [improvements, setImprovements] = useState<LandImprovement[]>([]);
    
    // --- UI STATES ---
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
    const [nextLandImprovementId, setNextLandImprovementId] = useState(1);
    const [nextBSMId, setNextBSMId] = useState(1);
    const [nextBAIId, setNextBAIId] = useState(1);

    // --- Reset/Close Logic ---
    const handleResetAllStates = useCallback(() => {
        setMasterData(initialMasterData);
        setLandData(initialLandData);
        setBuildingData(initialBuildingData);
        setMachineryData(initialMachineryData);
        setImprovements([]);
        setSubmitError(null);
        setSubmitLoading(false);
        setSubmissionSuccessful(false);
        setSelectedLGCode('');
        setSelectedPCCode('');
    }, []);

    const handleCancel = () => {
        handleResetAllStates(); 
        setShowDialog(false);
    };

    const handleCloseOnSuccess = () => {
        setShowDialog(false);
        setRefresh(prev => !prev);
        handleResetAllStates();
    }


    // --- DATA HYDRATION EFFECT FOR EDIT MODE ---
    useEffect(() => {
        if (isEdit && propertyToEditData) {
            const data = propertyToEditData;
            
            // 1. Master Data
            setMasterData(prev => ({
                ...prev,
                ...data,
                property_id: data.property_id,
            }));
            setSelectedLGCode(data.lg_code);
            setSelectedPCCode(data.details.pc_code || ''); // For Land specific lookups

            // 2. Specific Data & Nested Arrays
            const details = data.details || {};
            const kind = data.property_kind;

            if (kind === 'Land') {
                setLandData(prev => ({ ...prev, ...details }));
                // Hydrate Land Improvements
                const hydratedImprovements = (details.other_improvements || []).map((imp, index) => ({
                    ...imp,
                    id: imp.improvement_id || index + 1,
                    quantity: parseFloat(imp.quantity) || 0,
                    unit_value: parseFloat(imp.unit_value) || 0,
                    base_market_value: parseFloat(imp.base_market_value) || 0,
                }));
                setImprovements(hydratedImprovements);
                setNextLandImprovementId(hydratedImprovements.reduce((max, imp) => Math.max(max, imp.id), 0) + 1);

            } else if (kind === 'Building') {
                // Hydrate Building Core Data
                setBuildingData(prev => ({
                    ...prev,
                    ...details,
                    no_of_storeys: details.no_of_storeys || '',
                    year_constructed: details.year_constructed || '',
                }));

                // Hydrate Building Nested Arrays
                const hydrateArray = (arr, idKey, nextIdSetter) => {
                    const hydrated = (arr || []).map((item, index) => ({
                        ...item,
                        id: item[idKey] || index + 1,
                        // Parse numbers if they are strings from API
                        quantity: item.quantity !== undefined ? parseFloat(item.quantity) || item.quantity : '',
                        unit_cost: item.unit_cost !== undefined ? parseFloat(item.unit_cost) || item.unit_cost : '',
                        total_cost: parseFloat(item.total_cost) || 0,
                    }));
                    nextIdSetter(hydrated.reduce((max, item) => Math.max(max, item.id), 0) + 1);
                    return hydrated;
                };

                const hydratedFloorAreas = (details.floor_areas || []).map(fa => ({
                    ...fa, 
                    floor_area: parseFloat(fa.floor_area) || '',
                }));
                setBuildingData(prev => ({ ...prev, floor_areas: hydratedFloorAreas }));

                const hydratedStructural = hydrateArray(details.structural_materials, 'bsm_id', setNextBSMId);
                setBuildingData(prev => ({ ...prev, structural_materials: hydratedStructural }));

                const hydratedAdditional = hydrateArray(details.additional_items, 'bai_id', setNextBAIId);
                setBuildingData(prev => ({ ...prev, additional_items: hydratedAdditional }));

            } else if (kind === 'Machinery') {
                // Hydrate Machinery Data
                setMachineryData(prev => ({
                    ...prev,
                    ...details,
                    economic_life: details.economic_life || '',
                    year_installed: details.year_installed || '',
                    year_initial_operation: details.year_initial_operation || '',
                    original_cost: parseFloat(details.original_cost) || 0.00,
                    conversion_factor: parseFloat(details.conversion_factor) || 1.00,
                    // Calculated fields are re-calculated by the useEffect, but we set them here for immediate display if API provides them
                    rcn: parseFloat(details.rcn) || 0.00,
                    years_used: parseInt(details.years_used) || 0,
                    depreciation_rate: parseFloat(details.depreciation_rate) || 0.00,
                    total_depreciation_value: parseFloat(details.total_depreciation_value) || 0.00,
                    depreciated_value: parseFloat(details.depreciated_value) || 0.00,
                }));
            }
        } else if (!isEdit) {
            // Reset to initial states when switching to create mode
            handleResetAllStates(); 
        }
    }, [isEdit, propertyToEditData]);


    // --- DATA FETCHING EFFECTS ---
    // (Rest of the lookup useEffects remain here, omitted for brevity)

    // Fetch initial lookups (LGU, Land PC, Land AU, Building Lookups, Machinery Lookups)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const lgRes = await api.get('lvg/list');
                setLG_CODES(lgRes.data.data.map((item: any) => item.code));
                const pcRes = await api.get('p/plist');
                setPC_CODES(pcRes.data.map((item: any) => item.code));
                setPC_NAMES(pcRes.data.map((item: any) => item.classname));
                const auRes = await api.get('p/augetlist');
                setLAND_AU_CODES(auRes.data.map((item: any) => item.code));
                const bkRes = await api.get('p/bklist');
                setBK_CODES(bkRes.data.data.map((item: any) => item.code));
                setBK_VALUES(bkRes.data.data.map((item: any) => item.bk_id));
                const stRes = await api.get('p/stlist');
                setSTRUCTURAL_TYPES(stRes.data.data.map((item: any) => item.code));
                setSTRUCTURAL_VALUES(stRes.data.data.map((item: any) => item.st_id));
                const bauRes = await api.get('p/baulist');
                setBUILDING_AU_CODES_LIST(bauRes.data.data.map((item: any) => item.code));
                setBUILDING_AU_VALUES(bauRes.data.data.map((item: any) => item.bau_id));
                const mtRes = await api.get('p/mtlist');
                setMT_CODES(mtRes.data.data.map((item: any) => item.code));
                setMT_VALUES(mtRes.data.data.map((item: any) => item.mt_id));
                const mauRes = await api.get('p/maulist');
                setMAU_CODES(mauRes.data.data.map((item: any) => item.code));
                setMAU_VALUES(mauRes.data.data.map((item: any) => item.mau_id));
            } catch (error) {
                console.error("Error fetching initial lookup data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Barangays when LGU changes
    useEffect(() => {
        const fetchBarangays = async () => {
            if (!selectedLGCode) { setBARANGAY_CODES([]); return; }
            try {
                const lgIdRes = await api.get('lvg/getID', { params: { code: selectedLGCode } });
                const lg_id = lgIdRes.data.lg_id;
                const brgyRes = await api.get('lvg/barangayList', { params: { lg_id } });
                setBARANGAY_CODES(brgyRes.data.map((item: any) => item.barangay_name));
            } catch (error) { console.error("Error fetching barangay list:", error); }
        };
        fetchBarangays();
    }, [selectedLGCode]);

    // Fetch Subclassifications when Land PC changes
    useEffect(() => {
        const fetchSubClass = async () => {
            if (!selectedPCCode) { setLAND_PSC_CODES([]); return; }
            try {
                const pcIdRes = await api.get('p/getCID', { params: { code: selectedPCCode } });
                const pc_id = pcIdRes.data.pc_id;
                const pscRes = await api.get('p/splist', { params: { pc_id } });
                setLAND_PSC_CODES(pscRes.data.map((item: any) => item.code));
            } catch (error) { console.error("Error fetching sub-classification list:", error); }
        };
        fetchSubClass();
    }, [selectedPCCode]);


    // --- MACHINERY DEPRECIATION EFFECT ---
    useEffect(() => {
        const calculatedData = calculateMachineryValues(machineryData);
        if (
            machineryData.rcn !== calculatedData.rcn || 
            machineryData.depreciated_value !== calculatedData.depreciated_value || 
            machineryData.remaining_life !== calculatedData.remaining_life
        ) {
            setMachineryData(calculatedData);
        }
    }, [machineryData.original_cost, machineryData.conversion_factor, machineryData.economic_life, machineryData.year_initial_operation]);


    // --- HANDLERS (handleMasterChange, handleSpecificChange, etc. remain here) ---
    const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: string | number) => {
        const { name } = e.target;
        const finalValue = value !== undefined ? value : e.target.value;
        
        setMasterData(prev => ({ ...prev, [name]: finalValue as any }));
        if (name === 'lg_code') { setSelectedLGCode(finalValue as string); setMasterData(prev => ({ ...prev, barangay: '' })); }
        if (name === 'property_kind') { setSelectedPCCode(''); setLandData(initialLandData); setBuildingData(initialBuildingData); setMachineryData(initialMachineryData); }
    };

    const handleSpecificChange = (setter: React.Dispatch<React.SetStateAction<any>>) => 
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value?: string | number) => {
        const { name } = e.target;
        const finalValue = value !== undefined ? value : e.target.value;

        if (masterData.property_kind === 'Land' && name === 'pc_code') {
            setSelectedPCCode(finalValue as string);
            setter((prev: LandSpecificData) => ({ ...prev, [name]: finalValue as any, psc_code: '' }));
        } 
        else if (masterData.property_kind === 'Machinery' && name === 'mt_id') {
            const selectedMT = finalValue as string;
            const smv = MACHINERY_SMV[selectedMT] || 0.00;
            setter((prev: MachinerySpecificData) => {
                let newState: MachinerySpecificData = { ...prev, [name]: selectedMT, original_cost: smv };
                return calculateMachineryValues(newState);
            });
        }
        else {
            setter((prev: any) => {
                const newState = { ...prev, [name]: finalValue as any };
                if (masterData.property_kind === 'Machinery') {
                    return calculateMachineryValues(newState);
                }
                return newState;
            });
        }
    };

    // (Building, Land, and Submission Handlers remain here)
    const handleFloorAreaChange = useCallback((floorNo: number, value: number) => { setBuildingData(prev => ({ ...prev, floor_areas: prev.floor_areas.map(fa => fa.floor_no === floorNo ? { ...fa, floor_area: value } : fa) })); }, []);
    useEffect(() => { /* Building Storeys logic */ }, [buildingData.no_of_storeys]);
    const handleAddBSM = useCallback(() => { setBuildingData(prev => ({ ...prev, structural_materials: [...prev.structural_materials, { id: nextBSMId, part: '', floor_no: '', material: '' }] })); setNextBSMId(prev => prev + 1); }, [nextBSMId]);
    const handleRemoveBSM = useCallback((id: number) => { setBuildingData(prev => ({ ...prev, structural_materials: prev.structural_materials.filter(bsm => bsm.id !== id) })); }, []);
    const handleBSMChange = useCallback((id: number, name: keyof BuildingStructuralMaterial, value: string) => { setBuildingData(prev => ({ ...prev, structural_materials: prev.structural_materials.map(bsm => bsm.id === id ? { ...bsm, [name]: value } : bsm) })); }, []);
    const handleAddBAI = useCallback(() => { setBuildingData(prev => ({ ...prev, additional_items: [...prev.additional_items, { id: nextBAIId, item_name: '', quantity: '', unit_cost: '', total_cost: 0 }] })); setNextBAIId(prev => prev + 1); }, [nextBAIId]);
    const handleRemoveBAI = useCallback((id: number) => { setBuildingData(prev => ({ ...prev, additional_items: prev.additional_items.filter(bai => bai.id !== id) })); }, []);
    const handleBAIChange = useCallback((id: number, name: keyof BuildingAdditionalItem, value: string | number) => { setBuildingData(prev => ({ ...prev, additional_items: prev.additional_items.map(bai => { if (bai.id !== id) return bai; const newBai: BuildingAdditionalItem = { ...bai, [name]: value }; const quantity = newBai.quantity as number || 0; const unit_cost = newBai.unit_cost as number || 0; newBai.total_cost = quantity * unit_cost; return newBai; }) })); }, []);
    const totalBAIValue = useMemo(() => { return buildingData.additional_items.reduce((sum, item) => sum + item.total_cost, 0); }, [buildingData.additional_items]);
    const handleAddImprovement = useCallback(() => { setImprovements(prev => [...prev, { id: nextLandImprovementId, improvement_name: '', quantity: 1, unit_value: 0, base_market_value: 0, remarks: '' }]); setNextLandImprovementId(prev => prev + 1); }, [nextLandImprovementId]);
    const handleRemoveImprovement = useCallback((id: number) => { setImprovements(prev => prev.filter(imp => imp.id !== id)); }, []);
    const handleImprovementChange = useCallback((id: number, name: keyof LandImprovement, value: string | number) => { setImprovements(prev => prev.map(imp => { if (imp.id !== id) return imp; const newImp: LandImprovement = { ...imp, [name]: value as any }; if (name === 'quantity' || name === 'unit_value') { const quantity = newImp.quantity as number || 0; const unit_value = newImp.unit_value as number || 0; newImp.base_market_value = quantity * unit_value; } return newImp; })); }, []);
    const totalImprovementValue = useMemo(() => { return improvements.reduce((sum, imp) => sum + imp.base_market_value, 0); }, [improvements]);
    
    // Final Submission Logic (Simplified for system response)
    const validateAndGetPayload = (): SubmissionPayload | null => { /* Validation logic */ return { kind: masterData.property_kind, master: masterData, land: landData, improvements: improvements, building: buildingData, floor_areas: buildingData.floor_areas, structural_materials: buildingData.structural_materials, additional_items: buildingData.additional_items, machinery: machineryData } as any; };
    const handleInternalSubmit = async () => {
        setSubmitError(null);
        setSubmitLoading(true);
        const payload = validateAndGetPayload();
        if (!payload) { setSubmitLoading(false); return; }
        try {
            const lgRes = await api.get('lvg/getID', {params: {code: payload.master.lg_code}});
            const lg_code_from_api = lgRes.data.code;
            const apiMethod = isEdit ? 'put' : 'post';
            const apiEndpoint = isEdit ? `pml/update/${masterData.property_id}` : 'pml/add';
            const dataToPost = { ...payload.master, lg_code: lg_code_from_api, details: payload.kind === 'Land' ? payload.land : payload.kind === 'Building' ? { ...payload.building, floor_areas: payload.floor_areas, structural_materials: payload.structural_materials, additional_items: payload.additional_items } : payload.machinery, improvements: payload.kind === 'Land' ? payload.improvements : [] };
            await api[apiMethod](apiEndpoint, dataToPost);
            setSubmissionSuccessful(true);
        } catch (error) {
            console.error("Submission failed:", error);
            setSubmitError(`Failed to save property. Please check the network and API endpoint. [${(error as any)?.response?.data?.details || 'Unknown Error'}]`);
        } finally { setSubmitLoading(false); }
    };


    // --- DYNAMIC RENDERING ---
    const PropertyIcon = ({ kind }: { kind: PropertyKind }) => {
        switch (kind) {
            case 'Land': return <LandPlot className="w-6 h-6 text-emerald-600 mr-3" />;
            case 'Building': return <BuildingIcon className="w-6 h-6 text-emerald-600 mr-3" />;
            case 'Machinery': return <Factory className="w-6 h-6 text-emerald-600 mr-3" />;
            default: return <MapPin className="w-6 h-6 text-emerald-600 mr-3" />;
        }
    }

    if (!showDialog) return null;

    if (submissionSuccessful) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="success-title">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-6 animate-pulse" />
                    <h2 id="success-title" className="text-3xl font-bold text-gray-900 mb-2">{isEdit ? 'Update Successful!' : 'Success!'}</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        The {masterData.property_kind} Property record (**{masterData.arp_no}**) has been successfully {isEdit ? 'updated' : 'created'}.
                    </p>
                    <button
                        onClick={handleCloseOnSuccess}
                        type="button"
                        className="px-8 py-3 text-lg font-medium text-white rounded-xl shadow-lg transition duration-200 ease-in-out bg-emerald-600 hover:bg-emerald-700 flex items-center"
                    >
                        Close and View List
                    </button>
                </div>
            </div>
        );
    }


    const dialogTitle = isEdit ? `Edit Existing ${masterData.property_kind} Property Record` : `Create New ${masterData.property_kind} Property Record`;
    const submitButtonText = isEdit ? 'Update Property' : `Create ${masterData.property_kind} Property`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-200">
                    <h2 id="dialog-title" className="text-2xl font-bold text-gray-900 flex items-center">
                        <PropertyIcon kind={masterData.property_kind} />
                        {dialogTitle}
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        title="Close"
                        disabled={submitLoading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleInternalSubmit(); }}>
                        
                        {/* --- 1. Owner Details Section (Master List) --- */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4 border-b pb-2">
                                <ClipboardList className="w-5 h-5 mr-2 text-emerald-500" /> Owner & Registration Info
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <InputField label="ARP No. " name="arp_no" value={masterData.arp_no} onChange={handleMasterChange} required readOnly={isEdit} />
                                <InputField label="PIN (Parcel ID)" name="pin" value={masterData.pin} onChange={handleMasterChange} readOnly={isEdit} />
                                <div className="sm:col-span-2">
                                    <InputField label="Owner Name " name="owner_name" value={masterData.owner_name} onChange={handleMasterChange} required isFullWidth />
                                </div>
                                <div className="sm:col-span-4">
                                    <TextAreaField label="Owner Address" name="owner_address" value={masterData.owner_address} onChange={handleMasterChange} isFullWidth />
                                </div>
                            </div>
                        </div>

                        {/* --- 2. Location & Property Kind Section (Master List) --- */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4 border-b pb-2">
                                <Landmark className="w-5 h-5 mr-2 text-emerald-500" /> Location & Type
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <SelectField
                                    label="Property Kind "
                                    name="property_kind"
                                    value={masterData.property_kind}
                                    onChange={handleMasterChange}
                                    options={['Land', 'Building', 'Machinery']}
                                    required
                                    readOnly={isEdit} // Prevent changing type in edit mode
                                />
                                <SelectField
                                    label="LGU Code "
                                    name="lg_code"
                                    value={masterData.lg_code}
                                    onChange={handleMasterChange}
                                    options={LG_CODES}
                                    required
                                    readOnly={isEdit}
                                />
                                <SelectField
                                    label="Barangay "
                                    name="barangay"
                                    value={masterData.barangay}
                                    onChange={handleMasterChange}
                                    options={BARANGAY_CODES}
                                    required
                                    readOnly={!selectedLGCode || BARANGAY_CODES.length === 0 || isEdit}
                                />
                                <InputField label="Status" name="status" value="ACTIVE" onChange={handleMasterChange} readOnly />

                                <InputField label="Lot No." name="lot_no" value={masterData.lot_no} onChange={handleMasterChange} />
                                <InputField label="Block No." name="block_no" value={masterData.block_no} onChange={handleMasterChange} />
                                <div className="sm:col-span-2">
                                    <TextAreaField label="Master Description" name="description" value={masterData.description} onChange={handleMasterChange} isFullWidth />
                                </div>
                            </div>
                        </div>
                        
                        {/* --- 3. Specific Property Details Section --- */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-emerald-50/20">
                             <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4 border-b pb-2">
                                 {masterData.property_kind} Specific Details
                             </h3>
                            { 
                                masterData.property_kind === 'Land'?  // LAND PROPERTIES
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <SelectField
                                                label="Land Classification (PC) Code "
                                                name="pc_code"
                                                value={landData.pc_code}
                                                onChange={handleSpecificChange(setLandData)}
                                                options={PC_NAMES}
                                                values={PC_CODES}
                                                required
                                            />
                                            <SelectField
                                                label="Sub-Classification (PSC) Code "
                                                name="psc_code"
                                                value={landData.psc_code}
                                                onChange={handleSpecificChange(setLandData)}
                                                options={LAND_PSC_CODES}
                                                required
                                                readOnly={!landData.pc_code || LAND_PSC_CODES.length === 0}
                                            />
                                            <SelectField
                                                label="Actual Use (AU) Code "
                                                name="au_code"
                                                value={landData.au_code}
                                                onChange={handleSpecificChange(setLandData)}
                                                options={LAND_AU_CODES}
                                                required
                                            />
                                            <InputField 
                                                label="Lot Area (sqm) " 
                                                name="lot_area" 
                                                value={landData.lot_area} 
                                                onChange={handleSpecificChange(setLandData)} 
                                                type="number" 
                                                min="0.01"
                                                step="0.01"
                                                required 
                                            />
                                            <TextAreaField label="Land Remarks" name="remarks" value={landData.remarks} onChange={handleSpecificChange(setLandData)} isFullWidth />
                                        </div>
                                        
                                        {/* Land Improvements Section */}
                                        <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-emerald-50/50">
                                            <h3 className="text-lg font-semibold text-gray-700 flex justify-between items-center mb-4">
                                                <span className="flex items-center">
                                                    <Landmark className="w-5 h-5 mr-2 text-emerald-500" /> Land Other Improvements
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleAddImprovement}
                                                    className="px-3 py-1 text-sm font-medium text-white rounded-md bg-emerald-500 hover:bg-emerald-600 transition flex items-center shadow-md"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Add
                                                </button>
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-300">
                                                            <th className="py-2 text-left font-medium text-gray-600">Improvement Name</th>
                                                            <th className="py-2 text-center font-medium text-gray-600 w-24">Qty</th>
                                                            <th className="py-2 text-right font-medium text-gray-600 w-32">Unit Value</th>
                                                            <th className="py-2 text-right font-medium text-gray-600 w-32">Total Value (BMV)</th>
                                                            <th className="py-2 text-center font-medium text-gray-600 w-16">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {improvements.map(imp => (
                                                        <tr key={imp.id} className="hover:bg-gray-100">
                                                            <td className="py-2">
                                                                <input
                                                                    type="text"
                                                                    value={imp.improvement_name}
                                                                    onChange={(e) => handleImprovementChange(imp.id, 'improvement_name', e.target.value)}
                                                                    placeholder="e.g., Concrete Fence"
                                                                    className="w-full text-sm p-1 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    value={imp.quantity}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                                        handleImprovementChange(imp.id, 'quantity', val);
                                                                    }}
                                                                    className="w-full text-sm p-1 border rounded-md text-right focus:ring-emerald-500 focus:border-emerald-500"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={imp.unit_value}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                                        handleImprovementChange(imp.id, 'unit_value', val);
                                                                    }}
                                                                    className="w-full text-sm p-1 border rounded-md text-right focus:ring-emerald-500 focus:border-emerald-500"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2 text-right font-medium text-gray-900 bg-gray-50 rounded-md">
                                                                {imp.base_market_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="py-2 px-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImprovement(imp.id)}
                                                                    className="p-1 text-red-500 hover:text-red-700 transition"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="font-bold text-gray-800">
                                                            <td colSpan={3} className="pt-3 text-right">Total Improvements Value:</td>
                                                            <td className="pt-3 px-2 text-right text-lg text-emerald-800">{totalImprovementValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                            {improvements.length === 0 && (
                                                <p className="text-center text-gray-500 italic py-4">Click "Add" to list permanent improvements on the land.</p>
                                            )}
                                        </div>
                                    </div>:
                                
                                masterData.property_kind === 'Building'? // BUILDING PROPERTIES (NEW STRUCTURE)
                                    <div className="space-y-6">
                                        {/* === 3.1 Core Building Data === */}
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            {/* Building Kind (bk_id) */}
                                            <SelectField
                                                label="Building Kind "
                                                name="bk_id"
                                                value={buildingData.bk_id}
                                                onChange={handleSpecificChange(setBuildingData)}
                                                options={BK_CODES} 
                                                values={BK_VALUES}
                                                required
                                            />
                                            
                                            {/* Structural Type (st_id) - NEW FIELD */}
                                            <SelectField
                                                label="Structural Type "
                                                name="st_id"
                                                value={buildingData.st_id}
                                                onChange={handleSpecificChange(setBuildingData)}
                                                values={STRUCTURAL_VALUES} 
                                                options={STRUCTURAL_TYPES} 
                                                required
                                            />
                                            
                                            {/* Building Actual Use (bau_id) */}
                                            <SelectField
                                                label="Actual Use (AU) Code "
                                                name="bau_id"
                                                value={buildingData.bau_id}
                                                onChange={handleSpecificChange(setBuildingData)}
                                                values={BUILDING_AU_VALUES}
                                                options={BUILDING_AU_CODES_LIST}
                                                required
                                            />

                                            {/* No. of Storeys (Controls Floor Area Inputs) */}
                                            <InputField 
                                                label="No. of Storeys" 
                                                name="no_of_storeys" 
                                                value={buildingData.no_of_storeys} 
                                                onChange={handleSpecificChange(setBuildingData)} 
                                                type="number" 
                                                min="1"
                                                step="1"
                                                required
                                            />

                                            {/* Year Constructed */}
                                            <InputField 
                                                label="Year Constructed" 
                                                name="year_constructed" 
                                                value={buildingData.year_constructed} 
                                                onChange={handleSpecificChange(setBuildingData)} 
                                                type="number" 
                                                min="1900"
                                                step="1"
                                            />
                                            
                                            {/* Building Remarks */}
                                            <TextAreaField 
                                                label="Building Remarks" 
                                                name="remarks" 
                                                value={buildingData.remarks} 
                                                onChange={handleSpecificChange(setBuildingData)} 
                                                isFullWidth 
                                            />
                                        </div>

                                        {/* === 3.2 Building Floor Areas (BuildingFloorAreas Table) === */}
                                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                            <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center border-b pb-2">
                                                <Layers className="w-5 h-5 mr-2 text-emerald-600" />
                                                Floor Areas (sqm) - {buildingData.no_of_storeys || 0} Storey(s)
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                {buildingData.floor_areas.map((floor) => (
                                                    <BuildingFloorAreaInput 
                                                        key={floor.floor_no} 
                                                        floor={floor} 
                                                        onChange={handleFloorAreaChange} 
                                                    />
                                                ))}
                                            </div>
                                            {buildingData.floor_areas.length === 0 && buildingData.no_of_storeys > 0 && (
                                                <p className="text-center text-red-500 italic py-2">Please enter a valid number of storeys (1 or more).</p>
                                            )}
                                        </div>
                                        
                                        {/* === 3.3 Structural Materials (BuildingStructuralMaterials Table) === */}
                                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                            <h3 className="text-md font-semibold text-gray-700 mb-3 flex justify-between items-center border-b pb-2">
                                                <span className="flex items-center">
                                                    <HardHat className="w-5 h-5 mr-2 text-emerald-600" />
                                                    Structural Materials
                                                </span>
                                                <button
                                                    type="button" 
                                                    className="px-3 py-1 text-sm font-medium text-white rounded-md bg-emerald-500 hover:bg-emerald-600 transition flex items-center shadow-md"
                                                    onClick={handleAddBSM} 
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Add Part
                                                </button>
                                            </h3>
                                            {buildingData.structural_materials.map((bsm) => (
                                                <BuildingStructuralMaterialForm 
                                                    key={bsm.id} 
                                                    bsm={bsm} 
                                                    floorCount={buildingData.no_of_storeys as number}
                                                    onChange={handleBSMChange} 
                                                    onRemove={handleRemoveBSM} 
                                                />
                                            ))}
                                            {buildingData.structural_materials.length === 0 && (
                                                <p className="text-center text-gray-500 italic py-2">Click "Add Part" to document structural components.</p>
                                            )}
                                        </div>

                                        {/* === 3.4 Additional Items (BuildingAdditionalItems Table) === */}
                                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                            <h3 className="text-md font-semibold text-gray-700 mb-3 flex justify-between items-center border-b pb-2">
                                                <span className="flex items-center">
                                                    <Hammer className="w-5 h-5 mr-2 text-emerald-600" />
                                                    Additional Items
                                                </span>
                                                <button
                                                    type="button" 
                                                    className="px-3 py-1 text-sm font-medium text-white rounded-md bg-emerald-500 hover:bg-emerald-600 transition flex items-center shadow-md"
                                                    onClick={handleAddBAI} 
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Add Item
                                                </button>
                                            </h3>
                                            {buildingData.additional_items.map((bai) => (
                                                <BuildingAdditionalItemForm 
                                                    key={bai.id} 
                                                    bai={bai} 
                                                    onChange={handleBAIChange} 
                                                    onRemove={handleRemoveBAI} 
                                                />
                                            ))}
                                            {buildingData.additional_items.length === 0 ? (
                                                <p className="text-center text-gray-500 italic py-2">Click "Add Item" to list fixtures or additional components.</p>
                                            ) : (
                                                <div className="text-right mt-4 font-bold text-gray-800">
                                                    Total Additional Items Value: <span className="text-lg text-emerald-800">{totalBAIValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                        </div>

                                    </div>:
                                
                                // MACHINERY PROPERTIES (UPDATED STRUCTURE)
                                <div className="space-y-4">
                                    {/* Row 1: Type, Actual Use, Brand/Model, Capacity/HP */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField
                                            label="Machinery Type "
                                            name="mt_id"
                                            value={machineryData.mt_id}
                                            onChange={handleSpecificChange(setMachineryData)}
                                            values={MT_VALUES}
                                            options={MT_CODES}
                                            required
                                        />
                                        <SelectField
                                            label="Actual Use "
                                            name="mau_id"
                                            value={machineryData.mau_id}
                                            onChange={handleSpecificChange(setMachineryData)}
                                            values={MAU_VALUES}
                                            options={MAU_CODES}
                                            required
                                        />
                                        <InputField 
                                            label="Brand/Model" 
                                            name="brand_model" 
                                            value={machineryData.brand_model} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            required
                                        />
                                        <InputField 
                                            label="Capacity (HP)" 
                                            name="capacity_hp" 
                                            value={machineryData.capacity_hp} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            required
                                        />
                                    </div>
                                    
                                    {/* Row 2: Condition, Economic Life, Years Installed/Operation */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <SelectField
                                            label="Condition"
                                            name="condition"
                                            value={machineryData.condition}
                                            onChange={handleSpecificChange(setMachineryData)}
                                            options={CONDITION_ENUM_MACHINERY}
                                        />
                                        <InputField 
                                            label="Economic Life (Years)" 
                                            name="economic_life" 
                                            value={machineryData.economic_life} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            type="number" 
                                            min="1"
                                            step="1"
                                            required
                                        />
                                        <InputField 
                                            label="Year Installed" 
                                            name="year_installed" 
                                            value={machineryData.year_installed} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            type="number" 
                                            min="1900"
                                            step="1"
                                        />
                                        <InputField 
                                            label="Year Initial Operation " 
                                            name="year_initial_operation" 
                                            value={machineryData.year_initial_operation} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            type="number" 
                                            min="1900"
                                            step="1"
                                            required
                                        />
                                    </div>
                                    
                                    {/* Row 3: Date Acquired, Conversion Factor, Remaining Life, Original Cost/Remarks */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <InputField 
                                            label="Date Acquired" 
                                            name="date_acquired" 
                                            value={machineryData.date_acquired} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            type="date" 
                                        />
                                        <InputField 
                                            label="Conversion Factor" 
                                            name="conversion_factor" 
                                            value={machineryData.conversion_factor} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            type="number" 
                                            min="0.01"
                                            step="0.01"
                                        />
                                        <InputField 
                                            label="Remaining Life (Years)" 
                                            name="remaining_life" 
                                            value={machineryData.remaining_life} 
                                            readOnly
                                        />
                                        <InputField 
                                            label={`Original Cost (SMV: ${MACHINERY_SMV[machineryData.mt_id] ? MACHINERY_SMV[machineryData.mt_id]?.toLocaleString('en-US') : 'N/A'})`}
                                            name="original_cost" 
                                            value={machineryData.original_cost} 
                                            onChange={handleSpecificChange(setMachineryData)} 
                                            type="number" 
                                            min="0.01"
                                            step="0.01"
                                            required 
                                        />
                                    </div>
                                    
                                    {/* Valuation Readouts */}
                                    <div className="p-4 border border-gray-300 rounded-lg bg-white grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                                        <FieldRow label="Years Used (Age)" value={machineryData.years_used} />
                                        <FieldRow label="Depreciation Rate (%)" value={machineryData.depreciation_rate.toFixed(2)} />
                                        <FieldRow label="RCN (Reproduction Cost New)" value={machineryData.rcn.toLocaleString('en-US', { minimumFractionDigits: 2 })} />
                                        <FieldRow label="Total Depreciation Value" value={machineryData.total_depreciation_value.toLocaleString('en-US', { minimumFractionDigits: 2 })} />
                                        <FieldRow label="Depreciated Value (Sound Value)" value={machineryData.depreciated_value.toLocaleString('en-US', { minimumFractionDigits: 2 })} isFull />
                                    </div>

                                    {/* Remarks */}
                                    <TextAreaField label="Machinery Remarks" name="remarks" value={machineryData.remarks} onChange={handleSpecificChange(setMachineryData)} isFullWidth />

                                </div>
                            }
                        </div>

                        {/* Hidden input to allow form submission via button */}
                        <input type="hidden" /> 
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl">
                    <div className="flex flex-col space-y-1">
                        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleCancel}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition"
                            disabled={submitLoading}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleInternalSubmit}
                            type="button"
                            disabled={submitLoading}
                            className={`px-6 py-2 text-sm font-medium text-white rounded-md shadow-lg transition duration-200 ease-in-out flex items-center justify-center
                                bg-emerald-600 hover:bg-emerald-700
                                ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {submitLoading && (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            )}
                            <Plus className="w-4 h-4 mr-2 -ml-1" /> {submitButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- END: PROPERTY FORM BODY (Previously PropertyCreationDialog) ---


// --- START: EXPORTED DIALOGS ---

// The primary exported component for creating new records
export const PropertyCreationDialog: React.FC<PropertyFormProps> = (props) => {
    return <PropertyFormBody {...props} isEdit={false} propertyToEditData={undefined} />;
}

// The secondary exported component for fetching and editing existing records
export const PropertyEditDialog: React.FC<PropertyEditDialogProps> = ({
    showDialog,
    setShowDialog,
    setRefresh,
    propertyId,
}) => {
    const [propertyData, setPropertyData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data when the dialog opens or propertyId changes
    useEffect(() => {
        if (showDialog && propertyId) {
            const loadData = async () => {
                setLoading(true);
                setError(null);
                setPropertyData(null);
                try {
                    const data = await fetchPropertyData(propertyId);
                    setPropertyData(data);
                } catch (err) {
                    console.error("Error fetching property data:", err);
                    setError("Failed to load property details. Check ID or network.");
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [showDialog, propertyId]);

    if (!showDialog) return null;

    // Content Display for Loading/Error
    let content;
    let title = "Edit Property Record";

    if (loading) {
        content = (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                <p className="text-lg font-medium">Loading Record ID: {propertyId}...</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className="flex flex-col items-center justify-center h-64 text-red-600 bg-red-50 rounded-lg p-6">
                <AlertTriangle className="w-8 h-8 mb-4" />
                <p className="text-lg font-medium">Error Loading Data</p>
                <p className="text-sm text-center">{error}</p>
                <button 
                    onClick={() => setShowDialog(false)}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-gray-500 hover:bg-gray-600 transition"
                >
                    Close
                </button>
            </div>
        );
    } else if (propertyData) {
        title = `Edit ${propertyData.property_kind} Record: ${propertyData.arp_no}`;
    }

    // Render the form body when data is ready
    if (propertyData) {
        return (
            <PropertyFormBody
                showDialog={showDialog}
                setShowDialog={setShowDialog}
                setRefresh={setRefresh}
                isEdit={true}
                propertyToEditData={propertyData}
            />
        );
    }

    // Default modal wrapper for loading/error states
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-200">
                    <h2 id="dialog-title" className="text-2xl font-bold text-gray-900 flex items-center">
                        <MapPin className="w-6 h-6 text-emerald-600 mr-3" />
                        {title}
                    </h2>
                    <button
                        onClick={() => setShowDialog(false)}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        title="Close"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
                    {content}
                </div>
            </div>
        </div>
    );
};