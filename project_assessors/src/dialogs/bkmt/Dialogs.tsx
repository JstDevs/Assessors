// dialogs/types/Dialogs.tsx
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Loading from '../../common/Loading.tsx';
import type { BuildingKindFormData, MachineryTypeFormData } from '../../structures/Bkmt.tsx';

// ============= BUILDING KIND MODIFY DIALOG =============


interface BuildingKindModifyDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    edit: boolean;
    approve: boolean;
    setNewBuildingKind: React.Dispatch<React.SetStateAction<BuildingKindFormData>>;
    setSubmitLoading: (loading: boolean) => void;
    setApprove: (approve: boolean) => void;
    setSubmitError: (error: string | null) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
    newBuildingKind: BuildingKindFormData;
    inputError: string;
    setInputError: (error: string) => void;
}

export const BuildingKindModifyDialog: React.FC<BuildingKindModifyDialogProps> = ({
    showDialog,
    setShowDialog,
    edit,
    approve,
    setNewBuildingKind,
    setApprove,
    setSubmitError,
    setRefresh,
    submitError,
    submitLoading,
    handleChange,
    handleSubmit,
    newBuildingKind,
    inputError,
    setInputError,
}) => {
    const handleClose = () => {
        if (approve) {
            setRefresh(prev => !prev);
        }
        setShowDialog(false);
        setApprove(false);
        setSubmitError(null);
        setInputError('');
        setNewBuildingKind({
            code: '',
            name: '',
            description: '',
        });
    };

    if (!showDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {edit ? 'Edit Building Kind' : 'Add Building Kind'}
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
                                {edit ? 'Building Kind Updated!' : 'Building Kind Added!'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The building kind has been {edit ? 'updated' : 'added'} successfully.
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
                            {inputError && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-600 text-sm">{inputError}</p>
                                </div>
                            )}

                            <form className="space-y-6">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={newBuildingKind.code}
                                        onChange={handleChange}
                                        maxLength={20}
                                        required
                                        placeholder="e.g., BK-001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newBuildingKind.name}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                        placeholder="e.g., Concrete"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newBuildingKind.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Optional description..."
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
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            {edit ? 'Update' : 'Add'} Building Kind
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= BUILDING KIND DELETE DIALOG =============
interface BuildingKindDeleteDialogProps {
    showDeleteDialog: boolean;
    setShowDeleteDialog: (show: boolean) => void;
    approve: boolean;
    setApprove: (approve: boolean) => void;
    submitLoading: boolean;
    submitError: string | null;
    setSubmitError: (error: string | null) => void;
    handleDelete: () => Promise<void>;
    buildingKindItem: {
        code: string;
        name: string;
    } | null;
}

export const BuildingKindDeleteDialog: React.FC<BuildingKindDeleteDialogProps> = ({
    showDeleteDialog,
    setShowDeleteDialog,
    approve,
    setApprove,
    submitLoading,
    submitError,
    setSubmitError,
    handleDelete,
    buildingKindItem,
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
                        Delete Building Kind
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
                                The building kind has been deleted successfully.
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
                                    You are about to delete the following building kind:
                                </p>
                                {buildingKindItem && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                                        <p className="text-sm font-medium text-gray-900">
                                            {buildingKindItem.code} - {buildingKindItem.name}
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

// ============= MACHINERY TYPE MODIFY DIALOG =============

interface MachineryTypeModifyDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    edit: boolean;
    approve: boolean;
    setNewMachineryType: React.Dispatch<React.SetStateAction<MachineryTypeFormData>>;
    setSubmitLoading: (loading: boolean) => void;
    setApprove: (approve: boolean) => void;
    setSubmitError: (error: string | null) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
    newMachineryType: MachineryTypeFormData;
    inputError: string;
    setInputError: (error: string) => void;
}

export const MachineryTypeModifyDialog: React.FC<MachineryTypeModifyDialogProps> = ({
    showDialog,
    setShowDialog,
    edit,
    approve,
    setNewMachineryType,
    setApprove,
    setSubmitError,
    setRefresh,
    submitError,
    submitLoading,
    handleChange,
    handleSubmit,
    newMachineryType,
    inputError,
    setInputError,
}) => {
    const handleClose = () => {
        if (approve) {
            setRefresh(prev => !prev);
        }
        setShowDialog(false);
        setApprove(false);
        setSubmitError(null);
        setInputError('');
        setNewMachineryType({
            code: '',
            name: '',
            description: '',
        });
    };

    if (!showDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {edit ? 'Edit Machinery Type' : 'Add Machinery Type'}
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
                                {edit ? 'Machinery Type Updated!' : 'Machinery Type Added!'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The machinery type has been {edit ? 'updated' : 'added'} successfully.
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
                            {inputError && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-600 text-sm">{inputError}</p>
                                </div>
                            )}

                            <form className="space-y-6">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={newMachineryType.code}
                                        onChange={handleChange}
                                        maxLength={20}
                                        required
                                        placeholder="e.g., MT-001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newMachineryType.name}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                        placeholder="e.g., Generator Set"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newMachineryType.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Optional description..."
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
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            {edit ? 'Update' : 'Add'} Machinery Type
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= MACHINERY TYPE DELETE DIALOG =============
interface MachineryTypeDeleteDialogProps {
    showDeleteDialog: boolean;
    setShowDeleteDialog: (show: boolean) => void;
    approve: boolean;
    setApprove: (approve: boolean) => void;
    submitLoading: boolean;
    submitError: string | null;
    setSubmitError: (error: string | null) => void;
    handleDelete: () => Promise<void>;
    machineryTypeItem: {
        code: string;
        name: string;
    } | null;
}

export const MachineryTypeDeleteDialog: React.FC<MachineryTypeDeleteDialogProps> = ({
    showDeleteDialog,
    setShowDeleteDialog,
    approve,
    setApprove,
    submitLoading,
    submitError,
    setSubmitError,
    handleDelete,
    machineryTypeItem,
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
                        Delete Machinery Type
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
                                The machinery type has been deleted successfully.
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
                                    You are about to delete the following machinery type:
                                </p>
                                {machineryTypeItem && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                                        <p className="text-sm font-medium text-gray-900">
                                            {machineryTypeItem.code} - {machineryTypeItem.name}
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