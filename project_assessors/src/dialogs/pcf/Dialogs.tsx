import React from "react";
import { X, Save, Trash2 } from "lucide-react";
import Dialog from "../../common/Dialog.tsx";
import Loading from "../../common/Loading.tsx";
import type { PropertyClassificationForm, PropertySubclassification, ActualUse } from "../../structures/Properties.tsx";

interface ModifyClassificationDialogProps {
    openAddClass: boolean;
    setOpenAddClass: React.Dispatch<React.SetStateAction<boolean>>;
    edit: boolean;
    setNewPropertyClassification: React.Dispatch<React.SetStateAction<PropertyClassificationForm>>;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    classificationHandleSubmit: React.MouseEventHandler<HTMLButtonElement>;
    approve: boolean;
    submitLoading: boolean;
    submitError: string | null;
    newPropertyClassification: PropertyClassificationForm;
    classificationHandleChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => void;
}
export const ModifyClassificationDialog: React.FC<ModifyClassificationDialogProps> = ({
    openAddClass,
    setOpenAddClass,
    edit,
    approve, 
    setNewPropertyClassification,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefresh,
    submitLoading,
    classificationHandleSubmit,
    submitError,
    newPropertyClassification,
    classificationHandleChange
    
}) => {
    return (
        <Dialog
                open={openAddClass}
                onClose={()=>setOpenAddClass(false)}
                title={edit? 'Update Classification': 'Create new Classification'}
                actions={ 
                    <div className="flex justify-end gap-3 pt-4">
                        {
                            !approve?
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewPropertyClassification({pc_id: -1, code: "", classname: "", description: ""});
                                        setOpenAddClass(false);
                                        setSubmitLoading(false);
                                        setApprove(false);
                                        setSubmitError(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <X size={20} />
                                    Cancel
                                </button>:<></>
                        }
                        
                        {
                            approve?
                                    <button
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            setNewPropertyClassification({pc_id: -1, code: "", classname: "", description: ""});
                                            setOpenAddClass(false);
                                            setSubmitLoading(false);
                                            setApprove(false);
                                            setSubmitError(null);
                                            setRefresh(prev=>!prev);
                                        }}
                                    >
                                        <Save size={20} />
                                        Confirm
                                    </button>:
                                    <button
                                        className={`px-4 py-2 bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 ${submitLoading? 'bg-emerald-900': 'hover:bg-emerald-700'}`}
                                        onClick={classificationHandleSubmit}
                                    >
                                        <Save size={20} />
                                        {submitLoading? "Processing": edit ? 'Update' : 'Create'} Classification
                                    </button>
                        }
                    </div>
                }
            >
                {
                    approve? 
                        <p className='text-emerald-600 text-center'> { "Success!" } </p>:
                        submitError?
                            <p className='text-red-600 text-center'> { submitError } </p>:
                            submitLoading?
                                <Loading />:
                                <form className="space-y-6">
                                    {/* Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Classification Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={newPropertyClassification.code}
                                            onChange={classificationHandleChange}
                                            required
                                            maxLength={10}
                                            placeholder="e.g., R, A, I, C"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* Class Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Classification Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="classname"
                                            value={newPropertyClassification.classname}
                                            onChange={classificationHandleChange}
                                            required
                                            maxLength={100}
                                            placeholder="e.g., Residential, Agricultural, Industrial"
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
                                            value={newPropertyClassification.description}
                                            onChange={classificationHandleChange}
                                            rows={3}
                                            placeholder="Optional description of the classification..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </form>
                }
        </Dialog>
    )
}

interface DeleteClassificationDialogProps {
    openDelClass: boolean;
    setOpenDelClass: React.Dispatch<React.SetStateAction<boolean>>;
    classificationHandleDelete: React.MouseEventHandler<HTMLButtonElement> | undefined;
    setNewPropertyClassification: React.Dispatch<React.SetStateAction<PropertyClassificationForm>>
    approve: boolean;
    submitLoading: boolean;
    submitError: string | null;
    newPropertyClassification: PropertyClassificationForm;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DeleteClassificationDialog: React.FC<DeleteClassificationDialogProps> = ({
    openDelClass,
    approve,
    submitLoading,
    submitError,
    newPropertyClassification,
    setOpenDelClass,
    classificationHandleDelete,
    setNewPropertyClassification,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefresh
}) => {
    return (
        <Dialog
                open={openDelClass}
                onClose={()=>setOpenDelClass(false)}
                title='Delete Classification'
                actions={ 
                    <div className="flex justify-end gap-3 pt-4">
                        {
                            !approve?
                                <button
                                type="button"
                                onClick={() => {
                                    setNewPropertyClassification({pc_id: -1, code: "", classname: "", description: ""});
                                    setOpenDelClass(false);
                                    setSubmitLoading(false);
                                    setApprove(false);
                                    setSubmitError(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <X size={20} />
                                Cancel
                            </button>:<></>
                        }
                        
                        {
                            approve?
                                    <button
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            setNewPropertyClassification({pc_id: -1, code: "", classname: "", description: ""});
                                            setOpenDelClass(false);
                                            setSubmitLoading(false);
                                            setApprove(false);
                                            setSubmitError(null);
                                            setRefresh(prev=>!prev);
                                        }}
                                    >
                                        <Save size={20} />
                                        Confirm
                                    </button>:
                                    <button
                                        className={`px-4 py-2 bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 ${submitLoading? 'bg-red-900': 'hover:bg-red-700'}`}
                                        onClick={classificationHandleDelete}
                                    >
                                        <Trash2 size={20} />
                                        Delete Classification
                                    </button>
                        }
                    </div>
                }
            >
                {
                    approve? 
                        <p className='text-emerald-600 text-center'> { "Success!" } </p>:
                        submitError?
                            <p className='text-red-600 text-center'> { submitError } </p>:
                            submitLoading?
                                <Loading />:
                                    <p className='text-red-600'>Are you sure you want to delete this classification [{newPropertyClassification.classname}]?</p>
                                
                }
        </Dialog>
    );
};


export interface ModifySubClassificationDialogProps {
    showModifySClass: boolean;
    setShowModifySClass: React.Dispatch<React.SetStateAction<boolean>>;
    edit: boolean;
    approve: boolean;
    setNewPropertySubClassification: React.Dispatch<React.SetStateAction<PropertySubclassification>>;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setRefreshSelected: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    subClassificationHandleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    subclassificationHandleSubmit: () => void;
    selectedClassification: PropertyClassificationForm | null;
    newPropertySubClassification: PropertySubclassification
}

export const ModifySubClassificationDialog:React.FC<ModifySubClassificationDialogProps> = ({
    showModifySClass,
    setShowModifySClass,
    edit,
    approve,
    setNewPropertySubClassification,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefreshSelected,
    submitError,
    submitLoading,
    subClassificationHandleChange,
    subclassificationHandleSubmit,
    selectedClassification,
    newPropertySubClassification
}) => {
    return (
        <Dialog
            open={showModifySClass}
            onClose={() => setShowModifySClass(false)}
            title={edit ? "Update Sub Classification" : "Create new Sub Classification"}
            actions={
                <div className="flex justify-end gap-3 pt-4">
                    {!approve && (
                        <button
                            type="button"
                            onClick={() => {
                                setNewPropertySubClassification({
                                    psc_id: -1,
                                    pc_id: -1,
                                    code: "",
                                    subclass_name: "",
                                    description: "",
                                    valuation_factor: 0,
                                });
                                setShowModifySClass(false);
                                setSubmitLoading(false);
                                setApprove(false);
                                setSubmitError(null);
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <X size={20} />
                            Cancel
                        </button>
                    )}

                    {approve ? (
                        <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            onClick={() => {
                                setNewPropertySubClassification({
                                    psc_id: -1,
                                    pc_id: -1,
                                    code: "",
                                    subclass_name: "",
                                    description: "",
                                    valuation_factor: 0,
                                });
                                setShowModifySClass(false);
                                setSubmitLoading(false);
                                setApprove(false);
                                setSubmitError(null);
                                setRefreshSelected(prev=>!prev);
                            }}
                        >
                            <Save size={20} />
                            Confirm
                        </button>
                    ) : (
                        <button
                            className={`px-4 py-2 bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                                submitError? "hover:bg-emerald-700" : submitLoading ? "bg-emerald-900" : "hover:bg-emerald-700"
                            }`}
                            onClick={subclassificationHandleSubmit}
                        >
                            <Save size={20} />
                            {submitError ? "Resubmit"
                                : submitLoading
                                ? "Processing"
                                : edit
                                ? "Update"
                                : "Create"}{" "}
                            Sub Classification
                        </button>
                    )}
                </div>
            }
        >
            {approve ? (
                <p className="text-emerald-600 text-center">Success!</p>
            ) : submitError ? (
                <p className="text-red-600 text-center">{submitError}</p>
            ) : submitLoading ? (
                <Loading />
            ) : (
                <form className="space-y-6">
                    {/* Show Classification it belongs to */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            Classification:{" "}
                            <span className="font-semibold text-gray-900">
                                {selectedClassification?.classname || "Unknown"}
                            </span>
                        </p>
                    </div>

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sub Classification Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={newPropertySubClassification.code}
                            onChange={subClassificationHandleChange}
                            required
                            maxLength={10}
                            placeholder="e.g., R-1, A-1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Subclass Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sub Classification Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="subclass_name"
                            value={newPropertySubClassification.subclass_name}
                            onChange={subClassificationHandleChange}
                            required
                            maxLength={100}
                            placeholder="e.g., Residential 1, Agricultural Rice Land"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Valuation Factor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valuation Factor <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            min="0"
                            name="valuation_factor"
                            value={newPropertySubClassification.valuation_factor}
                            onChange={subClassificationHandleChange}
                            required
                            placeholder="e.g., 1.0000"
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
                            value={newPropertySubClassification.description}
                            onChange={subClassificationHandleChange}
                            rows={3}
                            placeholder="Optional description for this sub classification..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </form>
            )}
        </Dialog>
    )
}

