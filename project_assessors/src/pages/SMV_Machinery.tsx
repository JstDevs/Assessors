import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../axiosBase';
import Loading from '../common/Loading';
import { formatCurrency, formatDate } from '../common/Tools';
import { SMVMachineryDeleteDialog, SMVMachineryModifyDialog } from '../dialogs/smv/Dialogs';

interface SMVMachinery {
    smv_machinery_id: number;
    ry_id: number;
    mt_id: number;
    machinery_type: string;
    unit_value: number;
    depreciation_rate: number;
    effective_date: string;
    ordinance_no: string | null;
    approved_by: string | null;
    remarks: string | null;
    mt_name: string;
}

interface MachineryType {
    mt_id: number;
    code: string;
    name: string;
    description: string | null;
}

interface SMVMachineryFormData {
    smv_machinery_id?: number;
    ry_id: number;
    mt_id: number;
    unit_value: number;
    depreciation_rate: number;
    effective_date: string;
    ordinance_no: string;
    approved_by: string;
    remarks: string;
    mt_name: string;
}

const SMVMachineryManagement: React.FC = () => {
    const [SMVMachineryList, setSMVMachineryList] = useState<SMVMachinery[]>([]);
    const [machineryTypes, setMachineryTypes] = useState<MachineryType[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [refresh, setRefresh] = useState<boolean>(false);

    // Dialog states
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [showDelDialog, setShowDelDialog] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [approve, setApprove] = useState<boolean>(false);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<string>('');
    const [miniLoading, setMiniLoading] = useState<boolean>(false);

    const [newSMVMachinery, setNewSMVMachinery] = useState<SMVMachineryFormData>({
        smv_machinery_id: -1,
        ry_id: 0,
        mt_id: -1,
        unit_value: 0,
        depreciation_rate: 0,
        effective_date: new Date().toISOString().split('T')[0],
        ordinance_no: '',
        approved_by: '',
        remarks: '',
        mt_name: ''
    });

    // Fetch functions
    async function getSMVMachinery() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('smv/machineryList');
            setSMVMachineryList(res.data.data);
            setLoading(false);
        } catch (err) {
            setError('Error in fetching Machinery SMV records!');
            console.log(err);
            setLoading(false);
        }
    }

    async function getMachineryTypes() {
        setMiniLoading(true);
        try {
            const res = await api.get('smv/mtList');
            setMachineryTypes(res.data.data);
        } catch (err) {
            console.error('Failed to load machinery types', err);
        }
        setMiniLoading(false);
    }

    useEffect(() => {
        getSMVMachinery();
        getMachineryTypes();
    }, [refresh]);

    // Search functionality
    // this has an issue, it doesn't show all rows if the oridnance number is empty, need to fix this
    const filteredMachinery: SMVMachinery[] = SMVMachineryList.filter(item => 
        item.machinery_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ordinance_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.approved_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    // CRUD handlers
    const handleAddNew = (): void => {
        setNewSMVMachinery({
            ry_id: 0,
            mt_id: -1,
            unit_value: 0,
            depreciation_rate: 0,
            effective_date: new Date().toISOString().split('T')[0],
            ordinance_no: '',
            approved_by: '',
            remarks: '',
            mt_name: ''
        });
        setEditMode(false);
        setShowDialog(true);
    };

    const handleEdit = async (smv_machinery_id: number): Promise<void> => {
        setEditMode(true);
        setSubmitLoading(true);
        setShowDialog(true);
        try {
            const res = await api.get('smv/getMachinery', { params: { smv_machinery_id } });
            const data = res.data.data;
            setNewSMVMachinery({
                smv_machinery_id: data.smv_machinery_id,
                ry_id: data.ry_id,
                mt_id: data.mt_id,
                unit_value: data.unit_value,
                depreciation_rate: data.depreciation_rate,
                effective_date: data.effective_date,
                ordinance_no: data.ordinance_no || '',
                approved_by: data.approved_by || '',
                remarks: data.remarks || '',
                mt_name: data.mt_name
            });
        } catch (err) {
            console.error('Failed to fetch machinery SMV', err);
        }
        setSubmitLoading(false);
    };


    const handleDeletedSubmit = async ()=>{
        setApprove(false);
        setSubmitError(null);
        setSubmitLoading(true);
        try{
            const id = newSMVMachinery.smv_machinery_id;
            await api.delete('smv/deleteMachinery', { params: { smv_machinery_id: id }});
            setApprove(true);
            setSubmitLoading(false);
        }catch(err){
            console.error(err);
            setSubmitError("Error in deleting machinery smv");
        }
    }

    const handleDelete = async (machinery: SMVMachinery): Promise<void> => {
        setNewSMVMachinery(prev=>({...prev,
            smv_machinery_id: machinery.smv_machinery_id,
            machinery_type: machinery.mt_name,
            unit_value: machinery.unit_value,
            depreciation_rate: machinery.depreciation_rate
         }));
        setShowDelDialog(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewSMVMachinery(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = async () => {
        if (newSMVMachinery.mt_id <= 0 || newSMVMachinery.unit_value <= 0 || newSMVMachinery.depreciation_rate <= 0) {
            setInputError("Fill all required fields!");
            return;
        }
        setInputError("");
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            if (editMode) {
                await api.put('smv/setMachinery', newSMVMachinery);
            } else {
                await api.post('smv/addMachinery', newSMVMachinery);
            }
            setApprove(true);
            setRefresh(prev => !prev);
        } catch (err) {
            setSubmitError('Failed to save Machinery SMV.');
            console.error(err);
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Machinery Market Values</h1>
                <p className="text-gray-600">Manage market value schedules for machinery types</p>
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
                                    Machinery Market Values ({filteredMachinery.length})
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
                                    placeholder="Search by machinery type, ordinance, or approver..."
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
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machinery Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Value</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordinance No.</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMachinery.map((machinery) => (
                                    <tr key={machinery.smv_machinery_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">{machinery.mt_name}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(machinery.unit_value)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(machinery.effective_date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{machinery.ordinance_no || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{machinery.approved_by || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(machinery.smv_machinery_id)}
                                                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(machinery)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMachinery.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            No machinery market values found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Dialog would be imported here */}
            <SMVMachineryModifyDialog
                showDialog={showDialog}
                setShowDialog={setShowDialog}
                edit={editMode}
                approve={approve}
                setNewSMVMachinery={setNewSMVMachinery}
                setSubmitLoading={setSubmitLoading}
                setApprove={setApprove}
                setSubmitError={setSubmitError}
                setRefresh={setRefresh}
                submitError={submitError}
                submitLoading={submitLoading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                newSMVMachinery={newSMVMachinery}
                machineryTypes={machineryTypes}
                loading={miniLoading}
                inputError={inputError}
                setInputError={setInputError}
            />
            <SMVMachineryDeleteDialog
                setSubmitError={setSubmitError}
                showDeleteDialog={showDelDialog}
                setShowDeleteDialog={setShowDelDialog}
                approve={approve}
                setApprove={setApprove}
                submitLoading={submitLoading}
                submitError={submitError}
                handleDelete={handleDeletedSubmit}
                setRefresh={setRefresh}
                machineryItem={{
                    unit_value: newSMVMachinery.unit_value,
                    depreciation_rate: newSMVMachinery.depreciation_rate,
                    machinery_type: newSMVMachinery.mt_name
                }}
            />
        </div>
    );
};

export default SMVMachineryManagement;