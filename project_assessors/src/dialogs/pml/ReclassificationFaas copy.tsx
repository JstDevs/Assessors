import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, X, Loader2, CheckCircle, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import api from '../../../axiosBase.ts';
// --- INTERFACES ---

interface ReclassificationData {
    reclassification_date: string;
    new_classification: string; // PC ID (number as string)
    new_subclassification: string; // PSC ID (number as string)
    new_actual_use: string; // AU ID (number as string)
    new_unit_value: string; // Calculated/Input value
    new_assessment_level: string; // Calculated/Input value
    remarks: string;
}

interface FAASData {
    faas_id: number;
    faas_no: string;
    property_id: number;
    owner_name: string;
    owner_address: string;
    property_kind: 'Land' | 'Building' | 'Machinery' | string;
    effectivity_date: string;
    status: string;
    ry_id: number;
    lg_code?: string;
}

interface LandAppraisal {
    classification: string;
    subclassification: string;
    area: string;
    unit_value: string;
    base_market_value: string;
}

interface LandAssessment {
    actual_use: string;
    market_value: string;
    assessment_level: string;
    assessed_value: string;
}

interface Adjustment {
    factor: string;
    adjustment: string;
}

interface Improvement {
    improvement_name: string;
    qty: number;
    unit_value: string;
}

interface PropertyData {
    market_value: number;
    assessed_value: number;
    assessment_level?: number;
    actual_use?: string;
    classification?: string;
    subclassification?: string;
    unit_value?: number;
    area?: number;
}

interface Option {
    pc_id?: number; 
    classname?: string;
    psc_id?: number; 
    subclass_name?: string; 
    au_id?: number;
    use_name?: string;
    code: string;
    assessment_level?: number;
    unit_value?: number;
}

interface FAASReclassificationDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

