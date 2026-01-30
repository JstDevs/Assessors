import React from "react";
import { X, Save, Trash2 } from "lucide-react";
import Dialog from "../../common/Dialog.tsx";
import Loading from "../../common/Loading.tsx";
import type { LocationalGroup } from "../../structures/Location.tsx";

interface ModifyLocationDialogProps {
    openAdd: boolean;
    setOpenAdd: React.Dispatch<React.SetStateAction<boolean>>;
    edit: boolean;
    setNewLocational: React.Dispatch<React.SetStateAction<LocationalGroup>>;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleSubmit: React.MouseEventHandler<HTMLButtonElement>;
    approve: boolean;
    submitLoading: boolean;
    submitError: string | null;
    newLocational: LocationalGroup;
    handleChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => void;
}
export const ModifyLocationDialog: React.FC<ModifyLocationDialogProps> = ({
    openAdd,
    setOpenAdd,
    edit,
    approve, 
    setNewLocational,
    setSubmitLoading,
    setApprove,
    setSubmitError,
    setRefresh,
    submitLoading,
    handleSubmit,
    submitError,
    newLocational,
    handleChange
    
}) => {
    return (
        <Dialog
                open={openAdd}
                onClose={()=>setOpenAdd(false)}
                title={edit? 'Update Locational Group': 'Create new Locational Group'}
                actions={ 
                    <div className="flex justify-end gap-3 pt-4">
                        {
                            !approve?
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewLocational({
                                            lg_id: 0,
                                            ry_id: 0,
                                            code: "",
                                            name: "",
                                            description: "",
                                            active: false,
                                            zone_type: "PRIME"
                                        });
                                        setOpenAdd(false);
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
                                            setNewLocational({
                                                lg_id: 0,
                                                ry_id: 0,
                                                code: "",
                                                name: "",
                                                description: "",
                                                active: false,
                                                zone_type: "PRIME"
                                            });
                                            setOpenAdd(false);
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
                                        onClick={handleSubmit}
                                    >
                                        <Save size={20} />
                                        {submitLoading? "Processing": edit ? 'Update' : 'Create'} Locational Group
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
                                            Locational Group Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={newLocational.code}
                                            onChange={handleChange}
                                            required
                                            maxLength={10}
                                            placeholder="e.g., LG1, LG2"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* Class Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Locational Group Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={newLocational.name}
                                            onChange={handleChange}
                                            required
                                            maxLength={100}
                                            placeholder="Locational Group 1"
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
                                            value={newLocational.description ?? ""}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Optional description of the location group..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Zone Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="zone_type"
                                            value={newLocational.zone_type ?? "STANDARD"}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="PRIME">PRIME</option>
                                            <option value="STANDARD">STANDARD</option>
                                            <option value="SUBURBAN">SUBURBAN</option>
                                            <option value="RURAL">RURAL</option>
                                        </select>
                                    </div>
                                </form>
                }
        </Dialog>
    )
}
interface DeleteLocationDialogProps {
    openDel: boolean;
    setOpenDel: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setApprove: React.Dispatch<React.SetStateAction<boolean>>;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleDelete: () => Promise<void>;
    setNewLocational: React.Dispatch<React.SetStateAction<LocationalGroup>>;
    approve: boolean;
    submitLoading: boolean;
    submitError: string | null;
    name: string
}


export const DeleteLocationalDialog: React.FC<DeleteLocationDialogProps> = ({
    openDel,
    setOpenDel,
    approve,
    setApprove,
    submitError,
    setSubmitError,
    submitLoading,
    setSubmitLoading,
    setRefresh,
    handleDelete,
    setNewLocational,
    name
}) => {
    return (
        <Dialog
        open={openDel}
        onClose={() => setOpenDel(false)}
        title="Delete Actual Use"
        actions={
            <div className="flex justify-end gap-3 pt-4">
            {!approve && (
                <button
                type="button"
                onClick={() => {
                    setNewLocational({
                        lg_id: 0,
                        ry_id: 0,
                        code: "",
                        name: "",
                        description: "",
                        active: false,
                        zone_type: "PRIME"
                    });
                    setOpenDel(false);
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
                    setNewLocational({
                        lg_id: 0,
                        ry_id: 0,
                        code: "",
                        name: "",
                        description: "",
                        active: false,
                        zone_type: "PRIME"
                    });
                    setOpenDel(false);
                    setSubmitLoading(false);
                    setApprove(false);
                    setSubmitError(null);
                    setRefresh((prev) => !prev);
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
                onClick={handleDelete}
                >
                <Trash2 size={20} />
                Delete Locational Group
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
            Are you sure you want to delete this actual use [{name}]?
            </p>
        )}
        </Dialog>
    );
}