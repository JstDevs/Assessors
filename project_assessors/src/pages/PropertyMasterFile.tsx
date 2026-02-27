import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, FileText, AlertCircle, Archive, Layers } from 'lucide-react';
import api from '../../axiosBase.ts';
import Loading from '../common/Loading.tsx';

// Renamed and using the unified creation dialog
import { PropertyCreationDialog } from '../dialogs/pml/newDialogs'; 
import { PropertyPreviewDialog } from '../dialogs/pml/previewDialog.tsx';

// --- INTERFACES REQUIRED FOR SUBMISSION PAYLOAD (Copied from PropertyCreationDialog.tsx) ---

type PropertyKind = 'Land' | 'Building' | 'Machinery';
type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'CANCELLED';
type OperationalCondition = 'OPERATIVE' | 'INOPERATIVE';

interface LandImprovement {
    id: number;
    improvement_name: string;
    quantity: number;
    unit_value: number;
    base_market_value: number;
    remarks: string;
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
    au_code: string; // Actual Use
    psc_code: string; // Sub-Classification
    lot_area: number | '';
    remarks: string;
}

interface BuildingSpecificData {
    bk_code: string;
    pc_code: string; 
    au_code: string; 
    floor_area: number | '';
    no_of_storeys: number | '';
    year_constructed: number | '';
    depreciation_rate: number | '';
    additional_adj_factor: number | '';
    remarks: string;
}

interface MachinerySpecificData {
    mt_code: string;
    machine_description: string;
    year_acquired: number | ''; 
    acquisition_cost: number | '';
    estimated_life: number | '';
    depreciation_rate: number | '';
    operational_condition: OperationalCondition;
    remarks: string;
}

type SubmissionPayload = 
    | { kind: 'Land', master: MasterData, land: LandSpecificData, improvements: LandImprovement[] }
    | { kind: 'Building', master: MasterData, building: BuildingSpecificData }
    | { kind: 'Machinery', master: MasterData, machinery: MachinerySpecificData };

interface Property {
    property_id: number;
    arp_no: string;
    pin: string | null;
    owner_name: string;
    owner_address: string | null;
    owner_id: number | null;
    lg_code: string;
    barangay: string | null;
    lot_no: string | null;
    block_no: string | null;
    property_kind: PropertyKind;
    description: string | null;
    status: PropertyStatus;
    created_date: string;
    updated_date: string;
    active_faas?: string | null;
    original?: number;
}

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
    property_kind: PropertyKind;
    description: string;
    status: PropertyStatus;
}

