import React, { useState, useEffect } from 'react';
import { 
    X, FileText, Calendar, MapPin, User, Building, Wrench, Package, 
    TrendingDown, DollarSign, Loader, Info, Tag, AlertCircle, Printer, 
    LandPlot, Factory, History, ArrowLeft, Layers, Hammer,
    Users,
    ClipboardList,
    BuildingIcon,
    HardHat,
    Plus,
    Calculator
} from 'lucide-react';
// Commented out to prevent compilation errors in this preview environment.
import api from '../../../axiosBase';
// import { printFaas } from './print'; 
// import TaxDeclarationDialog from './createTD'; 

const printFaas = (data: any) => console.log("Printing FAAS...", data);

// Dummy component for the preview environment
const TaxDeclarationDialog = ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm text-center">
                <h3 className="font-bold text-lg text-slate-800 mb-2">Create Tax Declaration</h3>
                <p className="text-sm text-slate-600 mb-6">This is a stub component for the preview environment. In the real app, this will open the TD creator.</p>
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 w-full font-bold transition-colors">Close</button>
            </div>
        </div>
    );
};

// Mock API for the preview environment
// const api: any = {
//     get: async (url: string) => {
//         await new Promise(r => setTimeout(r, 600));
//         // Default to a Land FAAS response for the preview
//         return {
//             data: {
//                 faas: {
//                     faas_id: 336,
//                     property_id: 293,
//                     ry_id: 1,
//                     faas_no: "FAAS-00336",
//                     arp_no: "FAAS-00328",
//                     pin: "000-111-222",
//                     lg_code: "PRIME-01",
//                     barangay: "Barangay 12",
//                     lot_no: "Lot 1A",
//                     block_no: "Block 5",
//                     faas_type: "REVISION",
//                     effectivity_date: "2026-02-24T16:00:00.000Z",
//                     previous_faas_id: 328,
//                     status: "ACTIVE",
//                     taxable: 1,
//                     property_kind: "Land",
//                     created_by: "System Admin",
//                     created_date: "2026-02-25T06:05:50.000Z"
//                 },
//                 owners: [
//                     {
//                         fo_id: 221,
//                         faas_id: 336,
//                         owner_id: 5,
//                         last_name: "Conchas",
//                         first_name: "Robert",
//                         middle_name: "C.",
//                         suffix: "",
//                         tin_no: "123-456-789",
//                         email: "robert@example.com",
//                         contact_no: "09202672998",
//                         address_house_no: "Unit 307 Bldg. 2 Katuparan Housing Vitas St. Tondo, Manila"
//                     }
//                 ],
//                 land: {
//                     appraisal: {
//                         classification: "R",
//                         subclassification: "R2",
//                         area: "25000.00",
//                         unit_value: "541.00",
//                         base_market_value: "13525000.00"
//                     },
//                     assessment: {
//                         actual_use: "COM-RETAIL",
//                         market_value: "13705132.00",
//                         assessment_level: "50.00",
//                         assessed_value: "6852566.00"
//                     },
//                     adjustments: [],
//                     improvements: [
//                         {
//                             improvement_name: "Fences",
//                             qty: 12,
//                             unit_value: "15011.00"
//                         }
//                     ]
//                 },
//                 building: null,
//                 machinery: null
//             }
//         };
//     }
// };

// --- Interfaces ---

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
    additionals: Array<{ item_name: string; quantity: number; unit_cost: string | null; total_cost: string | null }>;
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

interface Owner {
    fo_id: number;
    faas_id: number;
    owner_id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    suffix: string;
    tin_no: string;
    email: string;
    contact_no: string;
    address_house_no: string;
}

interface FAASResponse {
    faas: FAASBase;
    owners: Owner[];
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
    
    // Internal Navigation State (for viewing Previous FAAS)
    const [viewId, setViewId] = useState<number | null>(null);
    const [history, setHistory] = useState<number[]>([]);

    useEffect(() => {
        if (isOpen && faasId) {
            setViewId(faasId);
            setHistory([]);
        } else if (!isOpen) {
            setData(null);
            setError('');
            setViewId(null);
            setHistory([]);
        }
    }, [isOpen, faasId]);

    useEffect(() => {
        if (isOpen && viewId) {
            fetchFAASData(viewId);
        }
    }, [viewId, isOpen]);

