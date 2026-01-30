import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, X, Loader2, CheckCircle, Users, UserPlus, Trash2, FileText, AlertCircle, AlertOctagon, Search, ChevronDown, Check } from 'lucide-react';
import api from '../../../axiosBase';
import { SelectField } from '../../common/CustomSelect';

// --- Interfaces ---

interface TransferData {
    transfer_date: string;
    transfer_type: string;
    deed_no: string;
    deed_date: string;
    remarks: string;
}

interface OwnerOption {
    owner_id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    suffix?: string;
    address_house_no?: string;
    contact_no?: string;
    email?: string;
    tin_no?: string;
}

interface FAASData {
    faas_id: number;
    faas_no: string;
    property_id: number;
    owner_name: string; // Current owner string (for display fallback)
    owners?: OwnerOption[]; // List of current owners
    owner_address: string;
    property_kind: string;
    effectivity_date: string;
    market_value?: number;
    assessed_value?: number;
}

interface FAASTransferDialogProps {
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    faasId: number;
    setRefresh: (refresh: any) => void;
}

const TRANSFER_TYPES = [
    { type_id: 'SALE', name: 'Sale' },
    { type_id: 'DONATION', name: 'Donation' },
    { type_id: 'INHERITANCE', name: 'Inheritance' },
    { type_id: 'EXCHANGE', name: 'Exchange' },
    { type_id: 'PARTITION', name: 'Partition' },
    { type_id: 'MERGER', name: 'Merger' },
    { type_id: 'CONSOLIDATION', name: 'Consolidation' },
    { type_id: 'OTHER', name: 'Other' },
];

