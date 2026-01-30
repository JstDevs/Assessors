import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Edit, Trash2, Plus, Save, X, Loader, Search, FileText, Tag } from 'lucide-react';
import api from '../../axiosBase';

// --- INTERFACES & TYPES ---

interface TransactionalCode {
    tc_id?: string;
    transaction_name: string;
    transaction_code: string;
    transaction_description: string;
    created_at?: Date;
    updated_at?: Date;
}

// --- MOCK API ---
// const mockApi = {
//     get: async () => {
//         await new Promise(resolve => setTimeout(resolve, 500));
//         return {
//             data: [
//                 { tc_id: '1', transaction_name: 'Land Transfer', transaction_code: 'TC-LND-001', transaction_description: 'Transfer of land ownership between parties' },
//                 { tc_id: '2', transaction_name: 'Building Permit', transaction_code: 'TC-BLD-002', transaction_description: 'Application for building construction permit' },
//                 { tc_id: '3', transaction_name: 'Property Valuation', transaction_code: 'TC-VAL-003', transaction_description: 'Assessment and valuation of property' }
//             ]
//         };
//     },
//     post: async (code: TransactionalCode) => {
//         await new Promise(resolve => setTimeout(resolve, 500));
//         return { data: code };
//     },
//     delete: async (id: string) => {
//         await new Promise(resolve => setTimeout(resolve, 500));
//     }
// };

// --- CRUD LOGIC HOOK ---

const useTransactionalCodes = () => {
    const [codes, setCodes] = useState<TransactionalCode[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCodes = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedCodes = await api.get('tc/');
            fetchedCodes.data.sort((a, b) => (a.transaction_name || '').localeCompare(b.transaction_name || ''));
            setCodes(fetchedCodes.data);
        } catch (error) {
            console.error("Error fetching codes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCodes();
    }, [fetchCodes]);

    const saveCode = useCallback(async (code: TransactionalCode) => {
        try {
            await api.post('tc/', code);
            await fetchCodes();
        } catch (error) {
            console.error("Error saving code:", error);
        }
    }, [fetchCodes]);

    const deleteCode = useCallback(async (id: string) => {
        try {
            if (window.confirm("Are you sure you want to delete this code? This action cannot be undone.")) {
                await mockApi.delete(id);
                await fetchCodes();
            }
        } catch (error) {
            console.error("Error deleting code:", error);
            alert("Failed to delete transactional code. Check console for details.");
        }
    }, [fetchCodes]);

    return { codes, loading, saveCode, deleteCode };
};

// --- MODAL/FORM COMPONENT ---

interface EditModalProps {
    code: TransactionalCode | null;
    onClose: () => void;
    onSave: (code: TransactionalCode) => Promise<void>;
}

const initialFormState: TransactionalCode = {
    transaction_name: '',
    transaction_code: '',
    transaction_description: ''
};

const EditModal: React.FC<EditModalProps> = ({ code, onClose, onSave }) => {
    const [formData, setFormData] = useState<TransactionalCode>(initialFormState);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (code) {
            setFormData(code);
        } else {
            setFormData(initialFormState);
        }
    }, [code]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.transaction_name || !formData.transaction_code) {
            alert('Name and Code are required fields.');
            return;
        }

        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold">{code ? 'Edit Transactional Code' : 'Create New Code'}</h3>
                        <p className="text-emerald-100 text-sm mt-1">Fill in the details below</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-white/20 transition-all hover:rotate-90 duration-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="transaction_name" className="block text-sm font-semibold text-gray-700">
                            Transaction Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="transaction_name"
                            id="transaction_name"
                            value={formData.transaction_name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-300"
                            placeholder="e.g., Land Transfer"
                        />
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                        <label htmlFor="transaction_code" className="block text-sm font-semibold text-gray-700">
                            Transaction Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                name="transaction_code"
                                id="transaction_code"
                                value={formData.transaction_code}
                                onChange={handleChange}
                                required
                                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-300 font-mono"
                                placeholder="e.g., TC-LND-TRN"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label htmlFor="transaction_description" className="block text-sm font-semibold text-gray-700">
                            Description <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <textarea
                            name="transaction_description"
                            id="transaction_description"
                            value={formData.transaction_description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-300 resize-none"
                            placeholder="A brief explanation of what this code is used for..."
                        />
                    </div>

                    {/* Footer / Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold disabled:opacity-50 hover:shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold flex items-center disabled:opacity-50 hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                            {isSaving ? (
                                <>
                                    <Loader size={20} className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" />
                                    Save Code
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const TransactionalCodes = () => {
    const { codes, loading, saveCode, deleteCode } = useTransactionalCodes();

    const [filterText, setFilterText] = useState('');
    const [editingCode, setEditingCode] = useState<TransactionalCode | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredCodes = useMemo(() => {
        if (!filterText) return codes;
        const lowerCaseFilter = filterText.toLowerCase();
        return codes.filter(code =>
            code.transaction_name.toLowerCase().includes(lowerCaseFilter) ||
            code.transaction_code.toLowerCase().includes(lowerCaseFilter) ||
            code.transaction_description.toLowerCase().includes(lowerCaseFilter)
        );
    }, [codes, filterText]);

    const handleCreate = () => {
        setEditingCode(null);
        setIsModalOpen(true);
    };

    const handleEdit = (code: TransactionalCode) => {
        setEditingCode(code);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingCode(null);
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-t-4 border-emerald-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-2xl">
                                <FileText className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Transactional Codes</h1>
                                <p className="text-gray-500 text-sm mt-1">Manage your transaction code system</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center font-semibold hover:scale-105 active:scale-95"
                        >
                            <Plus size={20} className="mr-2" />
                            New Code
                        </button>
                    </div>
                </div>

                {/* Stats Card */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-emerald-500">
                        <p className="text-sm text-gray-500 mb-1">Total Codes</p>
                        <p className="text-3xl font-bold text-gray-900">{codes.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 mb-1">Filtered Results</p>
                        <p className="text-3xl font-bold text-gray-900">{filteredCodes.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <p className="text-lg font-semibold text-emerald-600">Active</p>
                    </div>
                </div> */}

                {/* Main Content Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="relative max-w-md">
                            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, code, or description..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-300"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                <Loader size={36} className="animate-spin text-emerald-600" />
                            </div>
                            <p className="text-gray-600 font-medium">Loading transactional codes...</p>
                        </div>
                    ) : (
                        /* Table */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Transaction Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                                            Description
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredCodes.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                                        <FileText className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-600 font-medium mb-1">
                                                        {filterText ? "No results found" : "No codes yet"}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        {filterText ? "Try adjusting your search terms" : "Create your first transactional code to get started"}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCodes.map((code) => (
                                            <tr key={code.tc_id} className="hover:bg-emerald-50/50 transition-all duration-150 group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {code.transaction_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        {code.transaction_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate hidden lg:table-cell">
                                                    {code.transaction_description || <span className="italic text-gray-400">No description</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(code)}
                                                            className="p-2 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition-all duration-200 hover:scale-110"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => code.tc_id && deleteCode(code.tc_id)}
                                                            className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-100 transition-all duration-200 hover:scale-110"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <EditModal
                    code={editingCode}
                    onClose={handleCloseModal}
                    onSave={saveCode}
                />
            )}
        </div>
    );
};

export default TransactionalCodes;