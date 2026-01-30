import React from "react";
import { Trash2 } from "lucide-react"; 
import type { RevisionYear } from "../structures/RevisionYear";

interface DeleteGRProps {
    showDeleteModal: boolean;
    deletingRevision: RevisionYear | null;
    setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    confirmDelete: () => void;
}


const Delete_GR: React.FC<DeleteGRProps> = ({showDeleteModal, deletingRevision, setShowDeleteModal, confirmDelete})=>{
    return(
        <>
        {showDeleteModal && deletingRevision && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Revision Year</h3>
                                    <p className="text-gray-600">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete revision <strong>{deletingRevision.revision_code}</strong>?
                            </p>
                            <div className="flex items-center justify-end gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

}

export default Delete_GR;