    const fetchFAASData = async (idToFetch: number) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`faas/${idToFetch}`);
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load FAAS data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPrevious = () => {
        if (data?.faas.previous_faas_id) {
            setHistory(prev => [...prev, viewId as number]);
            setViewId(data.faas.previous_faas_id);
        }
    };

    const handleNavigateBack = () => {
        const newHistory = [...history];
        const prevId = newHistory.pop();
        if (prevId) {
            setHistory(newHistory);
            setViewId(prevId);
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

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return <span className="text-slate-400 font-normal text-sm">-</span>;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return <span className="text-slate-400 font-normal text-sm">{String(dateString)}</span>;
        return <span className="font-medium text-slate-800 text-sm">{date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>;
    };

    const handlePrint = () => {
        if (data) printFaas(data);
    };

    // --- UI Components ---
    const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2 uppercase tracking-wide">
            {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
            {title}
        </h3>
    );

    const InfoRow = ({ label, value, subLabel }: { label: string, value: React.ReactNode, subLabel?: string }) => (
        <div className="flex justify-between items-baseline py-1.5 border-b border-slate-50 last:border-0">
            <div className="flex flex-col pr-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                {subLabel && <span className="text-[10px] text-slate-400 leading-tight">{subLabel}</span>}
            </div>
            <div className="text-right flex-shrink-0">{value}</div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-100 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
                
                {/* Header - Darker Theme */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl bg-white/10 border border-white/5`}>
                            {data?.faas.property_kind === 'Land' ? <LandPlot size={24} className="text-emerald-400" /> : 
                             data?.faas.property_kind === 'Building' ? <BuildingIcon size={24} className="text-blue-400" /> : 
                             data?.faas.property_kind === 'Machinery' ? <Factory size={24} className="text-amber-400" /> :
                             <FileText size={24} className="text-slate-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                {history.length > 0 && (
                                    <button onClick={handleNavigateBack} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition" title="Go Back">
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <h2 className="text-xl font-bold tracking-tight">FAAS Details</h2>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5 ml-1">
                                <span className="font-mono text-white/90">{data?.faas.faas_no || 'Loading...'}</span>
                                {data?.faas.property_kind && (
                                    <>
                                        <span className="text-slate-600">•</span>
                                        <span className="uppercase font-bold tracking-wider text-xs text-slate-300">{data.faas.property_kind}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {data?.faas.previous_faas_id && (
                            <button 
                                onClick={handleViewPrevious}
                                className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition flex items-center gap-2"
                            >
                                <History size={14} /> View Previous FAAS
                            </button>
                        )}
                        <div className="h-6 w-px bg-slate-700 mx-1"></div>
                        <button 
                            onClick={handlePrint}
                            disabled={!data}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            title="Print"
                        >
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors" title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
                            <p className="text-slate-500 font-medium">Retrieving FAAS data...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="bg-red-100 p-4 rounded-full mb-3"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                            <h3 className="text-lg font-bold text-slate-800">Unable to load data</h3>
                            <p className="text-slate-500 mb-4">{error}</p>
                            <button onClick={() => fetchFAASData(viewId as number)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm">Try Again</button>
                        </div>
                    ) : data ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* COL 1: General & Owner (Width: 3/12) */}
                            <div className="lg:col-span-3 space-y-6">
                                {/* General Info Card */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="General Info" icon={Info} />
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
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                    <SectionHeader title="Owner Details" icon={Users} />
                                    <div className="mt-2 divide-y divide-slate-100">
                                        {data.owners && data.owners.length > 0 ? (
                                            data.owners.map((item, index) => (
                                                <div key={index} className="py-3 first:pt-0 last:pb-0">
                                                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">
                                                        {item.last_name}, {item.first_name} {item.middle_name} {item.suffix}
                                                    </h4>
                                                    <div className="mt-1.5 space-y-1">
                                                        <div className="flex items-start gap-2 text-xs text-slate-500">
                                                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                            <span className="leading-snug">{item.address_house_no || 'N/A'}</span>
                                                        </div>
                                                        {item.contact_no && (
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span className="font-semibold text-slate-400 w-8">TEL:</span>
                                                                <span>{item.contact_no}</span>
                                                            </div>
                                                        )}
                                                        {item.tin_no && (
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span className="font-semibold text-slate-400 w-8">TIN:</span>
                                                                <span>{item.tin_no}</span>
                                                            </div>
                                                        )}
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
                                    <SectionHeader title="Property Location" icon={MapPin} />
                                    <div className="grid grid-cols-1 gap-y-2 pt-2">
                                        <InfoRow label="ARP No." value={<span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{renderValue(data.faas.arp_no)}</span>} />
                                        <InfoRow label="PIN" value={<span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{renderValue(data.faas.pin)}</span>} />
                                        <InfoRow label="Barangay" value={renderValue(data.faas.barangay)} />
                                        <InfoRow label="LGU Code" value={renderValue(data.faas.lg_code)} />
                                        
                                        {(data.faas.lot_no || data.faas.block_no) && (
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
                                    <SectionHeader title={`${data.faas.property_kind} Specs & Appraisal`} icon={ClipboardList} />

                                    {/* --- LAND SPECIFICS --- */}
                                    {data.faas.property_kind === 'Land' && data.land && (
                                        <div className="space-y-5 pt-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoRow label="Classification" value={data.land.appraisal.classification} />
                                                <InfoRow label="Sub-Class" value={data.land.appraisal.subclassification} />
                                                <InfoRow label="Area" value={renderValue(data.land.appraisal.area, ' sqm')} />
                                                <InfoRow label="Unit Value" value={formatCurrency(data.land.appraisal.unit_value)} />
                                            </div>
                                            
                                            {/* Improvements */}
                                            {data.land.improvements && data.land.improvements.length > 0 && (
                                                <div className="pt-4 border-t border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><Hammer size={12}/> Improvements</p>
                                                    <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-100 text-slate-500 text-left">
                                                                <tr>
                                                                    <th className="px-3 py-2 font-semibold">Item</th>
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

                                    {/* --- BUILDING SPECIFICS --- */}
                                    {data.faas.property_kind === 'Building' && data.building && (
                                        <div className="pt-2 space-y-5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Building Kind</p>
                                                    <p className="text-xs font-semibold text-slate-800">{data.building.general.buildingKind}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Structure</p>
                                                    <p className="text-xs font-semibold text-slate-800">{data.building.general.structuralType}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Storeys</p>
                                                        <p className="text-xs font-semibold text-slate-800">{data.building.general.storeys}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Age</p>
                                                        <p className="text-xs font-semibold text-slate-800">{data.building.general.buildingAge} yrs</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoRow label="Unit Cost" value={formatCurrency(data.building.appraisal.unit_cost)} />
                                            </div>

                                            {/* Floor Breakdown */}
                                            {data.building.floors && data.building.floors.length > 0 && (
                                                <div className="pt-3 border-t border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><Layers size={12}/> Floor Breakdown</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {data.building.floors.map((f, i) => (
                                                            <div key={i} className="flex justify-between items-center text-xs py-1.5 px-3 bg-slate-50 border border-slate-100 rounded">
                                                                <span className="text-slate-600 font-medium">Floor {f.floor_no}</span>
                                                                <span className="font-mono font-semibold text-slate-800">{renderValue(f.floor_area, ' sqm')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Structural Materials */}
                                            {data.building.materials && data.building.materials.length > 0 && (
                                                <div className="pt-3 border-t border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><HardHat size={12}/> Structural Materials</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {data.building.materials.map((m, i) => (
                                                            <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-md font-medium">
                                                                {m.part}: <span className="text-slate-900">{m.material}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Additional Items */}
                                            {data.building.additionals && data.building.additionals.length > 0 && (
                                                <div className="pt-3 border-t border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><Plus size={12}/> Additional Items</p>
                                                    <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-100 text-slate-500 text-left">
                                                                <tr>
                                                                    <th className="px-3 py-2 font-semibold">Item Name</th>
                                                                    <th className="px-3 py-2 text-center font-semibold">Qty</th>
                                                                    <th className="px-3 py-2 text-right font-semibold">Unit Cost</th>
                                                                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200">
                                                                {data.building.additionals.map((add, i) => (
                                                                    <tr key={i}>
                                                                        <td className="px-3 py-2 text-slate-700 font-medium">{add.item_name}</td>
                                                                        <td className="px-3 py-2 text-slate-500 text-center">x{add.quantity}</td>
                                                                        <td className="px-3 py-2 font-mono text-right text-slate-500">{formatCurrency(add.unit_cost || 0)}</td>
                                                                        <td className="px-3 py-2 font-mono text-right font-semibold text-slate-700">{formatCurrency(add.total_cost || 0)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* --- MACHINERY SPECIFICS --- */}
                                    {data.faas.property_kind === 'Machinery' && data.machinery && (
                                        <div className="pt-2 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoRow label="Machine Type" value={data.machinery.appraisal.machinery_type} />
                                                <InfoRow label="Brand/Model" value={data.machinery.appraisal.brand_model} />
                                                <InfoRow label="Capacity" value={data.machinery.appraisal.capacity_hp} />
                                                <InfoRow label="Condition" value={
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.machinery.appraisal.machinery_condition === 'NEW' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {data.machinery.appraisal.machinery_condition}
                                                    </span>
                                                } />
                                                <InfoRow label="Date Acquired" value={formatDate(data.machinery.appraisal.date_acquired)} />
                                                <InfoRow label="Year Installed" value={data.machinery.appraisal.year_installed || '-'} />
                                                <InfoRow label="Econ. Life" value={renderValue(data.machinery.appraisal.estimated_life, ' yrs')} />
                                                <InfoRow label="Rem. Life" value={renderValue(data.machinery.appraisal.remaining_life, ' yrs')} />
                                                <InfoRow label="Years Used" value={renderValue(data.machinery.appraisal.years_used, ' yrs')} />
                                                <InfoRow label="Conv. Factor" value={data.machinery.appraisal.conversion_factor} />
                                            </div>
                                            
                                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Original Cost</p>
                                                    <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(data.machinery.appraisal.original_cost)}</p>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">RCN</p>
                                                    <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(data.machinery.appraisal.rcn)}</p>
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
                                    <SectionHeader title="Valuation Summary" icon={Calculator} />
                                    
                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 font-medium">Base Market Value</span>
                                            <span className="text-sm font-bold text-slate-800 font-mono">
                                                {formatCurrency(
                                                    data.land?.appraisal.base_market_value || 
                                                    data.building?.appraisal.base_market_value || 
                                                    data.machinery?.appraisal.original_cost
                                                )}
                                            </span>
                                        </div>

                                        {/* Dynamic Adjustments/Depreciation Rows */}
                                        {data.land?.improvements && data.land.improvements.length > 0 && (
                                            <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
                                                <span className="text-xs font-semibold">+ Improvements</span>
                                                <span className="text-sm font-mono font-bold">
                                                    +{formatCurrency(data.land.improvements.reduce((acc, cur) => acc + (cur.qty * parseFloat(cur.unit_value)), 0))}
                                                </span>
                                            </div>
                                        )}

                                        {data.building && parseFloat(data.building.appraisal.additional_total || '0') > 0 && (
                                            <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
                                                <span className="text-xs font-semibold">+ Additionals</span>
                                                <span className="text-sm font-mono font-bold">+{formatCurrency(data.building.appraisal.additional_total)}</span>
                                            </div>
                                        )}
                                        
                                        {data.building && parseFloat(data.building.appraisal.depreciation_cost || '0') > 0 && (
                                            <div className="flex justify-between items-center text-red-700 bg-red-50 px-2 py-1.5 rounded">
                                                <span className="text-xs font-semibold">- Depreciation ({data.building.appraisal.deprication_rate}%)</span>
                                                <span className="text-sm font-mono font-bold">-{formatCurrency(data.building.appraisal.depreciation_cost)}</span>
                                            </div>
                                        )}
                                        
                                        {data.machinery && parseFloat(data.machinery.appraisal.depreciation_value || '0') > 0 && (
                                            <div className="flex justify-between items-center text-red-700 bg-red-50 px-2 py-1.5 rounded">
                                                <span className="text-xs font-semibold">- Depreciation ({data.machinery.appraisal.depreciation_rate}%)</span>
                                                <span className="text-sm font-mono font-bold">-{formatCurrency(data.machinery.appraisal.depreciation_value)}</span>
                                            </div>
                                        )}

                                        <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-900">Final Market Value</span>
                                            <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
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
                                <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 text-white relative overflow-hidden">
                                    {/* Decoration */}
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <DollarSign size={100} />
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-300 mb-4 pb-2 border-b border-slate-700 flex items-center gap-2 uppercase tracking-wide">
                                        Assessment Summary
                                    </h3>
                                    
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Actual Use</span>
                                            <span className="text-sm font-bold text-white text-right block max-w-[180px]">
                                                {data.land?.assessment.actual_use || data.building?.assessment.actual_use || data.machinery?.assessment.actual_use || '-'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Tax Status</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm border ${
                                                (data.faas.property_kind === 'Land' ? data.faas.taxable : 
                                                data.building?.assessment.taxable || data.machinery?.assessment.taxable) === 1 
                                                ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-600 border-slate-500 text-slate-200'
                                            }`}>
                                                {(data.faas.property_kind === 'Land' ? data.faas.taxable : 
                                                data.building?.assessment.taxable || data.machinery?.assessment.taxable) === 1 
                                                ? 'Taxable' : 'Exempt'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Assess Level</span>
                                            <span className="text-sm font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                                {renderValue(
                                                    data.land?.assessment.assessment_level || 
                                                    data.building?.assessment.assessment_level || 
                                                    data.machinery?.assessment.assessment_level, '%'
                                                )}
                                            </span>
                                        </div>
                                        
                                        <div className="pt-5 mt-3 border-t border-slate-700/50">
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Total Assessed Value</p>
                                            <p className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tight leading-none drop-shadow-md">
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
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="text-xs text-slate-400 italic">
                        Property ID: {data?.faas?.property_id || '-'}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={()=>{ setShowTd(true)}}
                            disabled={!data || loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors text-sm border border-transparent shadow-sm disabled:opacity-50"
                        >
                            Create TD
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors text-sm border border-slate-300 shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Using conditional rendering instead of always rendering to prevent unnecessary mounts */}
            {showTd && (
                <TaxDeclarationDialog
                    faasId={viewId as number}
                    isOpen={showTd}
                    onClose={()=>{setShowTd(false)}}
                    onSuccess={()=>{}}
                />
            )}
        </div>
    );
}