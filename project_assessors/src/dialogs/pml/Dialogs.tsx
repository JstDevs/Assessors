import React, { useCallback, useEffect, useState } from 'react';
import { X, AlertTriangle, FileText, Calendar, Eye, Plus, AlertCircle, Loader, XCircle, CheckCircle, Logs, History, Clock, User, ChevronUp, ChevronDown, MapPin, Building2, Wrench, Home, Receipt, Trash2, Info, Layers } from 'lucide-react';
import Loading from '../../common/Loading.tsx';
import api from '../../../axiosBase.ts';
// import type { LandDetails, MachineryDetails, BuildingDetails } from '../../structures/Properties.tsx';

// ============= PROPERTY MODIFY DIALOG =============
interface PropertyFormData {
    property_id?: number;
    arp_no: string;
    pin: string | null;
    owner_name: string;
    owner_address: string | null;
    owner_id: number | null;
    lg_code: string;
    barangay: string | null;
    lot_no: string | null;
    block_no: string | null;
    property_kind: 'Land' | 'Building' | 'Machinery';
    description: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
    // pc_code is a temporary helper for classification lookup, kept on the main form data
    pc_code: number | '';
}

interface LandDetails {
    au_code: string;
    psc_code: string;
    lot_area: number;
    shape: 'REGULAR' | 'IRREGULAR';
    topography: 'LEVEL' | 'SLOPING' | 'ROLLING' | 'HILLY';
    corner_lot: boolean;
    road_access: 'PAVED' | 'GRAVEL' | 'EARTH' | 'NONE';
    additional_adj_factor: number;
    remarks: string | null;
}

interface BuildingDetails {
    bk_id: number | ''; // Use number for ID lookup, or an empty string for select
    pc_code: string; // The property classification code (from PropertyBuilding table) - assuming this is the code string
    floor_area: number;
    no_of_storeys: number;
    year_constructed: string | null;
    depreciation_rate: number;
    additional_adj_factor: number;
    remarks: string | null;
}

interface MachineryDetails {
    machine_description: string;
    mt_id: number;
    year_acquired: string | null;
    acquisition_cost: number;
    estimated_life: number;
    depreciation_rate: number;
    operational_condition: 'OPERATIVE' | 'INOPERATIVE';
    remarks: string | null;
}

type NewDetails = LandDetails | BuildingDetails | MachineryDetails | null;

interface PropertyModifyDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    edit: boolean;
    approve: boolean;
    setNewProperty: React.Dispatch<React.SetStateAction<PropertyFormData>>;
    setSubmitLoading: (loading: boolean) => void;
    setApprove: (approve: boolean) => void;
    setSubmitError: (error: string | null) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: () => Promise<void>;
    newProperty: PropertyFormData;
    inputError: string;
    setInputError: (error: string) => void;
    setNewDetails: React.Dispatch<React.SetStateAction<NewDetails>>;
    newDetails: NewDetails;
}
// --------------------------------------------------------------------------

// Initial state for property details
const getInitialLandDetails = (): LandDetails => ({
    au_code: '', // Moved from newProperty
    psc_code: '', // Moved from newProperty
    lot_area: 0, // Moved from newProperty
    shape: 'REGULAR',
    topography: 'LEVEL',
    corner_lot: false,
    road_access: 'PAVED',
    additional_adj_factor: 1.0000,
    remarks: null,
});

const getInitialBuildingDetails = (): BuildingDetails => ({
    bk_id: '',
    pc_code: '',
    floor_area: 0,
    no_of_storeys: 1,
    year_constructed: null,
    depreciation_rate: 0.00,
    additional_adj_factor: 1.0000,
    remarks: null,
});

const getInitialMachineryDetails = (): MachineryDetails => ({
    machine_description: '',
    brand_model: null,
    year_acquired: null,
    acquisition_cost: 0,
    estimated_life: 10,
    depreciation_rate: 0.00,
    operational_condition: 'OPERATIVE',
    remarks: null,
});

