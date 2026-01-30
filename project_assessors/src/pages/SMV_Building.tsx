import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../axiosBase';
import Loading from '../common/Loading';
import { formatCurrency, formatDate, phFormatDate } from '../common/Tools';
import { DeleteSMVDialog, SMVBuildingAddDialog } from '../dialogs/smv/Dialogs';

interface SMVBuilding {
    smv_building_id: number;
    ry_id: number;
    pc_id: number;
    bk_id: number;
    classification: string;
    bk_name: string;
    unit_value: number;
    effective_date: string;
    ordinance_no: string | null;
    approved_by: string | null;
    remarks: string | null;
}

interface PropertyClassification {
    pc_id: number;
    code: string;
    classname: string;
}

interface BuildingKind {
    bk_id: number;
    code: string;
    name: string;
}

interface SMVBuildingFormData {
    smv_building_id?: number;
    ry_id: number;
    pc_id: number;
    bk_id: number;
    unit_value: number;
    effective_date: string;
    ordinance_no: string;
    approved_by: string;
    remarks: string;
    bk_name: string;
    classification: string;
}

const SMVBuildingManagement: React.FC = () => {
    const [SMVBuildingList, setSMVBuildingList] = useState<SMVBuilding[]>([]);
    const [propertyClassifications, setPropertyClassifications] = useState<PropertyClassification[]>([]);
    const [buildingKinds, setBuildingKinds] = useState<BuildingKind[]>([]);
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

    const [newSMVBuilding, setNewSMVBuilding] = useState<SMVBuildingFormData>({
        ry_id: 0,
        pc_id: -1,
        bk_id: -1,
        unit_value: 0,
        depreciation_rate: 0,
        effective_date: new Date().toISOString().split('T')[0],
        ordinance_no: '',
        approved_by: '',
        remarks: '',
        bk_name: '',
        classification: ''
    });

    // Fetch functions
    async function getSMVBuildings() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('smv/buildingList');
            setSMVBuildingList(res.data.data);
            setLoading(false);
        } catch (err) {
            setError('Error in fetching Building SMV records!');
            console.log(err);
            setLoading(false);
        }
    }

    async function getPropertyClassifications() {
        try {
            const res = await api.get('smv/bkList');
            setPropertyClassifications(res.data.data);
        } catch (err) {
            console.error('Failed to load property classifications', err);
        }
    }

    async function getBuildingKinds() {
        setMiniLoading(true);
        try {
            const res = await api.get('smv/kindList');
            setBuildingKinds(res.data.data);
        } catch (err) {
            console.error('Failed to load building kinds', err);
        }
        setMiniLoading(false);
    }

    useEffect(() => {
        getSMVBuildings();
        getPropertyClassifications();
        getBuildingKinds();
    }, [refresh]);

    // Search functionality
    const filteredBuildings: SMVBuilding[] = SMVBuildingList.filter(item =>
        item.classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bk_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ordinance_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.approved_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    // CRUD handlers
    const handleAddNew = (): void => {
        setNewSMVBuilding({
            ry_id: 0,
            pc_id: -1,
            bk_id: -1,
            unit_value: 0,
            effective_date: new Date().toISOString().split('T')[0],
            ordinance_no: '',
            approved_by: '',
            remarks: '',
            bk_name: '',
            classification: ''
        });
        setEditMode(false);
        setShowDialog(true);
    };

    const handleEdit = async (smv_building_id: number): Promise<void> => {
        setEditMode(true);
        setSubmitLoading(true);
        setShowDialog(true);
        try {
            const res = await api.get('smv/getBuilding', { params: { smv_building_id } });
            const data = res.data.data;
            setNewSMVBuilding({
                smv_building_id: data.smv_building_id,
                ry_id: data.ry_id,
                pc_id: data.pc_id,
                bk_id: data.bk_id,
                unit_value: data.unit_value,
                depreciation_rate: data.depreciation_rate,
                effective_date: data.effective_date,
                ordinance_no: data.ordinance_no || '',
                approved_by: data.approved_by || '',
                remarks: data.remarks || '',
                bk_name: data.bk_name,
                classification: ''
            });
        } catch (err) {
            console.error('Failed to fetch building SMV', err);
        }
        setSubmitLoading(false);
    };

    const handleDeletedSubmit = async (): Promise<void> =>{
        setApprove(false);
        setSubmitLoading(true);
        setSubmitError(null);
        try{
            await api.delete('smv/deleteBuilding', { params: { smv_building_id: newSMVBuilding.smv_building_id} });
            setSubmitLoading(false);
            setApprove(true);
        }catch(err){
            console.log(err);
            setSubmitError("Error in deleting this smv_building")
        }
    }

    const handleDelete = (building: SMVBuildingFormData): void => {
        setShowDelDialog(true);
        setNewSMVBuilding({
            smv_building_id: building.smv_building_id,
            ry_id: building.ry_id,
            pc_id: building.pc_id,
            bk_id: building.bk_id,
            unit_value: building.unit_value,
            effective_date: building.effective_date,
            ordinance_no: building.ordinance_no || '',
            approved_by: building.approved_by || '',
            remarks: building.remarks || '',
            bk_name: building.bk_name,
            classification: building.classification
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewSMVBuilding(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = async () => {
        if (newSMVBuilding.bk_id <= 0 || newSMVBuilding.st_id <= 0 || newSMVBuilding.unit_value <= 0) {
            setInputError("Fill all required fields!");
            return;
        }
        setInputError("");
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            if (editMode) {
                await api.put('smv/setBuidling', 
                    {
                        smv_building_id: newSMVBuilding.smv_building_id,
                        unit_value: newSMVBuilding.unit_value,
                        depreciation_rate: newSMVBuilding.depreciation_rate,
                        effective_date: phFormatDate(newSMVBuilding.effective_date),
                        ordinance_no: newSMVBuilding.ordinance_no,
                        approved_by: newSMVBuilding.approved_by,
                        remarks: newSMVBuilding.remarks
                    });
            } else {
                const res = await api.post('smv/addBuilding', newSMVBuilding);
                console.log(res.data);
            }

            setApprove(true);
            setRefresh(prev => !prev);
        } catch (err) {
            setSubmitError('Failed to save Building SMV.');
            console.error(err);
        } finally {
            setSubmitLoading(false);
        }
    };

    


    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Building Market Values</h1>
                <p className="text-gray-600">Manage market value schedules for building classifications</p>
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
                                    Building Market Values ({filteredBuildings.length})
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
                                    placeholder="Search by classification, building kind, ordinance, or approver..."
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building Kind</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structural Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Value (per sqm)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordinance No.</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBuildings.map((building) => (
                                    <tr key={building.smv_building_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">{building.buildingkind}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{building.structuraltype}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(building.unit_value)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(building.effective_date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{building.ordinance_no || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{building.approved_by || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(building.smv_building_id)}
                                                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                {/* Don't worry about this error! */}
                                                <button
                                                    onClick={() => handleDelete(building)} 
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBuildings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            No building market values found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Dialog would be imported here */}
            <SMVBuildingAddDialog
                showSMVBuildingDialog={showDialog}
                setShowSMVBuildingDialog={setShowDialog}
                edit={editMode}
                approve={approve}
                setNewSMVBuilding={setNewSMVBuilding}
                setSubmitLoading={setSubmitLoading}
                setApprove={setApprove}
                setSubmitError={setSubmitError}
                setRefresh={setRefresh}
                submitError={submitError}
                submitLoading={submitLoading}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                newSMVBuilding={newSMVBuilding}
                propertyClassifications={propertyClassifications}
                buildingKinds={buildingKinds}
                loading={miniLoading}
                inputError={inputError}
                setInputError={setInputError}
            />
            <DeleteSMVDialog
                showDeleteDialog={showDelDialog}
                setShowDeleteDialog={setShowDelDialog}
                approve={approve}
                setApprove={setApprove}
                submitLoading={submitLoading}
                submitError={submitError}
                handleDelete={handleDeletedSubmit}
                itemType="Building"
                itemName={newSMVBuilding.bk_name + " - " + newSMVBuilding.classification + " - "  + newSMVBuilding.unit_value}
                setRefresh={setRefresh}
            />
        </div>
    );
};

export default SMVBuildingManagement;