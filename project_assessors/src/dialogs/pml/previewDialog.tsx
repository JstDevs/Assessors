import React, { useState, useMemo, useEffect } from 'react';
import { X, ClipboardList, LandPlot, ChevronUp, ChevronDown, Building as BuildingIcon, Factory, Layers, HardHat, Hammer, MapPin, Loader2, AlertTriangle, User } from 'lucide-react';
import api from '../../../axiosBase.ts';
import { OriginalFaas } from './newFaas.tsx';
import PropertyChangeHistoryDialog from './historyDialog.tsx';
import { FAASTransferDialog } from './TransferFaas.tsx';
import { FAASCancellationDialog } from './CancellationFaas.tsx';
import { FAASReclassificationDialog } from './ReclassificationFaas.tsx';
import { FAASDestroyDialog } from './destroyFaas.tsx';
import { FAASImprovementDialog } from './improvementFaas.tsx';
import { FAASSubdivisionDialog } from './subdivisionFaas.tsx';
import { FAASConsolidationDialog } from './consolidatationFaas.tsx';
import { FAASRevisionDialog } from './revisionFaas.tsx';



const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatInteger = (value) => {
    const num = parseInt(value);
    return isNaN(num) ? 'N/A' : num;
};

const FieldRow = ({ label, value, isFull = false, isNumeric = false }) => (
    <div className={`${isFull ? 'sm:col-span-4' : 'sm:col-span-1'} border-l-4 border-emerald-300/50 pl-3`}>
        <p className="text-xs font-medium text-gray-500 uppercase truncate">{label}</p>
        <p className={`text-sm font-semibold text-gray-800 ${isNumeric ? 'text-right' : 'text-left'}`}>{value || 'N/A'}</p>
    </div>
);

const SectionHeader = ({ title, icon: Icon, color = 'text-emerald-600' }) => (
    <h3 className="text-lg font-bold text-gray-800 flex items-center border-b pb-2 mb-4 mt-6">
        <Icon className={`w-5 h-5 mr-2 ${color}`} />
        {title}
    </h3>
);

const MasterDataFields = [
    { key: 'arp_no', label: 'ARP No.' },
    { key: 'pin', label: 'PIN (Parcel ID)' },
    { key: 'status', label: 'Status' },
    { key: 'property_kind', label: 'Property Type' },
    { key: 'lg_code', label: 'LGU Code' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'lot_no', label: 'Lot No.' },
    { key: 'block_no', label: 'Block No.' },
];