export const PropertyModifyDialog: React.FC<PropertyModifyDialogProps> = ({
    showDialog,
    setShowDialog,
    edit,
    approve,
    setNewProperty,
    setApprove,
    setSubmitError,
    setRefresh,
    submitError,
    submitLoading,
    handleChange,
    newProperty,
    inputError,
    setInputError,
    handleSubmit,
    setNewDetails,
    newDetails,
    setImprovements,
    improvements
}) => {
    // --- Local State for Dropdowns ---
    const [lgList, setLgList] = useState<any[]>([]);
    const [pcList, setPcList] = useState<any[]>([]);
    const [selectedPC, setSelectedPC] = useState<number | ''>(-1); // State to hold the selected pc_id
    const [pscList, setPscList] = useState<any[]>([]);
    const [auList, setAuList] = useState<any[]>([]);
    const [stList, setStList] = useState<any[]>([]); // Structure/Building Kind List
    const [mtList, setMtList] = useState<any[]>([]);
    const [bauList, setBauList] = useState<any[]>([]);

    // Separate change handlers for property-specific details
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Type conversion logic
        let newValue: string | number | boolean = value;
        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number' || name === 'lot_area' || name === 'floor_area' || name === 'acquisition_cost' || name === 'bk_id' || name === 'no_of_storeys' || name === 'estimated_life' || name === 'depreciation_rate' || name === 'additional_adj_factor') {
            // Special handling for decimal/integer numbers
            newValue = Number(value);
        } else if (name === 'pc_code') {
            // For the classification code dropdown that uses ID
            newValue = Number(value)
        }

        setNewDetails(prev => {
            if (!prev) return null; // Should not happen if data is loaded correctly
            
            // Explicitly cast the previous state to the correct detail type based on property_kind
            let newDetailState = { ...prev };
            
            switch (newProperty.property_kind) {
                case 'Land':
                    newDetailState = { ...(prev as LandDetails), [name]: newValue };
                    // Handle nested changes for main form data fields now moved to details for Land
                    if (name === 'au_code' || name === 'psc_code' || name === 'lot_area') {
                        // Optionally update main form data if these are still in it, but ideally remove them from main form data.
                        // Since I've removed them from the suggested PropertyFormData, no extra action is needed here for newProperty.
                    }
                    break;
                case 'Building':
                    newDetailState = { ...(prev as BuildingDetails), [name]: newValue };
                    break;
                case 'Machinery':
                    newDetailState = { ...(prev as MachineryDetails), [name]: newValue };
                    break;
            }

            return newDetailState as NewDetails;
        });

        // Special handling for dropdowns that affect dependent lists (e.g., PC Code)
        if (name === 'pc_code') {
             // For the classification code dropdown that uses ID
            setSelectedPC(Number(value));
        }

    };

    const getLGList = async () => {
        try {
            const res = await api.get('lvg/list');
            setLgList(res.data.data);
        } catch (err) {
            console.error(err);
        }
        //  setLgList([{ code: 'LG-001' }, { code: 'LG-002' }] as any[]); // Mock
    };

    const getPCList = async () => {
        try {
            const res = await api.get('p/plist');
            setPcList(res.data);
        } catch (err) {
            console.error(err);
        }
        //  setPcList([{ pc_id: 1, code: 'PC-AGRI' }, { pc_id: 2, code: 'PC-RES' }] as any[]); // Mock
    };

    const getPSCList = async () => {
        if (!selectedPC) {
            setPscList([]);
            return;
        }
        try {
            const res = await api.get('p/splist', { params: { pc_id: selectedPC } });
            setPscList(res.data);
        } catch (err) {
            console.error(err);
        }
        // setPscList([{ code: 'PSC-1' }, { code: 'PSC-2' }] as any[]); // Mock
    };

    const getAUList = async () => {
        if (!selectedPC) {
            setAuList([]);
            return;
        }
        try {
            const res = await api.get('p/aulist', { params: { pc_id: selectedPC } });
            setAuList(res.data);
        } catch (err) {
            console.error(err);
        }
        // setAuList([{ code: 'AU-A' }, { code: 'AU-B' }] as any[]); // Mock
    };

    const getSTList = async () => {
        try {
            const res = await api.get('bkmt/bkList');
            setStList(res.data.data);
        } catch (err) {
            console.error(err);
        }
        // setStList([{ bk_id: 1, code: 'ST-CONCRETE' }, { bk_id: 2, code: 'ST-WOOD' }] as any[]); // Mock
    };
    const setMTList = async () => {
        try {
            const res = await api.get('bkmt/mtList');
            setMtList(res.data.data);
        } catch (err) {
            console.error(err);
        }
        // setStList([{ bk_id: 1, code: 'ST-CONCRETE' }, { bk_id: 2, code: 'ST-WOOD' }] as any[]); // Mock
    };
    const getBAUList = async () => {
        try{
            const res = await api.get('bkmt/bauList');
            setBauList(res.data.data);
        }catch(err){
            console.log(err);
        }
    }

    // The logic for fetching Machinery Types (mtList) is removed as it doesn't align with the Machinery table structure provided (no mt_id).

    // --- Effects ---
    useEffect(() => {
        getLGList();
        getPCList();
        getSTList();
        setMTList();
        getBAUList();
    }, []);

    useEffect(() => {
        getPSCList();
        getAUList();
    }, [selectedPC]);

    // Function to reset dropdown-related local state
    function reset() {
        setSelectedPC('');
        setSelectedLG(0);
        setImprovements([]);
        // setPscList([]); // Not strictly necessary as useEffect handles this on selectedPC change
        // setAuList([]); // Same as above
    }

    // Function to fetch and set classification based on psc_code for editing (or adding if pre-filled)
    const getClassification = async () => {
        // if (newProperty.psc_code) {
        //      // Mock lookup logic: assuming there's a way to find the PC ID from PSC code
        //     const mockPCId = 1; 
        //     setNewProperty(prev => ({ ...prev, pc_code: mockPCId }));
        //     setSelectedPC(mockPCId);
        //     // Fetch dependent lists (getAUList, getPSCList) will run via useEffect [selectedPC]
        // }
        
        try {
            const code = newProperty.psc_code;
            if (code) {
                const res = await api.get('p/spgetid', { params: { code } });
                if (res.data.data) {
                    setNewProperty(prev => ({ ...prev, pc_code: res.data.data.pc_id }));
                    // setSelectedPC(res.data.data.pc_id);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (showDialog && edit) {
            setSelectedPC(newProperty.pc_code);
            setSelectedLG(newProperty.lg_id);
        }
        getClassification();
    }, [newDetails, showDialog, edit]); // Added dependencies to comply with hooks rules

    // The property-specific details that are currently active in the form
    const activeDetails = newDetails || (newProperty.property_kind === 'Land' ? getInitialLandDetails() : 
                                       newProperty.property_kind === 'Building' ? getInitialBuildingDetails() : 
                                       getInitialMachineryDetails());


    const handleClose = () => {
        if (approve) {
            setRefresh(prev => !prev);
        }
        setShowDialog(false);
        setApprove(false);
        setSubmitError(null);
        setInputError('');

        // Reset main property form state
        setNewProperty({
            arp_no: '',
            pin: null,
            owner_name: '',
            owner_address: null,
            owner_id: null,
            lg_code: '',
            barangay: null,
            lot_no: null,
            block_no: null,
            property_kind: 'Land',
            description: null,
            status: 'ACTIVE',
            pc_code: '', 
        });

        // Reset detail state using the unified setter
        setNewDetails(getInitialLandDetails()); // Default to Land details state

        // Reset dropdown-related local state
        reset();
        
    };

    const [brgys, setBrgys] = useState<any[]>([]);
    const [selectedLG, setSelectedLG] = useState<number>(0);
    async function getBrgs(){
            try{
            const res = await api.get('lvg/barangayList', { params: { lg_id: selectedLG }});
            setBrgys(res.data);
        }catch(err){
            console.error(err);
        }
    }
    useEffect(()=>{
        getBrgs();
    }, [selectedLG]);


    //improvements
    const [nextId, setNextId] = useState(1);
    interface Improvement {
        id: number;
        improvement_name: string;
        quantity: number;
        unit_value: number;
        total_value: number;
    }

    const addImprovement = () => {
        const newImprovement: Improvement = {
            id: nextId,
            improvement_name: '',
            quantity: 1,
            unit_value: 0,
            total_value: 0
        };
        setImprovements([...improvements, newImprovement]);
        setNextId(nextId + 1);
    };

    const removeImprovement = (id: number) => {
        setImprovements(improvements.filter(imp => imp.improvement_id !== id));
    };

    const updateImprovement = (id: number, field: keyof Improvement, value: string | number) => {
        setImprovements(improvements.map(imp => {
            if (imp.improvement_id === id) {
                const updated = { ...imp, [field]: value };
                // Auto-calculate total value
                if (field === 'quantity' || field === 'unit_value') {
                    updated.base_market_value = Number(updated.quantity) * Number(updated.unit_value);
                }
                return updated;
            }
            return imp;
        }));
    };

    const getTotalValue = () => {
        return improvements.reduce((sum, imp) => sum + imp.total_value, 0);
    };


    if (!showDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {edit ? 'Edit Property' : 'Add New Property'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {/* Assuming you have a `Loading` component */}
                    {submitLoading ? (
                        <div className="text-center py-8">Loading...</div> // Placeholder for <Loading />
                    ) : approve ? (
                        <div className="text-center py-8">
                            <div className="mb-4 text-emerald-600">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {edit ? 'Property Updated!' : 'Property Added!'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The property has been {edit ? 'updated' : 'added'} successfully.
                            </p>
                            <button
                                onClick={handleClose}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <form className="space-y-6">
                                {/* Property Identification Section (Master List) */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Property Identification</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* ARP No */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ARP No. <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="arp_no"
                                                value={newProperty.arp_no}
                                                onChange={handleChange}
                                                maxLength={50}
                                                required
                                                placeholder="e.g., ARP-2024-001"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* PIN */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                PIN (Property Identification Number)
                                            </label>
                                            <input
                                                type="text"
                                                name="pin"
                                                value={newProperty.pin || ''}
                                                onChange={handleChange}
                                                maxLength={50}
                                                placeholder="e.g., 123-45-678-90-123"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Property Kind */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Property Kind <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="property_kind"
                                                value={newProperty.property_kind}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    // Reset details when changing kind
                                                    if (e.target.value === 'Land') setNewDetails(getInitialLandDetails());
                                                    if (e.target.value === 'Building') setNewDetails(getInitialBuildingDetails());
                                                    if (e.target.value === 'Machinery') setNewDetails(getInitialMachineryDetails());
                                                    reset(); // Reset PC related dropdowns
                                                }}
                                                className="disabled:cursor-not-allowed w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                disabled={edit}
                                            >
                                                <option value="Land">Land</option>
                                                <option value="Building">Building</option>
                                                <option value="Machinery">Machinery</option>
                                            </select>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="status"
                                                value={newProperty.status}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="TRANSFERRED">Transferred</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <hr />

                                {/* Owner Information Section */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Owner Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Owner Name */}
                                        <div className='md:col-span-2'>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Owner Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="owner_name"
                                                value={newProperty.owner_name}
                                                onChange={handleChange}
                                                maxLength={150}
                                                required
                                                placeholder="e.g., Juan Dela Cruz"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Owner Address */}
                                        <div className='md:col-span-2'>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Owner Address
                                            </label>
                                            <textarea
                                                name="owner_address"
                                                value={newProperty.owner_address || ''}
                                                onChange={handleChange}
                                                rows={2}
                                                placeholder="Complete address of the owner"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <hr />

                                {/* Location Information Section */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Location Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Locational Group Code */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Locational Group Code <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="lg_id"
                                                value={newProperty.lg_id}
                                                onChange={(e)=>{handleChange(e); setSelectedLG(Number(e.target.value));}}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value=''>-- Select Code --</option>
                                                {lgList.map((item, index) => (
                                                    <option value={item.lg_id} key={index}>{item.code}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Barangay */}
                                        {/* <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Barangay
                                            </label>
                                            <input
                                                type="text"
                                                name="barangay"
                                                value={newProperty.barangay || ''}
                                                onChange={handleChange}
                                                maxLength={100}
                                                placeholder="e.g., Barangay San Jose"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div> */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Barangay <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="barangay"
                                                value={newProperty.barangay || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                {brgys.length < 1 ? (
                                                    <option value=''>-- Select a group first --</option>
                                                ) : (
                                                    <option value=''>-- Select Barangay --</option>
                                                )}
                                                {brgys.map((item, index) => (
                                                    <option value={item.barangay_name} key={index}>{item.barangay_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Lot No */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Lot No.
                                            </label>
                                            <input
                                                type="text"
                                                name="lot_no"
                                                value={newProperty.lot_no || ''}
                                                onChange={handleChange}
                                                maxLength={50}
                                                placeholder="e.g., 123"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Block No */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Block No.
                                            </label>
                                            <input
                                                type="text"
                                                name="block_no"
                                                value={newProperty.block_no || ''}
                                                onChange={handleChange}
                                                maxLength={50}
                                                placeholder="e.g., 45"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <hr />

                                {/* Property Classification Section (General) */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Classification Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Property Classification (PC ID) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Property Classification <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="pc_code" // Naming this pc_code for the lookup is fine, though it holds the ID
                                                value={newProperty.pc_code}
                                                onChange={(e) => {
                                                    // Pass the event to main handler to update newProperty
                                                    handleChange(e); 
                                                    // Set local state to trigger dependent list fetching
                                                    if(newProperty.property_kind !== 'Land')
                                                        setNewDetails(prev=>({...prev, pc_code: e.target.value}));
                                                    else    
                                                        setSelectedPC(Number(e.target.value) || '');
                                                    
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value=''>-- Select classification --</option>
                                                {pcList.map((item, index) => (
                                                    <option value={newProperty.property_kind === 'Land'? item.pc_id: item.code} key={index}>{item.code}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <hr />


                                {/* Property-Specific Details Based on Property Kind */}
                                {newProperty.property_kind === 'Land' && (
                                    <div className='mt-6'>
                                        <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2 bg-green-50 -mx-6 -mt-2 px-6 pt-2">
                                            Land Specific Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Actual Use Code */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Actual Use Code <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="au_code"
                                                    value={(activeDetails as LandDetails)?.au_code || ''}
                                                    onChange={handleDetailChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    {auList.length < 1 ? (
                                                        <option value=''>-- Select a classification first --</option>
                                                    ) : (
                                                        <option value=''>-- Select Actual Use --</option>
                                                    )}
                                                    {auList.map((item, index) => (
                                                        <option value={item.code} key={index}>{item.code}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Property Subclass Code */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Property Subclass Code <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="psc_code"
                                                    value={(activeDetails as LandDetails)?.psc_code || ''}
                                                    onChange={handleDetailChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    {pscList.length < 1 ? (
                                                        <option value=''>-- Select a classification first --</option>
                                                    ) : (
                                                        <option value=''>-- Select Sub Class --</option>
                                                    )}
                                                    {pscList.map((item, index) => (
                                                        <option value={item.code} key={index}>{item.code}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Lot Area */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Lot Area (sqm) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    name="lot_area"
                                                    value={(activeDetails as LandDetails)?.lot_area || 0}
                                                    onChange={handleDetailChange}
                                                    required
                                                    placeholder="e.g., 500.00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Shape */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Shape
                                                </label>
                                                <select
                                                    name="shape"
                                                    value={(activeDetails as LandDetails)?.shape}
                                                    onChange={handleDetailChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="REGULAR">Regular</option>
                                                    <option value="IRREGULAR">Irregular</option>
                                                </select>
                                            </div>

                                            {/* Topography */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Topography
                                                </label>
                                                <select
                                                    name="topography"
                                                    value={(activeDetails as LandDetails)?.topography}
                                                    onChange={handleDetailChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="LEVEL">Level</option>
                                                    <option value="SLOPING">Sloping</option>
                                                    <option value="ROLLING">Rolling</option>
                                                    <option value="HILLY">Hilly</option>
                                                </select>
                                            </div>

                                            {/* Road Access */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Road Access
                                                </label>
                                                <select
                                                    name="road_access"
                                                    value={(activeDetails as LandDetails)?.road_access}
                                                    onChange={handleDetailChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="PAVED">Paved</option>
                                                    <option value="GRAVEL">Gravel</option>
                                                    <option value="EARTH">Earth</option>
                                                    <option value="NONE">None</option>
                                                </select>
                                            </div>

                                            {/* Additional Adjustment Factor */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Additional Adjustment Factor
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0"
                                                    name="additional_adj_factor"
                                                    value={(activeDetails as LandDetails)?.additional_adj_factor || 1.0000}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 1.0000"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Corner Lot */}
                                            <div className="md:col-span-1 flex items-end">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="corner_lot"
                                                        checked={(activeDetails as LandDetails)?.corner_lot}
                                                        onChange={handleDetailChange}
                                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Corner Lot</span>
                                                </label>
                                            </div>

                                            {/* Remarks */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Land Remarks
                                                </label>
                                                <textarea
                                                    name="remarks"
                                                    value={(activeDetails as LandDetails)?.remarks || ''}
                                                    onChange={handleDetailChange}
                                                    rows={2}
                                                    placeholder="Additional land-specific notes..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        {/* Land Other Improvements Section */}
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-4 bg-yellow-50 -mx-6 px-6 py-3 border-b">
                                                <h3 className="text-md font-semibold text-gray-900">
                                                    Land Other Improvements (Trees, Fence, etc.)
                                                </h3>
                                                <button
                                                    onClick={addImprovement}
                                                    type="button"
                                                    className="flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                                                >
                                                    <Plus size={16} />
                                                    Add Improvement
                                                </button>
                                            </div>

                                            {/* Improvements List */}
                                            <div className="space-y-3">
                                                {improvements.length === 0 ? (
                                                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                                        <p className="text-sm text-gray-500">No improvements added yet.</p>
                                                        <p className="text-xs text-gray-400 mt-1">Click "Add Improvement" to start adding items.</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {improvements.map((improvement, index) => (
                                                            <div 
                                                                key={improvement.improvement_id} 
                                                                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                                                            >
                                                                {/* Row Number */}
                                                                <div className="md:col-span-1 flex items-center">
                                                                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                                                                        {index + 1}
                                                                    </span>
                                                                </div>

                                                                {/* Improvement Name */}
                                                                <div className="md:col-span-4">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Improvement Name
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={improvement.improvement_name}
                                                                        onChange={(e) => updateImprovement(improvement.improvement_id, 'improvement_name', e.target.value)}
                                                                        placeholder="e.g., Perimeter Fence, Mango Tree"
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                                    />
                                                                </div>

                                                                {/* Quantity */}
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Quantity
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        value={improvement.quantity}
                                                                        onChange={(e) => updateImprovement(improvement.improvement_id, 'quantity', Number(e.target.value))}
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                                    />
                                                                </div>

                                                                {/* Unit Value */}
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Unit Value (₱)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={improvement.unit_value}
                                                                        onChange={(e) => updateImprovement(improvement.improvement_id, 'unit_value', Number(e.target.value))}
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                                    />
                                                                </div>

                                                                {/* Total Value (Read-only) */}
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Total Value
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={improvement?.base_market_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                        disabled
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                                                                    />
                                                                </div>

                                                                {/* Delete Button */}
                                                                <div className="md:col-span-1 flex items-end">
                                                                    <button
                                                                        onClick={() => removeImprovement(improvement.improvement_id)}
                                                                        type="button"
                                                                        className="w-full md:w-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-300"
                                                                        title="Remove improvement"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Total Summary */}
                                                        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-semibold text-emerald-900">
                                                                    Total Improvements Value:
                                                                </span>
                                                                <span className="text-lg font-bold text-emerald-900">
                                                                    ₱{
                                                                        improvements.reduce((accumulator, item) => {
                                                                            return accumulator + Number(item.base_market_value);
                                                                        }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-emerald-700 mt-1">
                                                                {improvements.length} improvement{improvements.length !== 1 ? 's' : ''} added
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {newProperty.property_kind === 'Building' && (
                                    <div className='mt-6'>
                                        <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2 bg-blue-50 -mx-6 -mt-2 px-6 pt-2">
                                            Building Specific Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Building Kind (Structure Type) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Building Kind <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="bk_id"
                                                    value={(activeDetails as BuildingDetails)?.bk_id}
                                                    onChange={handleDetailChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value=''>-- Select Structure Type --</option>
                                                    {stList.map((item, index) => (
                                                        <option value={item.bk_id} key={index}>{item.code}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Actual Use (Building) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Actual Use <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="au_code"
                                                    value={(activeDetails as BuildingDetails)?.use_code}
                                                    onChange={handleDetailChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value=''>-- Select Actual Use --</option>
                                                    {bauList.map((item, index) => (
                                                        <option value={item.use_code} key={index}>{item.use_name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Floor Area */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Floor Area (sqm) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    name="floor_area"
                                                    value={(activeDetails as BuildingDetails)?.floor_area || 0}
                                                    onChange={handleDetailChange}
                                                    required
                                                    placeholder="e.g., 250.00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Number of Storeys */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Number of Storeys
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    name="no_of_storeys"
                                                    value={(activeDetails as BuildingDetails)?.no_of_storeys}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 2"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Year Constructed */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Year Constructed
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                    name="year_constructed"
                                                    value={(activeDetails as BuildingDetails)?.year_constructed || ''}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 2020"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Depreciation Rate */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Depreciation Rate (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    name="depreciation_rate"
                                                    value={(activeDetails as BuildingDetails)?.depreciation_rate || 0.00}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 2.50"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Additional Adjustment Factor */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Additional Adjustment Factor
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0"
                                                    name="additional_adj_factor"
                                                    value={(activeDetails as BuildingDetails)?.additional_adj_factor || 1.0000}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 1.0000"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Remarks */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Building Remarks
                                                </label>
                                                <textarea
                                                    name="remarks"
                                                    value={(activeDetails as BuildingDetails)?.remarks || ''}
                                                    onChange={handleDetailChange}
                                                    rows={2}
                                                    placeholder="Additional building-specific notes..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {newProperty.property_kind === 'Machinery' && (
                                    <div className="mt-6">
                                        <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2 bg-orange-50 -mx-6 -mt-2 px-6 pt-2">
                                            Machinery Specific Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            {/* Brand/Model (Machinery Type) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Brand / Model <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="mt_id"
                                                    value={(activeDetails as MachineryDetails)?.mt_id || ''}
                                                    onChange={handleDetailChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="">-- Select Brand/Model --</option>
                                                    {mtList.map((item, index) => (
                                                        <option 
                                                            key={index} 
                                                            value={item.mt_id}
                                                        >
                                                            {item.code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Machine Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Machine Description <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="machine_description"
                                                    value={(activeDetails as MachineryDetails)?.machine_description || ''}
                                                    onChange={handleDetailChange}
                                                    required
                                                    placeholder="e.g., Industrial Generator Set"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Acquisition Cost -- removed manual adding, refer now to smv_machinery unit value */}
                                            {/* <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Acquisition Cost <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    name="acquisition_cost"
                                                    value={(activeDetails as MachineryDetails)?.acquisition_cost || ''}
                                                    onChange={handleDetailChange}
                                                    required
                                                    placeholder="e.g., 550000.00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div> */}

                                            {/* Year Acquired */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Year Acquired
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                    name="year_acquired"
                                                    value={(activeDetails as MachineryDetails)?.year_acquired || ''}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 2020"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Estimated Life */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Estimated Life (years)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    name="estimated_life"
                                                    value={(activeDetails as MachineryDetails)?.estimated_life || ''}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 10"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            {/* Depreciation Rate */}
                                            {/* refer to the smv_machinery too ig <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Depreciation Rate (% per year)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    name="depreciation_rate"
                                                    value={(activeDetails as MachineryDetails)?.depreciation_rate || ''}
                                                    onChange={handleDetailChange}
                                                    placeholder="e.g., 10.00"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div> */}

                                            {/* Operational Condition */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Operational Condition
                                                </label>
                                                <select
                                                    name="operational_condition"
                                                    value={(activeDetails as MachineryDetails)?.operational_condition || 'OPERATIVE'}
                                                    onChange={handleDetailChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="OPERATIVE">Operative</option>
                                                    <option value="INOPERATIVE">Inoperative</option>
                                                </select>
                                            </div>

                                            {/* Remarks */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Remarks
                                                </label>
                                                <textarea
                                                    name="remarks"
                                                    value={(activeDetails as MachineryDetails)?.remarks || ''}
                                                    onChange={handleDetailChange}
                                                    rows={2}
                                                    placeholder="Additional machinery-specific notes..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                )}

                                <hr />
                                {/* General Description */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">General Property Details</h3>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        General Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newProperty.description || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Additional property description or notes..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!submitLoading && !approve && (
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <div className="flex-1">
                            {submitError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{submitError}</p>
                                </div>
                            )}
                            {inputError && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-600 text-sm">{inputError}</p>
                                </div>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 max-h-fit hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 max-h-fit transition-colors"
                            >
                                {edit ? 'Update' : 'Add'} Property
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= logs history
interface PropertyLogsDialogProps {
    propertyId: number;
}

interface PropertyLog {
    history_id: number;
    property_id: number;
    arp_no: string;
    pin: string | null;
    owner_id: number | null;
    owner_name: string;
    owner_address: string | null;
    barangay: string | null;
    lot_no: string | null;
    block_no: string | null;
    lg_code: string;
    property_kind: 'Land' | 'Building' | 'Machinery';
    description: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
    change_reason: 'UPDATE' | 'TRANSFER' | 'CANCELLATION' | 'CORRECTION' | 'REASSESSMENT';
    snapshot: string | null;
    changed_by: string | null;
    changed_at: string;
}

export function PropertyLogsDialog({ propertyId, show, setShow }: PropertyLogsDialogProps) {
    const [open, setOpen] = useState(false);
    const [logs, setLogs] = useState<PropertyLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const openHistory = async () => {
        setOpen(true);
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`pml/history/${propertyId}`);
            
            setLogs(res.data || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
            setError("Failed to load property history. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        if(show){
            openHistory();
        }
    }, [show]);

    const toggleExpanded = (historyId: number) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(historyId)) {
            newExpanded.delete(historyId);
        } else {
            newExpanded.add(historyId);
        }
        setExpandedLogs(newExpanded);
    };

    const getPropertyKindIcon = (kind: string) => {
        switch(kind) {
            case 'Land': return <MapPin className="w-4 h-4" />;
            case 'Building': return <Building2 className="w-4 h-4" />;
            case 'Machinery': return <Wrench className="w-4 h-4" />;
            default: return <Home className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            ACTIVE: 'bg-green-100 text-green-800 border-green-300',
            INACTIVE: 'bg-gray-100 text-gray-800 border-gray-300',
            TRANSFERRED: 'bg-blue-100 text-blue-800 border-blue-300',
            CANCELLED: 'bg-red-100 text-red-800 border-red-300'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getChangeReasonColor = (reason: string) => {
        const colors = {
            UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
            TRANSFER: 'bg-purple-50 text-purple-700 border-purple-200',
            CANCELLATION: 'bg-red-50 text-red-700 border-red-200',
            CORRECTION: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            REASSESSMENT: 'bg-orange-50 text-orange-700 border-orange-200'
        };
        return colors[reason as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            {/* Overlay + Dialog */}
            {open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-lime-100 p-2 rounded-lg">
                                    <History className="w-5 h-5 text-lime-700" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Property Change History</h2>
                                    <p className="text-sm text-gray-500">Property ID: {propertyId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {setOpen(false); setShow(false);}}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-lime-200 border-t-lime-600 rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-600 font-medium">Loading property history...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                    <p className="text-red-700 font-medium">{error}</p>
                                    <button
                                        onClick={openHistory}
                                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium text-lg">No history logs found</p>
                                    <p className="text-gray-400 text-sm mt-2">Changes to this property will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map((log, index) => (
                                        <div
                                            key={log.history_id}
                                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                                        >
                                            {/* Log Header */}
                                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="bg-lime-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                            {logs.length - index}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getChangeReasonColor(log.change_reason)}`}>
                                                                {log.change_reason}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(log.status)}`}>
                                                                {log.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <User size={14} />
                                                            <span className="font-medium">{log.changed_by || 'System'}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {formatDate(log.changed_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Property Identification */}
                                            <div className="px-5 py-4 border-b border-gray-100">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                                                    Property Identification
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                    <div>
                                                        <label className="text-xs text-gray-500 font-medium">ARP No.</label>
                                                        <p className="text-gray-900 font-semibold mt-1">{log.arp_no}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 font-medium">PIN</label>
                                                        <p className="text-gray-900 font-semibold mt-1">{log.pin || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 font-medium">Property Kind</label>
                                                        <p className="text-gray-900 mt-1">
                                                            <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center gap-1 ${
                                                                log.property_kind === 'Land' ? 'bg-green-100 text-green-800' :
                                                                log.property_kind === 'Building' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-orange-100 text-orange-800'
                                                            }`}>
                                                                {getPropertyKindIcon(log.property_kind)}
                                                                {log.property_kind}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 font-medium">Location Code</label>
                                                        <p className="text-gray-900 font-semibold mt-1">{log.lg_code}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Owner & Location Info */}
                                            <div className="px-5 py-4">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                                                    Owner & Location Information
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <label className="text-xs text-gray-500 font-medium">Owner Name</label>
                                                        <p className="text-gray-900 font-semibold mt-1">{log.owner_name}</p>
                                                    </div>
                                                    {log.owner_address && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 font-medium">Owner Address</label>
                                                            <p className="text-gray-900 mt-1">{log.owner_address}</p>
                                                        </div>
                                                    )}
                                                    {log.barangay && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 font-medium">Barangay</label>
                                                            <p className="text-gray-900 font-semibold mt-1">{log.barangay}</p>
                                                        </div>
                                                    )}
                                                    {log.lot_no && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 font-medium">Lot No.</label>
                                                            <p className="text-gray-900 font-semibold mt-1">{log.lot_no}</p>
                                                        </div>
                                                    )}
                                                    {log.block_no && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 font-medium">Block No.</label>
                                                            <p className="text-gray-900 font-semibold mt-1">{log.block_no}</p>
                                                        </div>
                                                    )}
                                                    {log.description && (
                                                        <div className="md:col-span-2">
                                                            <label className="text-xs text-gray-500 font-medium">Description</label>
                                                            <p className="text-gray-700 mt-1">{log.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Property Details Snapshot */}
                                            {log.snapshot && (
                                                <div className="px-5 pb-4">
                                                    <button
                                                        onClick={() => toggleExpanded(log.history_id)}
                                                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                                    >
                                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <FileText size={16} />
                                                            View {log.property_kind} Specific Details
                                                        </span>
                                                        {expandedLogs.has(log.history_id) ? (
                                                            <ChevronUp size={20} className="text-gray-600" />
                                                        ) : (
                                                            <ChevronDown size={20} className="text-gray-600" />
                                                        )}
                                                    </button>
                                                    {expandedLogs.has(log.history_id) && (
                                                        <div className={`mt-3 rounded-lg p-4 border ${
                                                            log.property_kind === 'Land' ? 'bg-green-50 border-green-200' :
                                                            log.property_kind === 'Building' ? 'bg-blue-50 border-blue-200' :
                                                            'bg-orange-50 border-orange-200'
                                                        }`}>
                                                            {(() => {
                                                                try {
                                                                    const snapshotData = JSON.parse(log.snapshot);
                                                                    const detail = snapshotData.detail;
                                                                    
                                                                    if (!detail) {
                                                                        return <p className="text-gray-600 text-sm">No additional details available</p>;
                                                                    }

                                                                    const colorClass = log.property_kind === 'Land' ? 'text-green-900' :
                                                                                     log.property_kind === 'Building' ? 'text-blue-900' :
                                                                                     'text-orange-900';
                                                                    
                                                                    const labelClass = log.property_kind === 'Land' ? 'text-green-700' :
                                                                                      log.property_kind === 'Building' ? 'text-blue-700' :
                                                                                      'text-orange-700';

                                                                    // Render based on property kind
                                                                    if (log.property_kind === 'Land') {
                                                                        return (
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                                                {detail.lot_area && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Lot Area (sqm)</label>
                                                                                        <p className={`${colorClass} font-semibold mt-1`}>
                                                                                            {Number(detail.lot_area).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.pc_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Classification</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.pc_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.psc_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Sub-Classification</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.psc_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.au_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Actual Use</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.au_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.assessment_level != null && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Assessment Level</label>
                                                                                        <p className={`${colorClass} font-semibold mt-1`}>{detail.assessment_level}%</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.shape && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Shape</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.shape}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.topography && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Topography</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.topography}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.road_access && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Road Access</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.road_access}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    } else if (log.property_kind === 'Building') {
                                                                        return (
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                                                {detail.floor_area && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Floor Area (sqm)</label>
                                                                                        <p className={`${colorClass} font-semibold mt-1`}>
                                                                                            {Number(detail.floor_area).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.no_of_storeys && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>No. of Storeys</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.no_of_storeys}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.year_constructed && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Year Constructed</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.year_constructed}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.building_kind_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Building Kind</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.building_kind_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.depreciation_rate != null && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Depreciation Rate</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.depreciation_rate}%</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.au_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Actual Use</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.au_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.assessment_level != null && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Assessment Level</label>
                                                                                        <p className={`${colorClass} font-semibold mt-1`}>{detail.assessment_level}%</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    } else if (log.property_kind === 'Machinery') {
                                                                        return (
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                                                {detail.brand_model && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Brand/Model</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.brand_model}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.machinery_type_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Machinery Type</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.machinery_type_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.year_acquired && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Year Acquired</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.year_acquired}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.base_value && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Acquisition Cost</label>
                                                                                        <p className={`${colorClass} font-semibold mt-1`}>
                                                                                            ₱{Number(detail.base_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.operational_condition && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Condition</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.operational_condition}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.au_name && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Actual Use</label>
                                                                                        <p className={`${colorClass} mt-1`}>{detail.au_name}</p>
                                                                                    </div>
                                                                                )}
                                                                                {detail.assessment_level != null && (
                                                                                    <div>
                                                                                        <label className={`text-xs font-medium ${labelClass}`}>Assessment Level</label>
                                                                                        <p className={`${colorClass} font-semibold mt-1`}>{detail.assessment_level}%</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    
                                                                    return null;
                                                                } catch (e) {
                                                                    return (
                                                                        <p className="text-red-600 text-sm">
                                                                            Unable to parse snapshot data
                                                                        </p>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!loading && logs.length > 0 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{logs.length}</span> history record{logs.length !== 1 ? 's' : ''}
                                </p>
                                <button
                                    onClick={() => {setOpen(false); setShow(false);}}
                                    className="px-6 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

// ============= PROPERTY VIEW DIALOG WITH FAAS HISTORY =============
interface PropertyFormData {
    property_id?: number;
    arp_no: string;
    pin: string;
    owner_name: string;
    owner_address: string;
    owner_id: number | null;
    lg_code: string;
    barangay: string;
    lot_no: string;
    block_no: string;
    au_code: string;
    psc_code: string;
    lot_area: number;
    property_kind: 'Land' | 'Building' | 'Machinery';
    description: string;
    status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
}

interface FAASRecord {
    faas_id: number;
    faas_no: string;
    faas_type: 'ORIGINAL' | 'REVISION' | 'TRANSFER' | 'CANCELLATION';
    effectivity_date: string;
    taxable: boolean;
    status: 'ACTIVE' | 'CANCELLED';
    created_by: string | null;
    created_date: string;
    market_value?: number;
    assessed_value?: number;
}

interface PropertyViewDialogProps {
    showViewDialog: boolean;
    setShowViewDialog: (show: boolean) => void;
    submitLoading: boolean;
    property: PropertyFormData;
    details: LandDetails | BuildingDetails | MachineryDetails;
}

interface PropertyFormData {
    property_id?: number;
    arp_no: string;
    pin: string | null;
    owner_name: string;
    owner_address: string | null;
    owner_id: number | null;
    lg_code: string;
    barangay: string | null;
    lot_no: string | null;
    block_no: string | null;
    property_kind: 'Land' | 'Building' | 'Machinery';
    description: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
}

interface PropertyLandDetails {
    land_id: number;
    property_id: number;
    au_code: string;
    psc_code: string;
    lot_area: number;
    shape: 'REGULAR' | 'IRREGULAR';
    topography: 'LEVEL' | 'SLOPING' | 'ROLLING' | 'HILLY';
    corner_lot: boolean;
    road_access: 'PAVED' | 'GRAVEL' | 'EARTH' | 'NONE';
    additional_adj_factor: number;
    remarks: string | null;
}

interface PropertyBuildingDetails {
    building_id: number;
    property_id: number;
    bk_id: number;
    pc_code: string;
    floor_area: number;
    no_of_storeys: number;
    year_constructed: string | null;
    depreciation_rate: number;
    additional_adj_factor: number;
    remarks: string | null;
}

interface PropertyMachineryDetails {
    machinery_id: number;
    property_id: number;
    machine_description: string;
    brand_model: string | null;
    year_acquired: string | null;
    acquisition_cost: number;
    estimated_life: number;
    depreciation_rate: number;
    operational_condition: 'OPERATIVE' | 'INOPERATIVE';
    remarks: string | null;
}

export const PropertyViewDialog: React.FC<PropertyViewDialogProps> = ({
    showViewDialog,
    setShowViewDialog,
    submitLoading,
    property,
    details,
    improvements
}) => {
    const [faasHistory, setFaasHistory] = useState<FAASRecord[]>([]);
    const [loadingFaas, setLoadingFaas] = useState<boolean>(false);
    const [showFaasDetail, setShowFaasDetail] = useState<boolean>(false);
    const [showCreateFaas, setShowCreateFaas] = useState<boolean>(false);
    const [selectedFaas, setSelectedFaas] = useState<FAASRecord | null>(null);
    const [error, setError] = useState<string>('');
    const [openLogs, setOpenLogs] = useState<boolean>(false);
    
    // Property-specific details states
    const [landDetails, setLandDetails] = useState<PropertyLandDetails | null>(null);
    const [buildingDetails, setBuildingDetails] = useState<PropertyBuildingDetails | null>(null);
    const [machineryDetails, setMachineryDetails] = useState<PropertyMachineryDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const handleCreateFaas = () => {
        setShowCreateFaas(true);
    };

    const handleClose = () => {
        setShowViewDialog(false);
        setFaasHistory([]);
        setLandDetails(null);
        setBuildingDetails(null);
        setMachineryDetails(null);
    };

    // Fetch FAAS history when dialog opens
    useEffect(() => {
        if (showViewDialog && property.property_id) {
            fetchFaasHistory();
        }
    }, [showViewDialog, property.property_id]);

    const fetchFaasHistory = async () => {
        setLoadingFaas(true);
        try {
            const res = await api.get('faas/history', { 
                params: { property_id: property.property_id } 
            });
            const faasRecords = res.data.data || [];
            setFaasHistory(faasRecords);

            // Fetch Tax Declarations for each FAAS
            if (faasRecords.length > 0) {
                const tdPromises = faasRecords.map(async (faas: FAASRecord) => {
                    try {
                        const tdRes = await api.get(`td/list/${faas.faas_id}`);
                        return { faasId: faas.faas_id, tds: tdRes.data || [] };
                    } catch (err) {
                        console.error(`Failed to fetch TDs for FAAS ${faas.faas_id}`, err);
                        return { faasId: faas.faas_id, tds: [] };
                    }
                });

                const tdResults = await Promise.all(tdPromises);
                const tdMap = new Map<number, TaxDeclaration[]>();
                tdResults.forEach(result => {
                    tdMap.set(result.faasId, result.tds);
                });
                setTaxDeclarations(tdMap);
            }
        } catch (err) {
            setError('Failed to fetch FAAS history');
            console.error('Failed to fetch FAAS history', err);
        } finally {
            setLoadingFaas(false);
        }
    };

    const handleViewFaas = (faas: FAASRecord) => {
        setSelectedFaas(faas);
        setShowFaasDetail(true);
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
    };

    const getFaasTypeBadgeColor = (type: string): string => {
        switch (type) {
            case 'ORIGINAL':
                return 'bg-green-100 text-green-800';
            case 'REVISION':
                return 'bg-blue-100 text-blue-800';
            case 'TRANSFER':
                return 'bg-orange-100 text-orange-800';
            case 'CANCELLATION':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getFaasStatusBadgeColor = (status: string): string => {
        return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };

    const openHistory = async ( ) => {
        setOpenLogs(true);
    } 
    const handleCreateTaxDec = async ( ) => {
        setShowTdDialog(true);
    } 

    const mockProperty: PropertyFormData = {
        property_id: 101,
        arp_no: 'A-001-00042',
        pin: '1-001-042-01-001',
        owner_name: 'Juan Dela Cruz',
        lg_code: 'MC',
        property_kind: 'LAND',
        barangay: 'San Roque',
        street_address: 'Main Street',
        assessment_level: 20, // Land Residential
    };

    const mockActiveFaas: ActiveFaasData = {
        faas_id: 55,
        faas_no: 'F-2024-0055',
        effectivity_date: '2024-01-01',
        market_value: 500000.00,
        assessment_level: 20.00,
        assessed_value: 100000.00,
        taxable: true,
        notes: 'Land assessment based on 2024 RY.',
    };

    const [showTdDialog, setShowTdDialog] = useState<boolean>(false);
    const handleSuccess = ( ) => {
        fetchFaasHistory();
        
    }


    interface TaxDeclaration {
        td_id: number;
        faas_id: number;
        td_no: string;
        effectivity_date: string;
        owner_name: string;
        owner_address: string | null;
        property_location: string | null;
        property_kind: 'LAND' | 'BUILDING' | 'MACHINERY';
        market_value: number;
        assessment_level: number;
        assessed_value: number;
        taxable: boolean;
        status: 'ACTIVE' | 'CANCELLED';
        created_by: string | null;
        created_date: string;
    }
    // Add new state for Tax Declarations
    const [taxDeclarations, setTaxDeclarations] = useState<Map<number, TaxDeclaration[]>>(new Map());


    if (!showViewDialog) return null;
    const InfoField = ({ label, value, className = "" }) => (
        <div className={className}>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        <p className="text-sm text-gray-900 mt-1 font-medium">{value || '-'}</p>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Property Details</h2>
                        <p className="text-emerald-100 text-sm mt-1">ARP No: {property.arp_no}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 transition-colors rounded-lg p-2"
                    >
                        <X size={24} />
                    </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                    {submitLoading ? (
                        <div className="py-20">
                        <Loading />
                        </div>
                    ) : (
                        <div className="space-y-6">
                        {/* Quick Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                            <label className="text-xs font-semibold text-emerald-700 uppercase">Property Kind</label>
                            <p className="text-2xl font-bold text-emerald-900 mt-1">{property.property_kind}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                            <label className="text-xs font-semibold text-blue-700 uppercase">Status</label>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{property.status}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                            <label className="text-xs font-semibold text-purple-700 uppercase">PIN</label>
                            <p className="text-lg font-bold text-purple-900 mt-1 break-all">{property.pin || 'Not Set'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                            <label className="text-xs font-semibold text-amber-700 uppercase">Barangay</label>
                            <p className="text-xl font-bold text-amber-900 mt-1">{property.barangay || '-'}</p>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-emerald-600 rounded"></div>
                            Owner Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoField label="Owner Name" value={property.owner_name} />
                            <InfoField label="Owner Address" value={property.owner_address} />
                            </div>
                        </div>

                        {/* Location Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-600 rounded"></div>
                            Location Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <InfoField label="LG Code" value={property.lg_code} />
                            <InfoField label="Barangay" value={property.barangay} />
                            <InfoField label="Lot No." value={property.lot_no} />
                            <InfoField label="Block No." value={property.block_no} />
                            </div>
                        </div>

                        {/* Property-Specific Details */}
                        {loadingDetails ? (
                            <div className="text-center py-8">
                            <Loading />
                            </div>
                        ) : (
                            <>
                            {/* Land Details */}
                            {property.property_kind === 'Land' && details && (
                                <>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-md">
                                    <h3 className="text-lg font-bold text-green-900 mb-5 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-green-600 rounded"></div>
                                    Land Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <InfoField label="Actual Use Code" value={details.au_code} />
                                    <InfoField label="PSC Code" value={details.psc_code} />
                                    <InfoField 
                                        label="Lot Area (sqm)" 
                                        value={Number(details.lot_area).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                    />
                                    <InfoField label="Shape" value={details.shape} />
                                    <InfoField label="Topography" value={details.topography} />
                                    <InfoField label="Road Access" value={details.road_access} />
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Corner Lot</label>
                                        <p className="mt-1">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${details.corner_lot ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-800'}`}>
                                            {details.corner_lot ? 'Yes' : 'No'}
                                        </span>
                                        </p>
                                    </div>
                                    <InfoField label="Adj. Factor" value={Number(details.additional_adj_factor).toFixed(4)} />
                                    {details.remarks && (
                                        <InfoField label="Remarks" value={details.remarks} className="md:col-span-3" />
                                    )}
                                    </div>
                                </div>

                                {/* Land Other Improvements */}
                                {improvements && improvements.length > 0 && (
                                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-xl p-6 shadow-md">
                                    <h3 className="text-lg font-bold text-cyan-900 mb-5 flex items-center gap-2">
                                        <Wrench className="text-cyan-700" size={20} />
                                        Other Improvements
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-cyan-300">
                                            <th className="text-left py-3 px-4 text-xs font-bold text-cyan-900 uppercase">Improvement</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold text-cyan-900 uppercase">Quantity</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold text-cyan-900 uppercase">Unit Value</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold text-cyan-900 uppercase">Base Market Value</th>
                                            <th className="text-left py-3 px-4 text-xs font-bold text-cyan-900 uppercase">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {improvements.map((imp, idx) => (
                                            <tr key={imp.improvement_id || idx} className="border-b border-cyan-200 hover:bg-cyan-100/50 transition-colors">
                                                <td className="py-3 px-4 text-sm font-medium text-cyan-900">{imp.improvement_name}</td>
                                                <td className="py-3 px-4 text-sm text-right text-cyan-900">{imp.quantity}</td>
                                                <td className="py-3 px-4 text-sm text-right font-medium text-cyan-900">{formatCurrency(imp.unit_value)}</td>
                                                <td className="py-3 px-4 text-sm text-right font-bold text-cyan-900">{formatCurrency(imp.base_market_value)}</td>
                                                <td className="py-3 px-4 text-sm text-cyan-900">{imp.remarks || '-'}</td>
                                            </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-cyan-200 font-bold">
                                            <td colSpan="3" className="py-3 px-4 text-sm text-right text-cyan-900 uppercase">Total:</td>
                                            <td className="py-3 px-4 text-sm text-right text-cyan-900">
                                                {formatCurrency(improvements.reduce((sum, imp) => sum + Number(imp.base_market_value || 0), 0))}
                                            </td>
                                            <td></td>
                                            </tr>
                                        </tfoot>
                                        </table>
                                    </div>
                                    </div>
                                )}
                                </>
                            )}

                            {/* Building Details */}
                            {property.property_kind === 'Building' && details && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-md">
                                <h3 className="text-lg font-bold text-blue-900 mb-5 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-blue-600 rounded"></div>
                                    Building Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <InfoField label="Building Kind" value={details.name} />
                                    <InfoField label="PC Code" value={details.pc_code} />
                                    <InfoField label="AU Code" value={details.au_code} />
                                    <InfoField 
                                    label="Floor Area (sqm)" 
                                    value={Number(details.floor_area).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                    />
                                    <InfoField label="No. of Storeys" value={details.no_of_storeys} />
                                    <InfoField label="Year Constructed" value={details.year_constructed} />
                                    <InfoField label="Depreciation Rate" value={`${Number(details.depreciation_rate).toFixed(2)}%`} />
                                    <InfoField label="Adj. Factor" value={Number(details.additional_adj_factor).toFixed(4)} />
                                    {details.remarks && (
                                    <InfoField label="Remarks" value={details.remarks} className="md:col-span-3" />
                                    )}
                                </div>
                                </div>
                            )}

                            {/* Machinery Details */}
                            {property.property_kind === 'Machinery' && details && (
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 shadow-md">
                                <h3 className="text-lg font-bold text-orange-900 mb-5 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-orange-600 rounded"></div>
                                    Machinery Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <InfoField label="Brand / Model" value={details?.name} />
                                    <InfoField label="PC Code" value={details?.pc_code} />
                                    <InfoField label="Machine Description" value={details?.machine_description} className="md:col-span-3" />
                                    <InfoField label="Year Acquired" value={details?.year_acquired} />
                                    <InfoField label="Acquisition Cost" value={formatCurrency(details?.base_value)} />
                                    <InfoField label="Estimated Life" value={details?.estimated_life ? `${details.estimated_life} years` : '-'} />
                                    <InfoField label="Depreciation Rate" value={details?.smv_depreciation_rate ? `${details.smv_depreciation_rate}% per year` : '-'} />
                                    <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Operational Condition</label>
                                    <p className="mt-1">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${details?.operational_condition === 'OPERATIVE' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                                        {details?.operational_condition || '-'}
                                        </span>
                                    </p>
                                    </div>
                                    {details?.remarks && (
                                    <InfoField label="Remarks" value={details.remarks} className="md:col-span-3" />
                                    )}
                                </div>
                                </div>
                            )}
                            </>
                        )}

                        {/* Description */}
                        {property.description && (
                            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-purple-600 rounded"></div>
                                Description
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{property.description}</p>
                            </div>
                        )}

                        {/* FAAS History */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="text-emerald-600" size={20} />
                            FAAS History
                            </h3>
                            {error ? (
                            <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-200">
                                {error}
                            </div>
                            ) : loadingFaas ? (
                            <div className="text-center py-8">
                                <Loading />
                            </div>
                            ) : faasHistory.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                                <p className="text-gray-600 font-medium">No FAAS records found</p>
                            </div>
                            ) : (
                            <div className="space-y-4">
                                {faasHistory.map((faas, index) => {
                                const faasTDs = taxDeclarations.get(faas.faas_id) || [];
                                
                                return (
                                    <div key={index} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                    {/* FAAS Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5">
                                        <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <h4 className="font-bold text-gray-900 text-xl">{faas.faas_no}</h4>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getFaasTypeBadgeColor(faas.faas_type)}`}>
                                                {faas.faas_type}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getFaasStatusBadgeColor(faas.status)}`}>
                                                {faas.status}
                                            </span>
                                            {faas.taxable && (
                                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-200 text-emerald-900">
                                                Taxable
                                                </span>
                                            )}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <InfoField label="Effectivity Date" value={formatDate(faas.effectivity_date)} />
                                            {faas.market_value && <InfoField label="Market Value" value={formatCurrency(faas.market_value)} />}
                                            {faas.assessed_value && <InfoField label="Assessed Value" value={formatCurrency(faas.assessed_value)} />}
                                            <InfoField label="Created By" value={faas.created_by} />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleViewFaas(faas)}
                                            className="ml-4 text-emerald-600 hover:bg-emerald-100 transition-colors p-3 rounded-lg"
                                            title="View FAAS Details"
                                        >
                                            <Eye size={22} />
                                        </button>
                                        </div>
                                    </div>

                                    {/* Tax Declarations */}
                                    {faasTDs.length > 0 && (
                                        <div className="p-5 bg-fuchsia-50/30">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Receipt size={18} className="text-fuchsia-600" />
                                            <h5 className="text-sm font-bold text-fuchsia-900">Tax Declarations</h5>
                                        </div>
                                        <div className="space-y-3">
                                            {faasTDs.map((td) => (
                                            <div key={td.td_id} className="bg-white border-2 border-fuchsia-300 rounded-lg p-4 hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono font-bold text-fuchsia-900 text-lg">{td.td_no}</span>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${td.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-800'}`}>
                                                    {td.status}
                                                    </span>
                                                    {td.taxable && (
                                                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-200 text-green-900">
                                                        Taxable
                                                    </span>
                                                    )}
                                                </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <InfoField label="Owner" value={td.owner_name} />
                                                <InfoField label="Effectivity" value={new Date(td.effectivity_date).toLocaleDateString()} />
                                                <InfoField label="Market Value" value={formatCurrency(td.market_value)} />
                                                <InfoField label="Assessed Value" value={formatCurrency(td.assessed_value)} />
                                                </div>
                                                {td.property_location && (
                                                <div className="mt-3 pt-3 border-t border-fuchsia-200">
                                                    <InfoField label="Location" value={td.property_location} />
                                                </div>
                                                )}
                                                {td.created_by && (
                                                <div className="mt-3 text-xs text-fuchsia-700">
                                                    Created by <span className="font-semibold">{td.created_by}</span> on {new Date(td.created_date).toLocaleString()}
                                                </div>
                                                )}
                                            </div>
                                            ))}
                                        </div>
                                        </div>
                                    )}
                                    </div>
                                );
                                })}
                            </div>
                            )}
                        </div>
                        </div>
                    )}
                    </div>

                    {/* Footer */}
                    {!submitLoading && (
                    <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200 flex justify-end gap-3">
                        <button
                        onClick={openHistory}
                        className="px-5 py-2.5 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
                        >
                        <Logs size={20} />
                        History
                        </button>
                        <button
                        onClick={handleCreateFaas}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
                        >
                        <Plus size={20} />
                        Create FAAS
                        </button>
                        <button
                        onClick={handleCreateTaxDec}
                        className="px-5 py-2.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
                        >
                        <FileText size={20} />
                        Create TD
                        </button>
                        <button
                        onClick={handleClose}
                        className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold shadow-md hover:shadow-lg"
                        >
                        Close
                        </button>
                    </div>
                    )}
                </div>
                </div>
            
            <CreateTaxDeclarationDialog
                showDialog={showTdDialog}
                setShowDialog={setShowTdDialog}
                onSuccess={handleSuccess}
                property={property}
            />

            <PropertyLogsDialog
                propertyId={property.property_id}
                show={openLogs}
                setShow={setOpenLogs}
            />

            {/* FAAS Detail Dialog */}
            {showFaasDetail && selectedFaas &&  (
                <PreviewFAASDialog
                    showDialog={showFaasDetail}
                    setShowDialog={setShowFaasDetail}
                    faas={ selectedFaas }
                />
            )}
            {/* Create FAAS Dialog */}
            {showCreateFaas && (
                <CreateFAASDialog
                    showDialog={showCreateFaas}
                    setShowDialog={setShowCreateFaas}
                    property={property}
                    improvements={improvements}
                    onSuccess={() => {
                        fetchFaasHistory(); // Refresh FAAS history after creation
                    }}
                    details={details}
                />
            )}
        </>
    );
};

// --- preview
interface PreviewFAASDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faas: any; // This should have faas_id
}

export const PreviewFAASDialog: React.FC<PreviewFAASDialogProps> = ({
    showDialog,
    setShowDialog,
    faas
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetched FAAS data
    const [faasData, setFaasData] = useState<any>(null);

    // Initialize and fetch all required data
    useEffect(() => {
        if (showDialog && faas?.faas_id) {
            fetchFaasDetails();
        }
    }, [showDialog, faas]);

    const fetchFaasDetails = async () => {
        setLoading(true);
        setSubmitError(null);
        try {
            console.log(faas.faas_id);
            const response = await api.get('faas/allDetails', { 
                params: { 
                    faas_id: faas.faas_id
                } 
            });
            setLoading(false);

            setFaasData(response.data);
        } catch (err) {
            console.error('Error fetching FAAS details:', err);
            setSubmitError('Failed to load FAAS details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
        setSubmitError(null);
        setFaasData(null);
    };

    if (!showDialog) return null;

    const getFaasTypeColor = (type: string) => {
        const colors = {
            ORIGINAL: 'bg-blue-100 text-blue-800 border-blue-300',
            REVISION: 'bg-purple-100 text-purple-800 border-purple-300',
            TRANSFER: 'bg-orange-100 text-orange-800 border-orange-300',
            CANCELLATION: 'bg-red-100 text-red-800 border-red-300'
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusColor = (status: string) => {
        const colors = {
            active: 'bg-green-100 text-green-800 border-green-300',
            inactive: 'bg-gray-100 text-gray-800 border-gray-300',
            cancelled: 'bg-red-100 text-red-800 border-red-300'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const renderPropertyDetails = () => {
        if (!faasData) return null;

        if (faasData.property_kind === 'Land') {
            return (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-5 mb-4 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-emerald-500 rounded"></div>
                        Land Assessment Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Market Value</label>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                ₱{Number(faasData.market_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Assessment Level</label>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                {Number(faasData.assessment_level || 0).toFixed(2)}%
                            </p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg border-2 border-emerald-300">
                            <label className="text-xs text-emerald-700 font-medium">Assessed Value</label>
                            <p className="text-emerald-800 font-bold text-lg mt-1">
                                ₱{Number(faasData.assessed_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    {faasData.notes && (
                        <div className="mt-4 bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Calculation Notes</label>
                            <p className="text-slate-700 text-sm mt-1">{faasData.notes}</p>
                        </div>
                    )}
                </div>
            );
        } else if (faasData.property_kind === 'Building') {
            return (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-5 mb-4 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-emerald-500 rounded"></div>
                        Building Assessment Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Market Value</label>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                ₱{Number(faasData.market_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Assessment Level</label>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                {Number(faasData.assessment_level || 0).toFixed(2)}%
                            </p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg border-2 border-emerald-300">
                            <label className="text-xs text-emerald-700 font-medium">Assessed Value</label>
                            <p className="text-emerald-800 font-bold text-lg mt-1">
                                ₱{Number(faasData.assessed_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    {faasData.notes && (
                        <div className="mt-4 bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Calculation Notes</label>
                            <p className="text-slate-700 text-sm mt-1">{faasData.notes}</p>
                        </div>
                    )}
                </div>
            );
        } else if (faasData.property_kind === 'Machinery') {
            return (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-5 mb-4 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-emerald-500 rounded"></div>
                        Machinery Assessment Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Market Value</label>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                ₱{Number(faasData.market_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Assessment Level</label>
                            <p className="text-slate-900 font-bold text-lg mt-1">
                                {Number(faasData.assessment_level || 0).toFixed(2)}%
                            </p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg border-2 border-emerald-300">
                            <label className="text-xs text-emerald-700 font-medium">Assessed Value</label>
                            <p className="text-emerald-800 font-bold text-lg mt-1">
                                ₱{Number(faasData.assessed_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    {faasData.notes && (
                        <div className="mt-4 bg-white p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 font-medium">Calculation Notes</label>
                            <p className="text-slate-700 text-sm mt-1">{faasData.notes}</p>
                        </div>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-slate-200">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 flex items-center justify-between z-10 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                FAAS Preview
                            </h2>
                            <p className="text-emerald-100 text-sm">
                                {faasData?.faas_no || faas?.faas_no || 'Loading...'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 transition-colors p-2 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">Loading FAAS details...</p>
                        </div>
                    ) : (
                        <>
                            {submitError && (
                                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-600 text-sm font-medium">{submitError}</p>
                                </div>
                            )}

                            {faasData && (
                                <>
                                    {/* Status Badges */}
                                    <div className="mb-6 flex flex-wrap items-center gap-3">
                                        <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${getFaasTypeColor(faasData.faas_type)}`}>
                                            {faasData.faas_type}
                                        </span>
                                        <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(faasData.status)}`}>
                                            {faasData.status?.toUpperCase()}
                                        </span>
                                        {faasData.taxable ? (
                                            <span className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-800 border-2 border-green-300 rounded-lg text-sm font-bold">
                                                <CheckCircle size={16} />
                                                Taxable
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-800 border-2 border-gray-300 rounded-lg text-sm font-bold">
                                                <XCircle size={16} />
                                                Non-Taxable
                                            </span>
                                        )}
                                    </div>

                                    {/* Property Info */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
                                        <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Property Information
                                            <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Read-only</span>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <label className="text-xs text-blue-600 font-medium">ARP No.</label>
                                                <p className="text-blue-900 font-bold mt-1">{faasData.arp_no || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <label className="text-xs text-blue-600 font-medium">PIN</label>
                                                <p className="text-blue-900 font-semibold mt-1">{faasData.pin || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <label className="text-xs text-blue-600 font-medium">FAAS No.</label>
                                                <p className="text-blue-900 font-bold mt-1">{faasData.faas_no || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <label className="text-xs text-blue-600 font-medium">Property Kind</label>
                                                <p className="text-blue-900 font-bold mt-1">{faasData.property_kind || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200 col-span-2">
                                                <label className="text-xs text-blue-600 font-medium">Owner</label>
                                                <p className="text-blue-900 font-semibold mt-1">{faasData.owner_name || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200 col-span-2">
                                                <label className="text-xs text-blue-600 font-medium">Owner Address</label>
                                                <p className="text-blue-900 font-semibold mt-1">{faasData.owner_address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* FAAS Details */}
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-5 mb-6 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-emerald-600" />
                                            FAAS Information
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <label className="text-xs text-slate-500 font-medium">Revision Year</label>
                                                <p className="text-slate-900 font-bold mt-1">{faasData.year || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <label className="text-xs text-slate-500 font-medium">Effectivity Date</label>
                                                <p className="text-slate-900 font-semibold mt-1">
                                                    {faasData.effectivity_date ? new Date(faasData.effectivity_date).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <label className="text-xs text-slate-500 font-medium">Previous FAAS</label>
                                                <p className="text-slate-900 font-semibold mt-1">
                                                    {faasData.old_faas || 'None'}
                                                </p>
                                            </div>
                                            {faasData.created_by && (
                                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                    <label className="text-xs text-slate-500 font-medium">Created By</label>
                                                    <p className="text-slate-900 font-semibold mt-1">{faasData.created_by}</p>
                                                </div>
                                            )}
                                            {faasData.created_date && (
                                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                    <label className="text-xs text-slate-500 font-medium">Created Date</label>
                                                    <p className="text-slate-900 font-semibold mt-1">
                                                        {new Date(faasData.created_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {faasData.remarks && (
                                            <div className="mt-4 bg-white p-3 rounded-lg border border-slate-200">
                                                <label className="text-xs text-slate-500 font-medium">Remarks</label>
                                                <p className="text-slate-700 text-sm mt-1">{faasData.remarks}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Property-specific details */}
                                    {renderPropertyDetails()}

                                    {/* Total Summary */}
                                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 shadow-lg">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-emerald-100 font-semibold text-xs mb-1 block">Total Market Value</label>
                                                <p className="text-white font-bold text-3xl">
                                                    ₱{Number(faasData.market_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-emerald-100 font-semibold text-xs mb-1 block">Total Assessed Value</label>
                                                <p className="text-white font-bold text-3xl">
                                                    ₱{Number(faasData.assessed_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && (
                    <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t-2 border-slate-200 flex justify-end gap-3 rounded-b-xl">
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                        >
                            Close Preview
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};




// ============= CREATE FAAS DIALOG =============
interface Property {
    property_id: number;
    arp_no: string;
    pin: string | null;
    owner_name: string;
    lg_code: string;
    barangay: string | null;
    property_kind: 'Land' | 'Building' | 'Machinery';
}

interface LandImprovement {
    improvement_id: number;
    land_id: number;
    improvement_name: string;
    quantity: number;
    unit_value: number;
    base_market_value: number; // calculated: quantity * unit_value
    remarks: string | null;
}

interface Adjustment {
    id: string; // client-side ID for UI management
    factor_name: string;
    percent_adjustment: number;
    remarks: string;
}

interface LandDetails {
    pc_name: string;
    pc_code: string;
    psc_name: string;
    psc_code: string;
    au_name: string;
    au_code: string;
    lot_area: number;
}
interface BuildingDetails { floor_area: number; depreciation_rate: number; }
interface MachineryDetails { smv_depreciation_rate: number; year_acquired: string; base_value: number; }

interface CreateFAASDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    property: Property;
    improvements: LandImprovement[]; // List of improvements (only relevant for Land)
    onSuccess: () => void;
    details: LandDetails | BuildingDetails | MachineryDetails | any;
}

// --- CORE COMPONENT ---

const CreateFAASDialog: React.FC<CreateFAASDialogProps> = ({
    showDialog,
    setShowDialog,
    property,
    improvements,
    onSuccess,
    details
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(true);
    const [approve, setApprove] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<string>('');

    // Fetched data
    const [revisionYears, setRevisionYears] = useState<any[]>([]);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [smvData, setSMVData] = useState<any>(null);

    // Land adjustments
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [baseMarketValue, setBaseMarketValue] = useState<number>(0);
    const [improvementsTotal, setImprovementsTotal] = useState<number>(0);

    const [newFaas, setNewFaas] = useState({
        property_id: property.property_id,
        ry_id: 0,
        faas_type: 'ORIGINAL' as 'ORIGINAL' | 'REVISION' | 'TRANSFER' | 'CANCELLATION',
        effectivity_date: new Date().toISOString().split('T')[0],
        previous_faas_id: null as number | null,
        taxable: true,
        remarks: '',
    });

    const [faasDetail, setFaasDetail] = useState({
        property_kind: property.property_kind,
        market_value: 0,
        assessment_level: 0,
        assessed_value: 0,
        notes: '',
    });

    const handleDetailChange = (field: string, value: any) => {
        setFaasDetail(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Calculate progressive adjustments
    const calculateProgressiveValues = () => {
        const values: { base: number; adjusted: number }[] = [];
        // Start with base market value + improvements
        let currentValue = baseMarketValue + improvementsTotal;

        adjustments.forEach((adj) => {
            const base = currentValue;
            const adjustmentAmount = (currentValue * adj.percent_adjustment) / 100;
            currentValue = currentValue + adjustmentAmount;
            
            values.push({
                base,
                adjusted: currentValue
            });
        });

        return values;
    };

    const progressiveValues = calculateProgressiveValues();
    const finalMarketValue = progressiveValues.length > 0 
        ? progressiveValues[progressiveValues.length - 1].adjusted 
        : baseMarketValue + improvementsTotal;

    // Update market value when adjustments change
    useEffect(() => {
        // This effect runs for all property types, but baseMarketValue calculation
        // and progressive calculations currently only apply directly to Land.
        if (property.property_kind === 'Land') {
            const assessedValue = finalMarketValue * (faasDetail.assessment_level / 100);
            setFaasDetail(prev => ({
                ...prev,
                market_value: finalMarketValue,
                assessed_value: assessedValue
            }));
        }
        // NOTE: For Building/Machinery, this effect should recalculate depreciation
        // based on SMV and details (which is currently handled inside calculateAssessment
        // and needs re-running if dependencies change outside RY/initial load).
        
    }, [finalMarketValue, faasDetail.assessment_level]);

    const addAdjustment = () => {
        const newAdjustment: Adjustment = {
            id: `adj_${Date.now()}`,
            factor_name: '',
            percent_adjustment: 0,
            remarks: ''
        };
        setAdjustments([...adjustments, newAdjustment]);
    };

    const removeAdjustment = (id: string) => {
        setAdjustments(adjustments.filter(adj => adj.id !== id));
    };

    const updateAdjustment = (id: string, field: keyof Adjustment, value: string | number) => {
        setAdjustments(adjustments.map(adj => 
            adj.id === id ? { ...adj, [field]: value } : adj
        ));
    };

    const formatCurrency = (value: number) => {
        if (value === undefined || value === null) return '₱0.00';
        return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getAdjustmentColor = (percent: number) => {
        if (percent > 0) return 'text-emerald-600';
        if (percent < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    // Initialize and fetch all required data
    useEffect(() => {
        if (showDialog) {
            initializeDialog();
        }
    }, [showDialog]);

    useEffect(() => {
        if (newFaas.ry_id && newFaas.ry_id !== 0) {
            initializeDialog();
        }
    }, [newFaas.ry_id]);

    const initializeDialog = async () => {
        setInitializing(true);
        try {
            let smvResponse;
            
            // Fetch SMV based on property kind (using placeholder API)
            if (property.property_kind === 'Land') {
                smvResponse = { data: { data: { unit_value: 5000 } } }; // Mock data
            } else if (property.property_kind === 'Building') {
                smvResponse = { data: { data: { unit_value: 15000 } } };
            } else if (property.property_kind === 'Machinery') {
                smvResponse = { data: { data: { base_value: 500000 } } };
            }

            // Mock revision years
            const ryResponse = { 
                data: [
                    { ry_id: 1, revision_code: 'RY2024', year: 2024, active: 1 },
                    { ry_id: 2, revision_code: 'RY2023', year: 2023, active: 0 }
                ]
            };
            
            const smv = smvResponse?.data?.data;
            setSMVData(smv);
            setRevisionYears(ryResponse.data);
            setPropertyDetails(property);

            // Auto-select first active revision year
            if (newFaas.ry_id === 0) {
                const activeRY = ryResponse.data.find((item: any) => item.active === 1);
                if (activeRY) {
                    setNewFaas(prev => ({
                        ...prev,
                        ry_id: activeRY.ry_id
                    }));
                }
                return;
            }

            // Calculate based on property kind
            calculateAssessment(smv);

        } catch (err) {
            console.error('Error initializing dialog:', err);
            setSubmitError('Failed to load required data. Please try again.');
        } finally {
            setInitializing(false);
        }
    };

    const calculateAssessment = (smv: any) => {
        let marketValue = 0;
        let notes = '';

        // Calculate total improvements first (only for Land)
        const impTotal = property.property_kind === 'Land' 
            ? improvements?.reduce((sum, imp) => sum + Number(imp.base_market_value || 0), 0) || 0
            : 0;
        setImprovementsTotal(impTotal);

        if (property.property_kind === 'Land') {
            const unitValue = Number(smv?.unit_value || 0);
            const area = Number(details.lot_area || 0);
            marketValue = area * unitValue;
            setBaseMarketValue(marketValue);
            
            notes = `${area.toFixed(2)} sqm × ₱${unitValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}/sqm`;
            if (impTotal > 0) {
                notes += ` + Improvements: ₱${impTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            }
            
            // Market value subject to adjustments is Base MV + Improvements Total
            marketValue += impTotal; 
            
        } else if (property.property_kind === 'Building') {
            const unitValue = Number(smv?.unit_value || 0);
            const floorArea = Number(details.floor_area || 0);
            const depreciationRate = Number(details.depreciation_rate || 0);
            const depreciationFactor = 1 - (depreciationRate / 100);
            
            marketValue = floorArea * unitValue * depreciationFactor;
            notes = `${floorArea.toFixed(2)} sqm × ₱${unitValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}/sqm × ${(depreciationFactor * 100).toFixed(2)}% (after ${depreciationRate}% depreciation)`;
            setBaseMarketValue(marketValue); // Use calculated MV as base for non-Land types
            
        } else if (property.property_kind === 'Machinery') {
            const baseValue = Number(smv?.base_value || 0);
            const depreciationRate = Number(details?.smv_depreciation_rate || 0);
            const yearAcquired = Number(details.year_acquired || new Date().getFullYear());
            const currentYear = new Date().getFullYear();
            const yearsUsed = Math.max(0, currentYear - yearAcquired);
            const maxDepreciationRate = 50;
            
            const initialValue = baseValue;
            const totalDepreciation = Math.min(depreciationRate * yearsUsed, maxDepreciationRate);
            const depreciationFactor = 1 - (totalDepreciation / 100);
            
            marketValue = initialValue * depreciationFactor;
            notes = `₱${initialValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} × ${(depreciationFactor * 100).toFixed(2)}% (${yearsUsed} years, ${depreciationRate}% per year, max ${maxDepreciationRate}%)`;
            setBaseMarketValue(marketValue); // Use calculated MV as base for non-Land types
        }

        // Final Market Value after land adjustments
        const finalCalculatedMV = progressiveValues.length > 0 
            ? progressiveValues[progressiveValues.length - 1].adjusted 
            : marketValue; 

        const assessmentLevel = Number(details.assessment_level || 0);
        const assessedValue = finalCalculatedMV * (assessmentLevel / 100);

        setFaasDetail({
            property_kind: property.property_kind,
            market_value: finalCalculatedMV, // Use the final value including adjustments
            assessment_level: assessmentLevel,
            assessed_value: assessedValue,
            notes: notes
        });
    };

    const handleClose = () => {
        if (approve) {
            onSuccess();
        }
        setShowDialog(false);
        setApprove(false);
        setSubmitError(null);
        setInputError('');
        setInitializing(true);
        setAdjustments([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewFaas(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = async () => {
        if (!newFaas.ry_id || !newFaas.effectivity_date) {
            setInputError("Revision Year and Effectivity Date are required!");
            return;
        }

        setInputError("");
        setLoading(true);
        setSubmitError(null);

        try {
            // Mock API call
            console.log('Submitting FAAS:', {
                ...newFaas,
                ...faasDetail,
                adjustments: adjustments
            });
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setApprove(true);
        } catch (err) {
            setSubmitError('Failed to create FAAS.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!showDialog) return null;

    const renderPropertyDetails = () => {
        if (property.property_kind === 'Land') {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Land Classification & Valuation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="col-span-1">
                            <label className="text-xs text-gray-600">Classification</label>
                            <p className="text-gray-900 font-medium">
                                {details?.pc_name || 'N/A'}
                                <span className="text-xs text-gray-500 ml-1">
                                    ({details?.pc_code || ''})
                                </span>
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-600">Sub-Classification</label>
                            <p className="text-gray-900 font-medium">
                                {details?.psc_name || 'N/A'}
                                <span className="text-xs text-gray-500 ml-1">
                                    ({details?.psc_code || ''})
                                </span>
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-600">Actual Use</label>
                            <p className="text-gray-900 font-medium">
                                {details?.au_name || 'N/A'}
                                <span className="text-xs text-gray-500 ml-1">
                                    ({details?.au_code || ''})
                                </span>
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-600">Area (sqm)</label>
                            <p className="text-gray-900 font-bold text-base">
                                {details?.lot_area?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-600">Unit Value (per sqm)</label>
                            <p className="text-gray-900 font-bold text-base">
                                {formatCurrency(smvData?.unit_value || 0)}
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-600">Base Market Value</label>
                            <p className="text-emerald-700 font-bold text-base">
                                {formatCurrency(baseMarketValue)}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        // Other property kind details (Building/Machinery) would go here
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Create New FAAS - {property.arp_no}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {initializing || loading ? (
                        <Loading text={initializing ? "Loading property data and SMVs..." : "Creating FAAS..."} />
                    ) : approve ? (
                        <div className="text-center py-8">
                            <div className="mb-4 text-emerald-600">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                FAAS Created Successfully!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The FAAS has been created and added to the property.
                            </p>
                            <button
                                onClick={handleClose}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {submitError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-600 text-sm">{submitError}</p>
                                </div>
                            )}
                            {inputError && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-yellow-600 text-sm">{inputError}</p>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                
                                {/* 1. Property Info (Read-Only Header) */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        Property Information <span className="text-xs font-normal text-gray-500">(Master List)</span>
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <DetailItem label="ARP No." value={propertyDetails?.arp_no || property.arp_no} className="font-medium" />
                                        <DetailItem label="PIN" value={propertyDetails?.pin || 'N/A'} />
                                        <DetailItem label="Owner" value={propertyDetails?.owner_name || property.owner_name} />
                                        <DetailItem label="Kind" value={propertyDetails?.property_kind || property.property_kind} className="font-medium" />
                                    </div>
                                </div>

                                {/* 2. FAAS Metadata (Editable Inputs) */}
                                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">FAAS Metadata</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Revision Year <span className="text-red-500">*</span></label>
                                            <select
                                                name="ry_id"
                                                value={newFaas.ry_id}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            >
                                                <option value={0}>Select Revision Year</option>
                                                {revisionYears.map(ry => (
                                                    <option key={ry.ry_id} value={ry.ry_id}>
                                                        {ry.revision_code} - {ry.year} {ry.active ? '(Active)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">FAAS Type <span className="text-red-500">*</span></label>
                                            <select
                                                name="faas_type"
                                                value={newFaas.faas_type}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            >
                                                <option value="ORIGINAL">Original</option>
                                                <option value="REVISION">Revision</option>
                                                <option value="TRANSFER">Transfer</option>
                                                <option value="CANCELLATION">Cancellation</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Effectivity Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="effectivity_date"
                                                value={newFaas.effectivity_date}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                                            <textarea
                                                name="remarks"
                                                value={newFaas.remarks}
                                                onChange={handleChange}
                                                rows={2}
                                                placeholder="Additional notes or remarks..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Land Valuation & Adjustments (Land Specific Section) */}
                                {property.property_kind === 'Land' && (
                                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                                        <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Land Valuation & Adjustments</h3>
                                        
                                        {/* Land Base Valuation (Read-Only) */}
                                        {renderPropertyDetails()}

                                        {/* Land Other Improvements (NEW SECTION) */}
                                        <div className="bg-white border border-gray-300 rounded-lg p-4 mt-4">
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <Layers size={16} className="text-blue-500" /> Land Other Improvements
                                                <span className="text-xs font-normal text-gray-500 ml-auto">Total: {formatCurrency(improvementsTotal)}</span>
                                            </h4>
                                            {improvements && improvements.length > 0 ? (
                                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                    <table className="min-w-full text-xs">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase">Improvement</th>
                                                                <th className="px-3 py-2 text-right font-medium text-gray-600 uppercase">Quantity</th>
                                                                <th className="px-3 py-2 text-right font-medium text-gray-600 uppercase">Unit Value</th>
                                                                <th className="px-3 py-2 text-right font-bold text-gray-700 uppercase">Total MV</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {improvements.map((imp) => (
                                                                <tr key={imp.improvement_id} className="border-t hover:bg-green-50 transition-colors">
                                                                    <td className="px-3 py-2 font-medium text-gray-900">{imp.improvement_name}</td>
                                                                    <td className="px-3 py-2 text-right">{imp.quantity.toLocaleString()}</td>
                                                                    <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(imp.unit_value)}</td>
                                                                    <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatCurrency(imp.base_market_value)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-center text-sm text-gray-500 py-3">No other permanent land improvements found.</p>
                                            )}
                                        </div>

                                        {/* Land Progressive Adjustments */}
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 shadow-md mt-4">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-purple-900">Land Adjustments</h3>
                                                    <div className="group relative">
                                                        <Info size={18} className="text-purple-600 cursor-help" />
                                                        <div className="absolute left-0 top-6 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl">
                                                            <p className="mb-2 font-semibold">Progressive Adjustment:</p>
                                                            <p>Each adjustment applies to the running total (Base MV + Improvements + previous adjustments).</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addAdjustment}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold shadow-md hover:shadow-lg text-sm"
                                                >
                                                    <Plus size={18} />
                                                    Add Adjustment
                                                </button>
                                            </div>

                                            {/* Base Value Subject to Adjustments */}
                                            <div className="bg-white border-2 border-purple-200 rounded-lg p-4 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="col-span-2">
                                                        <label className="text-xs font-bold text-purple-700 uppercase">Current Market Value (Base + Improvements)</label>
                                                    </div>
                                                    <div className="col-span-2 text-right">
                                                        <p className="text-xl font-bold text-purple-900">{formatCurrency(baseMarketValue + improvementsTotal)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Adjustments List (Editable) */}
                                            {adjustments.map((adj, index) => {
                                                const values = progressiveValues[index];
                                                const adjustmentAmount = values.adjusted - values.base;
                                                
                                                return (
                                                    <div key={adj.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all mb-3">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-sm font-bold text-purple-700 uppercase">
                                                                Adjustment #{index + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAdjustment(adj.id)}
                                                                className="text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                            {/* Base Value for this step (Read-only) */}
                                                            <div className="col-span-4">
                                                                <label className="text-xs font-medium text-gray-600 uppercase">Value Before Adj.</label>
                                                                <p className="mt-1 px-3 py-2 text-sm font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg">
                                                                    {formatCurrency(values.base)}
                                                                </p>
                                                            </div>

                                                            {/* Factor Name */}
                                                            <div className="col-span-4">
                                                                <label className="text-xs font-medium text-gray-600 uppercase">Factor Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={adj.factor_name}
                                                                    onChange={(e) => updateAdjustment(adj.id, 'factor_name', e.target.value)}
                                                                    placeholder="e.g., Topography"
                                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                                                />
                                                            </div>

                                                            {/* Adjustment % */}
                                                            <div className="col-span-2">
                                                                <label className="text-xs font-medium text-gray-600 uppercase">Adj %</label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={adj.percent_adjustment || 0}
                                                                        onChange={(e) => updateAdjustment(adj.id, 'percent_adjustment', parseFloat(e.target.value) || 0)}
                                                                        placeholder="0.00"
                                                                        className="mt-1 w-full px-3 py-2 pr-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">%</span>
                                                                </div>
                                                            </div>

                                                            {/* Adjusted Value (Read-only) */}
                                                            <div className="col-span-2 text-right">
                                                                <label className="text-xs font-medium text-gray-600 uppercase">Value After Adj.</label>
                                                                <p className={`mt-1 px-3 py-2 text-sm font-bold text-purple-900 bg-purple-100 border border-purple-300 rounded-lg`}>
                                                                    {formatCurrency(values.adjusted)}
                                                                    <span className={`text-xs block mt-0.5 font-semibold ${getAdjustmentColor(adj.percent_adjustment)}`}>
                                                                        ({adj.percent_adjustment > 0 ? '+' : ''}{adj.percent_adjustment.toFixed(2)}%)
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="col-span-12">
                                                                <label className="text-xs font-medium text-gray-600 uppercase">Remarks</label>
                                                                <input
                                                                    type="text"
                                                                    value={adj.remarks}
                                                                    onChange={(e) => updateAdjustment(adj.id, 'remarks', e.target.value)}
                                                                    placeholder="Optional notes for this adjustment..."
                                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Final Market Value */}
                                            <div className="mt-6 bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl p-5 shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="text-sm font-bold text-white uppercase">Final Market Value</label>
                                                        <p className="text-xs text-emerald-200 mt-1">
                                                            Total value before applying assessment level.
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-extrabold text-white">
                                                            {formatCurrency(finalMarketValue)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* 4. Final Assessment Summary (All property types) */}
                                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Final Assessment Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Market Value (Final)</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(faasDetail.market_value).replace('₱', '')}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Level (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={faasDetail.assessment_level.toFixed(2)}
                                                onChange={(e) => handleDetailChange('assessment_level', Number(e.target.value))}
                                                disabled={property.property_kind !== 'Land'} // Allow editing for non-Land types if needed, but Land is dynamic
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Assessed Value</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(faasDetail.assessed_value).replace('₱', '')}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-emerald-50 text-emerald-900 font-bold"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Property Kind</label>
                                            <input
                                                type="text"
                                                value={faasDetail.property_kind}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Notes</label>
                                        <textarea
                                            value={faasDetail.notes}
                                            onChange={(e) => handleDetailChange('notes', e.target.value)}
                                            placeholder="Auto-generated calculation basis..."
                                            rows={2}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && !approve && !initializing && (
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 z-10">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-md"
                        >
                            Create FAAS
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for cleaner detail display
const DetailItem = ({ label, value, className = '', fullWidth = false }) => (
    <div className={`${fullWidth ? 'col-span-full' : 'col-span-1'}`}>
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <p className={`text-gray-900 text-sm ${className}`}>{value || '-'}</p>
    </div>
);




// Mock Interfaces for type safety and clarity
/**
 * Mock data structure for the Property Master List data.
 */

/**
 * Mock data structure for the Active FAAS that will be linked.
 */
interface ActiveFaasData {
    faas_id: number;
    faas_no: string;
    effectivity_date: string;
    market_value: number;
    assessment_level: number;
    assessed_value: number;
    taxable: boolean;
    notes: string;
}

/**
 * Props for the Tax Declaration Dialog component.
 */
interface CreateTDDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faas: any; // Should have faas_id
    onSuccess: () => void;
}

export const CreateTaxDeclarationDialog: React.FC<CreateTDDialogProps> = ({
    showDialog,
    setShowDialog,
    onSuccess,
    property
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(true);
    const [approve, setApprove] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<string>('');

    // Fetched FAAS complete details
    const [faasDetails, setFaasDetails] = useState<any>(null);

    // State for the new Tax Declaration record
    const [newTd, setNewTd] = useState({
        faas_id: 0,
        td_no: '',
        effectivity_date: '',
        owner_name: '',
        owner_address: '',
        property_location: '',
        property_kind: 'LAND' as 'LAND' | 'BUILDING' | 'MACHINERY',
        market_value: 0,
        assessment_level: 0,
        assessed_value: 0,
        taxable: true,
        status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED'
    });

    const initializeDialog = useCallback(async () => {
        if (!showDialog) return;

        setInitializing(true);
        setSubmitError(null);
        setInputError('');

        try {
            const res = await api.get('faas/active', {params: {property_id: property.property_id}});
            const faas_id = res.data.faas_id;
            console.log(faas_id);
            if(faas_id === 0){
                setInputError("No Active FAAS to create a TAX DECLARATION!");
                return
            }
            // Fetch complete FAAS details using the allDetails endpoint
            const response = await api.get('faas/allDetails', { 
                params: { faas_id: faas_id }
            });
            
            const fetchedData = response.data;
            setFaasDetails(fetchedData);

            // Pre-fill tax declaration from FAAS data
            setNewTd({
                faas_id: fetchedData.faas_id,
                td_no: '', // Will be generated by backend
                effectivity_date: fetchedData.effectivity_date.split('T')[0],
                owner_name: fetchedData.owner_name || '',
                owner_address: fetchedData.owner_address || '',
                property_location: `${fetchedData.barangay}, Lot ${fetchedData.lot_no}, Block ${fetchedData.block_no}`,
                property_kind: fetchedData.property_kind || 'LAND',
                market_value: Number(fetchedData.market_value || 0),
                assessment_level: Number(fetchedData.assessment_level || 0),
                assessed_value: Number(fetchedData.assessed_value || 0),
                taxable: fetchedData.taxable !== false,
                status: 'ACTIVE'
            });

        } catch (err) {
            console.error('Error initializing TD dialog:', err);
            setSubmitError('Failed to load FAAS data. Please try again.');
        } finally {
            setInitializing(false);
        }
    }, [showDialog]);

    useEffect(() => {
        if (showDialog) {
            initializeDialog();
        }
    }, [initializeDialog, showDialog]);

    const handleClose = () => {
        if (approve) {
            onSuccess();
        }
        setShowDialog(false);
        setApprove(false);
        setSubmitError(null);
        setInputError('');
        setInitializing(true);
        setNewTd(prev => ({...prev, td_no: ''}));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setNewTd(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!newTd.effectivity_date || !newTd.owner_name || !newTd.owner_address || !newTd.property_location) {
            setInputError("Effectivity Date, Owner Name, Address, and Property Location are required.");
            return;
        }
        
        if (newTd.market_value === 0 || newTd.assessed_value === 0) {
            setInputError("Valuation data is missing from the linked FAAS. Cannot create TD.");
            return;
        }

        setInputError("");
        setLoading(true);
        setSubmitError(null);

        try {
            //temp td generation
            const year = new Date().getFullYear().toString().slice(-2); // e.g., '25'
            const randomPart = Math.floor(1000 + Math.random() * 9000); // 1000-9999
            const response = await api.post('td/create', {...newTd, td_no: `20${year}-${randomPart}`, created_by: "System"});

            // Update state with the newly generated TD number
            if (response.data?.td_no) {
                setNewTd(prev => ({ ...prev, td_no: response.data.td_no }));
            }

            setApprove(true);
        } catch (err: any) {
            setSubmitError(`Failed to create Tax Declaration: ${err.response.data.error || 'Server error'}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!showDialog) return null;

    const formatCurrency = (value: number) => 
        `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Receipt className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Create New Tax Declaration
                            </h2>
                            <p className="text-sm text-gray-500">
                                Linked to FAAS: {faasDetails?.faas_no /*faas?.faas_no*/ || 'Loading...'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {initializing ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Loading FAAS data and property snapshot...</p>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Creating Tax Declaration...</p>
                        </div>
                    ) : approve ? (
                        <div className="text-center py-10">
                            <div className="mb-6 text-emerald-600">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Tax Declaration Created Successfully!
                            </h3>
                            {newTd.td_no && (
                                <p className="text-gray-700 mb-4 text-lg font-mono tracking-wider bg-emerald-100 inline-block px-4 py-2 rounded-lg border border-emerald-300">
                                    TD NO: {newTd.td_no}
                                </p>
                            )}
                            <p className="text-gray-600 mb-8">
                                The Tax Declaration has been finalized and is now linked to FAAS #{faasDetails?.faas_no}.
                            </p>
                            <button
                                onClick={handleClose}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-all font-semibold"
                            >
                                Close & Continue
                            </button>
                        </div>
                    ) : (
                        <>
                            {submitError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-700 text-sm font-medium">{submitError}</p>
                                </div>
                            )}
                            {inputError && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-yellow-700 text-sm font-medium">{inputError}</p>
                                </div>
                            )}

                            <div className="space-y-8">
                                
                                {/* 1. Source FAAS Summary */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Source FAAS & Property Information
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">FAAS No.</label>
                                            <p className="text-blue-900 font-bold text-base">{faasDetails?.faas_no}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">ARP No.</label>
                                            <p className="text-blue-900 font-medium">{faasDetails?.arp_no}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">PIN</label>
                                            <p className="text-blue-900 font-medium">{faasDetails?.pin || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">Property Kind</label>
                                            <p className="text-blue-900 font-medium">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    faasDetails?.property_kind === 'LAND' ? 'bg-green-100 text-green-800' :
                                                    faasDetails?.property_kind === 'BUILDING' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {faasDetails?.property_kind}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">FAAS Type</label>
                                            <p className="text-blue-900 font-medium">{faasDetails?.faas_type}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">Revision Year</label>
                                            <p className="text-blue-900 font-medium">{faasDetails?.year}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-700 font-medium">Taxable Status</label>
                                            <p className={`font-semibold ${faasDetails?.taxable ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {faasDetails?.taxable ? 'TAXABLE' : 'EXEMPT'}
                                            </p>
                                        </div>
                                        {faasDetails?.old_faas && (
                                            <div>
                                                <label className="text-xs text-blue-700 font-medium">Previous FAAS</label>
                                                <p className="text-blue-900 font-medium">{faasDetails.old_faas}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Tax Declaration Details */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                        Tax Declaration Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* Effectivity Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Effectivity Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="effectivity_date"
                                                value={newTd.effectivity_date}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">From FAAS effectivity date</p>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={newTd.status}
                                                onChange={handleChange as any}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </div>

                                        {/* Owner Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Owner Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="owner_name"
                                                value={newTd.owner_name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">From property master list</p>
                                        </div>

                                        {/* Owner Address */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Owner Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="owner_address"
                                                value={newTd.owner_address}
                                                onChange={handleChange}
                                                placeholder="Enter full owner's mailing address..."
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Property Location */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Property Location <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="property_location"
                                                value={newTd.property_location}
                                                onChange={handleChange}
                                                rows={2}
                                                placeholder="e.g., Barangay Name, Lot 1, Block 2, Street Address..."
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Valuation Snapshot */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                        Assessment Valuation Snapshot
                                        <span className="text-xs font-normal text-gray-500 ml-2">(From FAAS)</span>
                                    </h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Property Kind</label>
                                                <p className="text-gray-900 font-semibold bg-white p-2 rounded-lg border text-center">
                                                    {newTd.property_kind}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Level</label>
                                                <p className="text-gray-900 font-semibold bg-white p-2 rounded-lg border text-center">
                                                    {newTd.assessment_level.toFixed(2)}%
                                                </p>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Market Value</label>
                                                <p className="text-blue-800 font-bold text-xl bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
                                                    {formatCurrency(newTd.market_value)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Assessed Value Highlight */}
                                        <div className="mt-6 bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 text-center">
                                            <label className="block text-lg font-medium text-emerald-800 mb-2">
                                                Total Assessed Value
                                            </label>
                                            <p className="text-emerald-900 font-extrabold text-3xl">
                                                {formatCurrency(newTd.assessed_value)}
                                            </p>
                                        </div>

                                        {/* Calculation Notes */}
                                        {faasDetails?.notes && (
                                            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                                                <label className="text-xs text-gray-600 font-medium">Calculation Notes</label>
                                                <p className="text-sm text-gray-700 mt-1">{faasDetails.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && !approve && !initializing && (
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-colors font-semibold flex items-center gap-2"
                            disabled={loading || initializing}
                        >
                            <Receipt size={18} />
                            Generate Tax Declaration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};



// ============= PROPERTY DELETE DIALOG =============
interface PropertyDeleteDialogProps {
    showDeleteDialog: boolean;
    setShowDeleteDialog: (show: boolean) => void;
    approve: boolean;
    setApprove: (approve: boolean) => void;
    submitLoading: boolean;
    submitError: string | null;
    setSubmitError: (error: string | null) => void;
    handleDelete: () => Promise<void>;
    propertyItem: {
        arp_no: string;
        owner_name: string;
        lot_area: number;
    } | null;
}

export const PropertyDeleteDialog: React.FC<PropertyDeleteDialogProps> = ({
    showDeleteDialog,
    setShowDeleteDialog,
    approve,
    setApprove,
    submitLoading,
    submitError,
    setSubmitError,
    handleDelete,
    propertyItem,
}) => {
    const handleClose = () => {
        setShowDeleteDialog(false);
        setApprove(false);
        setSubmitError(null);
    };

    if (!showDeleteDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Delete Property
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {submitLoading ? (
                        <Loading />
                    ) : approve ? (
                        <div className="text-center py-8">
                            <div className="mb-4 text-emerald-600">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Successfully Deleted!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The property has been deleted successfully.
                            </p>
                            <button
                                onClick={handleClose}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {submitError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{submitError}</p>
                                </div>
                            )}

                            <div className="text-center py-4">
                                <div className="mb-4 text-red-600">
                                    <AlertTriangle className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Are you sure?
                                </h3>
                                <p className="text-gray-600 mb-2">
                                    You are about to delete the following property:
                                </p>
                                {propertyItem && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            ARP No: {propertyItem.arp_no}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Owner: {propertyItem.owner_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Lot Area: {propertyItem.lot_area?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sqm
                                        </p>
                                    </div>
                                )}
                                <p className="text-sm text-red-600 font-medium">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!submitLoading && !approve && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};