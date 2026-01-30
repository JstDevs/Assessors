import React from "react";
import { X, User, Info } from "lucide-react";
import type { RevisionYear, RevisionYearPreviewForm } from "../structures/RevisionYear.tsx";
import { PreviewField, formatDate } from "../common/Tools.tsx";


interface PreviewGRProps {
  showForm: boolean;
  formData: RevisionYearPreviewForm;
  resetForm: () => void;
}

const Preview_GR: React.FC<PreviewGRProps> = ({
  showForm,
  formData,
  resetForm,
}) => {
if (!showForm) return null;

return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {"Preview"}
          </h2>
          <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PreviewField label="Revision Code" value={formData.revision_code || ''} />
          <PreviewField label="Year" value={formData.year || ""} />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <PreviewField label="Revision Year ID" value={formData.ry_id || ""} />
          <PreviewField label="TD Prefix" value={formData.td_prefix || ""} />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.active}
              disabled
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Set as Active</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            disabled
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>

        {/* Assessor Info */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <User size={20} />
            Assessor Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewField label="City Assessor Name" value={formData.city_assessor_name || ""} />
            <PreviewField label="Position" value={formData.city_assessor_position || ""} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewField label="Assistant City Assessor Name" value={formData.asst_city_assessor_name || ""} />
            <PreviewField label="Position" value={formData.asst_city_assessor_position || ""} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewField label="Provincial Assessor Name" value={formData.provincial_assessor_name || ""} />
            <PreviewField label="Position" value={formData.provincial_assessor_position || ""} />
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Info size={20} />
            Period Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewField label="Start Date" value={formatDate(formData.start_date) || ""} />
            <PreviewField label="End Date" value={formatDate(formData.end_date) || ""} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewField label="Created By" value={formData.created_by || ""} />
            <PreviewField label="Created At" value={formatDate(formData.created_at) || ""} />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default Preview_GR;