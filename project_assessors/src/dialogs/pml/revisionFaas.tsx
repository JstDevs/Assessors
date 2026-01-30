import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Landmark, Save, X, Loader2, ClipboardList, LandPlot, Building as BuildingIcon, Factory, Trash2, Layers, HardHat, Hammer, CheckCircle, History, Calculator, FileText, Plus } from 'lucide-react';
import api from '../../../axiosBase.ts';

type PropertyKind = 'Land' | 'Building' | 'Machinery';
type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
type MachineryCondition = 'NEW' | 'SECOND_HAND';

// --- Interfaces ---

interface LandImprovement {
    id: number;
    improvement_name: string;
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
    item_name: string;
    quantity: number | '';
    unit_cost: number | '';
    total_cost: number;
}

interface MasterData {
    arp_no: string;
    pin: string;
    owner_name: string;
    owner_address: string;
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
    owner_name: '',
    owner_address: '',
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

// --- Components ---

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
            ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0' : 'bg-white'}`}
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
        <div className="col-span-4">
            <SelectField
                label="Part"
                name="part"
                value={bsm.part}
                onChange={(_e: any) => onChange(bsm.id, 'part', _e.target.value)}
                options={BSM_PARTS}
                required
            />
        </div>
        <div className="col-span-3">
            <SelectField
                label="Floor (Optional)"
                name="floor_no"
                value={bsm.floor_no}
                onChange={(_e: any) => onChange(bsm.id, 'floor_no', _e.target.value)}
                options={Array.from({ length: floorCount }, (_, i) => (i + 1).toString())}
            />
        </div>
        <div className="col-span-4">
            <InputField
                label="Material"
                name="material"
                value={bsm.material}
                onChange={(_e: any, val: string) => onChange(bsm.id, 'material', val)}
                required
            />
        </div>
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
        <div className="col-span-5">
            <InputField
                label="Item Name"
                name="item_name"
                value={bai.item_name}
                onChange={(_e: any, val: string) => onChange(bai.id, 'item_name', val)}
                required
            />
        </div>
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
    
    const [LAND_AU_OPTIONS, setLAND_AU_OPTIONS] = useState<any[]>([]); // Full object for AL lookup
    const [LAND_AU_CODES, setLAND_AU_CODES] = useState<string[]>([]);
    
    const [BK_CODES, setBK_CODES] = useState<string[]>([]);
    const [BK_VALUES, setBK_VALUES] = useState<number[]>([]);
    const [STRUCTURAL_TYPES, setSTRUCTURAL_TYPES] = useState<string[]>([]);
    const [STRUCTURAL_VALUES, setSTRUCTURAL_VALUES] = useState<number[]>([]);
    
    const [BUILDING_AU_OPTIONS, setBUILDING_AU_OPTIONS] = useState<any[]>([]);
    const [BUILDING_AU_CODES_LIST, setBUILDING_AU_CODES_LIST] = useState<string[]>([]);
    const [BUILDING_AU_VALUES, setBUILDING_AU_VALUES] = useState<string[]>([]); // Values are codes usually for building actual use

    const [MT_CODES, setMT_CODES] = useState([]);
    const [MT_VALUES, setMT_VALUES] = useState([]);
    
    const [MAU_OPTIONS, setMAU_OPTIONS] = useState<any[]>([]);
    const [MAU_CODES, setMAU_CODES] = useState([]);
    const [MAU_VALUES, setMAU_VALUES] = useState([]); // Values
    
    const [revisionYears, setRevisionYears] = useState<any[]>([]);

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
    
    const [originalData, setOriginalData] = useState<any>(null);