// --- 2. LAND Details Preview ---
const LandDetailsPreview = ({ details }) => {
    const { other_improvements = [] } = details;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FieldRow label="Land ID" value={details.land_id} />
                <FieldRow label="Classification (AU)" value={details.au_code} />
                <FieldRow label="Sub-Classification (PSC)" value={details.psc_code} />
                <FieldRow label="Lot Area (sqm)" value={formatCurrency(details.lot_area)} />
                <FieldRow label="Remarks" value={details.remarks} isFull />
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
                <SectionHeader title="Other Improvements" icon={Layers} />
                {other_improvements.length === 0 ? (
                    <p className="text-center text-gray-500 italic py-4">No improvements recorded.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Name</th>
                                    <th className="px-6 py-3 text-center font-medium text-gray-600">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {other_improvements.map((imp, index) => (
                                    <tr key={imp.improvement_id || index}>
                                        <td className="px-6 py-3 whitespace-nowrap text-gray-900">{imp.improvement_name}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-center">{formatInteger(imp.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 3. BUILDING Details Preview ---
const BuildingDetailsPreview = ({ details }) => {
    const { floor_areas = [], structural_materials = [], additional_items = [] } = details;

    const totalAdditionalItemsCost = useMemo(() => {
        return additional_items.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);
    }, [additional_items]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FieldRow label="Building ID" value={details.building_id} />
                <FieldRow label="Building Kind (BK)" value={details.bk_id} />
                <FieldRow label="Structural Type (ST)" value={details.st_id} />
                <FieldRow label="Actual Use (BAU)" value={details.bau_id} />

                <FieldRow label="No. of Storeys" value={details.no_of_storeys} />
                <FieldRow label="Year Constructed" value={details.year_constructed} />
                <FieldRow label="Depreciation Rate (%)" value={details.depreciation_rate} />
                <FieldRow label="Addtl Adj. Factor" value={details.additional_adj_factor} />

                <FieldRow label="Remarks" value={details.remarks} isFull />
            </div>

            {/* Floor Areas */}
            <div className="p-4 border border-gray-200 rounded-lg">
                <SectionHeader title={`Floor Areas (${details.no_of_storeys} Storey(s))`} icon={Layers} />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {floor_areas.map((fa, index) => (
                        <FieldRow 
                            key={fa.bfa_id || index}
                            label={`Floor ${fa.floor_no} Area (sqm)`} 
                            value={formatCurrency(fa.floor_area)}
                            isNumeric
                        />
                    ))}
                </div>
            </div>

            {/* Structural Materials */}
            <div className="p-4 border border-gray-200 rounded-lg">
                <SectionHeader title="Structural Materials" icon={HardHat} />
                {structural_materials.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Part</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Material</th>
                                    <th className="px-6 py-3 text-center font-medium text-gray-600">Floor No.</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {structural_materials.map((bsm, index) => (
                                    <tr key={bsm.bsm_id || index}>
                                        <td className="px-6 py-3 whitespace-nowrap text-gray-900">{bsm.part}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">{bsm.material}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-center">{bsm.floor_no || 'All'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-center text-gray-500 italic py-4">No structural materials recorded.</p>}
            </div>

            {/* Additional Items */}
            <div className="p-4 border border-gray-200 rounded-lg">
                <SectionHeader title="Additional Items" icon={Hammer} />
                {additional_items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Item Name</th>
                                    <th className="px-6 py-3 text-center font-medium text-gray-600">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {additional_items.map((bai, index) => (
                                    <tr key={bai.bai_id || index}>
                                        <td className="px-6 py-3 whitespace-nowrap text-gray-900">{bai.item_name}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-center">{formatInteger(bai.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-center text-gray-500 italic py-4">No additional items recorded.</p>}
            </div>
        </div>
    );
};

// --- 4. MACHINERY Details Preview ---
const MachineryDetailsPreview = ({ details }) => {
    // Helper to extract year from full date string (e.g., "2019-01-04T16:00:00.000Z")
    const getYear = (dateStr) => {
        if (!dateStr) return 'N/A';
        // Note: The date acquired from the API is a full timestamp string
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FieldRow label="Machinery ID" value={details.machinery_id} />
                <FieldRow label="Machinery Type (MT ID)" value={details.mt_id} />
                <FieldRow label="Actual Use (MAU ID)" value={details.mau_id} />
                <FieldRow label="Condition" value={details.condition} />
                
                <FieldRow label="Brand / Model" value={details.brand_model} />
                <FieldRow label="Capacity / HP" value={details.capacity_hp} />
                <FieldRow label="Date Acquired" value={getYear(details.date_acquired)} />
                <FieldRow label="Conversion Factor" value={details.conversion_factor} />
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
                <SectionHeader title="Age & Depreciation Factors" icon={Factory} />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Age and Life */}
                    <FieldRow label="Year Installed" value={details.year_installed} />
                    <FieldRow label="Year Initial Operation" value={details.year_initial_operation} />
                    <FieldRow label="Economic Life (Years)" value={details.economic_life} />
                    <FieldRow label="Remaining Life (Years)" value={details.remaining_life} />
                    <FieldRow label="Years Used (Calculated Age)" value={details.years_used} />
                </div>
            </div>
            {/* 
                <div className="p-4 border border-gray-200 rounded-lg bg-emerald-50/50">
                    <SectionHeader title="Valuation" icon={Factory} color="text-emerald-800" />
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {* Cost and Value *}
                        <FieldRow label="Original Cost" value={formatCurrency(details.original_cost)} isNumeric />
                        <FieldRow label="RCN (Reproduction Cost New)" value={formatCurrency(details.rcn)} isNumeric />
                        <FieldRow label="Depreciation Rate (%)" value={formatCurrency(details.depreciation_rate)} isNumeric />
                        <FieldRow label="Total Depreciation Value" value={formatCurrency(details.total_depreciation_value)} isNumeric />
                        <FieldRow label="Depreciated Value (Sound Value)" value={formatCurrency(details.depreciated_value)} isNumeric />
                    </div>
                </div>
            */}
            
            <div className="border-l-4 border-gray-300/50 pl-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Remarks</p>
                <p className="text-sm font-semibold text-gray-800">{details.remarks || 'N/A'}</p>
            </div>
        </div>
    );
};


// --- MAIN DIALOG COMPONENT ---

export const PropertyPreviewDialog = ({ showDialog, setShowDialog, propertyId, hasOriginal, setRefresh }) => {
    const [propertyData, setPropertyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<String | null>(null);

    // on/off
    const [showOptions, setShowOptions] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [history, setHistory] = useState([]);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showCancellationDialog, setShowCancellationDialog] = useState(false);
    const [showReclassifyDialog, setShowReclassifyDialog] = useState(false);
    const [showDestroyDialog, setShowDestroyDialog] = useState(false);
    const [showImprovementDialog, setShowImprovementDialog] = useState(false);
    const [showSubdivisionDialog, setShowSubdivisionDialog] = useState(false);
    const [showConsolidationDialog, setShowConsolidationDialog] = useState(false);
    const [showRevisionDialog, setShowRevisionDialog] = useState(false);
    const [faas_id, setFaas_id] = useState(0);


    const fetchHistory = async () =>{
        const res = await api.get(`pml/history/${propertyId}`);
        // console.log(res.data);
        setHistory(res.data);
        setShowLogs(true);
    }

    const [showFaasDialog, setShowFaasDialog] = useState(false);

    // Fetch data when the dialog opens or propertyId changes
    useEffect(() => {
        if (showDialog && propertyId) {
            setShowOptions(false);
            const loadData = async () => {
                setLoading(true);
                setError(null);
                setPropertyData(null);
                try {
                    const data = await api.get(`pml/property/${propertyId}`);
                    setPropertyData(data.data);
                    setFaas_id(Number(data.data.faas_id));
                } catch (err) {
                    console.error("Error fetching property data:", err);
                    setError("Failed to load property details. Please check the network.");
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [showDialog, propertyId]);

    if (!showDialog) return null;
    
    // --- START: Move functions up for proper hoisting ---
    const renderDetails = (data) => {
        switch (data.property_kind) {
            case 'Land':
                return <LandDetailsPreview details={data.details} />;
            case 'Building':
                return <BuildingDetailsPreview details={data.details} />;
            case 'Machinery':
                return <MachineryDetailsPreview details={data.details} />;
            default:
                return <p className="text-red-500">Error: Unknown property kind.</p>;
        }
    };

    const PropertyIcon = ({ kind }) => {
        switch (kind) {
            case 'Land': return <LandPlot className="w-6 h-6 text-emerald-600 mr-3" />;
            case 'Building': return <BuildingIcon className="w-6 h-6 text-emerald-600 mr-3" />;
            case 'Machinery': return <Factory className="w-6 h-6 text-emerald-600 mr-3" />;
            default: return <MapPin className="w-6 h-6 text-emerald-600 mr-3" />;
        }
    };
    // --- END: Moved functions ---


    // Determine the content to display
    let content;
    let title = "Property Preview";
    let arpNo = 'Loading...';
    let propertyKind = 'Property';

    // handle transactions
    const transactions = (type:string) => {
        switch(type){
            case 'Original':
                setShowFaasDialog(true);
                break;
            case 'Transfer':
                setShowTransfer(true);
                break;
            case 'Subdivision':
                setShowSubdivisionDialog(true);
                break;
            case 'Consolidation':
                setShowConsolidationDialog(true);
                break;
            case 'Reclassification':
                setShowReclassifyDialog(true);
                break;
            case 'Revision':
                setShowRevisionDialog(true);
                break;
            case 'Improvement':
                setShowImprovementDialog(true);
                break;
            case 'Destroyed':
                setShowDestroyDialog(true);
                break;
            case 'Cancellation':
                setShowCancellationDialog(true);
                break;

            default:
                console.log("invalid type");
        }
        // console.log(type);
    }


    if (loading) {
        content = (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                <p className="text-lg font-medium">Loading Property Details...</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className="flex flex-col items-center justify-center h-64 text-red-600 bg-red-50 rounded-lg p-6">
                <AlertTriangle className="w-8 h-8 mb-4" />
                <p className="text-lg font-medium">Error:</p>
                <p className="text-sm text-center">{error}</p>
            </div>
        );
    } else if (propertyData) {
        // Set variables based on loaded data
        arpNo = propertyData.arp_no;
        propertyKind = propertyData.property_kind;
        title = `Property Preview: ARP[${arpNo}] (${propertyKind})`;
        
        content = (
            <div className="space-y-8">
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <SectionHeader title="Owner(s)" icon={User} color="text-gray-600" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {propertyData?.owners.map((owner, index) => (
                            <FieldRow
                                key={index}
                                label={owner.name}
                                value={owner.address}
                                isFull={true}
                            />
                        ))}
                    </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <SectionHeader title="Master Registration Information" icon={ClipboardList} color="text-gray-600" />
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {MasterDataFields.map(field => (
                            <FieldRow
                                key={field.key}
                                label={field.label}
                                value={propertyData[field.key]}
                                isFull={field.full}
                            />
                        ))}
                        <FieldRow label="Created Date" value={new Date(propertyData.created_date).toLocaleDateString()} />
                        <FieldRow label="Updated Date" value={new Date(propertyData.updated_date).toLocaleDateString()} />
                    </div>
                </div>

                <div className="p-4 border border-emerald-300 rounded-lg bg-emerald-50/20">
                    <SectionHeader title={`${propertyData.property_kind} Specific Details`} icon={propertyData.property_kind === 'Land' ? LandPlot : propertyData.property_kind === 'Building' ? BuildingIcon : Factory} />
                    {renderDetails(propertyData)}
                </div>
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <AlertTriangle className="w-8 h-8 mb-4 text-gray-400" />
                <p className="text-lg font-medium">No property ID provided or data is empty.</p>
            </div>
        );
    }



    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
        >
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
            >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-200">
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-900 flex items-center">
                        <PropertyIcon kind={propertyData ? propertyData.property_kind : 'Landmark'} />
                        {title}
                    </h2>
                    <button
                        onClick={() => setShowDialog(false)}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {content}
                </div>

                {/* Modal Footer - Simple Close Button */}
                <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end bg-gray-50 gap-1 rounded-b-xl">
                    <button
                        onClick={fetchHistory}
                        className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-lg transition duration-200 ease-in-out bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                    >
                        View History
                    </button>
                    <button
                        onClick={() => setShowOptions(prev => !prev)}
                        className="
                            group                                            /* Use 'group' for future styling */
                            relative 
                            inline-flex items-center justify-center gap-2    /* Center text/icon */
                            px-4 py-2                                        /* Adjusted padding for cleaner look */
                            text-sm font-medium text-white 
                            rounded-lg 
                            shadow-md hover:shadow-lg transition duration-200 
                            bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                        "
                    >
                        {/* Button Content */}
                        Transactions
                        {showOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

                        {/* Dropdown Menu (only render if showOptions is true) */}
                        {showOptions && (
                            <div
                                className="
                                    absolute bottom-full right-50% mb-2         
                                    origin-top-right 
                                    w-48 
                                    bg-white 
                                    rounded-lg 
                                    shadow-xl                                    
                                    ring-1 ring-black ring-opacity-5 
                                    p-1                                          /* Light inner padding */
                                "
                                role="menu" 
                                aria-orientation="vertical"
                            >
                                {/* Menu Items Container */}
                                <div className='py-1' role="none">
                                    {/* Replaced your divs with a simple mapping for cleaner code */}
                                    {['Original', 'Transfer', 'Subdivision', 'Consolidation', 'Reclassification', 'Revision', 'Improvement', 'Destroyed', 'Cancellation'].map((item) => (
                                        <div
                                            key={item}
                                            onClick={() => { 
                                                if(hasOriginal){
                                                    if(item !== 'Original' && !(propertyData.property_kind === 'Machinery' && item === 'Reclassification') && !(propertyData.property_kind === 'Land' && item === 'Destroyed'))
                                                        transactions(item)      
                                                }else{   
                                                    if(item === 'Original')
                                                       transactions(item)
                                                }
                                            }}
                                            className={`
                                                block 
                                                px-4 py-2 
                                                text-sm
                                                hover:bg-emerald-100 hover:text-emerald-700 
                                                rounded-md 
                                                transition duration-150 ease-in-out
                                                ${
                                                    hasOriginal?
                                                        (item !== 'Original' && !(propertyData.property_kind === 'Machinery' && item === 'Reclassification') && !(propertyData.property_kind === 'Land' && item === 'Destroyed') && !(propertyData.property_kind !== 'Land' && (item === 'Improvement' || item === 'Consolidation' || item === 'Subdivision' ))? 'cursor-pointer text-black ': 'cursor-not-allowed text-gray-400 '):
                                                        (item === 'Original'? 'cursor-pointer text-black ': 'cursor-not-allowed text-gray-400 ')
                                                }   
                                            `}
                                            role="menuitem"
                                            tabIndex={-1}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </button>
                    
                    <button
                        onClick={() => setShowDialog(false)}
                        className="px-6 py-2 text-sm font-medium text-white rounded-md shadow-lg transition duration-200 ease-in-out bg-gray-600 hover:bg-gray-700"
                        disabled={loading}
                    >
                        Close Preview
                    </button>
                </div>
            </div>
            <OriginalFaas 
                setShowDialog={setShowFaasDialog}
                showDialog={showFaasDialog}
                propertyId={propertyId}
                setRefresh={setRefresh}
            />
            <FAASTransferDialog
                faasId={faas_id}
                setShowDialog={setShowTransfer}
                showDialog={showTransfer}
                setRefresh={setRefresh}
            />
            <PropertyChangeHistoryDialog 
                propertyId={propertyId}
                isOpen={showLogs}
                history={history}
                onClose={()=>{setShowLogs(false)}}
            />
            <FAASCancellationDialog
                showDialog={showCancellationDialog}
                setShowDialog={setShowCancellationDialog}
                faasId={faas_id}
                setRefresh={setRefresh}
            />
            <FAASReclassificationDialog
                showDialog={showReclassifyDialog}
                setShowDialog={setShowReclassifyDialog}
                faasId={faas_id}
                setRefresh={setRefresh}
            />
            <FAASDestroyDialog 
                faasId={faas_id}
                setRefresh={setRefresh}
                setShowDialog={setShowDestroyDialog}
                showDialog={showDestroyDialog}
            />
            <FAASImprovementDialog
                faasId={faas_id}
                setRefresh={setRefresh}
                setShowDialog={setShowImprovementDialog}
                showDialog={showImprovementDialog}
            />
            <FAASSubdivisionDialog
                faasId={faas_id}
                setRefresh={setRefresh}
                setShowDialog={setShowSubdivisionDialog}
                showDialog={showSubdivisionDialog}
            />
            <FAASConsolidationDialog
                faasId={faas_id}
                setRefresh={setRefresh}
                setShowDialog={setShowConsolidationDialog}
                showDialog={showConsolidationDialog}
            />
            <FAASRevisionDialog
                faasId={faas_id}
                setRefresh={setRefresh}
                setShowDialog={setShowRevisionDialog}
                showDialog={showRevisionDialog}
            />
        </div>
    );
};