export interface DeleteSubClassificationDialogProps {
    showDelSClass: boolean;                           
    setShowDelSClass: React.Dispatch<React.SetStateAction<boolean>>;
    approve: boolean;                                
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    submitLoading: boolean;                          
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;                       
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    newPropertySubClassification: PropertySubclassification; 
    setNewPropertySubClassification: React.Dispatch<React.SetStateAction<PropertySubclassification>>;
    setRefreshSelected: React.Dispatch<React.SetStateAction<boolean>>; 
    subClassificationHandleDelete: () => void;
}


export const DeleteSubClassificationDialog:React.FC<DeleteSubClassificationDialogProps> = ({
    showDelSClass,
    setShowDelSClass,
    approve,
    setApprove,
    submitError,
    setSubmitError,
    submitLoading,
    setSubmitLoading,
    newPropertySubClassification,
    setNewPropertySubClassification,
    setRefreshSelected,
    subClassificationHandleDelete
}) => {
    return(
        <Dialog
            open={showDelSClass}
            onClose={() => setShowDelSClass(false)}
            title="Delete Sub Classification"
            actions={
                <div className="flex justify-end gap-3 pt-4">
                    {!approve && (
                        <button
                            type="button"
                            onClick={() => {
                                setNewPropertySubClassification({ psc_id: -1, pc_id: -1, code: "", subclass_name: "", description: "", valuation_factor: 0 });
                                setShowDelSClass(false);
                                setSubmitLoading(false);
                                setApprove(false);
                                setSubmitError(null);
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <X size={20} />
                            Cancel
                        </button>
                    )}

                    {approve ? (
                        <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            onClick={() => {
                                setNewPropertySubClassification({ psc_id: -1, pc_id: -1, code: "", subclass_name: "", description: "", valuation_factor: 0 });
                                setShowDelSClass(false);
                                setSubmitLoading(false);
                                setApprove(false);
                                setSubmitError(null);
                                setRefreshSelected(prev => !prev);
                            }}
                        >
                            <Save size={20} />
                            Confirm
                        </button>
                    ) : (
                        <button
                            className={`px-4 py-2 bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 ${submitError? "hover:bg-red-700": submitLoading ? "bg-red-900" : "hover:bg-red-700"}`}
                            onClick={subClassificationHandleDelete}
                        >
                            <Trash2 size={20} />
                            Delete Sub Classification
                        </button>
                    )}
                </div>
            }
        >
            {approve ? (
                <p className="text-emerald-600 text-center">Success!</p>
            ) : submitError ? (
                <p className="text-red-600 text-center">{submitError}</p>
            ) : submitLoading ? (
                <Loading />
            ) : (
                <p className="text-red-600">
                    Are you sure you want to delete this sub classification [
                    {newPropertySubClassification.subclass_name}]?
                </p>
            )}
        </Dialog>
    )
}


interface ModifyActualUseDialogProps {
    showModifyAU: boolean;
    setShowModifyAU: React.Dispatch<React.SetStateAction<boolean>>;

    edit: boolean; // true = edit, false = create
    approve: boolean;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;

    submitLoading: boolean;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;

    submitError: string | null;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;

    newActualUse: ActualUse;
    setNewActualUse: React.Dispatch<React.SetStateAction<ActualUse>>;

    refresh:  React.Dispatch<React.SetStateAction<boolean>>; // callback to reload table/list
    actualUseHandleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    actualUseHandleSubmit: () => void;
}

export const ModifyActualUseDialog: React.FC<ModifyActualUseDialogProps> = ({
    showModifyAU,
    setShowModifyAU,
    edit,
    approve,
    setApprove,
    submitLoading,
    setSubmitLoading,
    submitError,
    setSubmitError,
    newActualUse,
    setNewActualUse,
    refresh,
    actualUseHandleChange,
    actualUseHandleSubmit
}) => {
    return (
        <Dialog
            open={showModifyAU}
            onClose={() => setShowModifyAU(false)}
            title={edit ? "Update Actual Use" : "Create New Actual Use"}
            actions={
                <div className="flex justify-end gap-3 pt-4">
                    {!approve && (
                        <button
                            type="button"
                            onClick={() => {
                                setNewActualUse({
                                    au_id: -1,
                                    pc_id: -1,
                                    psc_id: undefined,
                                    code: "",
                                    use_name: "",
                                    taxable: true,
                                    exempt_percentage: "",
                                    assessment_level: "",
                                    notes: "",
                                    effective_date: ""
                                });
                                setShowModifyAU(false);
                                setSubmitLoading(false);
                                setApprove(false);
                                setSubmitError(null);
                                setNewActualUse({
                                    au_id: -1,
                                    pc_id: -1,
                                    psc_id: -1,
                                    code: "",
                                    use_name: "",
                                    taxable: false,
                                    exempt_percentage: "",
                                    assessment_level: "",
                                    notes: "",
                                    effective_date: ""
                                });
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <X size={20} /> Cancel
                        </button>
                    )}

                    {approve ? (
                        <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            onClick={() => {
                                setShowModifyAU(false);
                                setApprove(false);
                                setSubmitError(null);
                                refresh(prev=>!prev);
                                setNewActualUse({
                                    au_id: -1,
                                    pc_id: -1,
                                    psc_id: -1,
                                    code: "",
                                    use_name: "",
                                    taxable: false,
                                    exempt_percentage: "",
                                    assessment_level: "",
                                    notes: "",
                                    effective_date: ""
                                })
                            }}
                        >
                            <Save size={20} /> Confirm
                        </button>
                    ) : (
                        <button
                            className={`px-4 py-2 bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                                submitLoading ? "bg-emerald-900" : "hover:bg-emerald-700"
                            }`}
                            onClick={actualUseHandleSubmit}
                        >
                            <Save size={20} /> {submitLoading ? "Processing..." : edit ? "Update" : "Create"} Actual Use
                        </button>
                    )}
                </div>
            }
        >
            {approve ? (
                <p className="text-emerald-600 text-center">Success!</p>
            ) : submitError ? (
                <p className="text-red-600 text-center">{submitError}</p>
            ) : submitLoading ? (
                <Loading />
            ) : (
                <form className="space-y-4">
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={newActualUse.code}
                            onChange={actualUseHandleChange}
                            maxLength={10}
                            required
                            placeholder="e.g., RL, RES-LOT"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Use Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Actual Use Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="use_name"
                            value={newActualUse.use_name}
                            onChange={actualUseHandleChange}
                            maxLength={100}
                            required
                            placeholder="e.g., Riceland, Residential Lot"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Taxable */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="taxable"
                            checked={newActualUse.taxable}
                            onChange={(e) => setNewActualUse({ ...newActualUse, taxable: e.target.checked })}
                            className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">Taxable</label>
                    </div>

                    {/* Optional Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exempt Percentage</label>
                        <input
                            type="number"
                            name="exempt_percentage"
                            value={newActualUse.exempt_percentage || ""}
                            onChange={actualUseHandleChange}
                            maxLength={10}
                            placeholder="0%"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Level</label>
                        <input
                            type="number"
                            name="assessment_level"
                            value={newActualUse.assessment_level || ""}
                            onChange={actualUseHandleChange}
                            maxLength={10}
                            placeholder="0%"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={newActualUse.notes || ""}
                            onChange={actualUseHandleChange}
                            rows={3}
                            placeholder="Optional notes about the actual use..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                        <input
                            type="date"
                            name="effective_date"
                            value={
                                newActualUse.effective_date
                                ? new Date(newActualUse.effective_date).toISOString().split("T")[0] // ✅ Convert to YYYY-MM-DD
                                : ""
                            }
                            onChange={actualUseHandleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </form>
            )}
        </Dialog>
    );
};


interface DeleteActualUseDialogProps {
  showDelAU: boolean;
  setShowDelAU: (value: boolean) => void;
  approve: boolean;
  setApprove: (value: boolean) => void;
  submitError: string | null;
  setSubmitError: (value: string | null) => void;
  submitLoading: boolean;
  setSubmitLoading: (value: boolean) => void;
  newActualUse: ActualUse;
  setNewActualUse: (value: ActualUse) => void;
  setRefreshSelected: React.Dispatch<React.SetStateAction<boolean>>;
  actualUseHandleDelete: () => void;
}

export const DeleteActualUseDialog: React.FC<DeleteActualUseDialogProps> = ({
    showDelAU,
    setShowDelAU,
    approve,
    setApprove,
    submitError,
    setSubmitError,
    submitLoading,
    setSubmitLoading,
    newActualUse,
    setNewActualUse,
    setRefreshSelected,
    actualUseHandleDelete
}) => {
    return (
        <Dialog
        open={showDelAU}
        onClose={() => setShowDelAU(false)}
        title="Delete Actual Use"
        actions={
            <div className="flex justify-end gap-3 pt-4">
            {!approve && (
                <button
                type="button"
                onClick={() => {
                    setNewActualUse({
                        au_id: -1,
                        pc_id: -1,
                        psc_id: undefined,
                        code: "",
                        use_name: "",
                        taxable: true,
                        exempt_percentage: "",
                        assessment_level: "",
                        notes: "",
                        effective_date: undefined
                    });
                    setShowDelAU(false);
                    setSubmitLoading(false);
                    setApprove(false);
                    setSubmitError(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                <X size={20} />
                Cancel
                </button>
            )}

            {approve ? (
                <button
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                onClick={() => {
                    setNewActualUse({
                        au_id: -1,
                        pc_id: -1,
                        psc_id: undefined,
                        code: "",
                        use_name: "",
                        taxable: true,
                        exempt_percentage: "",
                        assessment_level: "",
                        notes: "",
                        effective_date: undefined
                    });
                    setShowDelAU(false);
                    setSubmitLoading(false);
                    setApprove(false);
                    setSubmitError(null);
                    setRefreshSelected((prev) => !prev);
                }}
                >
                <Save size={20} />
                Confirm
                </button>
            ) : (
                <button
                className={`px-4 py-2 bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                    submitError ? "hover:bg-red-700" : submitLoading ? "bg-red-900" : "hover:bg-red-700"
                }`}
                onClick={actualUseHandleDelete}
                >
                <Trash2 size={20} />
                Delete Actual Use
                </button>
            )}
            </div>
        }
        >
        {approve ? (
            <p className="text-emerald-600 text-center">Success!</p>
        ) : submitError ? (
            <p className="text-red-600 text-center">{submitError}</p>
        ) : submitLoading ? (
            <Loading />
        ) : (
            <p className="text-red-600">
            Are you sure you want to delete this actual use [{newActualUse.use_name}]?
            </p>
        )}
        </Dialog>
    );
}