    // Load existing FAAS data
    useEffect(() => {
        const loadPropertyData = async () => {
            if (faasId && showDialog) {
                setLoadingData(true);
                try {
                    const response = await api.get(`faas/${faasId}`);
                    const data = response.data;
                    setOriginalData(data);
                    
                    const faas = data.faas;

                    // 1. Map Master Data
                    setMasterData({
                        arp_no: faas.faas_no,
                        pin: faas.pin || '',
                        owner_name: faas.owner_name,
                        owner_address: faas.owner_address,
                        lg_code: faas.lg_code,
                        barangay: faas.barangay || '',
                        lot_no: faas.lot_no || '',
                        block_no: faas.block_no || '',
                        property_kind: faas.property_kind,
                        description: faas.description || '',
                        status: faas.status,
                    });
                    setSelectedLGCode(faas.lg_code);

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
                        // console.log(await api);
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
                        } else {
                            setAdjustmentFactors([]);
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

                        const mau_id = await api.get(`p/mauID/${extractCode(ass.actual_use)}`)

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
                const lgRes = await api.get('lvg/list');
                setLG_OPTIONS(lgRes.data.data.map((item: any) => ({ id: item.lg_id, code: item.code })));
                setLG_CODES(lgRes.data.data.map((item: any) => item.code));

                const pcRes = await api.get('p/plist');
                setPC_CODES(pcRes.data.map((item: any) => item.code));
                setPC_NAMES(pcRes.data.map((item: any) => item.classname));

                // Land Actual Use (With Assessment Level)
                const auRes = await api.get('p/augetlist');
                setLAND_AU_OPTIONS(auRes.data); // Store full object
                setLAND_AU_CODES(auRes.data.map((item: any) => item.code));

                const bkRes = await api.get('p/bklist');
                setBK_CODES(bkRes.data.data.map((item: any) => item.code));
                setBK_VALUES(bkRes.data.data.map((item: any) => item.bk_id));

                const stRes = await api.get('p/stlist');
                setSTRUCTURAL_TYPES(stRes.data.data.map((item: any) => item.code));
                setSTRUCTURAL_VALUES(stRes.data.data.map((item: any) => item.st_id));

                // Building Actual Use (With Assessment Level)
                const bauRes = await api.get('p/baulist');
                setBUILDING_AU_OPTIONS(bauRes.data.data); // Store full object
                setBUILDING_AU_CODES_LIST(bauRes.data.data.map((item: any) => item.code));
                setBUILDING_AU_VALUES(bauRes.data.data.map((item: any) => item.code)); // Using code as value for now per typical use

                const mtRes = await api.get('p/mtlist');
                setMT_CODES(mtRes.data.data.map((item: any) => item.code));
                setMT_VALUES(mtRes.data.data.map((item: any) => item.mt_id));

                // Machinery Actual Use (With Assessment Level)
                const mauRes = await api.get('p/maulist');
                setMAU_OPTIONS(mauRes.data.data); // Store full object
                setMAU_CODES(mauRes.data.data.map((item: any) => item.code));
                setMAU_VALUES(mauRes.data.data.map((item: any) => item.code)); // Using code as value

                const ryRes = await api.get('ry/list');
                setRevisionYears(ryRes.data);
            } catch (error) {
                console.error("Error fetching initial lookup data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Dependent Dropdowns & SMV Lookup Helpers
    useEffect(() => {
        const fetchBarangays = async () => {
            if (!selectedLGCode) {
                setBARANGAY_CODES([]);
                return;
            }
            try {
                const lgIdRes = await api.get('lvg/getID', { params: { code: selectedLGCode } });
                const lg_id = lgIdRes.data.lg_id;
                const brgyRes = await api.get('lvg/barangayList', { params: { lg_id } });
                setBARANGAY_CODES(brgyRes.data.map((item: any) => item.barangay_name));
            } catch (error) {
                console.error("Error fetching barangay list:", error);
            }
        };
        fetchBarangays();
    }, [selectedLGCode]);

    useEffect(() => {
        const fetchSubClass = async () => {
            if (!selectedPCCode) {
                setLAND_PSC_CODES([]);
                return;
            }
            try {
                const pcIdRes = await api.get('p/getCID', { params: { code: selectedPCCode } });
                const pc_id = pcIdRes.data.pc_id;
                const pscRes = await api.get('p/splist', { params: { pc_id } });
                setLAND_PSC_CODES(pscRes.data.map((item: any) => item.code));
                
                const idMap: {[key: string]: number} = {};
                pscRes.data.forEach((item: any) => { idMap[item.code] = item.psc_id; });
                setLAND_PSC_IDS(idMap);
            } catch (error) {
                console.error("Error fetching sub-classification list:", error);
            }
        };
        fetchSubClass();
    }, [selectedPCCode]);

    // --- SMV FETCH LOGIC ---
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

            // Update State
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
            if (name === 'au_code') { // Land
                const found = LAND_AU_OPTIONS.find(opt => opt.code === finalValue);
                if (found) setAssessmentLevel(parseFloat(found.assessment_level || '0'));
            } else if (name === 'bau_id') { // Building
                const found = BUILDING_AU_OPTIONS.find(opt => opt.code === finalValue); // value is code
                if (found) setAssessmentLevel(parseFloat(found.assessment_level || '0'));
            } else if (name === 'mau_id') { // Machinery
                const found = MAU_OPTIONS.find(opt => opt.code === finalValue);
                if (found) setAssessmentLevel(parseFloat(found.assessment_level || '0'));
            }
        };

    // ... [Keep Building Handlers: handleFloorAreaChange, Add/Remove BSM/BAI] ...
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
    const handleAddBAI = useCallback(() => { setBuildingData(prev => ({ ...prev, additional_items: [...prev.additional_items, { id: nextBAIId, item_name: '', quantity: '', unit_cost: '', total_cost: 0 }] })); setNextBAIId(prev => prev + 1); }, [nextBAIId]);
    const handleRemoveBAI = useCallback((id: number) => setBuildingData(prev => ({ ...prev, additional_items: prev.additional_items.filter(bai => bai.id !== id) })), []);
    const handleBAIChange = useCallback((id: number, name: keyof BuildingAdditionalItem, value: string | number) => { setBuildingData(prev => ({ ...prev, additional_items: prev.additional_items.map(bai => { if (bai.id !== id) return bai; const newBai: BuildingAdditionalItem = { ...bai, [name]: value }; const quantity = newBai.quantity as number || 0; const unit_cost = newBai.unit_cost as number || 0; newBai.total_cost = quantity * unit_cost; return newBai; }) })); }, []);
    const totalBAIValue = useMemo(() => buildingData.additional_items.reduce((sum, item) => sum + item.total_cost, 0), [buildingData.additional_items]);

    // ... [Keep Land Improvement Handlers] ...
    const handleAddImprovement = useCallback(() => { setImprovements(prev => [...prev, { id: nextLandImprovementId, improvement_name: '', quantity: 1, unit_value: 0, base_market_value: 0, remarks: '' }]); setNextLandImprovementId(prev => prev + 1); }, [nextLandImprovementId]);
    const handleRemoveImprovement = useCallback((id: number) => setImprovements(prev => prev.filter(imp => imp.id !== id)), []);
    const handleImprovementChange = useCallback((id: number, name: keyof LandImprovement, value: string | number) => { setImprovements(prev => prev.map(imp => { if (imp.id !== id) return imp; const newImp: LandImprovement = { ...imp, [name]: value as any }; if (name === 'quantity' || name === 'unit_value') { const quantity = newImp.quantity as number || 0; const unit_value = newImp.unit_value as number || 0; newImp.base_market_value = quantity * unit_value; } return newImp; })); }, []);

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
            setSubmissionSuccessful(true);
            setRefresh(prev => !prev);
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-6 animate-pulse" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Revision Successful!</h2>
                    <p className="text-lg text-gray-600 mb-8">The FAAS has been successfully revised.</p>
                    <button onClick={handleCloseOnSuccess} className="px-8 py-3 text-lg font-medium text-white rounded-xl bg-emerald-600 hover:bg-emerald-700">Close</button>
                </div>
            </div>
        );
    }

    if (loadingData) return <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl p-8 flex flex-col items-center"><Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" /><p className="text-gray-600">Loading property data...</p></div></div>;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-200 bg-emerald-50 rounded-t-xl">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <PropertyIcon kind={masterData.property_kind} />
                        Revise {masterData.property_kind} Record
                    </h2>
                    <button onClick={handleCancel} className="p-1 rounded-full text-gray-400 hover:bg-gray-100" disabled={submitLoading}><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleRevisionSubmit(); }}>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-3 flex items-center"><History className="w-4 h-4 mr-2" /> Revision Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Revision Date" type="date" name="revision_date" value={revisionDate} onChange={(_e: any, val: string) => setRevisionDate(val)} required />
                                <div className="sm:col-span-2"><TextAreaField label="Reason for Revision / Remarks" name="remarks" value={revisionRemarks} onChange={(_e: any, val: string) => setRevisionRemarks(_e.target.value)} required isFullWidth /></div>
                            </div>
                        </div>

                        {/* Master Data */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4 border-b pb-2"><ClipboardList className="w-5 h-5 mr-2 text-emerald-500" /> Owner & Registration Info</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <InputField label="FAAS No / ARP" name="arp_no" value={masterData.arp_no} onChange={handleMasterChange} required readOnly />
                                <InputField label="PIN" name="pin" value={masterData.pin} onChange={handleMasterChange} readOnly />
                                <div className="sm:col-span-2"><InputField label="Owner Name" name="owner_name" value={masterData.owner_name} onChange={handleMasterChange} required isFullWidth /></div>
                                <div className="sm:col-span-4"><TextAreaField label="Owner Address" name="owner_address" value={masterData.owner_address} onChange={handleMasterChange} isFullWidth /></div>
                            </div>
                        </div>

                        {/* Appraisal Parameters */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4 border-b pb-2"><Landmark className="w-5 h-5 mr-2 text-emerald-500" /> Appraisal Parameters</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <SelectField label="Revision Year" name="ry_id" value={faasDataState.ry_id} onChange={handleFAASChange} options={revisionYears.map(r=>r.year)} values={revisionYears.map(r=>r.ry_id)} required />
                                <InputField label="Effectivity Date" type="date" name="effectivity_date" value={faasDataState.effectivity_date} onChange={handleFAASChange} required />
                                <SelectField label="LGU Code" name="lg_code" value={faasDataState.lg_code} onChange={handleFAASChange} options={LG_CODES} required />
                                
                                <div className="relative">
                                    <InputField label="Unit Value (Base)" type="number" name="unit_value" value={faasDataState.unit_value} onChange={handleFAASChange} step="0.01" />
                                    {smvLoading && <span className="absolute right-2 top-8 text-xs text-emerald-500 animate-pulse">Fetching...</span>}
                                </div>

                                <InputField label={masterData.property_kind === 'Building' ? 'Total Floor Area' : masterData.property_kind === 'Land' ? 'Lot Area' : 'Quantity'} type="number" name="area" value={faasDataState.area} onChange={handleFAASChange} step="0.01" readOnly={masterData.property_kind === 'Building'} />
                                
                                {masterData.property_kind === 'Land' && (
                                    <>
                                        <SelectField label="Classification" name="pc_code" value={landData.pc_code} onChange={handleSpecificChange(setLandData)} options={PC_NAMES} values={PC_CODES} required />
                                        <SelectField label="Sub-Class" name="psc_code" value={landData.psc_code} onChange={handleSpecificChange(setLandData)} options={LAND_PSC_CODES} required />
                                        <SelectField label="Actual Use" name="au_code" value={landData.au_code} onChange={handleSpecificChange(setLandData)} options={LAND_AU_CODES} required />
                                    </>
                                )}
                                {masterData.property_kind === 'Building' && (
                                    <>
                                        <SelectField label="Building Kind" name="bk_id" value={buildingData.bk_id} onChange={handleSpecificChange(setBuildingData)} options={BK_CODES} values={BK_VALUES} />
                                        <SelectField label="Struct Type" name="st_id" value={buildingData.st_id} onChange={handleSpecificChange(setBuildingData)} options={STRUCTURAL_TYPES} values={STRUCTURAL_VALUES} />
                                        <SelectField label="Actual Use" name="bau_id" value={buildingData.bau_id} onChange={handleSpecificChange(setBuildingData)} options={BUILDING_AU_CODES_LIST} values={BUILDING_AU_VALUES} required />
                                        <InputField label="Depreciation Rate %" type="number" name="depreciation_rate" value={faasDataState.depreciation_rate} onChange={handleFAASChange} />
                                    </>
                                )}
                                {masterData.property_kind === 'Machinery' && (
                                    <>
                                         <SelectField label="Actual Use" name="mau_id" value={machineryData.mau_id} onChange={handleSpecificChange(setMachineryData)} options={MAU_CODES} values={MAU_VALUES} required />
                                         <InputField label="Depreciation Rate %" type="number" name="depreciation_rate" value={faasDataState.depreciation_rate} onChange={handleFAASChange} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Land Improvements */}
                        {masterData.property_kind === 'Land' && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-emerald-50/20">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex justify-between">Other Improvements <button type="button" onClick={handleAddImprovement} className="px-2 py-1 bg-emerald-500 text-white text-xs rounded"><Plus className="w-3 h-3 inline"/> Add</button></h4>
                                {improvements.map(imp => (
                                    <div key={imp.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                        <div className="col-span-5"><InputField placeholder="Name" value={imp.improvement_name} onChange={(_e:any, v:string) => handleImprovementChange(imp.id, 'improvement_name', v)} /></div>
                                        <div className="col-span-2"><InputField type="number" placeholder="Qty" value={imp.quantity} onChange={(_e:any, v:number) => handleImprovementChange(imp.id, 'quantity', v)} /></div>
                                        <div className="col-span-4"><InputField type="number" placeholder="Unit Val" value={imp.unit_value} onChange={(_e:any, v:number) => handleImprovementChange(imp.id, 'unit_value', v)} /></div>
                                        <div className="col-span-1"><button type="button" onClick={() => handleRemoveImprovement(imp.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Adjustments (Land Only) */}
                        {masterData.property_kind === 'Land' && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/20">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex justify-between">Adjustment Factors <button type="button" onClick={handleAddAdjustment} className="px-2 py-1 bg-blue-500 text-white text-xs rounded"><Plus className="w-3 h-3 inline"/> Add</button></h4>
                                {adjustmentFactors.map(adj => (
                                    <div key={adj.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                        <div className="col-span-8"><InputField placeholder="Factor (e.g. Corner Lot)" value={adj.factor_name} onChange={(_e:any, v:string) => handleAdjustmentChange(adj.id, 'factor_name', v)} /></div>
                                        <div className="col-span-3"><InputField type="number" placeholder="%" value={adj.percent_adjustment} onChange={(_e:any, v:number) => handleAdjustmentChange(adj.id, 'percent_adjustment', v)} /></div>
                                        <div className="col-span-1"><button type="button" onClick={() => handleRemoveAdjustment(adj.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Building Floors & Items */}
                        {masterData.property_kind === 'Building' && (
                            <>
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Floor Areas</h4>
                                    <div className="grid grid-cols-3 gap-2">{buildingData.floor_areas.map(f => <BuildingFloorAreaInput key={f.floor_no} floor={f} onChange={handleFloorAreaChange} />)}</div>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex justify-between">Additional Items <button type="button" onClick={handleAddBAI} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded">Add</button></h4>
                                    {buildingData.additional_items.map(bai => <BuildingAdditionalItemForm key={bai.id} bai={bai} onChange={handleBAIChange} onRemove={handleRemoveBAI} />)}
                                </div>
                            </>
                        )}

                        {/* Valuation Preview */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-100 overflow-hidden">
                            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center">
                                <Calculator className="w-5 h-5 text-emerald-600 mr-2" />
                                <h3 className="font-bold text-emerald-800">Valuation Summary</h3>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Base Market Value</span>
                                    <span className="font-medium">₱{calculations.baseMarketValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
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
                                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                                    <span>Total Market Value</span>
                                    <span>₱{calculations.totalMarketValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500">Assessment Level</span>
                                    <input type="number" className="w-20 border rounded text-right p-1" value={assessmentLevel} onChange={(e)=>setAssessmentLevel(parseFloat(e.target.value)||0)} />
                                </div>
                                <div className="bg-emerald-100 p-3 rounded-lg flex justify-between items-center font-extrabold text-xl text-emerald-900 mt-2">
                                    <span>ASSESSED VALUE</span>
                                    <span>₱{calculations.assessedValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200 space-x-3">
                            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={submitLoading} className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center shadow-lg">
                                {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} <Save className="w-4 h-4 mr-2" /> Confirm Revision
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};