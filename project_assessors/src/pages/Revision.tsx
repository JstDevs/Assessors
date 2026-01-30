import type React from "react";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Check, X, Calendar, User, Eye, FileText, Tag } from "lucide-react";
import api from '../../axiosBase.ts'
import Preview_GR from "../modals/Preview_GR.tsx";
import type { RevisionYear, RevisionYearPreviewForm } from "../structures/RevisionYear.tsx";
import Modify_GR from "../modals/Modify_GR.tsx";
import Delete_GR from "../modals/Delete_GR.tsx";
import Loading from "../common/Loading.tsx";
import { formatDate } from "../common/Tools.tsx";
import Dialog from "../common/Dialog.tsx";
import type { Future } from "react-router-dom";

const GeneralRevision: React.FC = () => {

    const [revisionYears, setRevisionYears] = useState<RevisionYear[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [mainError, setMainError] = useState<string | null>(null);
    const [dialoagLoading, setDialogLoading] = useState<boolean>(false);
    const [showDialog, setShowDialog] = useState(false);
    const [approve, setApprove] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isStatus, setIsStatus] = useState<boolean>(false);
    const handleConfirm = async () => {
        setDialogLoading(true);
        setError(null);
        setApprove(false);

        try{
            const res = isStatus? 
                await api.put('ry/active', { ry_id: activatingRevision?.ry_id }) : 
                await api.delete("ry/remove", { params: { ry_id: deletingRevision?.ry_id } });
            console.log(res.data);
            setApprove(true);
        }catch(err){   
            setError( isStatus? `Error in Updating ${activatingRevision?.revision_code}!` : `Error in deleting ${deletingRevision?.revision_code}!`)
            console.log(err);
        }finally{
            setDialogLoading(false);
        }
    }
    
    async function getList(){
        setLoading(true);
        setMainError(null);
        try{
            const res = await api.get('ry/list');
            setRevisionYears(res.data);
            setLoading(false);
        }catch(e){
            setMainError("Internal Server Error!");
            console.log(e);
        }
    } 
    useEffect(()=>{
        getList();
    },[refresh])

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showForm, setShowForm] = useState<boolean>(false);
    const [showPrevForm, setShowPrevForm] = useState<boolean>(false);
    const [deletingRevision, setDeletingRevision] = useState<RevisionYear | null>(null);
    const [activatingRevision, setActivatingRevision] = useState<RevisionYear | null>(null);
    const [isEdit, setIsEdit] = useState<boolean>(false); 


    const [previewFormData, setPreviewFormData] = useState<RevisionYearPreviewForm>({
        ry_id: -1,
        revision_code: "",
        year: "",
        description: "",
        td_prefix: "",
        city_assessor_name: "",
        city_assessor_position: "",
        asst_city_assessor_name: "",
        asst_city_assessor_position: "",
        provincial_assessor_name: "",
        provincial_assessor_position: "",
        start_date: "",
        end_date: "",
        created_by: "",
        created_at: "",
        active: false
    });

    // Filter revisions based on search
    const filteredRevisions = revisionYears.filter(revision =>
        revision.revision_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revision.year.toString().includes(searchTerm) ||
        (revision.description && revision.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Reset form
    const resetForm = (close:boolean = true): void => {
        setPreviewFormData({
            ry_id: -1,
            revision_code: "",
            year: 0,
            description: "",
            td_prefix: "",
            city_assessor_name: "",
            city_assessor_position: "",
            asst_city_assessor_name: "",
            asst_city_assessor_position: "",
            provincial_assessor_name: "",
            provincial_assessor_position: "",
            start_date: "",
            end_date: "",
            created_by: "",
            created_at: "",
            active: false
        });
        if(close)
            setShowForm(false);
    };

    const closePrevForm = ():void => {
        setShowPrevForm(false);
    }

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value, type } = e.target;
        setPreviewFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }));
    };

    // Handle add new revision
    const handleAddRevision = (): void => {
        setShowForm(true);
        setIsEdit(false);
        resetForm(false);
    };

    // Handle edit revision
    const handleEditRevision = (revision: RevisionYear): void => {
        setIsEdit(true);
        setPreviewFormData({
            ry_id: revision.ry_id,
            revision_code: revision.revision_code,
            year: revision.year,
            description: revision.description || "",
            td_prefix: revision.td_prefix,
            city_assessor_name: revision.city_assessor_name || "",
            city_assessor_position: revision.city_assessor_position || "",
            asst_city_assessor_name: revision.asst_city_assessor_name || "",
            asst_city_assessor_position: revision.asst_city_assessor_position || "",
            provincial_assessor_name: revision.provincial_assessor_name || "",
            provincial_assessor_position: revision.provincial_assessor_position || "",
            start_date: revision.start_date || "",
            end_date: revision.end_date || "",
            created_by: revision.created_by,
            created_at: revision.created_at,
            active: revision.active
        });
        setShowForm(true);
    };

    
    const handlePreviewRevision = (revision: RevisionYear): void => {
        setPreviewFormData({
            ry_id: revision.ry_id,
            revision_code: revision.revision_code,
            year: revision.year,
            description: revision.description || "",
            td_prefix: revision.td_prefix,
            city_assessor_name: revision.city_assessor_name || "",
            city_assessor_position: revision.city_assessor_position || "",
            asst_city_assessor_name: revision.asst_city_assessor_name || "",
            asst_city_assessor_position: revision.asst_city_assessor_position || "",
            provincial_assessor_name: revision.provincial_assessor_name || "",
            provincial_assessor_position: revision.provincial_assessor_position || "",
            start_date: revision.start_date || "",
            end_date: revision.end_date || "",
            created_by: revision.created_by,
            created_at: revision.created_at,
            active: revision.active
        });
        setShowPrevForm(true);
    };

    // Handle delete revision
    const handleDeleteRevision = (revision: RevisionYear): void => {
        setDeletingRevision(revision);
        setIsStatus(false);
        setShowDialog(true);
    };

    // Handle set active revision
    const handleSetActive = (revision: RevisionYear): void => {
        setActivatingRevision(revision);
        setIsStatus(true);
        setShowDialog(true);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">General Revision Management</h1>
                <p className="text-gray-600">Manage revision years and assessment periods</p>
            </div>

            {
            mainError? <p className="text-red-600 text-center"> { mainError } </p>:
                loading? <Loading />:
                    <>
                        {/* Search and Add Button */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search revision years..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <button
                                    onClick={handleAddRevision}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add New Revision
                                </button>
                            </div>
                        </div>

                        {/* Revision Years Table */}
                        <div className="bg-white rounded-lg w-full shadow-sm border border-gray-200">
                            <div className="overflow-x-auto w-full max-h-80 overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th
                                                colSpan={6}
                                                className="absolute bottom-0 left-0 right-0 border-b-2 border-gray-300 "
                                            />
                                        </tr>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revision Code</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TD Prefix</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 ">
                                        {filteredRevisions.map((revision) => (
                                            <tr key={revision.ry_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                            revision.active 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {revision.active ? 'Active' : 'Inactive'}
                                                        </span>
                                                        {!revision.active && (
                                                            <button
                                                                onClick={() => handleSetActive(revision)}
                                                                className="text-emerald-600 hover:text-emerald-800 text-xs"
                                                                title="Set as active"
                                                            >
                                                                Activate
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Tag size={16} className="text-emerald-600" />
                                                        <span className="text-sm font-medium text-gray-900">{revision.revision_code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{revision.year}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-mono">
                                                        {revision.td_prefix}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        <span>
                                                            {formatDate(revision.start_date || "") || 'Not Set'} - {formatDate(revision.end_date || "") || 'Not Set'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handlePreviewRevision(revision)}
                                                            className="text-cyan-600 hover:text-cyan-800 transition-colors"
                                                            title="Edit revision"
                                                        >
                                                            <Eye size={24} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditRevision(revision)}
                                                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                            title="Edit revision"
                                                        >
                                                            <Edit size={24} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRevision(revision)}
                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                            title="Delete revision"
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRevisions.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                    No revision years found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <Preview_GR
                            showForm={showPrevForm}
                            formData={previewFormData}
                            resetForm={closePrevForm}
                        />
                        <Modify_GR
                            showForm={showForm}
                            formData={previewFormData}
                            handleInputChange={handleInputChange}
                            resetForm={resetForm}
                            isEdit={isEdit}
                            setRefresh={setRefresh}
                        />
                        <Dialog
                            open={showDialog}
                            onClose={() => {
                                setShowDialog(false);
                                setLoading(false);
                                setError(null);
                                setApprove(false);
                            }}
                            title={isStatus? "Update Active Revision Year" : "Delete Revision"}
                            actions={
                                <>
                                    {!dialoagLoading && !approve && (
                                        <button
                                            onClick={() => setShowDialog(false)}
                                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    )}

                                    {!approve && (
                                        <button
                                            disabled={dialoagLoading}
                                            onClick={handleConfirm}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {dialoagLoading ? "Processing..." : "Confirm"}
                                        </button>
                                    )}

                                    {approve && (
                                    <button
                                        onClick={() => {
                                            setShowDialog(false);
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
                                dialoagLoading? <Loading/> :
                                error? <p className="text-red-600">{error}</p> :
                                approve? (isStatus? <p> { `[${activatingRevision?.revision_code}] is Activated!` } </p> : <p> {`[${deletingRevision?.revision_code}] Deleted Successfully!`} </p> ) :
                                (isStatus? <p>{ `Are you sure you want to change the active Revision year to [${activatingRevision?.revision_code}]?` }</p> : <p>{`Are you sure you want to delete revision [${deletingRevision?.revision_code}]?`}</p>)
                                
                            }
                        </Dialog>
                    </>
            }
        </div>
    );
};

export default GeneralRevision;