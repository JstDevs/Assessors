import React, { useState, useEffect, act } from 'react';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import api from '../../axiosBase.js';
import Loading from '../common/Loading.js';
import type { PropertyClassification, PropertySubclassification, ActualUse, PropertyClassificationForm } from '../structures/Properties.js';
import { DeleteActualUseDialog, DeleteClassificationDialog, DeleteSubClassificationDialog, ModifyActualUseDialog, ModifyClassificationDialog, ModifySubClassificationDialog } from '../dialogs/pcf/Dialogs.js';

const PropertyClassificationFile: React.FC = () => {
    const [selectedClassification, setSelectedClassification] = useState<PropertyClassification | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [subLoading, setSubLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [subError, setSubError] = useState<string>('');

    const [propertyClassifications, setPropertyClassification] = useState<PropertyClassification[]>([]);
    const [propertySubclassifications, setPropertySubclassifications] = useState<PropertySubclassification[]>([]);
    const [actualUses, setActualUses] = useState<ActualUse[]>([]);


    //dialogs
    const [openAddClass, setOpenAddClass] = useState<boolean>(false);
    const [openDelClass, setOpenDelClass] = useState<boolean>(false);
    const [showModifySClass, setShowModifySClass] = useState<boolean>(false);
    const [showDelSClass, setShowDelSClass] = useState<boolean>(false);
    const [showModifyAUClass, setShowModifyAUClass] = useState<boolean>(false);
    const [showDelAU, setShowDelAU] = useState<boolean>(false);


    //handlers
    const [approve, setApprove] = useState<boolean>(false);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [edit, setEdit] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [refreshSelected, setRefreshSelected] = useState<boolean>(false);
    const [newPropertyClassification, setNewPropertyClassification] = useState<PropertyClassificationForm>({
        pc_id: -1,
        code: "",
        classname: "",
        description: ""
    });
    const [newPropertySubClassification, setNewPropertySubClassification] = useState<PropertySubclassification>({
        psc_id: -1,
        pc_id: -1,
        code: "",
        subclass_name: "",
        description: "",
        valuation_factor: 0
    });
    const [newActualUse, setNewActualUse] = useState<ActualUse>({
        au_id: -1,
        pc_id: -1,
        psc_id: -1,
        code: "",
        use_name: "",
        taxable: false,
        strip_code: "",
        land_class: "",
        notes: "",
        effective_date: ""
    });

    //form handles
    const classificationHandleSubmit = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);

        if(edit){
            try{
                const res = await api.put('p/pupdate', {
                    pc_id: newPropertyClassification.pc_id,
                    code: newPropertyClassification.code,
                    classname: newPropertyClassification.classname,
                    description: newPropertyClassification.description || null
                });
                setApprove(true);
                setSubmitLoading(false);
            }catch(err){
                setSubmitError('Error in create new Property Classification!');
                console.log(err);
            }
        }else{
            try{
                const res = await api.post('p/padd', {
                    code: newPropertyClassification.code,
                    classname: newPropertyClassification.classname,
                    description: newPropertyClassification.description || null
                });
                setApprove(true);
                setSubmitLoading(false);
            }catch(err){
                setSubmitError('Error in create new Property Classification!');
                console.log(err);
            }
        }
    } 
    const subclassificationHandleSubmit = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);
        if(edit){
            try{
                const res = await api.put('p/spset', {
                    psc_id: newPropertySubClassification.psc_id,
                    pc_id: newPropertySubClassification.pc_id,
                    code: newPropertySubClassification.code,
                    subname: newPropertySubClassification.subclass_name,
                    description: newPropertySubClassification.description || null,
                    val_factor: newPropertySubClassification.valuation_factor
                });
                setApprove(true);
                setSubmitLoading(false);
            }catch(err){
                setSubmitError('Error in updating Property Sub Classification!');
                console.log(err);
            }
        }else{
            try{
                const res = await api.post('p/spadd', {
                    pc_id: selectedClassification?.pc_id,
                    code: newPropertySubClassification.code,
                    subname: newPropertySubClassification.subclass_name,
                    description: newPropertySubClassification.description || null,
                    val_factor: newPropertySubClassification.valuation_factor
                });
                setApprove(true);
                setSubmitLoading(false);
            }catch(err){
                setSubmitError('Error in create new Property Sub Classification!');
                console.log(err);
            }
        }
    }
    const classificationHandleDelete = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);
        try{
            await api.delete('p/pdel', { params:{ pc_id: newPropertyClassification.pc_id } } )
            setSubmitLoading(false);
            setApprove(true);
        }catch(err){
            setSubError("Error in deleting classification!");
            console.log(err);
        }
    }

    const classificationHandleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>):void => {
        const { name, value, type } = e.target;
        setNewPropertyClassification(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }));
    }
    const subClassificationHandleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>):void => {
        const { name, value, type } = e.target;
        setNewPropertySubClassification(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }));
    }
    const subClassificationHandleDelete = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);
        try{
            await api.delete('p/spdel', { params:{ psc_id: newPropertySubClassification.psc_id } } )
            setSubmitLoading(false);
            setApprove(true);
        }catch(err){
            setSubmitError("Error in deleting sub classification!");
            console.log(err);
        }
    }

    const actualUseHandleSubmit = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);

        try {
            if (edit) {
                await api.put("p/auset", {
                    au_id: newActualUse.au_id,
                    pc_id: selectedClassification?.pc_id,
                    psc_id: newActualUse.psc_id || null,
                    code: newActualUse.code,
                    use_name: newActualUse.use_name,
                    taxable: newActualUse.taxable,
                    exempt_percentage: newActualUse.exempt_percentage || 0,
                    assessment_level: newActualUse.assessment_level || 0,
                    notes: newActualUse.notes || null,
                });
            } else {
                await api.post("p/auadd", {
                    pc_id: selectedClassification?.pc_id,
                    psc_id: null, //direct null for now
                    code: newActualUse.code,
                    use_name: newActualUse.use_name,
                    taxable: newActualUse.taxable,
                    exempt_percentage: newActualUse.exempt_percentage || 0,
                    assessment_level: newActualUse.assessment_level || 0,
                    notes: newActualUse.notes || null,
                });
            }

            setApprove(true);
            setSubmitLoading(false);
        } catch (err) {
            setSubmitError(edit ? "Error updating Actual Use!" : "Error creating Actual Use!");
            console.log(err);
            setSubmitLoading(false);
        }
    };
    const actualUseHandleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewActualUse(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }))
    }
    const actualUseHandleDelete = async () => {
        setSubmitLoading(true);
        setApprove(false);
        setSubmitError(null);
        try{
            await api.delete('p/audel', { params:{ au_id: newActualUse.au_id } } )
            setSubmitLoading(false);
            setApprove(true);
        }catch(err){
            setSubmitError("Error in deleting Actual Use!");
            console.log(err);
        }
    }

    // async functions
    async function getProperties(){
        setLoading(true);
        setError('');    
        try{
            const res = await api.get('p/plist');
            setPropertyClassification(res.data);
            setLoading(false);
        }catch(err){
            setError('Error in fetching Property List!');
            console.log(err);
        }
    }
    async function getSubProperties(id:Number){
        setSubLoading(true);
        try{
            const ressc = await api.get('p/splist', { params: { pc_id: id } } );
            const resau = await api.get('p/aulist', { params: { pc_id: id } } );
            setPropertySubclassifications(ressc.data);
            setActualUses(resau.data);
            setSubLoading(false);
        }catch(err){
            setSubError('Error in getting Property information!');
            console.log(error);
        }
    }
    async function getActualUse(id:Number){
        setSubLoading(true);
        try{
            setSubLoading(false);
        }catch(err){
            setSubError('Error in getting Property information!');
            console.log(error);
        }
    }
    useEffect(()=>{
        getProperties();
    }, [refresh]);

    useEffect(()=>{
        getSubProperties(selectedClassification?.pc_id ?? 0);
        getActualUse(selectedClassification?.pc_id ?? 0);
    }, [refreshSelected]);

    // Search functionality
    const filteredClassifications: PropertyClassification[] = propertyClassifications.filter(item =>
        item.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClassificationClick = (classification: PropertyClassification): void => {
        setSelectedClassification(classification);
        getSubProperties(classification.pc_id);
        getActualUse(classification.pc_id);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    //CRUD Handling
    const handleAddNewClassification = (): void => {
        // Handle add new classification logic
        setOpenAddClass(true);
        setEdit(false);
    };

    const handleEditClassification = async (e:any, pc_id:Number): Promise<void> => {
        e.stopPropagation();
        setOpenAddClass(true);
        setEdit(true);
        setSubmitLoading(true);
        const result = await api.get('p/pget', { params:{ pc_id } });
        setNewPropertyClassification({
            pc_id: pc_id,
            code: result.data[0].code,
            classname: result.data[0].classname,
            description: result.data[0].description,
        });
        setSubmitLoading(false);
    };

    const handleDeleteClassification = (e: React.MouseEvent, classification: PropertyClassification): void => {
        e.stopPropagation();
        setNewPropertyClassification(classification);
        setOpenDelClass(true);
    };

    const handleAddSubclass = (): void => {
        setShowModifySClass(true);
        setEdit(false);
    };

    const handleEditSubclass = async (psc_id: number): Promise<void> => {
        setEdit(true);
        setShowModifySClass(true);
        setSubmitLoading(true);
        const result = await api.get('p/spget', { params:{ psc_id } });
        setNewPropertySubClassification({
            psc_id: result.data.psc_id,
            pc_id: result.data.pc_id,
            code: result.data.code,
            subclass_name: result.data.subclass_name,
            description: result.data.description,
            valuation_factor: result.data.valuation_factor
        });
        setSubmitLoading(false);
    };

    const handleDeleteSubclass = (subclass: PropertySubclassification): void => {
        setNewPropertySubClassification(subclass);
        setShowDelSClass(true);
    };

    const handleAddActualUse = (): void => {
        setShowModifyAUClass(true);
        setEdit(false);
    };

    const handleEditActualUse = async (au_id: number): Promise<void> => {
        setShowModifyAUClass(true);
        setEdit(true);
        setSubmitLoading(true);
        const res = await api.get('p/auget', { params: {au_id: au_id} });
        setNewActualUse(res.data);
        setSubmitLoading(false);
    };

    const handleDeleteActualUse = (actualUse: ActualUse): void => {
        setShowDelAU(true);
        setNewActualUse(actualUse);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Classification Management</h1>
                <p className="text-gray-600">Manage property classifications, subclassifications, and actual uses</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Property Classifications */}
                <div className="xl:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            
                            {
                                error?<p className="text-red-600 text-center">{error}</p> : 
                                    loading? <Loading />:
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-lg font-semibold text-gray-900">Property Classifications</h2>
                                                <button 
                                                    onClick={handleAddNewClassification}
                                                    className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={20} />
                                                    Add New
                                                </button>
                                            </div>
                                            
                                            {/* Search */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Search classifications..."
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                        </>
                            }
                        </div>

                        {
                            loading? <></>:
                            <div className="max-h-96 overflow-y-auto">
                                {filteredClassifications.map((classification) => (
                                    <div
                                        key={classification.pc_id}
                                        onClick={() => handleClassificationClick(classification)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            selectedClassification?.pc_id === classification.pc_id ? 'bg-emerald-50 border-emerald-200' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                                        {classification.code}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{classification.classname}</h3>
                                                        <p className="text-sm text-gray-500 truncate">{classification.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <button 
                                                    onClick={(e) => handleEditClassification(e, classification.pc_id)}
                                                    className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteClassification(e, classification)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredClassifications.length > 0? <></>:
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 p-3 text-center">
                                        No Found Property Classification
                                    </div>
                                </div>
                                }
                            </div>
                        }
                    </div>
                </div>
                

                {/* Subclassifications and Actual Uses */}
                <div className="xl:col-span-2 space-y-6">
                    {selectedClassification ? (
                        <>
                            {/* Selected Classification Info */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                                    Selected: {selectedClassification.classname} ({selectedClassification.code})
                                </h3>
                                <p className="text-emerald-700">{selectedClassification.description}</p>
                            </div>

                            {
                                subError?<p className="text-red-600 text-center">{subError}</p>: 
                                subLoading? <Loading />:
                                <>
                                    {/* Subclassifications */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    Subclassifications ({propertySubclassifications.length})
                                                </h2>
                                                <button 
                                                    onClick={handleAddSubclass}
                                                    className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={20} />
                                                    Add Subclass
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto max-h-54">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                                    </tr>
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subclass Name</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valuation Factor</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {propertySubclassifications.map((subclass) => (
                                                        <tr key={subclass.psc_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{subclass.code}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{subclass.subclass_name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{Number(subclass.valuation_factor ?? '0').toFixed(4)}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">{subclass.description}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditSubclass(subclass.psc_id)}
                                                                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                                    >
                                                                        <Edit size={20} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteSubclass(subclass)}
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                    >
                                                                        <Trash2 size={20} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {propertySubclassifications.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                                No subclassifications found for this classification
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Actual Uses */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    Actual Uses ({actualUses.length})
                                                </h2>
                                                <button 
                                                    onClick={handleAddActualUse}
                                                    className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={20} />
                                                    Add Use
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto max-h-54">
                                            <table className="w-full ">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className='absolute bottom-0 left-0 right-0 border-1 border-gray-400'></th>
                                                    </tr>
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Use Name</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exempt Percentage</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment Level</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {actualUses.map((use) => (
                                                        <tr key={use.au_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{use.code}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{use.use_name}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    use.taxable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {use.taxable ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{use.exempt_percentage}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">{use.assessment_level || '-'}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditActualUse(use.au_id || -1)}
                                                                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                                    >
                                                                        <Edit size={20} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteActualUse(use)}
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                    >
                                                                        <Trash2 size={20} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {actualUses.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                                No actual uses found for this classification
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            }
                        </>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                <Eye size={48} className="mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property Classification</h3>
                            <p className="text-gray-500">Click on a property classification from the left panel to view its subclassifications and actual uses.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <ModifyClassificationDialog
                approve={approve}
                classificationHandleChange={classificationHandleChange}
                classificationHandleSubmit={classificationHandleSubmit}
                edit={edit}
                newPropertyClassification={newPropertyClassification}
                openAddClass={openAddClass}
                setApprove={setApprove}
                setNewPropertyClassification={setNewPropertyClassification}
                setOpenAddClass={setOpenAddClass}
                setRefresh={setRefresh}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            <DeleteClassificationDialog
                approve={approve}
                newPropertyClassification={newPropertyClassification}
                openDelClass={openDelClass}
                classificationHandleDelete={classificationHandleDelete}
                setApprove={setApprove}
                setNewPropertyClassification={setNewPropertyClassification}
                setOpenDelClass={setOpenDelClass}
                setRefresh={setRefresh}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubLoading}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            <ModifySubClassificationDialog
                approve={approve}
                edit={edit}
                newPropertySubClassification={newPropertySubClassification}
                selectedClassification={selectedClassification}
                setApprove={setApprove}
                setNewPropertySubClassification={setNewPropertySubClassification}
                setRefreshSelected={setRefreshSelected}
                setShowModifySClass={setShowModifySClass}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                showModifySClass={showModifySClass}
                subClassificationHandleChange={subClassificationHandleChange}
                subclassificationHandleSubmit={subclassificationHandleSubmit}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            <DeleteSubClassificationDialog 
                approve={approve}
                subClassificationHandleDelete={subClassificationHandleDelete}
                newPropertySubClassification={newPropertySubClassification}
                setApprove={setApprove}
                setNewPropertySubClassification={setNewPropertySubClassification}
                setRefreshSelected={setRefreshSelected}
                setShowDelSClass={setShowDelSClass}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                showDelSClass={showDelSClass}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            <ModifyActualUseDialog
                actualUseHandleChange={actualUseHandleChange}
                actualUseHandleSubmit={actualUseHandleSubmit}
                approve={approve}
                edit={edit}
                newActualUse={newActualUse}
                refresh={setRefreshSelected}
                setApprove={setApprove}
                setNewActualUse={setNewActualUse}
                setShowModifyAU={setShowModifyAUClass}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                showModifyAU={showModifyAUClass}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            <DeleteActualUseDialog 
                actualUseHandleDelete={actualUseHandleDelete}
                approve={approve}
                newActualUse={newActualUse}
                setApprove={setApprove}
                setNewActualUse={setNewActualUse}
                setRefreshSelected={setRefreshSelected}
                setShowDelAU={setShowDelAU}
                setSubmitError={setSubmitError}
                setSubmitLoading={setSubmitLoading}
                showDelAU={showDelAU}
                submitError={submitError}
                submitLoading={submitLoading}
            />
            

        </div>
    );
};

export default PropertyClassificationFile;