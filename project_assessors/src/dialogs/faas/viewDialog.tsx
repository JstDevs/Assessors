import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, MapPin, User, Building, Wrench, Package, TrendingDown, DollarSign, Loader, Info, Tag, AlertCircle, Printer } from 'lucide-react';
import api from '../../../axiosBase';
// IMPORT THE FUNCTION, NOT THE COMPONENT
import { printFaas } from './print'; 
import TaxDeclarationDialog from './createTD';

// --- Interfaces (Kept exactly as you had them) ---

interface FAASBase {
    faas_id: number;
    property_id: number;
    ry_id: number;
    faas_no: string;
    arp_no: string | null;
    pin: string | null;
    owner_name: string;
    owner_address: string;
    lg_code: string;
    barangay: string;
    lot_no: string | null;
    block_no: string | null;
    faas_type: string;
    effectivity_date: string;
    previous_faas_id: number | null;
    status: string;
    taxable: number | null;
    property_kind: 'Land' | 'Building' | 'Machinery';
    created_by: string | null;
    created_date: string;
    description?: string;
}

interface LandDetails {
    appraisal: {
        classification: string;
        subclassification: string;
        area: string;
        unit_value: string;
        base_market_value: string;
    };
    assessment: {
        actual_use: string;
        market_value: string;
        assessment_level: string;
        assessed_value: string;
    };
    adjustments: Array<{ factor: string; adjustment: string }>;
    improvements: Array<{ improvement_name: string; qty: number; unit_value: string }>;
}

interface BuildingDetails {
    general: {
        buildingKind: string;
        structuralType: string;
        buildingAge: number;
        storeys: number;
    };
    floors: Array<{ floor_no: number; floor_area: string }>;
    materials: Array<{ part: string; material: string; floor_no?: number }>;
    appraisal: {
        unit_cost: string;
        base_market_value: string;
        additional_total: string;
        additional_market_value: string;
        deprication_rate: string;
        depreciation_cost: string;
        final_market_value: string;
    };
    assessment: {
        actual_use: string;
        market_value: string;
        assessment_level: string;
        assessed_value: string;
        taxable: number;
    };
    additionals: Array<{ item_name: string; quantity: number; unit_cost: string; total_cost: string }>;
}

interface MachineryDetails {
    appraisal: {
        machinery_type: string;
        brand_model: string;
        capacity_hp: string;
        date_acquired: string | null;
        machinery_condition: string;
        estimated_life: number;
        remaining_life: number;
        year_installed: number | null;
        initial_operation: number | null;
        original_cost: string;
        conversion_factor: string;
        rcn: string;
        years_used: string;
        depreciation_rate: string | null;
        depreciation_value: string;
    };
    assessment: {
        actual_use: string;
        market_value: string;
        assessment_level: string;
        assessed_value: string;
        taxable: number;
    };
}

interface FAASResponse {
    faas: FAASBase;
    land: LandDetails | null;
    building: BuildingDetails | null;
    machinery: MachineryDetails | null;
}

interface FAASViewDialogProps {
    faasId: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function FAASViewDialog({ faasId, isOpen, onClose }: FAASViewDialogProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<FAASResponse | null>(null);
    const [error, setError] = useState<string>('');
    const [showTd, setShowTd] = useState(false);

    useEffect(() => {
        if (isOpen && faasId) {
            fetchFAASData();
        } else if (!isOpen) {
            setData(null);
            setError('');
        }
    }, [isOpen, faasId]);

    const fetchFAASData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`faas/${faasId}`);
            console.log(response.data);
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load FAAS data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Formatters ---
    const renderValue = (val: string | number | null | undefined, suffix = '') => {
        if (val === null || val === undefined || val === '') return <span className="text-slate-400 font-normal text-sm">-</span>;
        return <span className="font-medium text-slate-800 text-sm">{val}{suffix}</span>;
    };

