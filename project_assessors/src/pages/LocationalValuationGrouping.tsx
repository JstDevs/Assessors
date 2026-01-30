import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, MapPin, ChevronRight } from 'lucide-react';
import api from '../../axiosBase.js';
import Loading from '../common/Loading.js';
import type { LocationalGroup } from '../structures/Location.js';
import { DeleteLocationalDialog, ModifyLocationDialog } from '../dialogs/lvg/Dialogs.js';

interface Barangay {
    barangay_id: number;
    lg_code: string;
    barangay_name: string;
    short_name: string | null;
    created_by: string | null;
    created_date: string;
}

const LocationalValuationGroup: React.FC = () => {
    const [locationalGroups, setLocationalGroups] = useState<LocationalGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Barangay states
    const [barangays, setBarangays] = useState<Map<number, Barangay[]>>(new Map());
    const [loadingBarangays, setLoadingBarangays] = useState<Set<number>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
    const [showBarangayDialog, setShowBarangayDialog] = useState<boolean>(false);
    const [editBarangay, setEditBarangay] = useState<boolean>(false);
    const [deleteBarangayDialog, setDeleteBarangayDialog] = useState<boolean>(false);
    const [currentLgId, setCurrentLgId] = useState<number>(0);

    // Barangay form state
    const [newBarangay, setNewBarangay] = useState<Barangay>({
        barangay_id: 0,
        lg_code: '',
        barangay_name: '',
        short_name: '',
        created_by: null,
        created_date: ''
    });

    // Existing locational group states
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>('');
    const [edit, setEdit] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const [approve, setApprove] = useState(false);
    const [newLocational, setNewLocational] = useState<LocationalGroup>({
        lg_id: 0,
        ry_id: 0,
        code: "",
        name: "",
        description: "",
        active: false,
        zone_type: "PRIME"
    });
    const [openDel, setOpenDel] = useState(false);
    const [selected, setSelected] = useState<{id:number; name:string;}>({id:-1, name: ""});

    // Fetch locational groups
    async function getLocationalGroups() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('lvg/list');
            setLocationalGroups(res.data.data);
            setLoading(false);
        } catch (err) {
            setError('Error in fetching Locational Groups!');
            console.log(err);
        }
    }

    useEffect(() => {
        getLocationalGroups();
    }, [refresh]);

    // Fetch barangays for a specific locational group
    const fetchBarangays = async (lgId: number, lgCode: string) => {
        if (loadingBarangays.has(lgId)) return;
        
        setLoadingBarangays(prev => new Set(prev).add(lgId));
        
        try {
            const res = await api.get(`lvg/barangayList`, { params: { lg_id: lgId }});
            const barangayList = res.data || [];
            
            setBarangays(prev => {
                const newMap = new Map(prev);
                newMap.set(lgId, barangayList);
                return newMap;
            });
        } catch (err) {
            console.error(`Failed to fetch barangays for LG ${lgId}:`, err);
        } finally {
            setLoadingBarangays(prev => {
                const newSet = new Set(prev);
                newSet.delete(lgId);
                return newSet;
            });
        }
    };

    // Toggle expand/collapse for locational group
    const toggleExpand = (lgId: number, lgCode: string) => {
        const newExpanded = new Set(expandedGroups);
        
        if (newExpanded.has(lgId)) {
            newExpanded.delete(lgId);
        } else {
            newExpanded.add(lgId);
            // Fetch barangays if not already fetched
            if (!barangays.has(lgId)) {
                fetchBarangays(lgId, lgCode);
            }
        }
        
        setExpandedGroups(newExpanded);
    };

    // Barangay CRUD handlers
    const handleAddBarangay = (lgId: number, lgCode: string) => {
        setCurrentLgId(lgId);
        setNewBarangay({
            barangay_id: 0,
            lg_code: lgCode,
            barangay_name: '',
            short_name: '',
            created_by: null,
            created_date: ''
        });
        setEditBarangay(false);
        setShowBarangayDialog(true);
    };

    const handleEditBarangay = (barangay: Barangay, lgId: number) => {
        setCurrentLgId(lgId);
        setNewBarangay(barangay);
        setEditBarangay(true);
        setShowBarangayDialog(true);
    };

    const handleDeleteBarangay = (barangay: Barangay, lgId: number) => {
        setCurrentLgId(lgId);
        setSelectedBarangay(barangay);
        setDeleteBarangayDialog(true);
    };

    const handleBarangayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewBarangay(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBarangaySubmit = async () => {
        setSubmitLoading(true);
        setSubmitError(null);

        try {
            if (editBarangay) {
                await api.put('barangay/update', {
                    barangay_id: newBarangay.barangay_id,
                    barangay_name: newBarangay.barangay_name,
                    short_name: newBarangay.short_name
                });
            } else {
                await api.post('lvg/barangay', {
                    lg_id: currentLgId,
                    barangay_name: newBarangay.barangay_name,
                    short_name: newBarangay.short_name
                });
            }
            
            // Refresh barangays for this LG
            const group = locationalGroups.find(g => g.lg_id === currentLgId);
            if (group) {
                await fetchBarangays(currentLgId, group.code);
            }
            
            setShowBarangayDialog(false);
            setSubmitLoading(false);
        } catch (err) {
            setSubmitError(`Error ${editBarangay ? 'updating' : 'creating'} barangay! [${err.response.data.error}]`);
            setSubmitLoading(false);
            console.error(err);
        }
    };

    const handleBarangayDelete = async () => {
        setSubmitLoading(true);
        setSubmitError(null);
        console.log(selectedBarangay?.barangay_id);
        try {
            await api.put(`lvg/barangay`, {barangay_id: selectedBarangay?.barangay_id});
            
            // Refresh barangays for this LG
            const group = locationalGroups.find(g => g.lg_id === currentLgId);
            if (group) {
                await fetchBarangays(currentLgId, group.code);
            }
            
            setDeleteBarangayDialog(false);
            setSubmitLoading(false);
        } catch (err) {
            setSubmitError('Error deleting barangay!');
            setSubmitLoading(false);
            console.error(err);
        }
    };

    // Search functionality
    const filteredGroups: LocationalGroup[] = locationalGroups.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.zone_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    // Locational Group CRUD handlers
    const handleAddNew = (): void => {
        setEdit(false);
        setOpenAdd(true);
    };

    const handleEdit = async (lg_id: number): Promise<void> => {
        const fetchRow = await api.get('/lvg/get', {
            params: { lg_id }
        });
        setSelected({id: lg_id, name:""});
        setNewLocational(fetchRow.data.data)
        setEdit(true);
        setOpenAdd(true);
    };

    const handleDelete = async (group: LocationalGroup): Promise<void> => {
        setOpenDel(true);
        setSelected({id:group.lg_id, name: group.name});
    };

    const getZoneBadgeColor = (zoneType: string): string => {
        switch (zoneType) {
            case 'PRIME':
                return 'bg-purple-100 text-purple-800';
            case 'STANDARD':
                return 'bg-blue-100 text-blue-800';
            case 'SUBURBAN':
                return 'bg-yellow-100 text-yellow-800';
            case 'RURAL':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const clear = () => {
        setNewLocational({
            lg_id: 0,
            ry_id: 0,
            code: "",
            name: "",
            description: "",
            active: false,
            zone_type: "PRIME"
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>)=>{
        const { name, value, type } = e.target;
        setNewLocational(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);

        if(edit){
            try{
                await api.put('/lvg/update', {
                    lg_id: selected.id,
                    code: newLocational.code,
                    name: newLocational.name,
                    description: newLocational.description,
                    zone_type: newLocational.zone_type
                });
                setApprove(true);
                setSubmitLoading(false);
            }catch(err){
                setSubmitError("Error in Updating Locational Valuation Group!");
                setSubmitLoading(false);
                console.log(err);
            }
        }else{
            try{
                await api.post('/lvg/add', {
                    code: newLocational.code,
                    name: newLocational.name,
                    description: newLocational.description,
                    zone_type: newLocational.zone_type
                });
                setApprove(true);
                setSubmitLoading(false);
            }catch(err){
                setSubmitError("Error Creating New Locational Valuation Group!");
                setSubmitLoading(false);
                console.log(err);
            }
        }
    }

    const handleDeleteRow = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);

        try{
            await api.delete('/lvg/delete', {
                params: {
                    lg_id: selected.id
                }
            });
            setApprove(true);
            setSubmitLoading(false);
        }catch(err){
            setSubmitError("Error in Deleting Locational Valuation Group!");
            setSubmitLoading(false);
            console.log(err);
        }
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Locational Valuation Groups</h1>
                <p className="text-gray-600">Manage locational groups, zone classifications, and barangays</p>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    {error ? (
                        <p className="text-red-600 text-center">{error}</p>
                    ) : loading ? (
                        <Loading />
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Locational Groups ({filteredGroups.length})
                                </h2>
                                <button
                                    onClick={handleAddNew}
                                    className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Add New
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, code, or zone type..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </>
                    )}
                </div>

                {loading ? (
                    <></>
                ) : (
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredGroups.map((group) => {
                                    const isExpanded = expandedGroups.has(group.lg_id);
                                    const groupBarangays = barangays.get(group.lg_id) || [];
                                    const isLoadingBrgy = loadingBarangays.has(group.lg_id);

                                    return (
                                        <React.Fragment key={group.lg_id}>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => toggleExpand(group.lg_id, group.code)}
                                                        className="text-gray-500 hover:text-gray-700 transition-transform"
                                                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{group.lg_id}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{group.code}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{group.name}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getZoneBadgeColor(group.zone_type)}`}>
                                                        {group.zone_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{group.description || '-'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        group.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {group.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(group.lg_id)}
                                                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                        >
                                                            <Edit size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(group)}
                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Barangays Section */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="bg-blue-50 p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                                                <MapPin size={16} />
                                                                Barangays ({groupBarangays.length})
                                                            </h3>
                                                            <button
                                                                onClick={() => handleAddBarangay(group.lg_id, group.code)}
                                                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                                            >
                                                                <Plus size={16} />
                                                                Add Barangay
                                                            </button>
                                                        </div>

                                                        {isLoadingBrgy ? (
                                                            <div className="text-center py-4">
                                                                <Loading />
                                                            </div>
                                                        ) : groupBarangays.length === 0 ? (
                                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                                No barangays found for this locational group
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {groupBarangays.map((barangay) => (
                                                                    <div
                                                                        key={barangay.barangay_id}
                                                                        className="bg-white border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                                                    >
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div className="flex-1">
                                                                                <p className="font-semibold text-gray-900">{barangay.barangay_name}</p>
                                                                                {barangay.short_name && (
                                                                                    <p className="text-xs text-gray-500">({barangay.short_name})</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => handleEditBarangay(barangay, group.lg_id)}
                                                                                    className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                                                                >
                                                                                    <Edit size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteBarangay(barangay, group.lg_id)}
                                                                                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500">ID: {barangay.barangay_id}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {filteredGroups.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            No locational groups found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Existing Dialogs */}
            <ModifyLocationDialog
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                newLocational={newLocational}
                setNewLocational={setNewLocational}
                approve={approve}
                edit={edit}
                openAdd={openAdd}
                setApprove={setApprove}
                setOpenAdd={setOpenAdd}
                setRefresh={setRefresh}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            <DeleteLocationalDialog
                approve={approve}
                handleDelete={handleDeleteRow}
                name={selected.name}
                openDel={openDel}
                setApprove={setApprove}
                setNewLocational={setNewLocational}
                setOpenDel={setOpenDel}
                setRefresh={setRefresh}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                submitError={submitError}
                submitLoading={submitLoading}
            />

            {/* Barangay Dialog - Add/Edit */}
            {showBarangayDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editBarangay ? 'Edit' : 'Add'} Barangay
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Barangay Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="barangay_name"
                                        value={newBarangay.barangay_name}
                                        onChange={handleBarangayChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter barangay name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Short Name
                                    </label>
                                    <input
                                        type="text"
                                        name="short_name"
                                        value={newBarangay.short_name || ''}
                                        onChange={handleBarangayChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional abbreviation"
                                    />
                                </div>
                            </div>
                            {submitError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {submitError}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {setShowBarangayDialog(false); setSubmitError(null)}}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBarangaySubmit}
                                disabled={submitLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {submitLoading ? 'Saving...' : editBarangay ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barangay Delete Dialog */}
            {deleteBarangayDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Barangay</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700">
                                Are you sure you want to delete <strong>{selectedBarangay?.barangay_name}</strong>?
                                This action cannot be undone.
                            </p>
                            {submitError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {submitError}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteBarangayDialog(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBarangayDelete}
                                disabled={submitLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {submitLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationalValuationGroup;