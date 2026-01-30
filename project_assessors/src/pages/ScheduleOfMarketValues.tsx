import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../axiosBase';
import Loading from '../common/Loading';
import type { SMVLand, SMVLandFormData } from '../structures/Smv.tsx';
import { SMVLandAddDialog, SMVLandDeleteDialog } from '../dialogs/smv/Dialogs.tsx';

const ScheduleOfMarketValues: React.FC = () => {
    // Land states
    const [lgSelected, setLgSelected] = useState(-1);
    const [refreshLand, setRefreshLand] = useState(false);
    const [SMVLandList, setSMVLandList] = useState<SMVLand[]>([]);
    const [loadingLand, setLoadingLand] = useState(true);
    const [errorLand, setErrorLand] = useState<string>('');
    const [miniLoading, setMiniLoading] = useState(true);
    const [inputError, setInputError] = useState<string>('');
    
    const [showSMVLandDialog, setShowSMVLandDialog] = useState(false);
    const [showSMVLandDelDialog, setShowSMVLandDelDialog] = useState(false);
    const [editLandSMV, setEditLandSMV] = useState(false);
    const [approveLandSMV, setApproveLandSMV] = useState(false);
    const [submitLoadingLand, setSubmitLoadingLand] = useState(false);
    const [submitErrorLand, setSubmitErrorLand] = useState<string | null>(null);

    const [newSMVLand, setNewSMVLand] = useState<SMVLandFormData>({
        smv_land_id: -1,
        ry_id: 0,
        lg_id: 0,
        psc_id: 0,
        unit_value: 0,
        effective_date: new Date().toISOString().split('T')[0],
        ordinance_no: '',
        approved_by: '',
        remarks: '',
    });
//     [mysqld]
// max_allowed_packet = 512M
// wait_timeout = 600
// net_read_timeout = 300
// innodb_buffer_pool_size = 512M


    // Reference data
    const [locationalGroups, setLocationalGroups] = useState([]);
    const [propertySubclasses, setPropertySubclasses] = useState([]);

    // Search terms
    const [searchLand, setSearchLand] = useState('');
    // Fetch functions
    async function getSMV_Land() {
        setLoadingLand(true);
        setErrorLand('');
        try {
            const result = await api.get('smv/landList');
            setSMVLandList(result.data.data);
        } catch (err) {
            setErrorLand('Error fetching Land SMV records!');
            console.error(err);
        } finally {
            setLoadingLand(false);
        }
    }

    async function getOptions() {
        try {
            const lg = await api.get('smv/lgList');
            setLocationalGroups(lg.data.data);
        } catch (err) {
            console.error('Failed to load available options', err);
        }
    }

    async function getscOptions() {
        setMiniLoading(true);
        try {
            const sc = await api.get('smv/scList', { params: { lg_id: lgSelected } });
            setPropertySubclasses(sc.data.data);
        } catch (err) {
            console.error(err);
        }
        setMiniLoading(false);
    }

    useEffect(() => {
        getOptions();
    }, [refreshLand]);

    useEffect(() => {
        getscOptions();
    }, [lgSelected, refreshLand]);

    useEffect(() => {
        getSMV_Land();
    }, [refreshLand]);

    // Handlers
    const handleLandChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewSMVLand((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleLandSubmit = async () => {
        if (newSMVLand.lg_id <= 0 || newSMVLand.psc_id <= 0 || newSMVLand.unit_value <= 0) {
            setInputError("Fill all required fields!");
            return;
        }
        setInputError("");
        setSubmitLoadingLand(true);
        setSubmitErrorLand(null);
        try {
            if (editLandSMV) {
                const res = await api.put('smv/setLand', { 
                    smv_land_id: newSMVLand.smv_land_id,
                    unit_value: newSMVLand.unit_value,
                    effective_date: newSMVLand.effective_date,
                    ordinance_no: newSMVLand.ordinance_no,
                    approved_by: newSMVLand.approved_by,
                    remarks: newSMVLand.remarks
                });
                // console.log(res.data);
            } else {
                const res = await api.post('smv/addland', newSMVLand);
                console.log(res.data);
            }
            setApproveLandSMV(true);
            setRefreshLand(prev => !prev);
        } catch (err) {
            setSubmitErrorLand('Failed to save Land SMV.');
        } finally {
            setSubmitLoadingLand(false);
            setLgSelected(-1);
        }
        

    };
    const handleLandDelete = async () => {
        setSubmitLoadingLand(true);
        setSubmitErrorLand(null);
        setApproveLandSMV(false);
        try{
            await api.delete('smv/deleteLand', { params: { smv_land_id: newSMVLand.smv_land_id } });
            setApproveLandSMV(true);
            setSubmitLoadingLand(false);
        }catch(err){
            console.error(err);
            setSubmitErrorLand("Error in deleting this SMV!");
        }
    }

    // Filter functions
    const filteredLand = SMVLandList.filter(item =>
        item.location?.toLowerCase().includes(searchLand.toLowerCase()) ||
        item.subclass?.toLowerCase().includes(searchLand.toLowerCase())
    );

    // Action handlers
    const handleAdd = () => {
        setNewSMVLand({
            ry_id: 0,
            lg_id: -1,
            psc_id: -1,
            unit_value: 0,
            effective_date: new Date().toISOString().split('T')[0],
            ordinance_no: '',
            approved_by: '',
            remarks: '',
        });
        setEditLandSMV(false);
        setShowSMVLandDialog(true);
    };

    const handleEdit = async (id: number) => {
        setSubmitLoadingLand(true);
        const result = await api.get('smv/getLand', { params: { smv_land_id: id } });
        const data = result.data.data;
        setNewSMVLand({
            smv_land_id: data.smv_land_id, 
            ry_id: data.ry_id,
            lg_id: data.lg_id,
            psc_id: data.psc_id,
            unit_value: data.unit_value,
            effective_date: data.effective_date,
            ordinance_no: data.ordinance_no ?? '',
            approved_by: data.approved_by ?? '',
            remarks: data.remarks ?? '',
        });
        setEditLandSMV(true);
        setShowSMVLandDialog(true);
        setSubmitLoadingLand(false);
    };

    const handleDelete = (id: number) => {
        setShowSMVLandDelDialog(true);
        setNewSMVLand(prev=>({...prev, smv_land_id: id}));
    };

    return (
        <div className="p-6 bg-gray-50 w-full min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule of Market Values</h1>
                <p className="text-gray-600">Manage market value schedules for property classifications</p>
            </div>

            <div className="space-y-6">
                {/* Land SMV */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        {errorLand ? (
                            <p className="text-red-600 text-center">{errorLand}</p>
                        ) : loadingLand ? (
                            <Loading />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Land Market Values ({filteredLand.length})
                                    </h2>
                                    <button
                                        onClick={handleAdd}
                                        className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Add New
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by location or subclass..."
                                        value={searchLand}
                                        onChange={(e) => setSearchLand(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {loadingLand ? (
                        <></>
                    ) : (
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                    </tr>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locational Group</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subclassification</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Value</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordinance No.</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLand.map((item) => (
                                        <tr key={item.smv_land_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{item.location}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{item.subclass}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(item.unit_value)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(item.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{item.ordinance_no || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{item.approved_by || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item.smv_land_id)}
                                                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.smv_land_id)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLand.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                                No land market value schedules found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <SMVLandAddDialog
                showSMVLandDialog={showSMVLandDialog}
                setShowSMVLandDialog={setShowSMVLandDialog}
                edit={editLandSMV}
                approve={approveLandSMV}
                setNewSMVLand={setNewSMVLand}
                setSubmitLoading={setSubmitLoadingLand}
                setApprove={setApproveLandSMV}
                setSubmitError={setSubmitErrorLand}
                setRefresh={setRefreshLand}
                submitError={submitErrorLand}
                submitLoading={submitLoadingLand}
                handleChange={handleLandChange}
                handleSubmit={handleLandSubmit}
                newSMVLand={newSMVLand}
                locationalGroups={locationalGroups}
                propertySubclasses={propertySubclasses}
                setLgSelected={setLgSelected}
                loading={miniLoading}
                inputError={inputError}
                setInputError={setInputError}
            />
            <SMVLandDeleteDialog
                approve={approveLandSMV}
                handleDelete={handleLandDelete}
                newSMVLand={newSMVLand}
                setApprove={setApproveLandSMV}
                setNewSMVLand={setNewSMVLand}
                setRefreshSelected={setRefreshLand}
                setShowDelAU={setShowSMVLandDelDialog}
                setSubmitError={setSubmitErrorLand}
                setSubmitLoading={setSubmitLoadingLand}
                showDelAU={showSMVLandDelDialog}
                submitError={submitErrorLand}
                submitLoading={submitLoadingLand}
                />
        </div>
    );
};

export default ScheduleOfMarketValues;