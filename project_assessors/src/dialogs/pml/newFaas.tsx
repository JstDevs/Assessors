import React, { useState, useEffect, useMemo } from 'react';
import { FileText, X, Plus, Trash2, Loader2, CheckCircle, Calculator } from 'lucide-react';
import api from '../../../axiosBase';

interface AdjustmentFactor {
    id: number;
    factor_name: string;
    percent_adjustment: number;
    remarks: string;
}

interface FAASData {
    property_id: number;
    ry_id: string;
    td_no: string;
    effectivity_date: string;
    lc_id: string;
    pc_code: string;
    unit_value: number;
    area: number;
    taxable: 1 | 0;
    approved_by: string;
    depreciation_rate: number;
    remarks: string;
}

interface PropertyData {
    property_id: number;
    arp_no: string;
    pin: string;
    owner_name: string;
    owner_address: string;
    lot_no: string;
    block_no: string;
    barangay: string;
    property_kind: string;
    details: any;
}

interface FAASCreationDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    propertyId: number;
    setRefresh: ()=>{};
}

export const OriginalFaas: React.FC<FAASCreationDialogProps> = ({
    showDialog,
    setShowDialog,
    propertyId,
    setRefresh
}) => {
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    const [revisionYears, setRevisionYears] = useState<any[]>([]);
    const [landClasses, setLandClasses] = useState<any[]>([]);
    
    const [faasData, setFAASData] = useState<FAASData>({
        property_id: propertyId,
        ry_id: '',
        td_no: '',
        effectivity_date: new Date().toISOString().split('T')[0],
        lc_id: '',
        pc_code: '',
        unit_value: 0,
        area: 0,
        taxable: 1,
        approved_by: '',
        depreciation_rate: 0,
        remarks: '',
    });

    const [smv_land, setSmv_land] = useState({});
    const [adjustmentFactors, setAdjustmentFactors] = useState<AdjustmentFactor[]>([]);
    const [assessmentLevel, setAssessmentLevel] = useState<number>(0);
    
    const [loading, setLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
    const [nextAdjustmentId, setNextAdjustmentId] = useState(1);
    const [active, setActive] = useState(0);

    // Load property data and lookups
    useEffect(() => {
        const loadData = async () => {
            if (!showDialog) return;
            
            setLoading(true);
            setLoadingError(null);
            setPropertyData(null);
            
            try {
                const propRes = await api.get(`pml/property/${propertyId}`);

                if (!propRes.data || !propRes.data.property_id) {
                    setLoadingError('Property not found');
                    return;
                }
                
                const property = propRes.data;
                console.log(property);
                setPropertyData(property);

                const ryRes = await api.get('ry/list');
                setRevisionYears(ryRes.data);
                const activeRY = ryRes.data.filter((item => item.active == 1)).map(item=>item.ry_id)[0] ?? 0;
                setActive(activeRY);
                setFAASData(prev => ({
                    ...prev,
                    ry_id: activeRY
                }));

                const lcRes = await api.get('p/plist');
                setLandClasses(lcRes.data);

                if (property.property_kind === 'Land') {

                    //other improvements
                    const other_improvements = propRes.data.details.other_improvements;
                    const new_other_improvements:any = [];
                    for (const [index, element] of other_improvements.entries()) {
                        const unit_value = await api.get(`smv/improvement/${element.i_id}`);
                        new_other_improvements.push({...other_improvements[index], unit_value: unit_value.data.unit_value})
                    }

                    setPropertyData({...property, details: {...property.details, other_improvements: new_other_improvements}})
                    const lgRes = await api.get('lvg/getID', {params: {code: property.lg_code}});
                    const pscRes = await api.get('p/getSPID', {params:{code: property?.details.psc_code}});
                    const lg_id = lgRes.data?.lg_id;
                    const psc_id = pscRes.data.psc_id;
                    const smv_data = await api.get('smv/landSMV', { params:{ lg_id: lg_id, psc_id: psc_id, ry_id: 1 }});
                    const smv_land = smv_data.data.data;
                    setSmv_land(smv_land);
                    
                    setFAASData(prev => ({
                        ...prev,
                        property_id: property.property_id,
                        pc_code: property.details.pc_code,
                        unit_value: parseFloat(smv_land.unit_value || '0'),
                        area: parseFloat(property.details.lot_area || '0'),
                    }));

                    setAssessmentLevel(Number(property?.details.assessment_level));
                } else if (property.property_kind === 'Building') {
                    const totalFloorArea = property.details.floor_areas?.reduce((sum, floor) => 
                        sum + parseFloat(floor.floor_area || '0'), 0
                    ) || 0;

                    //other improvements
                    const additional_items = propRes.data.details.additional_items;
                    const new_additional_items:any = [];
                    for (const [index, element] of additional_items.entries()) {
                        const unit_value = await api.get(`smv/additional/${element.item_id}`);
                        new_additional_items.push({...additional_items[index], unit_value: unit_value.data.unit_value})
                    }
                    setPropertyData({...property, details: {...property.details, additional_items: new_additional_items}})

                    //call in smv
                    // const bau_id = property.details.bau_id;
                    const bk_id = property.details.bk_id;
                    const st_id = property.details.st_id;

                    const smv_data = await api.get('smv/buildingSMV', { params: { bk_id, st_id, ry_id: 1 } })
                    const smv_building = smv_data.data.data;
                    console.log(smv_data.data);

                    
                    
                    setFAASData(prev => ({
                        ...prev,
                        property_id: property.property_id,
                        area: totalFloorArea,
                        unit_value: parseFloat(smv_building?.unit_value || '0'),
                    }));
                    setAssessmentLevel(parseFloat(property?.details?.assessment_level));
                } else if (property.property_kind === 'Machinery') {

                    const smv_data = await api.get('smv/machinerySMV', { params: { mt_id: property.details.mt_id, ry_id: 1 }});
                    console.log(smv_data.data);
                    setFAASData(prev => ({
                        ...prev,
                        property_id: property.property_id,
                        area: 1, // used for quantity
                        unit_value: parseFloat(smv_data?.data?.data?.unit_value || '0'),
                    }));

                    setAssessmentLevel(parseFloat(property.details.assessment_level || 0));
                }
                
            } catch (error) {
                console.error('Error loading data:', error);
                setLoadingError('Failed to load property data. Please try again. \n[' + error.response?.data?.message + ']');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [showDialog, propertyId]);

    const calculations = useMemo(() => {
        const propertyKind = propertyData?.property_kind;
        
        if (propertyKind === 'Land') {
            const baseMarketValue = faasData.unit_value * faasData.area;
            const baseUnitValue = faasData.unit_value;
            const area = faasData.area;
            
            const totalAdjustmentPercent = adjustmentFactors.reduce((sum, adj) => 
                sum + adj.percent_adjustment, 0
            );
            const adjustmentFactor = 1 + (totalAdjustmentPercent / 100);
            
            const adjustedUnitValue = baseUnitValue * adjustmentFactor;
            const adjustedMarketValue = baseMarketValue * adjustmentFactor;
            const landMarketValue = adjustedUnitValue * area;
            const improvementsValue = propertyData?.details.other_improvements?.reduce((sum:any, imp:any) => 
                sum + parseFloat(imp.unit_value || '0') * parseFloat(imp.quantity), 0
            ) || 0;
            
            const totalMarketValue = landMarketValue + improvementsValue;
            const assessedValue = totalMarketValue * (assessmentLevel / 100);
            
            return {
                baseUnitValue,
                baseMarketValue,
                adjustedMarketValue,
                totalAdjustmentPercent,
                adjustmentFactor,
                adjustedUnitValue,
                landMarketValue,
                improvementsValue,
                totalMarketValue,
                assessedValue,
            };
        } else if (propertyKind === 'Building') {
            const details = propertyData?.details;
            
            const totalFloorArea = details?.floor_areas?.reduce((sum:any, floor:any) => 
                sum + parseFloat(floor.floor_area || '0'), 0
            ) || 0;
            
            const additionalItemsValue = details?.additional_items?.reduce((sum:any, item:any) => 
                sum + parseFloat(item.quantity || '0') * parseFloat(item.unit_value || '0'), 0
            ) || 0;
            
            const baseMarketValue =  (faasData.unit_value * totalFloorArea);

            const marketValueAdditionals = baseMarketValue + additionalItemsValue;
            
            const totalAdjustmentPercent = adjustmentFactors.reduce((sum, adj) => 
                sum + adj.percent_adjustment, 0
            );
            // console.log(propertyData?.details);
            //for now I don't think i'll make the depreciation rate auto, i'll make it manual as there will be a data migration at some point

            const adjustmentFactor = parseFloat(details?.additional_adj_factor || '1.0') * (1 + (totalAdjustmentPercent / 100));
            
            const adjustedMarketValue = marketValueAdditionals * adjustmentFactor;
            
            const depreciationRate = parseFloat(faasData.depreciation_rate.toString() || '0') / 100;
            const marketValue = adjustedMarketValue * (1 - depreciationRate);
            const depreciationValue = adjustedMarketValue - marketValue;
            
            const assessedValue = marketValue * (assessmentLevel / 100);
            
            return {
                baseUnitValue: faasData.unit_value,
                baseMarketValue,
                marketValueAdditionals,
                adjustedMarketValue,
                totalAdjustmentPercent,
                depreciationValue,
                adjustmentFactor,
                adjustedUnitValue: faasData.unit_value * adjustmentFactor,
                landMarketValue: 0,
                improvementsValue: additionalItemsValue,
                totalMarketValue: marketValue,
                assessedValue,
                depreciationRate: depreciationRate * 100,
                totalFloorArea,
            };
        } else if (propertyKind === 'Machinery') {
            const details = propertyData?.details;
            
            const original = faasData.unit_value;
            const rcn = original * parseFloat(propertyData?.details.conversion_factor);
            const depreciationRate = faasData.depreciation_rate;
            const totalMarketValue = original * (1 - (faasData.depreciation_rate / 100));
            const deprciatedValue = original - totalMarketValue;

            // const depreciatedValue = faasData.unit_value;
            
            // const totalAdjustmentPercent = adjustmentFactors.reduce((sum, adj) => 
            //     sum + adj.percent_adjustment, 0
            // );
            // const adjustmentFactor = parseFloat(details?.conversion_factor || '1.0') * (1 + (totalAdjustmentPercent / 100));
            
            // const marketValue = depreciatedValue * adjustmentFactor;
            const assessedValue = totalMarketValue * (assessmentLevel / 100);
            
            return {
                // baseUnitValue: original,
                baseMarketValue: original,
                converted: rcn,
                depreciationValue: deprciatedValue,
                depreciationRate: depreciationRate,
                // adjustedMarketValue: marketValue,
                // totalAdjustmentPercent,
                // adjustmentFactor,
                // adjustedUnitValue: depreciatedValue * adjustmentFactor,
                landMarketValue: 0,
                improvementsValue: 0,
                totalMarketValue: totalMarketValue,
                
                assessedValue,
                originalCost: parseFloat(details?.original_cost || '0'),
                rcn: parseFloat(details?.rcn || '0'),
            };
        }
        
        return {
            baseUnitValue: 0,
            baseMarketValue: 0,
            adjustedMarketValue: 0,
            totalAdjustmentPercent: 0,
            adjustmentFactor: 1,
            adjustedUnitValue: 0,
            landMarketValue: 0,
            improvementsValue: 0,
            totalMarketValue: 0,
            assessedValue: 0,
        };
    }, [faasData.unit_value, faasData.area, adjustmentFactors, assessmentLevel, propertyData, faasData.depreciation_rate]);

    const handleFAASChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFAASData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAdjustment = () => {
        setAdjustmentFactors(prev => [
            ...prev,
            {
                id: nextAdjustmentId,
                factor_name: '',
                percent_adjustment: 0,
                remarks: '',
            }
        ]);
        setNextAdjustmentId(prev => prev + 1);
    };

    const handleRemoveAdjustment = (id: number) => {
        setAdjustmentFactors(prev => prev.filter(adj => adj.id !== id));
    };

    const handleAdjustmentChange = (id: number, field: keyof AdjustmentFactor, value: string | number) => {
        setAdjustmentFactors(prev => prev.map(adj => 
            adj.id === id ? { ...adj, [field]: value } : adj
        ));
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        setSubmitLoading(true);
        
        try {
            // need to check all input
            if (!faasData.ry_id) {
                setSubmitError('Revision Year is required');
                return;
            }

            let payload = {
                faas: {
                    property_id: faasData.property_id,
                    ry_id: parseInt(faasData.ry_id),
                    effectivity_date: faasData.effectivity_date,
                    faas_type: "ORIGINAL", //for now
                    status: "ACTIVE", //for now
                    taxable: faasData.taxable,
                    property_kind: propertyData?.property_kind,
                    lg_code: propertyData?.lg_code,
                    barangay: propertyData?.barangay,
                    lot_no: propertyData?.lot_no,
                    block_no: propertyData?.block_no,
                    arp_no: propertyData?.arp_no,
                    pin: propertyData?.pin
                },
                owners: [
                    ...propertyData?.owners
                ]
            }

            switch(propertyData?.property_kind){
                case 'Land':
                    payload = {
                        ...payload,
                        appraisal: {
                            classification: propertyData?.details.classification,
                            subclassification: propertyData?.details.subclassification,
                            area: faasData.area,
                            unit_value: faasData.unit_value,
                            base_market_value: calculations.baseMarketValue
                        },
                        assessment:{
                            actual_use: propertyData?.details.actualuse,
                            market_value: calculations.totalMarketValue,
                            assessment_level: assessmentLevel,
                            assessed_value: calculations.assessedValue
                        },

                        adjustments: adjustmentFactors.filter(adj => adj.factor_name && adj.percent_adjustment !== 0),
                        improvements: propertyData?.details.other_improvements,
                        property_kind: propertyData.property_kind
                    };
                    break;
                case 'Building':
                    // console.log(propertyData);
                    payload = {
                        ...payload,
                        general: {
                            buildingKind: propertyData.details.buildingkind,
                            structuraltype: propertyData.details.structuraltype,
                            buildingage:propertyData.details.year_constructed,
                            storeys:propertyData.details.no_of_storeys,
                        },
                        floors: propertyData.details.floor_areas,
                        materials: propertyData.details.structural_materials,
                        appraisal: {
                            unit_cost: faasData.unit_value,
                            base_market_value: calculations.baseMarketValue,
                            additional_total: calculations.improvementsValue,
                            additional_market_value: calculations.marketValueAdditionals,
                            depreciation_rate: calculations.depreciationRate,
                            depreciation_cost: calculations.depreciationValue,
                            final_market_value: calculations.totalMarketValue
                        },
                        assessment: {
                            actual_use: propertyData.details.actualuse,
                            market_value: calculations.totalMarketValue,
                            assessment_level: assessmentLevel,
                            assessed_value: calculations.assessedValue,
                            taxable: propertyData.details.taxable
                        },
                        additionals: propertyData.details.additional_items,
                        property_kind: propertyData.property_kind

                    }
                    break;
                case 'Machinery':
                    // console.log(propertyData);
                    payload = {
                        ...payload,
                        appraisal:{
                            machinery_type: propertyData.details.machinerytype,
                            brand_model: propertyData.details.brand_model,
                            capacity_hp: propertyData.details.capacity_hp,
                            machinery_condition: propertyData.details.condition,
                            estimated_life: propertyData.details.economic_life,
                            remaining_life: propertyData.details.remaining_life,
                            year_installed: propertyData.details.year_installed,
                            initial_operation: propertyData.details.year_initial_operation,
                            original_cost: calculations.baseMarketValue,
                            conversion_factor: propertyData.details.conversion_factor,
                            rcn: calculations.converted,
                            year_used: 0,
                            depreication_rate: calculations.depreciationRate,
                            depraciation_value: calculations.depreciationValue,
                        },
                        assessment: {
                            actual_use: propertyData.details.actualuse,
                            market_value: calculations.totalMarketValue,
                            assessment_level: assessmentLevel,
                            assessed_value: calculations.assessedValue,
                            taxable: propertyData.details.taxable,
                        },
                        property_kind: propertyData.property_kind
                    }
                    break;
            }
            // console.log(propertyData)
            // console.log(payload)
            setRefresh(prev=>!prev);
            await api.post('faas/create', payload);
            setSubmissionSuccessful(true);
            
        } catch (error) {
            console.error('Submission failed:', error);
            setSubmitError('Failed to create FAAS record');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSubmissionSuccessful(false);
        setAdjustmentFactors([]);
        setSubmitError(null);
        setLoadingError(null);
        setPropertyData(null);
    };

    if (!showDialog) return null;

    if (submissionSuccessful) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-10 flex flex-col items-center text-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-6 animate-pulse" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">FAAS Created Successfully!</h2>
                    {/* <p className="text-lg text-gray-600 mb-2">
                        Tax Declaration No: <strong>{faasData.td_no}</strong>
                    </p> */}
                    <p className="text-sm text-gray-500 mb-8">
                        Assessed Value: ₱{calculations.assessedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <button
                        onClick={handleClose}
                        type="button"
                        className="px-8 py-3 text-lg font-medium text-white rounded-xl shadow-lg transition bg-emerald-600 hover:bg-emerald-700"
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
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Loading property data...</p>
                    <p className="text-sm text-gray-500 mt-2">Property ID: {propertyId}</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Property</h2>
                    <p className="text-gray-600 mb-6">{loadingError}</p>
                    <div className="text-sm text-gray-500 mb-6">
                        <p>Property ID: <span className="font-medium">{propertyId}</span></p>
                    </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
                <div className="p-6 flex justify-between items-center border-b border-gray-200 bg-emerald-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <FileText className="w-6 h-6 text-emerald-600 mr-3" />
                            Field Appraisal & Assessment Sheet (FAAS) (Original)
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Property: {propertyData?.arp_no} - {propertyData?.owner_name}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        disabled={submitLoading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>



                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Owner(s)</h3>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                            {propertyData?.owners.map((item: any, index: number) => (
                                <div
                                key={index}
                                className="flex flex-col rounded-md border border-gray-200 p-3 bg-white"
                                >
                                <span className="font-semibold text-gray-900">
                                    {item.last_name}, {item.first_name} {item.middle_name} {item.suffix}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {item.address_house_no}
                                </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Property Information - {propertyData?.property_kind}</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">ARP No:</span>
                                <p className="font-medium">{propertyData?.arp_no}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">PIN:</span>
                                <p className="font-medium">{propertyData?.pin}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Location:</span>
                                <p className="font-medium">{propertyData?.barangay}</p>
                            </div>
                            
                            {propertyData?.property_kind === 'Land' && (
                                <>
                                    <div>
                                        <span className="text-gray-600">Lot/Block:</span>
                                        <p className="font-medium">{propertyData?.lot_no}/{propertyData?.block_no}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Classification:</span>
                                        <p className="font-medium">{propertyData?.details.classification}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">SubClassification:</span>
                                        <p className="font-medium">{propertyData?.details.subclassification}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Area:</span>
                                        <p className="font-medium">{propertyData?.details.lot_area} sqm</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Actual Use:</span>
                                        <p className="font-medium">{propertyData?.details.actualuse}</p>
                                    </div>
                                </>
                            )}
                            
                            {propertyData?.property_kind === 'Building' && (
                                <>
                                    <div>
                                        <span className="text-gray-600">Building Kind:</span>
                                        <p className="font-medium">{propertyData?.details.buildingkind}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Structural Type:</span>
                                        <p className="font-medium">{propertyData?.details.structuraltype}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Storeys:</span>
                                        <p className="font-medium">{propertyData?.details.no_of_storeys}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Year Constructed:</span>
                                        <p className="font-medium">{propertyData?.details.year_constructed}</p>
                                    </div>
                                    {/* <div>
                                        <span className="text-gray-600">Total Floor Area:</span>
                                        <p className="font-medium">
                                            {propertyData?.details.floor_areas?.reduce((sum, floor) => 
                                                sum + parseFloat(floor.floor_area || '0'), 0
                                            ).toFixed(2)} sqm
                                        </p>
                                    </div> */}
                                </>
                            )}
                            
                            {propertyData?.property_kind === 'Machinery' && (
                                <>
                                    <div>
                                        <span className="text-gray-600">Brand/Model:</span>
                                        <p className="font-medium">{propertyData?.details.brand_model}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Capacity:</span>
                                        <p className="font-medium">{propertyData?.details.capacity_hp} HP</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Condition:</span>
                                        <p className="font-medium">{propertyData?.details.condition?.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Year Installed:</span>
                                        <p className="font-medium">{propertyData?.details.year_installed}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">FAAS Details</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Revision Year <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="ry_id"
                                    value={faasData.ry_id == ''? active: faasData.ry_id}
                                    onChange={handleFAASChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                >
                                    <option value="">Select Year</option>
                                    {revisionYears.map(ry => (
                                        <option key={ry.ry_id} value={ry.ry_id}>{ry.year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Effectivity Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="effectivity_date"
                                    value={faasData.effectivity_date}
                                    onChange={handleFAASChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Unit Value (Base)
                                </label>
                                <input
                                    type="number"
                                    name="unit_value"
                                    value={faasData.unit_value}
                                    onChange={handleFAASChange}
                                    step="0.01"
                                    className="disabled:cursor-not-allowed disabled:bg-gray-200 w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    {propertyData?.property_kind === 'Land' ? 'Area (sqm)' : 
                                     propertyData?.property_kind === 'Building' ? 'Total Floor Area (sqm)' : 'Quantity'}
                                </label>
                                <input
                                    type="number"
                                    name="area"
                                    value={faasData.area}
                                    onChange={handleFAASChange}
                                    step="0.01"
                                    className="disabled:cursor-not-allowed disabled:bg-gray-200 w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                    disabled
                                />
                            </div>
                            <div className="flex items-center space-x-3 pt-6">
                                <input
                                    id="taxable-checkbox"
                                    type="checkbox"
                                    name="taxable"
                                    checked={propertyData?.details.taxable === 1}
                                    disabled
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="taxable-checkbox" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Tax Status: <span className='font-extrabold'>{propertyData?.details.taxable === 1 ? 'Taxable' : 'Exempt'}</span>
                                </label>
                            </div>
                            {
                                propertyData?.property_kind !== 'Land' && 
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Depreciation Rate (per year)
                                    </label>
                                    <input
                                        type="number"
                                        name="depreciation_rate"
                                        value={faasData.depreciation_rate}
                                        onChange={handleFAASChange}
                                        step="0.01"
                                        className="disabled:cursor-not-allowed disabled:bg-gray-200 w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                    />
                                </div>
                            }
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Approved By
                                </label>
                                <input
                                    type="text"
                                    name="approved_by"
                                    value={faasData.approved_by}
                                    onChange={handleFAASChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                />
                            </div>
                        </div>
                    </div>
                    {
                        propertyData?.property_kind === 'Land'? 
                            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center">
                                        <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                                        Adjustment Factors
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleAddAdjustment}
                                        className="px-3 py-1 text-sm font-medium text-white rounded-md bg-blue-500 hover:bg-blue-600 transition flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Add Factor
                                    </button>
                                </div>
                                
                                {adjustmentFactors.length === 0 ? (
                                    <p className="text-center text-gray-500 italic py-4">
                                        No adjustment factors. Click "Add Factor" to add topography, shape, corner lot, or other adjustments.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {adjustmentFactors.map(adj => (
                                            <div key={adj.id} className="grid grid-cols-10 gap-3 items-start bg-white p-3 rounded-md border border-gray-200">
                                                <div className="col-span-7">
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Factor Name</label>
                                                    <input
                                                        type="text"
                                                        value={adj.factor_name}
                                                        onChange={(e) => handleAdjustmentChange(adj.id, 'factor_name', e.target.value)}
                                                        placeholder="e.g., Corner Lot, Topography"
                                                        className="w-full text-sm p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Adjustment %</label>
                                                    <input
                                                        type="number"
                                                        value={adj.percent_adjustment}
                                                        onChange={(e) => handleAdjustmentChange(adj.id, 'percent_adjustment', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                        placeholder="e.g., 10 or -5"
                                                        className="w-full text-sm p-2 border rounded-md text-right focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                {/* <div className="col-span-5">
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                                                    <input
                                                        type="text"
                                                        value={adj.remarks}
                                                        onChange={(e) => handleAdjustmentChange(adj.id, 'remarks', e.target.value)}
                                                        placeholder="Optional notes"
                                                        className="w-full text-sm p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div> */}
                                                <div className="col-span-1 flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAdjustment(adj.id)}
                                                        className="p-2 text-red-500 hover:text-red-700 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        :<></>
                    }

                    <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50/50">
                        <h3 className="font-semibold text-gray-700 mb-4">Market Value Calculation</h3>
                        
                        <div className="space-y-3">
                            {propertyData?.property_kind === 'Land' && (
                                <>
                                    <div className="bg-white p-3 rounded-md border border-gray-200">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Land Appraisal</h4>
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Base Market Value:</span>
                                                <p className="font-medium">₱{calculations.baseMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Adjustment:</span>
                                                <p className="font-medium text-blue-600">
                                                    {calculations.totalAdjustmentPercent > 0 ? '+' : ''}{calculations.totalAdjustmentPercent.toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Actual Market Value:</span>
                                                <p className="font-bold text-emerald-700">₱{calculations.landMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {propertyData?.details.other_improvements && propertyData.details.other_improvements.length > 0 && (
                                        <div className="bg-white p-3 rounded-md border border-gray-200">
                                            <h4 className="font-medium text-sm text-gray-700 mb-2">Other Improvements</h4>
                                            <div className="space-y-2">
                                                {propertyData.details.other_improvements.map((imp:any, idx:any) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{imp.improvement_name} (Qty: {imp.quantity} | Unit Value: ₱{imp.unit_value})</span>
                                                        <span className="font-medium">₱{(parseFloat(imp.unit_value) * parseFloat(imp.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t border-gray-200 flex justify-between">
                                                    <span className="text-gray-700 font-medium">Total Improvements:</span>
                                                    <span className="font-bold text-emerald-700">₱{calculations.improvementsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {propertyData?.property_kind === 'Building' && (
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                    {/* Market Value Section - Moved to Top */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-xl text-gray-800 mb-4 border-b border-gray-100 pb-2">
                                            Appraised Market Value
                                        </h4>
                                        
                                        {/* Base Market Value */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between text-base">
                                                <span className="text-gray-600">Base Market Value:</span>
                                                <span className="font-medium text-gray-800">
                                                    ₱{calculations.baseMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-6 border-gray-200" />

                                    {/* Floor Area Details */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-xl text-gray-800 mb-4 border-b border-gray-100 pb-2">
                                            Floor Area Details
                                        </h4>
                                        
                                        <ul className="space-y-3">
                                            {propertyData?.details.floor_areas?.map((floor, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-sm pb-1 border-b border-gray-100 last:border-b-0">
                                                    <span className="text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                                                        Floor <span className='font-bold'>{floor.floor_no}</span> Area:
                                                    </span>
                                                    <span className="font-medium text-gray-800">
                                                        {parseFloat(floor.floor_area).toFixed(2)} sqm
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-4 pt-3 border-t-2 border-blue-100 bg-blue-50/50 p-3 rounded-md flex justify-between items-center font-bold text-base">
                                            <span className="text-blue-800">Total Floor Area:</span>
                                            <span className="text-blue-600">
                                                {calculations.totalFloorArea?.toFixed(2)} sqm
                                            </span>
                                        </div>
                                    </div>

                                    {/* Additional Items Section */}
                                    {propertyData?.details.additional_items && propertyData.details.additional_items.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h4 className="font-semibold text-xl text-gray-800 mb-4 border-b border-gray-100 pb-2">
                                                Additional Items Breakdown
                                            </h4>
                                            
                                            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                                                {propertyData.details.additional_items.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between items-center p-3 text-sm hover:bg-gray-50 transition duration-150">
                                                        <span className="text-gray-600">
                                                            <span className='font-bold'>{item.item_name}</span> <span className="text-xs text-gray-400">(Qty: {item.quantity} | Unit Value: ₱{item.unit_value})</span>
                                                        </span>
                                                        <span className="font-medium text-gray-700">
                                                            ₱{(parseFloat(item.unit_value) * parseFloat(item.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            
                                            <div className="mt-4 pt-3 border-t-2 border-blue-100 bg-blue-50/50 p-3 rounded-md flex justify-between items-center font-bold text-base">
                                                <span className="text-blue-800">Total Additional Items:</span>
                                                <span className="text-blue-600">
                                                    ₱{calculations.improvementsValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {/* Market Value with Additionals - Placed under breakdown */}
                                            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex justify-between text-base">
                                                    <span className="text-gray-600">Base Market Value <span className='font-bold'>W/ Additionals</span>:</span>
                                                    <span className="font-medium text-gray-800">
                                                        ₱{calculations.marketValueAdditionals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Depreciation Section - After Additionals */}
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h4 className="font-semibold text-xl text-gray-800 mb-4 border-b border-gray-100 pb-2">
                                            Depreciation
                                        </h4>
                                        
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-2 mb-4">
                                            <div className="flex justify-between text-base">
                                                <span className="text-gray-600">Depreciation Rate:</span>
                                                <span className="font-semibold text-red-600">
                                                    {calculations.depreciationRate?.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-base">
                                                <span className="text-gray-600">Depreciation Value:</span>
                                                <span className="font-semibold text-red-600">
                                                    -₱{calculations.depreciationValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Final Total Market Value */}
                                        <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-lg shadow-inner border border-emerald-300">
                                            <span className="text-lg font-bold text-emerald-800">After Depreciation (Total Market Value):</span>
                                            <span className="text-xl font-extrabold text-emerald-700">
                                                ₱{calculations.totalMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {propertyData?.property_kind === 'Machinery' && (
                                <div className="bg-white p-3 rounded-md border border-gray-200">
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">Machinery Appraisal</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Original Cost:</span>
                                            <span className="font-medium">₱{calculations.baseMarketValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">RCN (Replacement Cost New):</span>
                                            <span className="font-medium">₱{calculations.converted?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Economic Life:</span>
                                            <span className="font-medium">{propertyData?.details.economic_life} years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Years Used:</span>
                                            <span className="font-medium">{propertyData?.details.years_used} years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Remaining Life:</span>
                                            <span className="font-medium">{propertyData?.details.remaining_life} years</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="text-gray-600">Depreciation Rate:</span>
                                            <span className="font-semibold text-red-600">
                                                {Number(calculations.depreciationRate)?.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="text-gray-600">Depreciation Value:</span>
                                            <span className="font-semibold text-red-600">
                                                -₱{Number(calculations.depreciationValue)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-emerald-100 p-4 rounded-md border-2 border-emerald-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-800">Total Market Value:</span>
                                    <span className="text-2xl font-bold text-emerald-700">₱{calculations.totalMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/50">
                        <h3 className="font-semibold text-gray-700 mb-4">Property Assessment</h3>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-md border border-gray-200">
                                <span className="text-sm text-gray-600">Market Value</span>
                                <p className="text-xl font-bold text-gray-800">₱{calculations.totalMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white p-4 rounded-md border border-gray-200">
                                <span className="text-sm text-gray-600">Assessment Level</span>
                                <p className="text-xl font-bold text-purple-600">{assessmentLevel.toFixed(2)}%</p>
                            </div>
                            <div className="bg-purple-100 p-4 rounded-md border-2 border-purple-300">
                                <span className="text-sm text-gray-700 font-medium">Assessed Value</span>
                                <p className="text-2xl font-bold text-purple-700">₱{calculations.assessedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                            <textarea
                                name="remarks"
                                value={faasData.remarks}
                                onChange={handleFAASChange}
                                rows={2}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2"
                                placeholder="Additional notes or remarks..."
                            />
                        </div>
                    </div>
                </div>

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
                                bg-emerald-600 hover:bg-emerald-700
                                ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {submitLoading && (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            )}
                            <FileText className="w-4 h-4 mr-2" /> Create Original FAAS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};