// --- CURRENCY FORMATTING HELPER ---
const formatCurrency = (value: number | string | undefined): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === undefined || num === null) return '₱0.00';
    return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const formatPercent = (value: number | string | undefined): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === undefined || num === null) return '0.00%';
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}%`;
};

// --- COMPONENT ---

export const FAASReclassificationDialog: React.FC<FAASReclassificationDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    const [faasData, setFAASData] = useState<FAASData | null>(null);
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    
    // Detailed Land Appraisal/Assessment Data
    const [faasAppraisal, setFaasAppraisal] = useState<LandAppraisal | null>(null);
    const [faasAssessment, setFaasAssessment] = useState<LandAssessment | null>(null);
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [improvements, setImprovements] = useState<Improvement[]>([]);

    const [reclassificationData, setReclassificationData] = useState<ReclassificationData>({
        reclassification_date: new Date().toISOString().split('T')[0],
        new_classification: '',
        new_subclassification: '',
        new_actual_use: '',
        new_unit_value: '',
        new_assessment_level: '',
        remarks: '',
    });

    const [loading, setLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
    
    // Dropdown States
    const [classOptions, setClassOptions] = useState<Option[]>([]);
    const [subclassOptions, setSubclassOptions] = useState<Option[]>([]);
    const [actualUseOptions, setActualUseOptions] = useState<Option[]>([]);
    const [smvFound, setSmvFound] = useState(false);


    const selectedClassificationId = reclassificationData.new_classification;
    const selectedSubclassificationId = reclassificationData.new_subclassification;
    const selectedActualUseId = reclassificationData.new_actual_use;

    // --- Effect 1: Load FAAS Data and Current Property Data ---
    useEffect(() => {
        const loadData = async () => {
            if (!showDialog) return;
            
            setLoading(true);
            setLoadingError(null);
            setFAASData(null);
            setPropertyData(null);
            setFaasAppraisal(null);
            setFaasAssessment(null);
            setAdjustments([]);
            setImprovements([]);
            
            try {
                const response = await api.get(`faas/${faasId}`);
                const data = response.data;
    
                if (!data.faas) {
                    setLoadingError(`FAAS ID ${faasId} not found.`);
                    return;
                }

                // Prepare FAAS Info
                const faasInfo: FAASData = { 
                    ...data.faas,
                    ry_id: data.faas.ry_id || 5,
                    lg_code: data.faas.lg_code || 'PRIME' 
                };
                setFAASData(faasInfo);

                let extractedPropertyData: PropertyData | null = null;
                const kind = data.faas.property_kind;

                // Extract detailed data
                if (kind === 'Land' && data.land) {
                    setFaasAppraisal(data.land.appraisal || null);
                    setFaasAssessment(data.land.assessment || null);
                    setAdjustments(data.land.adjustments || []);
                    setImprovements(data.land.improvements || []);

                    extractedPropertyData = {
                        market_value: data.land.assessment ? parseFloat(data.land.assessment.market_value) : 0,
                        assessed_value: data.land.assessment ? parseFloat(data.land.assessment.assessed_value) : 0,
                        assessment_level: data.land.assessment ? parseFloat(data.land.assessment.assessment_level) : 0,
                        actual_use: data.land.assessment?.actual_use,
                        classification: data.land.appraisal?.classification,
                        subclassification: data.land.appraisal?.subclassification,
                        unit_value: data.land.appraisal ? parseFloat(data.land.appraisal.unit_value) : 0,
                        area: data.land.appraisal ? parseFloat(data.land.appraisal.area) : 0
                    };
                } else if (kind === 'Building' && data.building?.assessment) {
                    extractedPropertyData = {
                        market_value: parseFloat(data.building.assessment.market_value),
                        assessed_value: parseFloat(data.building.assessment.assessed_value),
                        assessment_level: parseFloat(data.building.assessment.assessment_level),
                        actual_use: data.building.assessment.actual_use,
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


    // --- Effect 2: Load Dropdown Options (Classification/ActualUse) ---
    useEffect(() => {
        if (!showDialog || !faasData?.ry_id) return;
        
        const fetchDropdowns = async () => {
            const ryId = faasData.ry_id;
            const kind = faasData.property_kind;

            try {
                const classResponse = await api.get<Option[]>(`p/plist`);
                setClassOptions(classResponse.data);
            } catch (e) { console.error('Error fetching classifications:', e); setClassOptions([]); }

            try {
                if (kind === 'Land') {
                    const actualUseResponse = await api.get<Option[]>(`p/augetlist`);
                    setActualUseOptions(actualUseResponse.data);
                } else if (kind === 'Building') {
                    const actualUseResponse = await api.get<Option[]>(`dropdowns/building-actual-uses?ry_id=${ryId}`);
                    setActualUseOptions(actualUseResponse.data);
                }
            } catch (e) { console.error('Error fetching actual uses:', e); setActualUseOptions([]); }
        };

        fetchDropdowns();

    }, [showDialog, faasData?.ry_id, faasData?.property_kind]);


    // --- Effect 3: Load Subclassification (Dependent on Classification selection) ---
    useEffect(() => {
        if (faasData?.property_kind !== 'Land' || !faasData?.ry_id || !selectedClassificationId) {
            setSubclassOptions([]);
            setReclassificationData(prev => ({ ...prev, new_subclassification: '' }));
            return;
        }

        const fetchSubclass = async () => {
            try {
                const subclassResponse = await api.get<Option[]>(`p/splist`, { params: {pc_id: selectedClassificationId}});
                setSubclassOptions(subclassResponse.data);
            } catch (e) { console.error('Error fetching subclassifications:', e); setSubclassOptions([]); }
        };

        fetchSubclass();

    }, [selectedClassificationId, faasData?.ry_id, faasData?.property_kind]);

    // --- Effect 4: Dynamic Lookup and Calculation (Assessment Level & Unit Value) ---
    useEffect(() => {
        const calculateNewValues = async () => {
            const kind = faasData?.property_kind;
            const ryId = faasData?.ry_id;
            const lgCode = faasData?.lg_code;

            let newLevel = '';
            let newUnitValue = '';
            
            // 1. Determine Assessment Level (from Actual Use) 
            const selectedActualUse = actualUseOptions.find(opt => String(opt.au_id) === selectedActualUseId);
            if (selectedActualUse && selectedActualUse.assessment_level !== undefined) {
                newLevel = parseFloat(selectedActualUse.assessment_level).toFixed(2);
            } else if (!selectedActualUseId && propertyData?.assessment_level) {
                 newLevel = propertyData.assessment_level.toFixed(2);
            } else {
                newLevel = reclassificationData.new_assessment_level; // Fall back to manual input
            }
            
            // 2. Determine Unit Value (from SMV table lookup - Land only)
            if (kind === 'Land' && ryId && selectedSubclassificationId) {
                const selectedSubclass = subclassOptions.find(opt => String(opt.psc_id) === selectedSubclassificationId);
                
                if (selectedSubclass) {
                    try {
                        setSmvFound(false);
                        // Get Locational Group ID (Mocking the ID to 1 based on previous step)
                        // const lgIdRes = await api.get('lvg/getID', { params: { code: lgCode}});
                        // const lgId = lgIdRes.data.lg_id;
                        const lgId = 1; 
                        
                        const smvResponse = await api.get(`smv/landSMV`, {params: { ry_id: ryId, psc_id: selectedSubclass.psc_id, lg_id: lgId }});
                        
                        if (smvResponse.data?.data?.unit_value) {
                            newUnitValue = parseFloat(smvResponse.data?.data?.unit_value).toFixed(2);
                            setSmvFound(true);
                        } else {
                            setSmvFound(false);
                            newUnitValue = ''; 
                        }
                    } catch (e) { 
                        console.error("SMV Lookup Error:", e);
                        setSmvFound(false);
                        newUnitValue = ''; 
                    }
                }
            } else if (kind === 'Land' && !selectedSubclassificationId && propertyData?.unit_value) {
                 newUnitValue = propertyData.unit_value.toFixed(2);
                 setSmvFound(true);
            } else {
                // For Building or if Land subclass/input is cleared
                 newUnitValue = reclassificationData.new_unit_value; 
                 setSmvFound(false);
            }
            
            setReclassificationData(prev => ({
                ...prev,
                new_assessment_level: newLevel,
                new_unit_value: newUnitValue,
            }));
            
        };

        calculateNewValues();
    }, [
        selectedClassificationId, 
        selectedSubclassificationId, 
        selectedActualUseId, 
        faasData?.property_kind, 
        faasData?.ry_id,
        faasData?.lg_code,
        propertyData?.assessment_level,
        propertyData?.unit_value,
        actualUseOptions,
        subclassOptions
    ]);


    // --- Final Computed Values (for Display and Submission) ---
    const computedNewValues = useMemo(() => {
        const currentUnitValue = propertyData?.unit_value || 0;
        const currentAssessmentLevel = propertyData?.assessment_level || 0;
        const currentMarketValue = propertyData?.market_value || 0;
        const currentAssessedValue = propertyData?.assessed_value || 0;
        const area = parseFloat(faasAppraisal?.area || '0');
        
        const newUnitValue = parseFloat(reclassificationData.new_unit_value) || currentUnitValue;
        const newAssessmentLevel = parseFloat(reclassificationData.new_assessment_level) || currentAssessmentLevel;

        // 1. Land Improvements Subtotal (remains unchanged)
        const improvementsSubtotal = improvements.reduce((sum, imp) => {
            return sum + (imp.qty * parseFloat(imp.unit_value || '0'));
        }, 0);

        // 2. New Base Market Value (BMV)
        const newBaseMarketValue = area * newUnitValue;

        // 3. Total Adjustment Value (Re-apply original adjustments to the NEW Base Market Value)
        let totalAdjustmentValue = 0;
        const adjustmentRate = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.adjustment || '0') / 100), 0);
        
        // Calculation: BMV * total adjustment percentage
        totalAdjustmentValue = newBaseMarketValue * adjustmentRate;

        // 4. New Total Market Value (TMV)
        const newTotalMarketValue = newBaseMarketValue + totalAdjustmentValue + improvementsSubtotal;

        // 5. New Assessed Value (AV)
        const newAssessedValue = newTotalMarketValue * (newAssessmentLevel / 100);
        
        // Helper to get descriptive names for display
        const getDisplayNames = () => {
            const getClassName = (id: string | undefined, fallback: string) => 
                classOptions.find(opt => String(opt.pc_id) === id)?.classname + ' (' + classOptions.find(opt => String(opt.pc_id) === id)?.code + ')' || fallback;
            
            const getSubclassName = (id: string | undefined, fallback: string) => 
                subclassOptions.find(opt => String(opt.psc_id) === id)?.subclass_name + ' (' + subclassOptions.find(opt => String(opt.psc_id) === id)?.code + ')' || fallback;
            
            const getActualUseName = (id: string | undefined, fallback: string) => 
                actualUseOptions.find(opt => String(opt.au_id) === id)?.use_name + ' (' + actualUseOptions.find(opt => String(opt.au_id) === id)?.code + ')' || fallback;

            const newClassificationName = reclassificationData.new_classification 
                ? getClassName(reclassificationData.new_classification, faasAppraisal?.classification || '-')
                : faasAppraisal?.classification || '-';
            
            const newSubclassName = reclassificationData.new_subclassification
                ? getSubclassName(reclassificationData.new_subclassification, faasAppraisal?.subclassification || '-')
                : faasAppraisal?.subclassification || '-';

            const newActualUseName = reclassificationData.new_actual_use
                ? getActualUseName(reclassificationData.new_actual_use, faasAssessment?.actual_use || '-')
                : faasAssessment?.actual_use || '-';

            return { newClassificationName, newSubclassName, newActualUseName };
        };
        const { newClassificationName, newSubclassName, newActualUseName } = getDisplayNames();


        // Current total adjustment value calculation (using current BMV)
        const currentBaseMarketValue = parseFloat(faasAppraisal?.base_market_value || '0');
        const currentAdjustmentValue = currentBaseMarketValue * adjustmentRate;

        const currentTotalMarketValue = currentMarketValue;

        return {
            improvementsSubtotal,
            adjustmentRate: adjustmentRate * 100, // Return as percentage for display
            newBaseMarketValue,
            totalAdjustmentValue,
            newTotalMarketValue,
            newAssessedValue,
            newUnitValue,
            newAssessmentLevel,
            currentBaseMarketValue,
            currentAdjustmentValue,
            currentTotalMarketValue,
            currentAssessedValue,
            currentAssessmentLevel,
            newClassificationName,
            newSubclassName,
            newActualUseName,
        };
    }, [reclassificationData, propertyData, faasAppraisal, faasAssessment, adjustments, improvements, classOptions, subclassOptions, actualUseOptions]);


    const handleReclassificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setReclassificationData(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        setSubmitLoading(true);
        
        try {
            if (!reclassificationData.reclassification_date) {
                setSubmitError('Reclassification date is required');
                return;
            }

            if (!selectedClassificationId && 
                !selectedSubclassificationId && 
                !selectedActualUseId && 
                !reclassificationData.new_unit_value && 
                !reclassificationData.new_assessment_level) {
                setSubmitError('Please select or enter at least one field to update for reclassification.');
                return;
            }
            
            const payload = {
                faas_id: faasId,
                ...reclassificationData,
                // Send the new calculated values (using computedNewValues)
                new_base_market_value: computedNewValues.newBaseMarketValue, 
                new_market_value: computedNewValues.newTotalMarketValue, 
                new_assessed_value: computedNewValues.newAssessedValue, 
                new_assessment_level: computedNewValues.newAssessmentLevel,
            };
            // console.log(payload);
            await api.post('faas/reclassify', payload);
            setSubmissionSuccessful(true);
            setRefresh(prev => !prev);
            
        } catch (error) {
            console.error('Reclassification failed:', error);
            // @ts-ignore
            setSubmitError(error.response?.data?.message || 'Failed to reclassify FAAS');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSubmissionSuccessful(false);
        setReclassificationData({
            reclassification_date: new Date().toISOString().split('T')[0],
            new_classification: '',
            new_subclassification: '',
            new_actual_use: '',
            new_unit_value: '',
            new_assessment_level: '',
            remarks: '',
        });
        setSubmitError(null);
        setLoadingError(null);
        setFAASData(null);
        setPropertyData(null);
        setFaasAppraisal(null);
        setFaasAssessment(null);
        setAdjustments([]);
        setImprovements([]);
        setClassOptions([]);
        setSubclassOptions([]);
        setActualUseOptions([]);
    };

    if (!showDialog) return null;

    if (submissionSuccessful) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-6 animate-pulse" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reclassification Successful!</h2>
                    <p className="text-lg text-gray-600 mb-2">
                        FAAS No: <strong>{faasData?.faas_no}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        A new FAAS revision has been created with updated classification
                    </p>
                    <button
                        onClick={handleClose}
                        type="button"
                        className="px-8 py-3 text-lg font-medium text-white rounded-xl shadow-lg transition bg-green-600 hover:bg-green-700"
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
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Loading FAAS data...</p>
                    <p className="text-sm text-gray-500 mt-2">FAAS ID: {faasId} (Mocking Data)</p>
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

    const canReclassify = faasData?.property_kind === 'Land' || faasData?.property_kind === 'Building';

    if (!canReclassify && faasData) {
         return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Reclassify</h2>
                    <p className="text-gray-600 mb-6">
                        Only Land and Building properties can be reclassified. This is a **{faasData.property_kind}** property.
                    </p>
                    <button onClick={handleClose} type="button" className="px-6 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition bg-gray-600 hover:bg-gray-700">Close</button>
                </div>
            </div>
        );
    }
    
    // Safety check needed for TypeScript after all error/loading handling
    if (!faasData || !propertyData || !faasAppraisal || !faasAssessment) return null;


    const ComparisonItem = ({ label, originalValue, newValue, isFinal = false, isPercent = false, isText = false }: { 
        label: string, 
        originalValue: number | string, 
        newValue: number | string, 
        isFinal?: boolean, 
        isPercent?: boolean,
        isText?: boolean
    }) => {
        const formatFn = isPercent ? formatPercent : (isText ? String : formatCurrency);
        const baseClasses = isFinal ? 'font-bold text-base' : 'font-medium text-sm';
        const newClasses = isFinal ? 'text-green-700' : 'text-gray-700';

        // Check if value changed to apply color/bolding
        const valueChanged = originalValue !== newValue;

        // Determine New Value display: text fields show the new name/code, numeric fields show the formatted number.
        const displayNewValue = formatFn(newValue);
        
        // Apply different styling for the 'New Value' column based on change and type
        const newColClasses = isText 
            ? `text-left ${valueChanged ? 'font-bold text-blue-600' : 'text-gray-700'}` 
            : `text-right ${valueChanged ? (isFinal ? 'font-extrabold text-green-700' : 'text-green-600') : 'text-gray-700'}`;
        
        const originalColClasses = isText ? 'text-left' : 'text-right';

        return (
            <div className={`grid grid-cols-3 gap-2 py-1 ${isFinal ? 'border-t border-gray-400 mt-2 pt-2' : ''}`}>
                <span className={`${baseClasses} text-gray-600 truncate`}>{label}</span>
                <span className={`${baseClasses} text-gray-900 ${originalColClasses}`}>{formatFn(originalValue)}</span>
                <span className={`${baseClasses} ${newColClasses}`}>{displayNewValue}</span>
            </div>
        );
    };


    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                <div className="p-6 flex justify-between items-center border-b border-gray-200 bg-green-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <RefreshCcw className="w-6 h-6 text-green-600 mr-3" />
                            Reclassify FAAS
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {faasData.faas_no} - {faasData.property_kind} (Testing FAAS ID: {faasId})
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        disabled={submitLoading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Current FAAS Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner">
                        <h3 className="font-semibold text-gray-700 mb-3">Current FAAS Details</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div><span className="text-gray-600">Owner:</span><p className="font-medium text-gray-900 truncate">{faasData.owner_name || '-'}</p></div>
                            <div><span className="text-gray-600">FAAS No:</span><p className="font-medium text-gray-900">{faasData.faas_no || '-'}</p></div>
                            <div><span className="text-gray-600">Locational Group:</span><p className="font-medium text-gray-900">{faasData.lg_code || '-'}</p></div>
                            <div><span className="text-gray-600">Area:</span><p className="font-medium text-gray-900">{faasAppraisal.area || '-'} sq.m</p></div>
                        </div>
                    </div>

                    {/* New Classification Data */}
                    <div className="border-2 border-green-300 rounded-xl p-6 bg-green-50 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-green-200 pb-2">
                            New Classification Parameters
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {/* Reclassification Date */}
                            <div className='col-span-full md:col-span-1'>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reclassification Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="reclassification_date"
                                    value={reclassificationData.reclassification_date}
                                    onChange={handleReclassificationChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border"
                                />
                            </div>
                            
                            {/* Classification Dropdowns (Land) */}
                            {faasData.property_kind === 'Land' && (
                                <>
                                    <div className='col-span-full'>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Classification</label>
                                        <select
                                            name="new_classification"
                                            value={reclassificationData.new_classification}
                                            onChange={handleReclassificationChange}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border bg-white"
                                            disabled={!classOptions.length}
                                        >
                                            <option value="">{classOptions.length ? `Current: ${faasAppraisal.classification || 'Select Classification'}` : 'Loading classifications...'}</option>
                                            {classOptions.map(option => (
                                                <option key={option.pc_id} value={option.pc_id}>{option.classname + " (" + option.code + ")"}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Subclassification</label>
                                        <select
                                            name="new_subclassification"
                                            value={reclassificationData.new_subclassification}
                                            onChange={handleReclassificationChange}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border bg-white"
                                            disabled={!subclassOptions.length && !!selectedClassificationId}
                                        >
                                            <option value="">{subclassOptions.length ? `Current: ${faasAppraisal.subclassification || 'Select Subclassification'}` : 'Select Classification first / Loading subclasses...'}</option>
                                            {subclassOptions.map(option => (
                                                <option key={option.psc_id} value={option.psc_id}>{option.subclass_name + " (" + option.code + ")"}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            
                            {/* Unit Value (Land) */}
                            {faasData.property_kind === 'Land' && (
                                <div className='col-span-full md:col-span-1'>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Unit Value (₱/sq.m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="new_unit_value"
                                        value={reclassificationData.new_unit_value}
                                        onChange={handleReclassificationChange}
                                        placeholder={faasAppraisal.unit_value || '0.00'}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border bg-white disabled:bg-gray-100"
                                        disabled={!!selectedSubclassificationId && smvFound}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {smvFound ? "Value populated by SMV lookup." : (selectedSubclassificationId ? "SMV not found, enter manually." : "SMV lookup requires Subclass selection.")}
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Actual Use Dropdown (Land/Building) */}
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Actual Use</label>
                                <select
                                    name="new_actual_use"
                                    value={reclassificationData.new_actual_use}
                                    onChange={handleReclassificationChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border bg-white"
                                    disabled={!actualUseOptions.length}
                                >
                                    <option value="">{actualUseOptions.length ? `Current: ${faasAssessment.actual_use || 'Select Actual Use'}` : 'Loading actual uses...'}</option>
                                    {actualUseOptions.map(option => (
                                        <option key={option.au_id} value={option.au_id}>{option.use_name + " (" + option.code + ")"}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assessment Level (Read-only) */}
                            <div className='col-span-full md:col-span-1'>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Assessment Level (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="new_assessment_level"
                                    value={computedNewValues.newAssessmentLevel.toFixed(2)}
                                    readOnly
                                    placeholder={faasAssessment.assessment_level || '0'}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border bg-gray-100"
                                    disabled={true}
                                />
                                <p className="text-xs text-gray-500 mt-1">Populated automatically by Actual Use.</p>
                            </div>

                            {/* Remarks */}
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={reclassificationData.remarks}
                                    onChange={handleReclassificationChange}
                                    rows={3}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border"
                                    placeholder="Reason for reclassification..."
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Valuation Preview */}
                    <div className="bg-blue-50 border border-blue-400 rounded-xl p-6 shadow-xl">
                        <h3 className="font-bold text-xl text-blue-800 mb-4 flex items-center border-b border-blue-400 pb-2">
                            <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                            Reclassification Valuation Preview
                        </h3>
                        
                        {/* Comparison Header */}
                        <div className="grid grid-cols-3 gap-2 text-xs font-semibold uppercase text-gray-600 mb-2 border-b border-blue-300 pb-2 bg-blue-50">
                            <span>Field</span>
                            <span className="text-center">Original Value</span>
                            <span className="text-center text-green-700">New Value</span>
                        </div>

                        {/* 1. Land Appraisal Section */}
                        <div className="space-y-2 mb-6">
                            <h4 className="font-semibold text-base text-gray-800 flex items-center mb-1 pt-1">
                                <DollarSign className="w-4 h-4 mr-2 text-gray-500" /> Land Appraisal
                            </h4>
                            <ComparisonItem 
                                label="Classification" 
                                originalValue={faasAppraisal.classification} 
                                newValue={computedNewValues.newClassificationName}
                                isText={true}
                            />
                            <ComparisonItem 
                                label="Subclass" 
                                originalValue={faasAppraisal.subclassification} 
                                newValue={computedNewValues.newSubclassName}
                                isText={true}
                            />
                            <ComparisonItem 
                                label="Area (sq.m)" 
                                originalValue={faasAppraisal.area} 
                                newValue={faasAppraisal.area}
                                isText={true}
                            />
                            <ComparisonItem 
                                label="Unit Value (₱/sq.m)" 
                                originalValue={faasAppraisal.unit_value} 
                                newValue={computedNewValues.newUnitValue}
                                isFinal={true}
                            />
                        </div>

                        {/* 2. Other Adjustments & Improvements */}
                        <div className="space-y-2 mb-6 border-t pt-4 border-blue-300">
                            <h4 className="font-semibold text-base text-gray-800 flex items-center mb-1">
                                <DollarSign className="w-4 h-4 mr-2 text-gray-500" /> Market Value Calculation
                            </h4>
                            
                            {/* Base Market Value Comparison */}
                            <ComparisonItem 
                                label="Base Market Value" 
                                originalValue={computedNewValues.currentBaseMarketValue} 
                                newValue={computedNewValues.newBaseMarketValue}
                            />

                            {/* Consolidated Adjustment Factor */}
                            <div className="py-2 px-4 border border-gray-300 rounded-md bg-white">
                                <span className='block text-xs font-semibold text-gray-600 mb-1'>Adjustment Applied: (Total Rate: {formatPercent(computedNewValues.adjustmentRate)})</span>
                                
                                <div className="grid grid-cols-3 gap-2 py-0.5 text-xs">
                                    <span className="text-gray-500 italic">Total Adjustment Value</span>
                                    <span className="text-gray-900 text-right">{formatCurrency(computedNewValues.currentAdjustmentValue)}</span>
                                    <span className="text-green-700 text-right">{formatCurrency(computedNewValues.totalAdjustmentValue)}</span>
                                </div>
                            </div>
                            <ComparisonItem 
                                label="Total Adjustments" 
                                originalValue={computedNewValues.currentAdjustmentValue} 
                                newValue={computedNewValues.totalAdjustmentValue}
                            />

                            {/* Improvements List (List only, no separate old/new columns) */}
                            <div className="py-2 px-4 border border-gray-300 rounded-md bg-white">
                                <span className='block text-xs font-semibold text-gray-600 mb-1'>Improvements (Constant Value):</span>
                                {improvements.map((imp, index) => (
                                    <div key={index} className="grid grid-cols-3 gap-2 py-0.5 text-xs border-b last:border-b-0 border-gray-100">
                                        <span className="text-gray-600 italic truncate">{imp.improvement_name} ({imp.qty} @ {formatCurrency(imp.unit_value)})</span>
                                        <span className="text-gray-900 text-center col-span-2">{formatCurrency(imp.qty * parseFloat(imp.unit_value))}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Final Market Value Comparison */}
                            <ComparisonItem 
                                label="FINAL MARKET VALUE" 
                                originalValue={computedNewValues.currentTotalMarketValue} 
                                newValue={computedNewValues.newTotalMarketValue}
                                isFinal={true}
                            />
                        </div>

                        {/* 3. Property Assessment */}
                        <div className="space-y-2 border-t pt-4 border-blue-300">
                            <h4 className="font-semibold text-base text-gray-800 flex items-center mb-1">
                                <DollarSign className="w-4 h-4 mr-2 text-gray-500" /> Property Assessment
                            </h4>
                             <ComparisonItem 
                                label="Actual Use" 
                                originalValue={faasAssessment.actual_use} 
                                newValue={computedNewValues.newActualUseName}
                                isText={true}
                            />
                             <ComparisonItem 
                                label="Market Value" 
                                originalValue={computedNewValues.currentTotalMarketValue} 
                                newValue={computedNewValues.newTotalMarketValue}
                            />
                            <ComparisonItem 
                                label="Assessment Level (%)" 
                                originalValue={computedNewValues.currentAssessmentLevel} 
                                newValue={computedNewValues.newAssessmentLevel}
                                isPercent={true}
                            />

                            <ComparisonItem 
                                label="FINAL ASSESSED VALUE" 
                                originalValue={computedNewValues.currentAssessedValue} 
                                newValue={computedNewValues.newAssessedValue}
                                isFinal={true}
                            />
                            
                            {/* Taxable Status (Mocked as always Taxable 1/Active status) */}
                            <div className="text-center mt-4 border-t pt-3 border-gray-200">
                                <p className="text-sm font-semibold text-gray-700">Taxable Status: <span className="text-green-600">TAXABLE</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Important Notice</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>This will create a new FAAS revision with updated classification</li>
                                        <li>The current FAAS will be marked as INACTIVE</li>
                                        <li>All property data will be duplicated with new values applied</li>
                                        <li>Market and assessed values will be recalculated based on new parameters</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex flex-col">
                        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleClose}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition"
                            disabled={submitLoading}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSubmit}
                            type="button"
                            disabled={submitLoading}
                            className={`px-6 py-2 text-sm font-medium text-white rounded-md shadow-lg transition flex items-center justify-center
                                bg-green-600 hover:bg-green-700
                                ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {submitLoading && (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            )}
                            <RefreshCcw className="w-4 h-4 mr-2" /> Apply Reclassification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};