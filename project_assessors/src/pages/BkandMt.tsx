import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../axiosBase';
import Loading from '../common/Loading';
import { BuildingKindDeleteDialog, BuildingKindModifyDialog, MachineryTypeDeleteDialog, MachineryTypeModifyDialog } from '../dialogs/bkmt/Dialogs';
import type { BuildingKind, MachineryType, BuildingKindFormData, MachineryTypeFormData } from '../structures/Bkmt.tsx';

const BkandMt: React.FC = () => {
    // Building Kind states
    const [buildingKinds, setBuildingKinds] = useState<BuildingKind[]>([]);
    const [searchBK, setSearchBK] = useState<string>('');
    const [loadingBK, setLoadingBK] = useState<boolean>(true);
    const [errorBK, setErrorBK] = useState<string>('');
    const [refreshBK, setRefreshBK] = useState<boolean>(false);

    // Machinery Type states
    const [machineryTypes, setMachineryTypes] = useState<MachineryType[]>([]);
    const [searchMT, setSearchMT] = useState<string>('');
    const [loadingMT, setLoadingMT] = useState<boolean>(true);
    const [errorMT, setErrorMT] = useState<string>('');
    const [refreshMT, setRefreshMT] = useState<boolean>(false);

    // Building Kind Dialog states
    const [showBKDialog, setShowBKDialog] = useState<boolean>(false);
    const [showBKDeleteDialog, setShowBKDeleteDialog] = useState<boolean>(false);
    const [editBK, setEditBK] = useState<boolean>(false);
    const [approveBK, setApproveBK] = useState<boolean>(false);
    const [submitLoadingBK, setSubmitLoadingBK] = useState<boolean>(false);
    const [submitErrorBK, setSubmitErrorBK] = useState<string | null>(null);
    const [inputErrorBK, setInputErrorBK] = useState<string>('');
    
    const [newBuildingKind, setNewBuildingKind] = useState<BuildingKindFormData>({
        bk_id: 0,
        code: '',
        name: '',
        description: '',
    });

    // Machinery Type Dialog states
    const [showMTDialog, setShowMTDialog] = useState<boolean>(false);
    const [showMTDeleteDialog, setShowMTDeleteDialog] = useState<boolean>(false);
    const [editMT, setEditMT] = useState<boolean>(false);
    const [approveMT, setApproveMT] = useState<boolean>(false);
    const [submitLoadingMT, setSubmitLoadingMT] = useState<boolean>(false);
    const [submitErrorMT, setSubmitErrorMT] = useState<string | null>(null);
    const [inputErrorMT, setInputErrorMT] = useState<string>('');
    
    const [newMachineryType, setNewMachineryType] = useState<MachineryTypeFormData>({
        code: '',
        name: '',
        description: '',
    });

    // Fetch functions
    async function getBuildingKinds() {
        setLoadingBK(true);
        setErrorBK('');
        try {
            const res = await api.get('bkmt/bkList');
            setBuildingKinds(res.data.data);
        } catch (err) {
            setErrorBK('Error fetching Building Kinds!');
            console.error(err);
        } finally {
            setLoadingBK(false);
        }
    }

    async function getMachineryTypes() {
        setLoadingMT(true);
        setErrorMT('');
        try {
            const res = await api.get('bkmt/mtList');
            setMachineryTypes(res.data.data);
        } catch (err) {
            setErrorMT('Error fetching Machinery Types!');
            console.error(err);
        } finally {
            setLoadingMT(false);
        }
    }

    useEffect(() => {
        getBuildingKinds();
    }, [refreshBK]);

    useEffect(() => {
        getMachineryTypes();
    }, [refreshMT]);

    // Search filters
    const filteredBuildingKinds: BuildingKind[] = buildingKinds.filter(item =>
        item.code.toLowerCase().includes(searchBK.toLowerCase()) ||
        item.name.toLowerCase().includes(searchBK.toLowerCase())
    );

    const filteredMachineryTypes: MachineryType[] = machineryTypes.filter(item =>
        item.code.toLowerCase().includes(searchMT.toLowerCase()) ||
        item.name.toLowerCase().includes(searchMT.toLowerCase())
    );

    // Building Kind handlers
    const handleAddBK = (): void => {
        setNewBuildingKind({
            code: '',
            name: '',
            description: '',
        });
        setEditBK(false);
        setShowBKDialog(true);
    };

    const handleEditBK = async (bk_id: number): Promise<void> => {
        setEditBK(true);
        setSubmitLoadingBK(true);
        setShowBKDialog(true);
        try {
            const res = await api.get('bkmt/bkGet', { params: { bk_id } });
            const data = res.data.data;
            setNewBuildingKind({
                bk_id: data.bk_id,
                code: data.code,
                name: data.name,
                description: data.description || '',
            });
        } catch (err) {
            console.error('Failed to fetch building kind', err);
        }
        setSubmitLoadingBK(false);
    };

    const handleDeleteBK = (bk: BuildingKind): void => {
        setNewBuildingKind(bk);
        setShowBKDeleteDialog(true);
    };

    const handleChangeBK = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewBuildingKind(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmitBK = async () => {
        if (!newBuildingKind.code || !newBuildingKind.name) {
            setInputErrorBK("Code and Name are required!");
            return;
        }
        setInputErrorBK("");
        setSubmitLoadingBK(true);
        setSubmitErrorBK(null);
        try {
            if (editBK) {
                await api.put('bkmt/bkSet', newBuildingKind);
            } else {
                await api.post('bkmt/bkAdd', newBuildingKind);
            }
            setApproveBK(true);
            setRefreshBK(prev => !prev);
        } catch (err) {
            setSubmitErrorBK('Failed to save Building Kind.');
            console.error(err);
        } finally {
            setSubmitLoadingBK(false);
        }
    };

    const handleDeleteSubmitBK = async () => {
        setSubmitLoadingBK(true);
        setSubmitErrorBK(null);
        try {
            await api.delete('bkmt/bkDel', { params: { bk_id: newBuildingKind.bk_id } });
            setApproveBK(true);
            setRefreshBK(prev => !prev);
        } catch (err) {
            setSubmitErrorBK('Failed to delete Building Kind.');
            console.error(err);
        } finally {
            setSubmitLoadingBK(false);
        }
    };

    // Machinery Type handlers
    const handleAddMT = (): void => {
        setNewMachineryType({
            mt_id: 0,
            code: '',
            name: '',
            description: '',
        });
        setEditMT(false);
        setShowMTDialog(true);
    };

    const handleEditMT = async (mt_id: number): Promise<void> => {
        setEditMT(true);
        setSubmitLoadingMT(true);
        setShowMTDialog(true);
        try {
            const res = await api.get('bkmt/mtGet', { params: { mt_id } });
            const data = res.data.data;
            setNewMachineryType({
                mt_id: data.mt_id,
                code: data.code,
                name: data.name,
                description: data.description || '',
            });
        } catch (err) {
            console.error('Failed to fetch machinery type', err);
        }
        setSubmitLoadingMT(false);
    };

    const handleDeleteMT = (mt: MachineryType): void => {
        setNewMachineryType(mt);
        setShowMTDeleteDialog(true);
    };

    const handleChangeMT = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewMachineryType(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmitMT = async () => {
        if (!newMachineryType.code || !newMachineryType.name) {
            setInputErrorMT("Code and Name are required!");
            return;
        }
        setInputErrorMT("");
        setSubmitLoadingMT(true);
        setSubmitErrorMT(null);
        try {
            if (editMT) {
                await api.put('bkmt/mtSet', newMachineryType);
            } else {
                await api.post('bkmt/mtAdd', newMachineryType);
            }
            setApproveMT(true);
            setRefreshMT(prev => !prev);
        } catch (err) {
            setSubmitErrorMT('Failed to save Machinery Type.');
            console.error(err);
        } finally {
            setSubmitLoadingMT(false);
        }
    };

    const handleDeleteSubmitMT = async () => {
        setSubmitLoadingMT(true);
        setSubmitErrorMT(null);
        try {
            await api.delete('bkmt/mtDel', { params: { mt_id: newMachineryType.mt_id } });
            setApproveMT(true);
            setRefreshMT(prev => !prev);
        } catch (err) {
            setSubmitErrorMT('Failed to delete Machinery Type.');
            console.error(err);
        } finally {
            setSubmitLoadingMT(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Types Management</h1>
                <p className="text-gray-600">Manage building kinds and machinery types</p>
            </div>

            <div className="space-y-6">
                {/* Building Kinds Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        {errorBK ? (
                            <p className="text-red-600 text-center">{errorBK}</p>
                        ) : loadingBK ? (
                            <Loading />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Building Kinds ({filteredBuildingKinds.length})
                                    </h2>
                                    <button
                                        onClick={handleAddBK}
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
                                        placeholder="Search by code or name..."
                                        value={searchBK}
                                        onChange={(e) => setSearchBK(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {loadingBK ? (
                        <></>
                    ) : (
                        <div className="overflow-x-auto max-h-60">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                    </tr>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredBuildingKinds.map((bk) => (
                                        <tr key={bk.bk_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{bk.code}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{bk.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{bk.description || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditBK(bk.bk_id)}
                                                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBK(bk)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredBuildingKinds.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                No building kinds found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Machinery Types Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        {errorMT ? (
                            <p className="text-red-600 text-center">{errorMT}</p>
                        ) : loadingMT ? (
                            <Loading />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Machinery Types ({filteredMachineryTypes.length})
                                    </h2>
                                    <button
                                        onClick={handleAddMT}
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
                                        placeholder="Search by code or name..."
                                        value={searchMT}
                                        onChange={(e) => setSearchMT(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {loadingMT ? (
                        <></>
                    ) : (
                        <div className="overflow-x-auto max-h-60">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                    </tr>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMachineryTypes.map((mt) => (
                                        <tr key={mt.mt_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{mt.code}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{mt.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{mt.description || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditMT(mt.mt_id)}
                                                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMT(mt)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMachineryTypes.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                No machinery types found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <BuildingKindModifyDialog
                approve={approveBK}
                edit={editBK}
                handleChange={handleChangeBK}
                handleSubmit={handleSubmitBK}
                inputError={inputErrorBK}
                newBuildingKind={newBuildingKind}
                setApprove={setApproveBK}
                setInputError={setInputErrorBK}
                setNewBuildingKind={setNewBuildingKind}
                setRefresh={setRefreshBK}
                setShowDialog={setShowBKDialog}
                setSubmitError={setSubmitErrorBK}
                setSubmitLoading={setSubmitLoadingBK}
                showDialog={showBKDialog}
                submitError={submitErrorBK}
                submitLoading={submitLoadingBK}
            />
            <BuildingKindDeleteDialog
                approve={approveBK}
                buildingKindItem={newBuildingKind}
                handleDelete={handleDeleteSubmitBK}
                setApprove={setApproveBK}
                setShowDeleteDialog={setShowBKDeleteDialog}
                setSubmitError={setSubmitErrorBK}
                showDeleteDialog={showBKDeleteDialog}
                submitError={submitErrorBK}
                submitLoading={submitLoadingBK}
            />
            <MachineryTypeModifyDialog
                approve={approveMT}
                edit={editMT}
                handleChange={handleChangeMT}
                handleSubmit={handleSubmitMT}
                inputError={inputErrorMT}
                newMachineryType={newMachineryType}
                setApprove={setApproveMT}
                setInputError={setInputErrorMT}
                setNewMachineryType={setNewMachineryType}
                setRefresh={setRefreshMT}
                setShowDialog={setShowMTDialog}
                setSubmitError={setSubmitErrorMT}
                setSubmitLoading={setSubmitLoadingMT}
                showDialog={showMTDialog}
                submitError={submitErrorMT}
                submitLoading={submitLoadingMT}
            />
            <MachineryTypeDeleteDialog
                approve={approveMT}
                machineryTypeItem={newMachineryType}
                handleDelete={handleDeleteSubmitMT}
                setApprove={setApproveMT}
                setShowDeleteDialog={setShowMTDeleteDialog}
                setSubmitError={setSubmitErrorMT}
                showDeleteDialog={showMTDeleteDialog}
                submitError={submitErrorMT}
                submitLoading={submitLoadingMT}
            />
        </div>
    );
};

export default BkandMt;