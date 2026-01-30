import React, { useState } from "react";
import { X, User, Check, Info } from "lucide-react";
import type { RevisionYear, RevisionYearPreviewForm } from "../structures/RevisionYear.tsx";
import { PreviewField, formatDate } from "../common/Tools.tsx";
import api from "../../axiosBase.ts";
import Dialog from "../common/Dialog.tsx";
import Loading from "../common/Loading.tsx";

interface EditGRProps {
    showForm: boolean;
    isEdit: boolean;
    formData: RevisionYearPreviewForm;
    resetForm: () => void;
    handleInputChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const Edit_GR: React.FC<EditGRProps> = ({
    showForm,
    isEdit,
    resetForm,
    formData,
    handleInputChange,
    setRefresh
}) => {
    const [loading, setLoading] = useState(false); // controls dialog loading state
    const [showDialog, setShowDialog] = useState(false); // controls dialog open/close
    const [approve, setApprove] = useState(false); // success message
    const [error, setError] = useState<string | null>(null); // error message

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        setShowDialog(true);
        setApprove(false);
        setError(null);
    };

  // Actual API call when user clicks Confirm in dialog
    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        setApprove(false);

        const payload = {
            rc: formData.revision_code,
            year: Number(formData.year),
            td_pref: formData.td_prefix,
            desc: formData.description || undefined,
            city_ass: formData.city_assessor_name || undefined,
            city_pos: formData.city_assessor_position || undefined,
            ass_city_ass: formData.asst_city_assessor_name || undefined,
            ass_city_pos: formData.asst_city_assessor_position || undefined,
            pro_ass: formData.provincial_assessor_name || undefined,
            pro_pos: formData.provincial_assessor_position || undefined,
            s_date: formData.start_date || undefined,
            e_date: formData.end_date || undefined,
            by: "ChasDev",
            ...(isEdit && { ry_id: formData.ry_id })
        };

        try {
            const res = isEdit
            ? await api.put("ry/update", payload)
            : await api.post("ry/create", payload);

            console.log(isEdit ? "Revision updated:" : "Revision created:", res.data);
            setApprove(true);
        } catch (err) {
            console.error(
                isEdit ? "Failed to update revision:" : "Failed to create revision:",
                err
            );
            setError(
            isEdit
                ? "Failed to update revision. Please try again."
                : "Failed to create revision. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
        {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isEdit ? "Edit Revision Year" : "Add New Revision Year"}
                        </h2>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Fields */}
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Revision Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="revision_code"
                                value={formData.revision_code}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g., 2025-REV"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleInputChange}
                                required
                                min="2000"
                                max="3000"
                                placeholder="2025"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        { isEdit? <PreviewField label="Revision Year ID" value={formData.ry_id || ""} /> : <></> }
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                TD Prefix <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="td_prefix"
                                value={formData.td_prefix}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g., 25-"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        { isEdit? <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700">Set as Active</span>
                            </label>
                        </div>: <></>}
                        
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Description of this revision year..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Assessor Information */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <User size={20} />
                            Assessor Information
                        </h3>
                        
                        {/* City Assessor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City Assessor Name</label>
                                <input
                                    type="text"
                                    name="city_assessor_name"
                                    value={formData.city_assessor_name}
                                    onChange={handleInputChange}
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                <input
                                    type="text"
                                    name="city_assessor_position"
                                    value={formData.city_assessor_position}
                                    onChange={handleInputChange}
                                    placeholder="Position title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Assistant City Assessor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assistant City Assessor Name</label>
                                <input
                                    type="text"
                                    name="asst_city_assessor_name"
                                    value={formData.asst_city_assessor_name}
                                    onChange={handleInputChange}
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                <input
                                    type="text"
                                    name="asst_city_assessor_position"
                                    value={formData.asst_city_assessor_position}
                                    onChange={handleInputChange}
                                    placeholder="Position title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Provincial Assessor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Provincial Assessor Name</label>
                                <input
                                    type="text"
                                    name="provincial_assessor_name"
                                    value={formData.provincial_assessor_name}
                                    onChange={handleInputChange}
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                <input
                                    type="text"
                                    name="provincial_assessor_position"
                                    value={formData.provincial_assessor_position}
                                    onChange={handleInputChange}
                                    placeholder="Position title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Info size={20} />
                            Period Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        { 
                            isEdit? 
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PreviewField label="Created By" value={formData.created_by || ""} />
                                <PreviewField label="Created At" value={formatDate(formData.created_at) || ""} />
                            </div>:<></>
                        }
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-all duration-300 ease-in-out transform"
                    >
                        <Check size={16} />
                        {isEdit ? "Update" : "Create"} Revision
                    </button>
                    </div>
                </form>
            </div>

            {/* Creation Dialog */}
            <Dialog
                open={showDialog}
                onClose={() => {
                    setShowDialog(false);
                    setLoading(false);
                    setError(null);
                    setApprove(false);
                }}
                title={isEdit? "Update Revision":"Create New Revision"}
                actions={
                    <>
                        {!loading && !approve && (
                            <button
                                onClick={() => setShowDialog(false)}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}

                        {!approve && (
                            <button
                                disabled={loading}
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? "Processing..." : "Confirm"}
                            </button>
                        )}

                        {approve && (
                        <button
                            onClick={() => {
                                setShowDialog(false);
                                resetForm();
                                setApprove(false);
                                setRefresh(prev=>!prev);
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                            Done
                        </button>
                        )}
                    </>
                }
            >
                {
                    loading? <Loading/> :
                    error? <p className="text-red-600">{error}</p> :
                    approve? (  <p className="text-emerald-700 font-medium">
                                    {isEdit
                                    ? "Revision updated successfully!"
                                    : "Revision created successfully!"}
                                </p>):
                                <p>
                                    {isEdit
                                        ? `Are you sure you want to update revision [${formData.revision_code}]?`
                                        : "Are you sure you want to create a new revision?"}
                                </p>
                }
            </Dialog>
            </div>
        )}
        </>
    );
};

export default Edit_GR;