export const FAASTransferDialog: React.FC<FAASTransferDialogProps> = ({
    showDialog,
    setShowDialog,
    faasId,
    setRefresh
}) => {
    // --- State ---
    const [faasData, setFAASData] = useState<FAASData | null>(null);
    
    // Transfer Details
    const [transferData, setTransferData] = useState<TransferData>({
        transfer_date: new Date().toISOString().split('T')[0],
        transfer_type: 'SALE',
        deed_no: '',
        deed_date: new Date().toISOString().split('T')[0],
        remarks: '',
    });

    // Owner Selection
    const [availableOwners, setAvailableOwners] = useState<OwnerOption[]>([]);
    const [selectedNewOwners, setSelectedNewOwners] = useState<OwnerOption[]>([]);
    const [selectedOwnerIdToAdd, setSelectedOwnerIdToAdd] = useState<string>('');

    
    // UI State
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // --- Load Data ---
    useEffect(() => {
        if (showDialog && faasId) {
            fetchInitialData();
        } else {
            // Reset
            setFAASData(null);
            setSelectedNewOwners([]);
            setSuccess(false);
            setError(null);
            setTransferData({
                transfer_date: new Date().toISOString().split('T')[0],
                transfer_type: 'SALE',
                deed_no: '',
                deed_date: new Date().toISOString().split('T')[0],
                remarks: '',
            });
        }
    }, [showDialog, faasId]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            //Fetch Current FAAS
            const faasRes = await api.get(`faas/${faasId}`);
            const data = faasRes.data;
            
            if (data.faas) {
                let mv = 0, av = 0;
                if (data.land?.assessment) {
                    mv = parseFloat(data.land.assessment.market_value);
                    av = parseFloat(data.land.assessment.assessed_value);
                } else if (data.building?.assessment) {
                    mv = parseFloat(data.building.assessment.market_value);
                    av = parseFloat(data.building.assessment.assessed_value);
                } else if (data.machinery?.assessment) {
                    mv = parseFloat(data.machinery.assessment.market_value);
                    av = parseFloat(data.machinery.assessment.assessed_value);
                }

                setFAASData({
                    ...data.faas,
                    owners: data.owners, 
                    market_value: mv,
                    assessed_value: av
                });
            }

            // Fetch Available Owners List
            // aaahh, I spent an hour making this filtering work T_T and then I realized I really don't need it
            // const param = data.owners.map((item:any)=>(item.owner_id)).join(',');
            // const ownersRes = await api.get('ol/available', { params: {ids: param} } );  
            const ownersRes = await api.get('ol/');  
            const ownersList = ownersRes.data.data || ownersRes.data;
            if (Array.isArray(ownersList)) {
                setAvailableOwners(ownersList);
            }
            //instead I just need to place the current owners on the selected one T_T
            const existingOwners = ownersList.filter((item:any)=>(data.owners.map((i:any)=>(i.owner_id)).includes(item.owner_id)));
            setSelectedNewOwners((prev:any)=>(
                [...prev, ...existingOwners]
            ))

        } catch (err: any) {
            console.error("Error loading transfer data:", err);
            setError("Failed to load property or owner information.");
        } finally {
            setLoading(false);
        }
    };

    const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTransferData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddOwner = () => {
        if (!selectedOwnerIdToAdd) return;
        const ownerToAdd = availableOwners.find(o => String(o.owner_id) === String(selectedOwnerIdToAdd));
        if (ownerToAdd && !selectedNewOwners.some(o => o.owner_id === ownerToAdd.owner_id)) {
            setSelectedNewOwners(prev => [...prev, ownerToAdd]);
        }
        setSelectedOwnerIdToAdd('');
    };

    const handleRemoveOwner = (id: number) => {
        setSelectedNewOwners(prev => prev.filter(o => o.owner_id !== id));
    };

    const handleSubmit = async () => {
        setError(null);
        setSubmitLoading(true);

        try {
            // Validation
            if (selectedNewOwners.length === 0) {
                throw new Error("Please select at least one new owner.");
            }
            if (!transferData.transfer_date) {
                throw new Error("Transfer date is required.");
            }

            // Construct Payload
            // Note: Adjust 'new_owner_ids' key if backend expects differently based on updated requirements
            const payload = {
                faas_id: faasId,
                ...transferData,
                new_owner_ids: selectedNewOwners,
            };
            console.log(payload);

            await api.post('faas/transfer', payload);
            
            // setSuccess(true);
            // setRefresh((prev: any) => !prev);
        } catch (err: any) {
            console.error("Transfer failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to process transfer.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleClose = () => {
        setShowDialog(false);
    };

    // --- Helpers ---
    const formatCurrency = (val?: number) => val ? `₱${val.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '-';

    if (!showDialog) return null;

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center animate-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 animate-pulse">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Transfer Successful</h2>
                    <p className="text-slate-600 mb-6">
                        Ownership has been transferred to <strong>{selectedNewOwners.length} owner(s)</strong>. 
                        A new FAAS record has been created.
                    </p>
                    <button onClick={handleClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white  h-fit w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Transfer Ownership</h2>
                            <p className="text-xs text-slate-500 font-mono">{faasData?.faas_no || 'Loading...'}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                            <p className="text-slate-500">Loading details...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* Error Alert */}
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                                    <AlertCircle size={18} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Current Property Info */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText size={14} /> Current Property Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Current Owner(s)</p>
                                        <div className="text-sm font-semibold text-slate-800 overflow-y-auto max-h-[60px]">
                                            {faasData?.owners && faasData.owners.length > 0 && (
                                                <ul className="list-disc list-inside">
                                                    {faasData.owners.map((o, i) => (
                                                        <li key={o.owner_id || i} className="truncate" title={`${o.last_name}, ${o.first_name}`}>
                                                            {o.last_name}, {o.first_name} {o.middle_name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Market Value</p>
                                        <p className="text-sm font-semibold text-slate-800">{formatCurrency(faasData?.market_value)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Assessed Value</p>
                                        <p className="text-sm font-semibold text-slate-800">{formatCurrency(faasData?.assessed_value)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* New Owners Selection */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Users size={14} /> New Owner(s) Selection
                                    </h3>
                                    
                                    <div className="flex gap-2 mb-4">
                                        <SelectField 
                                            label="Owner List"
                                            value={selectedOwnerIdToAdd}
                                            onChange={(e:any) => setSelectedOwnerIdToAdd(e.target.value)}
                                            options={availableOwners.filter(o => !selectedNewOwners.some(sel => sel.owner_id === o.owner_id))}
                                            idKey="owner_id"
                                            labelKey={["last_name", ",", "first_name", "middle_name", "suffix"]}
                                            required
                                        />
                                        
                                        <button 
                                            type="button" 
                                            onClick={handleAddOwner}
                                            disabled={!selectedOwnerIdToAdd}
                                            className="px-4 py-2 bg-blue-600 h-fit self-end text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm"
                                        >
                                            <UserPlus size={16} /> Add
                                        </button>
                                    </div>

                                    {/* Selected List */}
                                    <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50 min-h-[150px]">
                                        {selectedNewOwners.length > 0 ? (
                                            <div className="divide-y divide-slate-100 bg-white">
                                                {selectedNewOwners.map(owner => (
                                                    <div key={owner.owner_id} className="p-3 flex justify-between items-start hover:bg-slate-50 transition-colors">
                                                        <div className="flex-1 min-w-0 pr-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-slate-800 text-sm">
                                                                    {owner.last_name}, {owner.first_name} {owner.middle_name} {owner.suffix}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                                <p className="truncate" title={owner.address_house_no}>{owner.address_house_no || 'No Address'}</p>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-slate-400">
                                                                    <span title="TIN">TIN: {owner.tin_no || 'N/A'}</span>
                                                                    <span title="Contact">Tel: {owner.contact_no || 'N/A'}</span>
                                                                    <span title="Email">@{owner.email || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveOwner(owner.owner_id)} 
                                                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                            title="Remove Owner"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm p-4 italic">
                                                No new owners selected yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <FileText size={14} /> Transaction Details
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <SelectField
                                            label="Transfer Type"
                                            name="transfer_type"
                                            value={transferData.transfer_type}
                                            onChange={handleTransferChange}
                                            options={TRANSFER_TYPES}
                                            idKey="type_id"
                                            required
                                        />
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Transfer Date</label>
                                                <input type="date" name="transfer_date" value={transferData.transfer_date} onChange={handleTransferChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                                            <textarea name="remarks" value={transferData.remarks} onChange={handleTransferChange} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Additional notes..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button onClick={handleClose} disabled={submitLoading} className="px-5 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium transition">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitLoading || selectedNewOwners.length === 0 || selectedNewOwners.map((item:any)=>(item.owner_id)).join(',') === faasData?.owners?.map((item:any)=>(item.owner_id)).join(',') }
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirm Transfer
                    </button>
                </div>
            </div>
        </div>
    );
};