const PropertyMasterFile: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterPropertyKind, setFilterPropertyKind] = useState<string>('ALL');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [refresh, setRefresh] = useState<boolean>(false);

    // Dialog states
    const [showCreationDialog, setShowCreationDialog] = useState<boolean>(false); 
    const [editMode, setEditMode] = useState<boolean>(false);
    
    const [previewModal, setPreviewModal] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(0);

    // State used for EDIT/VIEW/DELETE operations (Kept for continuity)
    const [newProperty, setNewProperty] = useState<PropertyFormData>({
        arp_no: '', pin: '', owner_name: '', owner_address: '', owner_id: null, lg_code: '',
        barangay: '', lot_no: '', block_no: '', property_kind: 'Land', description: '', status: 'ACTIVE',
    });

    // Fetch properties
    async function getProperties() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('pml/list');
            setProperties(res.data.data);
            // console.log(res.data.data);
        } catch (err) {
            setError('Error fetching Property Master List!');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getProperties();
    }, [refresh]);

    // Search and filter
    const filteredProperties: Property[] = properties.filter(item => {
        const matchesSearch = 
            item.arp_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.pin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lg_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.barangay?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
        const matchesKind = filterPropertyKind === 'ALL' || item.property_kind === filterPropertyKind;
        return matchesSearch && matchesStatus && matchesKind;
    });
    

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setFilterStatus(e.target.value);
    };

    const handleKindFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setFilterPropertyKind(e.target.value);
    };

    // CRUD handlers
    const handleAddNew = (): void => {
        setShowCreationDialog(true);
        setEditMode(false);
    };

    const handleEdit = async (property_id: number): Promise<void> => {
        setEditMode(true);
        setSelectedPropertyId(property_id);
        setShowCreationDialog(true);
    };
    const [hasFaas, setHasFaas] = useState(false);

    const handleView = async (property_id: number, faas_id: number): Promise<void> => {
        setPreviewModal(true);
        setSelectedPropertyId(property_id);
        setHasFaas(!!faas_id); // simplified truthy check
    };

    const handleDelete = (property: Property): void => {
        setNewProperty(property);
    };

    // KEEPING this handler for the legacy PropertyModifyDialog
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewProperty(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    // REFACTORED: Now accepts the SubmissionPayload from the PropertyCreationDialog
    const handleSubmit = async (payload: SubmissionPayload) => {
        // Placeholder for submit logic
    };

    const getStatusBadgeStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'INACTIVE':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'TRANSFERRED':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPropertyKindIcon = (kind: string) => {
        switch (kind) {
            case 'Land':
                return <Layers size={14} className="mr-1.5" />;
            case 'Building':
                return <FileText size={14} className="mr-1.5" />;
            case 'Machinery':
                return <Archive size={14} className="mr-1.5" />;
            default:
                return <FileText size={14} className="mr-1.5" />;
        }
    };
    
    const getPropertyKindStyles = (kind: string) => {
        switch (kind) {
            case 'Land':
                return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'Building':
                return 'bg-violet-50 text-violet-700 border-violet-100';
            case 'Machinery':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 w-full">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Property Master List
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage and view all real property records in the system</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 hover:shadow-md active:scale-95 transition-all duration-200 gap-2"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>New Property</span>
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
                    
                    {/* Toolbar / Filters */}
                    <div className="p-5 border-b border-slate-100 bg-white space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 shrink-0">
                        
                        {/* Search */}
                        <div className="relative flex-1 max-w-lg group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 sm:text-sm"
                                placeholder="Search by ARP, PIN, Owner, or Location..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <select
                                    value={filterStatus}
                                    onChange={handleStatusFilterChange}
                                    className="pl-9 pr-8 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:bg-white hover:border-slate-300 transition-all min-w-[150px]"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="TRANSFERRED">Transferred</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div className="relative group">
                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <select
                                    value={filterPropertyKind}
                                    onChange={handleKindFilterChange}
                                    className="pl-9 pr-8 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:bg-white hover:border-slate-300 transition-all min-w-[150px]"
                                >
                                    <option value="ALL">All Types</option>
                                    <option value="Land">Land</option>
                                    <option value="Building">Building</option>
                                    <option value="Machinery">Machinery</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <Loading />
                                <span className="mt-2 text-sm font-medium">Loading records...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50/50">
                                <AlertCircle size={32} className="mb-2 opacity-80" />
                                <p className="font-medium">{error}</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left relative">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 whitespace-nowrap w-[140px] bg-slate-50">ARP No.</th>
                                        <th className="px-6 py-3 whitespace-nowrap w-[140px] bg-slate-50">PIN</th>
                                        <th className="px-6 py-3 whitespace-nowrap bg-slate-50">Owner Name</th>
                                        <th className="px-6 py-3 whitespace-nowrap bg-slate-50">Location</th>
                                        <th className="px-6 py-3 whitespace-nowrap bg-slate-50">Barangay</th>
                                        <th className="px-6 py-3 text-center whitespace-nowrap bg-slate-50">Kind</th>
                                        <th className="px-6 py-3 text-center whitespace-nowrap bg-slate-50">Status</th>
                                        <th className="px-6 py-3 text-center whitespace-nowrap bg-slate-50">Active FAAS</th>
                                        <th className="px-6 py-3 text-right whitespace-nowrap bg-slate-50">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredProperties.length > 0 ? (
                                        filteredProperties.map((property) => (
                                            <tr key={property.property_id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-slate-600 text-xs whitespace-nowrap">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{property.arp_no}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-600 text-xs whitespace-nowrap">
                                                    {property.pin ? <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{property.pin}</span> : <span className="text-slate-300 italic">-</span>}
                                                </td>
                                                <td className="px-6 py-4 max-w-[220px]">
                                                    <div className="font-medium text-slate-900 truncate" title={property.owner_name}>{property.owner_name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 max-w-[180px]">
                                                    <div className="truncate" title={property.lg_code}>{property.lg_code}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 max-w-[150px]">
                                                    <div className="truncate" title={property.barangay || ''}>{property.barangay || <span className="text-slate-300 italic">-</span>}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPropertyKindStyles(property.property_kind)}`}>
                                                        {getPropertyKindIcon(property.property_kind)}
                                                        {property.property_kind}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyles(property.status)}`}>
                                                        {property.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    {property.original || property.active_faas ? (
                                                        <>
                                                            {property.active_faas? <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                                                        {property.active_faas}
                                                                                    </span>:
                                                                                    <span className="font-mono text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                                                                        No Active Faas
                                                                                    </span>
                                                            }
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                            No Original FAAS
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleView(property.property_id, property.original || 0)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        {/* Future Actions placeholders */}
                                                        {!(property.original || property.active_faas) && 
                                                        <button 
                                                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Property"
                                                            onClick={() => handleEdit(property.property_id)}
                                                            >
                                                            <Edit size={18} />
                                                        </button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Search size={48} className="mb-4 opacity-20" />
                                                    <p className="text-lg font-medium text-slate-500">No properties found</p>
                                                    <p className="text-sm">Try adjusting your search or filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {/* Footer / Pagination Placeholder */}
                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
                        <span>Showing {filteredProperties.length} records</span>
                        {/* Pagination controls would go here */}
                    </div>

                </div>
            </div>
            
            {/* Dialogs */}
            <PropertyCreationDialog
                showDialog={showCreationDialog}
                setShowDialog={setShowCreationDialog}
                setRefresh={setRefresh}
                editMode={editMode}
                selectedPropertyId={selectedPropertyId}
            />
            
            <PropertyPreviewDialog 
                showDialog={previewModal} 
                setShowDialog={setPreviewModal} 
                propertyId={selectedPropertyId}
                hasOriginal={hasFaas}
                setRefresh={setRefresh}
            />
        </div>
    );
};

export default PropertyMasterFile;