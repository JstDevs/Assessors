// src/components/dialogs/smv/SMVLandDialog.tsx
import React, { useEffect, useState } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import Loading from '../../common/Loading.tsx';
import type { SMVLandFormData } from '../../structures/Smv.tsx';
import Dialog from '../../common/Dialog.tsx';
import MiniLoading from '../../common/MiniLoading.tsx';
import { phFormatDate } from '../../common/Tools.tsx';
import api from '../../../axiosBase.ts';

export interface SMVLandDialogProps {
    showSMVLandDialog: boolean;
    setShowSMVLandDialog: React.Dispatch<React.SetStateAction<boolean>>;
    edit: boolean;
    approve: boolean;
    setNewSMVLand: React.Dispatch<React.SetStateAction<SMVLandFormData>>;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: () => void;
    newSMVLand: SMVLandFormData;
    // Reference options for selects
    locationalGroups: { lg_id: number; code: string; name: string }[];
    propertySubclasses: { psc_id: number; code: string; subclass_name: string }[];
    setLgSelected: React.Dispatch<React.SetStateAction<number>>;
    loading: boolean;
    inputError: string;
    setInputError: React.Dispatch<React.SetStateAction<string>>;
}

export const SMVLandAddDialog: React.FC<SMVLandDialogProps> = ({
    showSMVLandDialog,
    setShowSMVLandDialog,
    edit,
    approve,
    setNewSMVLand,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefresh,
    submitError,
    submitLoading,
    handleChange,
    handleSubmit,
    newSMVLand,
    locationalGroups,
    propertySubclasses,
    setLgSelected,
    loading,
    inputError,
    setInputError
}) => {
  const resetForm = () => {
    setNewSMVLand({
      smv_land_id: -1,
      ry_id: 0,
      lg_id: locationalGroups.length > 0 ? locationalGroups[0].lg_id : 0,
      psc_id: propertySubclasses.length > 0 ? propertySubclasses[0].psc_id : 0,
      unit_value: 0,
      effective_date: new Date().toISOString().split('T')[0],
      ordinance_no: '',
      approved_by: '',
      remarks: '',
    });
    setShowSMVLandDialog(false);
    setSubmitLoading(false);
    setApprove(false);
    setSubmitError(null);
    setLgSelected(-1);
    setInputError("");
  };

  return (
    <Dialog
      open={showSMVLandDialog}
      onClose={() => setShowSMVLandDialog(false)}
      title={edit ? 'Update Land SMV' : 'Create New Land SMV'} 
      error={inputError}
      actions={
        <div className="flex justify-end gap-3 pt-4">
          {!approve && (
            <button
              type="button"
              onClick={resetForm}
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
                resetForm();
                setRefresh((prev) => !prev);
              }}
            >
              <Save size={20} />
              Confirm
            </button>
          ) : (
            <button
              className={`px-4 py-2 bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                submitLoading ? 'bg-emerald-900' : 'hover:bg-emerald-700'
              }`}
              onClick={handleSubmit}
            >
              <Save size={20} />
              {submitLoading
                ? 'Processing'
                : edit
                ? 'Update'
                : 'Create'}{' '}
              Land SMV
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
          {/* Locational Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locational Group <span className="text-red-500">*</span>
            </label>
            <select
              name="lg_id"
              value={newSMVLand.lg_id}
              onChange={(e)=>{handleChange(e); setLgSelected(Number(e.target.value));}}
              className="disabled:cursor-not-allowed w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={edit}
            >
              {locationalGroups.map((lg) => (
                <option key={lg.lg_id} value={lg.lg_id}>
                  {lg.code} — {lg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Property Subclassification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subclassification <span className="text-red-500">*</span>
            </label>
            {
                loading? <MiniLoading />:
                <select
                name="psc_id"
                value={newSMVLand.psc_id}
                onChange={handleChange}
                className="disabled:cursor-not-allowed w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={edit}
                >
                {edit?
                    <option value={newSMVLand.psc_id}> { newSMVLand.psc_id } </option>:
                    <>{
                        propertySubclasses.length <= 0?
                            <option value={""}>No Available Subclass for this Location Group</option>:
                            <option value={""}>Select A Sub Classification</option>
                      }
                      {
                      propertySubclasses.map((psc) => (
                        <option key={psc.psc_id} value={psc.psc_id}>
                        {psc.code} — {psc.subclass_name}
                        </option>
                    ))}
                    </>
                }
                </select>
            }
          </div>

          {/* Unit Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Value (₱ per sqm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="unit_value"
              value={newSMVLand.unit_value || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date
            </label>
            <input
              type="date"
              name="effective_date"
              value={phFormatDate(newSMVLand.effective_date)}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Ordinance No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordinance No
            </label>
            <input
              type="text"
              name="ordinance_no"
              value={newSMVLand.ordinance_no}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Ord-2025-001"
            />
          </div>

          {/* Approved By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approved By
            </label>
            <input
              type="text"
              name="approved_by"
              value={newSMVLand.approved_by}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Name of approving authority"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={newSMVLand.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Additional notes..."
            />
          </div>
        </form>
      )}
    </Dialog>
  );
};


interface DeleteSMVLandDialogProps {
  showDelAU: boolean;
  setShowDelAU: (value: boolean) => void;
  approve: boolean;
  setApprove: (value: boolean) => void;
  submitError: string | null;
  setSubmitError: (value: string | null) => void;
  submitLoading: boolean;
  setSubmitLoading: (value: boolean) => void;
  newSMVLand: SMVLandFormData;
  setNewSMVLand: (value: SMVLandFormData) => void;
  setRefreshSelected: React.Dispatch<React.SetStateAction<boolean>>;
  handleDelete: () => void;
}

export const SMVLandDeleteDialog: React.FC<DeleteSMVLandDialogProps> = ({
    showDelAU,
    setShowDelAU,
    approve,
    setApprove,
    submitError,
    setSubmitError,
    submitLoading,
    setSubmitLoading,
    newSMVLand,
    setNewSMVLand,
    setRefreshSelected,
    handleDelete
}) => {
  const resetForm = () => {
    setNewSMVLand({
        smv_land_id: -1,
        ry_id: 0,
        lg_id: -1,
        psc_id: -1,
        unit_value: 0,
        effective_date: new Date().toISOString().split('T')[0],
        ordinance_no: '',
        approved_by: '',
        remarks: '',
      });
      setShowDelAU(false);
      setSubmitLoading(false);
      setApprove(false);
      setSubmitError(null);
      setRefreshSelected(prev=>!prev);
    };
    return (
        <Dialog
        open={showDelAU}
        onClose={() => setShowDelAU(false)}
        title="Delete Land SMV"
        actions={
            <div className="flex justify-end gap-3 pt-4">
            {!approve && (
                <button
                type="button"
                onClick={ resetForm }
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                <X size={20} />
                Cancel
                </button>
            )}

            {approve ? (
                <button
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                onClick={ resetForm }
                >
                <Save size={20} />
                Confirm
                </button>
            ) : (
                <button
                className={`px-4 py-2 bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                    submitError ? "hover:bg-red-700" : submitLoading ? "bg-red-900" : "hover:bg-red-700"
                }`}
                onClick={handleDelete}
                >
                <Trash2 size={20} />
                Delete Land SMV
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
            Are you sure you want to delete this land SMV [{newSMVLand.smv_land_id}]?
            </p>
        )}
        </Dialog>
    );
}

interface SMVBuildingAddDialogProps {
    showSMVBuildingDialog: boolean;
    setShowSMVBuildingDialog: (show: boolean) => void;
    edit: boolean;
    approve: boolean;
    setNewSMVBuilding: React.Dispatch<React.SetStateAction<SMVBuildingFormData>>;
    setSubmitLoading: (loading: boolean) => void;
    setApprove: (approve: boolean) => void;
    setSubmitError: (error: string | null) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: () => Promise<void>;
    newSMVBuilding: SMVBuildingFormData;
    propertyClassifications: PropertyClassification[];
    buildingKinds: BuildingKind[];
    loading: boolean;
    inputError: string;
    setInputError: (error: string) => void;
}

export const SMVBuildingAddDialog: React.FC<SMVBuildingAddDialogProps> = ({
    showSMVBuildingDialog,
    setShowSMVBuildingDialog,
    edit,
    approve,
    setNewSMVBuilding,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefresh,
    submitError,
    submitLoading,
    handleChange,
    handleSubmit,
    newSMVBuilding,
    propertyClassifications,
    inputError,
    setInputError,
}) => {
    const [b_kinds, setb_kinds] = useState<BuildingKind[]>([]);
    const [s_class, sets_class] = useState(-1);
    const [loading, setLoading] = useState(true);
    const handleClose = () => {
        if (approve) {
          
          setRefresh(prev => !prev);
        }
        setShowSMVBuildingDialog(false);
        setApprove(false);
        setSubmitError(null);
        setInputError('');
        setNewSMVBuilding({
            ry_id: 0,
            pc_id: -1,
            bk_id: -1,
            unit_value: 0,
            effective_date: new Date().toISOString().split('T')[0],
            ordinance_no: '',
            approved_by: '',
            remarks: '',
        });
        sets_class(-1);
    };

    async function fetchClassifications(){
      setLoading(true);
      const res = await api.get('smv/stList', { params: { bk_id: s_class }});
      setb_kinds(res.data.data);
      setLoading(false);
    }

    useEffect(()=>{
      fetchClassifications();
    }, [s_class]);
    

    if (!showSMVBuildingDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {edit ? 'Edit Building Market Value' : 'Add Building Market Value'}
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
                                {edit ? 'Building Market Value Updated!' : 'Building Market Value Added!'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The building market value has been {edit ? 'updated' : 'added'} successfully.
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
                                {/* Property Classification */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Building Kind <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="bk_id"
                                        value={newSMVBuilding.bk_id}
                                        onChange={(e)=>{handleChange(e); sets_class(Number(e.target.value));}}s
                                        className="disabled:cursor-not-allowed w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        disabled={edit}
                                    >
                                        <option value="-1" disabled>-- Select Classification --</option>
                                        {propertyClassifications.map((item) => (
                                            <option key={item.bk_id} value={item.bk_id}>
                                                {item.code} - {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Building Kind */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Structure Type <span className="text-red-500">*</span>
                                    </label>
                                    {loading ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                            <span className="text-gray-400">Loading building kinds...</span>
                                        </div>
                                    ) : (
                                        <select
                                            name="st_id"
                                            value={newSMVBuilding.st_id}
                                            onChange={handleChange}
                                            className="disabled:cursor-not-allowed w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            disabled={edit}
                                        >
                                            {
                                              edit?
                                                <option value={newSMVBuilding.st_id}> { newSMVBuilding.bk_name } </option>:
                                              s_class < 0? 
                                                <option value="-1" >-- Select Building Kind --</option>:
                                                b_kinds.length < 1? 
                                                <option value="-1">-- No Available Option --</option>:
                                                <>
                                                  <option value="-1">-- Select Structural Type --</option>
                                                  {b_kinds.map((item, index) => (
                                                      <option key={index} value={item.st_id}>
                                                          {item.code} - {item.name}
                                                      </option>
                                                  ))}
                                                </>
                                            }
                                        </select>
                                    )}
                                </div>

                                {/* Unit Value */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Unit Value (per sqm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="unit_value"
                                        value={newSMVBuilding.unit_value || 0}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 22000.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Depreciation Rate */}
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Depreciation Rate <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="depreciation_rate"
                                        value={newSMVBuilding.depreciation_rate || 0}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 10.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div> */}

                                {/* Effective Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Effective Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="effective_date"
                                        value={phFormatDate(newSMVBuilding.effective_date || '')}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Ordinance No */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ordinance No.
                                    </label>
                                    <input
                                        type="text"
                                        name="ordinance_no"
                                        value={newSMVBuilding.ordinance_no || ''}
                                        onChange={handleChange}
                                        maxLength={50}
                                        placeholder="e.g., ORD-2024-001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Approved By */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Approved By
                                    </label>
                                    <input
                                        type="text"
                                        name="approved_by"
                                        value={newSMVBuilding.approved_by || ''}
                                        onChange={handleChange}
                                        maxLength={100}
                                        placeholder="Name of approving authority"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks
                                    </label>
                                    <textarea
                                        name="remarks"
                                        value={newSMVBuilding.remarks || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Additional notes or comments..."
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
                            {edit ? 'Update' : 'Add'} Building SMV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


interface DeleteSMVDialogProps {
    showDeleteDialog: boolean;
    setShowDeleteDialog: (show: boolean) => void;
    approve: boolean;
    setApprove: (approve: boolean) => void;
    submitLoading: boolean;
    submitError: string | null;
    handleDelete: () => Promise<void>;
    itemType: string; // 'Land', 'Building', or 'Machinery'
    itemName: string; // Display name of the item being deleted
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DeleteSMVDialog: React.FC<DeleteSMVDialogProps> = ({
    showDeleteDialog,
    setShowDeleteDialog,
    approve,
    setApprove,
    submitLoading,
    submitError,
    handleDelete,
    itemType,
    itemName,
    setRefresh
}) => {
    const handleClose = () => {
        setShowDeleteDialog(false);
        setApprove(false);
        setRefresh(prev=>!prev);
    };

    if (!showDeleteDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Delete {itemType} Market Value
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
                                The {itemType.toLowerCase()} market value has been deleted successfully.
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
                                    You are about to delete the following {itemType.toLowerCase()} market value:
                                </p>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm font-medium text-gray-900">{itemName}</p>
                                </div>
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

// ============= MODIFY DIALOG =============
interface SMVMachineryFormData {
    smv_machinery_id?: number;
    ry_id: number;
    mt_id: number;
    base_value: number;
    depreciation_rate: number;
    effective_date: string;
    ordinance_no: string;
    approved_by: string;
    remarks: string;
    mt_name: string;
}

interface MachineryType {
    mt_id: number;
    code: string;
    name: string;
    description: string | null;
}

interface SMVMachineryModifyDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    edit: boolean;
    approve: boolean;
    setNewSMVMachinery: React.Dispatch<React.SetStateAction<SMVMachineryFormData>>;
    setSubmitLoading: (loading: boolean) => void;
    setApprove: (approve: boolean) => void;
    setSubmitError: (error: string | null) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    submitError: string | null;
    submitLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: () => Promise<void>;
    newSMVMachinery: SMVMachineryFormData;
    machineryTypes: MachineryType[];
    loading: boolean;
    inputError: string;
    setInputError: (error: string) => void;
}

export const SMVMachineryModifyDialog: React.FC<SMVMachineryModifyDialogProps> = ({
    showDialog,
    setShowDialog,
    edit,
    approve,
    setNewSMVMachinery,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefresh,
    submitError,
    submitLoading,
    handleChange,
    handleSubmit,
    newSMVMachinery,
    machineryTypes,
    loading,
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
        setRefresh(prev=>!prev);
    };

    if (!showDialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {edit ? 'Edit Machinery Market Value' : 'Add Machinery Market Value'}
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
                                {edit ? 'Machinery Market Value Updated!' : 'Machinery Market Value Added!'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                The machinery market value has been {edit ? 'updated' : 'added'} successfully.
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
                                {/* Machinery Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Machinery Type <span className="text-red-500">*</span>
                                    </label>
                                    {loading ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                            <span className="text-gray-400">Loading machinery types...</span>
                                        </div>
                                    ) : (
                                        <select
                                            name="mt_id"
                                            value={newSMVMachinery.mt_id}
                                            onChange={handleChange}
                                            className="disabled:cursor-not-allowed w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            disabled={edit}
                                        >
                                            {edit?
                                                <option value="-1"> { newSMVMachinery.mt_name } </option>:
                                                <>
                                                    {
                                                        machineryTypes.length < 1?
                                                            <option value="-1">No Available Machinery Type</option>:
                                                            <option value="-1">Select Machinery Type</option>
                                                    }
                                                    {machineryTypes.map((item) => (
                                                        <option key={item.mt_id} value={item.mt_id}>
                                                            {item.code} - {item.name}
                                                        </option>
                                                    ))}
                                                </>
                                            }
                                        </select>
                                    )}
                                </div>

                                {/* Base Value */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Unit Value <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="unit_value"
                                        value={newSMVMachinery.unit_value || 0}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 550000.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Base value for depreciation calculation</p>
                                </div>

                                {/* Depreciation Rate */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Depreciation Rate (% per year) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        name="depreciation_rate"
                                        value={newSMVMachinery.depreciation_rate || 0}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 10.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Annual depreciation percentage</p>
                                </div>

                                {/* Effective Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Effective Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="effective_date"
                                        value={phFormatDate(newSMVMachinery.effective_date  || '')}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Ordinance No */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ordinance No.
                                    </label>
                                    <input
                                        type="text"
                                        name="ordinance_no"
                                        value={newSMVMachinery.ordinance_no || ''}
                                        onChange={handleChange}
                                        maxLength={50}
                                        placeholder="e.g., ORD-2024-001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Approved By */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Approved By
                                    </label>
                                    <input
                                        type="text"
                                        name="approved_by"
                                        value={newSMVMachinery.approved_by || ''}
                                        onChange={handleChange}
                                        maxLength={100}
                                        placeholder="Name of approving authority"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks
                                    </label>
                                    <textarea
                                        name="remarks"
                                        value={newSMVMachinery.remarks || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Additional notes or comments..."
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
                            {edit ? 'Update' : 'Add'} Machinery SMV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= DELETE DIALOG =============
interface SMVMachineryDeleteDialogProps {
    showDeleteDialog: boolean;
    setShowDeleteDialog: (show: boolean) => void;
    approve: boolean;
    setApprove: (approve: boolean) => void;
    submitLoading: boolean;
    submitError: string | null;
    setSubmitError: (error: string | null) => void;
    handleDelete: () => Promise<void>;
    machineryItem: {
        machinery_type: string;
        base_value: number;
        depreciation_rate: number;
    } | null;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SMVMachineryDeleteDialog: React.FC<SMVMachineryDeleteDialogProps> = ({
    showDeleteDialog,
    setShowDeleteDialog,
    approve,
    setApprove,
    submitLoading,
    submitError,
    setSubmitError,
    handleDelete,
    machineryItem,
    setRefresh
}) => {
    const handleClose = () => {
        setShowDeleteDialog(false);
        setApprove(false);
        setSubmitError(null);
        setRefresh(prev=>!prev);
    };

    if (!showDeleteDialog) return null;

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Delete Machinery Market Value
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
                                The machinery market value has been deleted successfully.
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
                                    You are about to delete the following machinery market value:
                                </p>
                                {machineryItem && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            {machineryItem.machinery_type}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Base Value: {formatCurrency(machineryItem.base_value)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Depreciation: {machineryItem.depreciation_rate}% per year
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