    const formatCurrency = (val: string | number | null | undefined) => {
        if (val === null || val === undefined || val === '') return <span className="text-slate-400 font-normal text-sm">-</span>;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return <span className="text-slate-400 font-normal text-sm">-</span>;
        return <span className="font-mono font-medium text-sm">₱{num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    };

    const formatCurrencyRaw = (val: string | number | null | undefined) => {
        if (!val) return '0.00';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return <span className="text-slate-400 font-normal text-sm">-</span>;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return <span className="text-slate-400 font-normal text-sm">{String(dateString)}</span>;
        return <span className="font-medium text-slate-800 text-sm">{date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>;
    };

    // --- PRINT HANDLER ---
    const handlePrint = () => {
        if (!data) return;
        
        // 1. Determine which sub-object to use (Land, Building, or Machinery)
        const details = data.land || data.building || data.machinery;
        const assessment = data.land?.assessment || data.building?.assessment || data.machinery?.assessment;
        
        // 2. Map your API data to the PDF structure
        const printData = {
            // Header
            transactionCode: data.faas.faas_no,
            arpNo: data.faas.arp_no || '',
            pin: data.faas.pin || '',
            // You might not have OCT/Survey in your interface yet, so we leave them blank or map if available
            octNo: "", 
            octDate: "",
            surveyNo: "", 
            lotNo: data.faas.lot_no || '',
            blkNo: data.faas.block_no || '',
            
            // Owner
            ownerName: data.faas.owner_name,
            ownerAddress: data.faas.owner_address,
            ownerTel: "", // Add to interface if needed
            ownerTin: "",
            
            // Admin (You can hardcode empty or add to interface)
            adminName: "",
            adminAddress: "",
            adminTel: "",
            adminTin: "",
            
            // Location
            propStreet: "", // If you have street in address, parse it here
            propBrgy: data.faas.barangay,
            propMuni: data.faas.lg_code, // Or map code to name
            propProv: "PROVINCE", 
            
            // Boundaries (Empty unless added to DB)
            boundNorth: "",
            boundEast: "",
            boundSouth: "",
            boundWest: "",
            
            // Appraisal
            class: data.land?.appraisal.classification || data.building?.general.buildingKind || data.machinery?.appraisal.machinery_type || '',
            subClass: data.land?.appraisal.subclassification || '',
            area: data.land?.appraisal.area || (data.building?.floors ? `${data.building.floors.length} Storeys` : ''),
            unitValue: data.land ? formatCurrencyRaw(data.land.appraisal.unit_value) : '',
            baseMarketValue: data.land ? formatCurrencyRaw(data.land.appraisal.base_market_value) : 
                             data.building ? formatCurrencyRaw(data.building.appraisal.base_market_value) : 
                             data.machinery ? formatCurrencyRaw(data.machinery.appraisal.original_cost) : '',
            
            // Totals
            totalArea: data.land?.appraisal.area || '',
            totalBaseMarket: data.land ? formatCurrencyRaw(data.land.appraisal.base_market_value) : 
                             data.building ? formatCurrencyRaw(data.building.appraisal.final_market_value) : '',
            
            // Market Value Adjustments
            adjustFactor: "", 
            adjustPercent: "", 
            adjustValue: "",
            marketValue: assessment ? formatCurrencyRaw(assessment.market_value) : '',
            
            // Assessment
            actualUse: assessment?.actual_use || '',
            assessLevel: assessment ? `${assessment.assessment_level}` : '',
            assessedValue: assessment ? formatCurrencyRaw(assessment.assessed_value) : '',
            
            // Signatories
            appraisedBy: data.faas.created_by || '',
            appraisedDate: new Date(data.faas.created_date).toLocaleDateString(),
            recommending: "MUNICIPAL ASSESSOR",
            recommendingDate: "",
            approvedBy: "PROVINCIAL ASSESSOR",
            approvedDate: "",
            
            // Recording
            entryDate: new Date(data.faas.created_date).toLocaleDateString(),
            entryBy: data.faas.created_by || ''
        };

        // 3. Call the print function
        printFaas(data);
        // console.log(data);
    };

    // --- UI Components ---
    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
            {title}
        </h3>
    );

    const InfoRow = ({ label, value, subLabel }: { label: string, value: React.ReactNode, subLabel?: string }) => (
        <div className="flex justify-between items-baseline py-1.5 border-b border-slate-50 last:border-0">
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                {subLabel && <span className="text-[10px] text-slate-400">{subLabel}</span>}
            </div>
            <div className="text-right">{value}</div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 z-101">
            <div className="bg-slate-100 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
                
                {/* Header - Darker Theme */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl bg-white/10 border border-white/5`}>
                            {data?.faas.property_kind === 'Land' ? <Package size={24} className="text-emerald-400" /> : 
                             data?.faas.property_kind === 'Building' ? <Building size={24} className="text-blue-400" /> : 
                             <Wrench size={24} className="text-amber-400" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">FAAS Details</h2>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                                <span className="font-mono text-white/90">{data?.faas.faas_no || 'Loading...'}</span>
                                <span className="text-slate-600">•</span>
                                <span className="uppercase font-bold tracking-wider text-xs text-slate-300">{data?.faas.property_kind}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* MODIFIED PRINT BUTTON */}
                        <button 
                            onClick={handlePrint}
                            disabled={!data}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            title="Print"
                        >
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader className="w-10 h-10 text-slate-600 animate-spin mb-3" />
                            <p className="text-slate-500 font-medium">Retrieving FAAS data...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="bg-red-100 p-4 rounded-full mb-3"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                            <h3 className="text-lg font-bold text-slate-800">Unable to load data</h3>
                            <p className="text-slate-500 mb-4">{error}</p>
                            <button onClick={fetchFAASData} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100">Try Again</button>
                        </div>
                    ) : data ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* COL 1: General & Owner (Width: 3/12) */}
                            <div className="lg:col-span-3 space-y-6">
                                {/* General Info Card */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="General Info" />
                                    <div className="space-y-3 pt-2">
                                        <InfoRow label="Type" value={<span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-700">{data.faas.faas_type}</span>} />
                                        <InfoRow label="Status" value={
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${data.faas.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                {data.faas.status}
                                            </span>
                                        } />
                                        <InfoRow label="Effectivity" value={formatDate(data.faas.effectivity_date)} />
                                        <InfoRow label="Created Date" value={formatDate(data.faas.created_date)} />
                                        <div className="pt-3 mt-1">
                                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Created By</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                    <User size={12} />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">{data.faas.created_by || 'System'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Owner Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <SectionHeader title="Owner Details" />
                                    
                                    <div className="mt-4 divide-y divide-slate-100">
                                        {data?.owners?.length > 0 ? (
                                        data.owners.map((item, index) => (
                                            <div key={index} className="py-4 first:pt-0 last:pb-0">
                                            {/* Owner Name */}
                                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">
                                                {item.last_name}, {item.first_name} {item.middle_name} {item.suffix}
                                            </h4>
                                            
                                            {/* Owner Details / Address */}
                                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>House No. {item.address_house_no || 'N/A'}</span>
                                            </div>
                                            </div>
                                        ))
                                        ) : (
                                        <p className="text-sm text-slate-400 italic py-2">No owner records found.</p>
                                        )}
                                    </div>
                                    </div>
                            </div>

                            {/* COL 2: Location & Details (Width: 5/12) */}
                            <div className="lg:col-span-5 space-y-6">
                                
                                {/* Location Card */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Property Location" />
                                    <div className="grid grid-cols-1 gap-y-2 pt-2">
                                        <InfoRow label="ARP No." value={<span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{renderValue(data.faas.arp_no)}</span>} />
                                        <InfoRow label="PIN" value={<span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{renderValue(data.faas.pin)}</span>} />
                                        <InfoRow label="Barangay" value={renderValue(data.faas.barangay)} />
                                        <InfoRow label="LGU Code" value={renderValue(data.faas.lg_code)} />
                                        {data.faas.property_kind === 'Land' && (
                                            <div className="grid grid-cols-2 gap-4 mt-1 pt-2 border-t border-slate-50">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Lot No.</p>
                                                    <p className="text-sm font-medium text-slate-900">{renderValue(data.faas.lot_no)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Block No.</p>
                                                    <p className="text-sm font-medium text-slate-900">{renderValue(data.faas.block_no)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Specific Details Card */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex-1">
                                    <SectionHeader title={`${data.faas.property_kind} Appraisal Details`} />

                                    {/* LAND DATA */}
                                    {data.land && (
                                        <div className="space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <InfoRow label="Classification" value={data.land.appraisal.classification} />
                                                <InfoRow label="Sub-Class" value={data.land.appraisal.subclassification} />
                                                <InfoRow label="Area" value={renderValue(data.land.appraisal.area, ' sqm')} />
                                                <InfoRow label="Unit Value" value={formatCurrency(data.land.appraisal.unit_value)} />
                                            </div>
                                            
                                            {data.land.improvements.length > 0 && (
                                                <div className="mt-5 pt-4 border-t border-slate-100">
                                                    <p className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Improvement Table</p>
                                                    <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-100 text-slate-500">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left font-semibold">Name</th>
                                                                    <th className="px-3 py-2 text-center font-semibold">Qty</th>
                                                                    <th className="px-3 py-2 text-right font-semibold">Unit Val</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200">
                                                                {data.land.improvements.map((imp, i) => (
                                                                    <tr key={i} className="hover:bg-white transition-colors">
                                                                        <td className="px-3 py-2 text-slate-700 font-medium">{imp.improvement_name}</td>
                                                                        <td className="px-3 py-2 text-slate-500 text-center">x{imp.qty}</td>
                                                                        <td className="px-3 py-2 font-mono text-right text-slate-600">{formatCurrency(imp.unit_value)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* BUILDING DATA */}
                                    {data.building && (
                                        <div className="pt-2 space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Kind</p>
                                                    <p className="text-xs font-semibold text-slate-800 truncate" title={data.building.general.buildingKind}>{data.building.general.buildingKind}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Structure</p>
                                                    <p className="text-xs font-semibold text-slate-800 truncate" title={data.building.general.structuralType}>{data.building.general.structuralType}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Storeys</p>
                                                    <p className="text-xs font-semibold text-slate-800">{data.building.general.storeys}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Year Built</p>
                                                    <p className="text-xs font-semibold text-slate-800">{data.building.general.buildingAge}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <InfoRow label="Unit Cost" value={formatCurrency(data.building.appraisal.unit_cost)} />
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Floor Breakdown</p>
                                                <div className="space-y-1">
                                                    {data.building.floors.map((f, i) => (
                                                        <div key={i} className="flex justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded">
                                                            <span className="text-slate-600 font-medium">Floor {f.floor_no}</span>
                                                            <span className="font-mono text-slate-800">{renderValue(f.floor_area, ' sqm')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* MACHINERY DATA */}
                                    {data.machinery && (
                                        <div className="pt-2 space-y-4">
                                            <div className="space-y-2">
                                                <InfoRow label="Machine Type" value={data.machinery.appraisal.machinery_type} />
                                                <InfoRow label="Brand/Model" value={data.machinery.appraisal.brand_model} />
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <InfoRow label="Capacity" value={data.machinery.appraisal.capacity_hp} />
                                                    <InfoRow label="Condition" value={data.machinery.appraisal.machinery_condition} />
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Date Acquired</p>
                                                    <p className="text-sm font-medium text-slate-900">{formatDate(data.machinery.appraisal.date_acquired)}</p>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Original Cost</p>
                                                    <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(data.machinery.appraisal.original_cost)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COL 3: Valuation & Assessment (Width: 4/12) */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Valuation Summary */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Valuation Summary" />
                                    
                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 font-medium">Base Market Value</span>
                                            <span className="text-sm font-bold text-slate-800">
                                                {formatCurrency(
                                                    data.land?.appraisal.base_market_value || 
                                                    data.building?.appraisal.base_market_value || 
                                                    data.machinery?.appraisal.original_cost
                                                )}
                                            </span>
                                        </div>

                                        {/* Dynamic Adjustments/Depreciation Rows */}
                                        {data.land?.improvements.length ? (
                                            <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                <span className="text-xs font-semibold">+ Improvements</span>
                                                <span className="text-sm font-mono font-bold">
                                                    +{formatCurrency(data.land.improvements.reduce((acc, cur) => acc + (cur.qty * parseFloat(cur.unit_value)), 0))}
                                                </span>
                                            </div>
                                        ) : null}

                                        {data.building && (
                                            <>
                                                <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                    <span className="text-xs font-semibold">+ Additionals</span>
                                                    <span className="text-sm font-mono font-bold">+{formatCurrency(data.building.appraisal.additional_total)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-red-700 bg-red-50 px-2 py-1 rounded">
                                                    <span className="text-xs font-semibold">- Depreciation</span>
                                                    <span className="text-sm font-mono font-bold">-{formatCurrency(data.building.appraisal.depreciation_cost)}</span>
                                                </div>
                                            </>
                                        )}
                                        
                                        {data.machinery && (
                                            <div className="flex justify-between items-center text-red-700 bg-red-50 px-2 py-1 rounded">
                                                <span className="text-xs font-semibold">- Depreciation</span>
                                                <span className="text-sm font-mono font-bold">-{formatCurrency(data.machinery.appraisal.depreciation_value)}</span>
                                            </div>
                                        )}

                                        <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-900">Final Market Value</span>
                                            <span className="text-lg font-extrabold text-slate-900">
                                                {formatCurrency(
                                                    (data.land?.assessment.market_value) || 
                                                    (data.building?.appraisal.final_market_value) || 
                                                    (data.machinery && (parseFloat(data.machinery.appraisal.rcn) - parseFloat(data.machinery.appraisal.depreciation_value)))
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Assessment Summary */}
                                <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 text-white">
                                    <h3 className="text-sm font-bold text-slate-300 mb-4 pb-2 border-b border-slate-700 flex items-center gap-2">
                                        Assessment Summary
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Actual Use</span>
                                            <span className="text-sm font-bold text-white text-right block max-w-[180px]">
                                                {data.land?.assessment.actual_use || data.building?.assessment.actual_use || data.machinery?.assessment.actual_use || '-'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Tax Status</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                                (data.faas.property_kind === 'Land' ? data.faas.taxable : 
                                                data.building?.assessment.taxable || data.machinery?.assessment.taxable) === 1 
                                                ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-200'
                                            }`}>
                                                {(data.faas.property_kind === 'Land' ? data.faas.taxable : 
                                                data.building?.assessment.taxable || data.machinery?.assessment.taxable) === 1 
                                                ? 'Taxable' : 'Exempt'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Assess Level</span>
                                            <span className="text-sm font-bold text-yellow-400">
                                                {renderValue(
                                                    data.land?.assessment.assessment_level || 
                                                    data.building?.assessment.assessment_level || 
                                                    data.machinery?.assessment.assessment_level, '%'
                                                )}
                                            </span>
                                        </div>
                                        
                                        <div className="pt-4 mt-2 border-t border-slate-700/50">
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Total Assessed Value</p>
                                            <p className="text-3xl font-extrabold text-white font-mono tracking-tight leading-none">
                                                {formatCurrency(
                                                    data.land?.assessment.assessed_value || 
                                                    data.building?.assessment.assessed_value || 
                                                    data.machinery?.assessment.assessed_value
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end shrink-0">
                    <button 
                        onClick={()=>{ setShowTd(true)}}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-800 text-slate-100 rounded-lg font-bold transition-colors text-sm border border-slate-200"
                    >
                        Create TD
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors text-sm border border-slate-200"
                    >
                        Close
                    </button>
                </div>
            </div>
            <TaxDeclarationDialog
                faasId={faasId}
                isOpen={showTd}
                onClose={()=>{setShowTd(false)}}
                onSuccess={()=>{}}
            />
        </div>
    );
}