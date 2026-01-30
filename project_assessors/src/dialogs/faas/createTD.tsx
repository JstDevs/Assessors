import React, { useState, useEffect } from 'react';
import { FileText, X, Loader2, Save, User, MapPin, Calendar, Hash, Info, CheckCircle } from 'lucide-react';
import api from '../../../axiosBase';
import { printTaxDec } from './print';

// --- Interfaces ---

interface TaxDeclarationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    faasId: number;
    onSuccess?: () => void;
}

interface TaxDeclarationPayload {
    faas_id: number;
    td_no: string;
    property_identification_no: string;
    issue_date: string;
    
    // Owner
    owner_name: string;
    owner_address: string;
    owner_tin: string;
    owner_tel: string;
    
    // Admin
    admin_name: string;
    admin_address: string;
    admin_tin: string;
    admin_tel: string;
    
    // Location
    location_street: string;
    location_barangay: string;
    location_municipality: string;
    location_province: string;
    
    // Identifiers
    survey_no: string;
    lot_no: string;
    block_no: string;
    cct_no: string;
    
    // Boundaries
    boundary_north: string;
    boundary_south: string;
    boundary_east: string;
    boundary_west: string;
    
    // Assessment
    property_kind: string;
    taxable: boolean;
    market_value: number;
    assessment_level: number;
    assessed_value: number;
    effectivity_qtr: string;
    effectivity_year: string;
    
    // Signatory
    approved_by: string;
    approved_date: string;
    previous_td_no: string;
}

const initialFormState: TaxDeclarationPayload = {
    faas_id: 0,
    td_no: '',
    property_identification_no: '',
    issue_date: new Date().toISOString().split('T')[0],
    owner_name: '',
    owner_address: '',
    owner_tin: '',
    owner_tel: '',
    admin_name: '',
    admin_address: '',
    admin_tin: '',
    admin_tel: '',
    location_street: '',
    location_barangay: '',
    location_municipality: 'Makati City', // Default or fetch from config
    location_province: 'Metro Manila',   // Default or fetch from config
    survey_no: '',
    lot_no: '',
    block_no: '',
    cct_no: '',
    boundary_north: '',
    boundary_south: '',
    boundary_east: '',
    boundary_west: '',
    property_kind: 'Land',
    taxable: true,
    market_value: 0,
    assessment_level: 0,
    assessed_value: 0,
    effectivity_qtr: 'Q1',
    effectivity_year: new Date().getFullYear().toString(),
    approved_by: '',
    approved_date: new Date().toISOString().split('T')[0],
    previous_td_no: '',
};

export default function TaxDeclarationDialog({ isOpen, onClose, faasId, onSuccess }: TaxDeclarationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<TaxDeclarationPayload>(initialFormState);
    const [error, setError] = useState<string>('');
    const [faas, setFaas] = useState({});
    // Load FAAS Data to Pre-fill the TD Form
    useEffect(() => {
        if (isOpen && faasId) {
            fetchFAASData();
        } else {
            setFormData(initialFormState); // Reset on close
        }
    }, [isOpen, faasId]);

    const fetchFAASData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`faas/${faasId}`);
            const data = response.data;
            
            const faas = data.faas;
            setFaas(faas);
            
            // Extract Assessment Values based on kind
            let mv = 0, al = 0, av = 0;
            let specificDetails: any = {};

            if (faas.property_kind === 'Land' && data.land) {
                mv = parseFloat(data.land.assessment.market_value);
                al = parseFloat(data.land.assessment.assessment_level);
                av = parseFloat(data.land.assessment.assessed_value);
                specificDetails = {
                    // Map specific land identifiers if they exist in land details, 
                    // otherwise fallback to faas base
                };
            } else if (faas.property_kind === 'Building' && data.building) {
                mv = parseFloat(data.building.assessment.market_value);
                al = parseFloat(data.building.assessment.assessment_level);
                av = parseFloat(data.building.assessment.assessed_value);
            } else if (faas.property_kind === 'Machinery' && data.machinery) {
                mv = parseFloat(data.machinery.assessment.market_value);
                al = parseFloat(data.machinery.assessment.assessment_level);
                av = parseFloat(data.machinery.assessment.assessed_value);
            }

            // Pre-fill Form
            setFormData(prev => ({
                ...prev,
                faas_id: faas.faas_id,
                property_identification_no: faas.pin || '',
                owner_name: faas.owner_name,
                owner_address: faas.owner_address,
                location_barangay: faas.barangay || '',
                lot_no: faas.lot_no || '',
                block_no: faas.block_no || '',
                property_kind: faas.property_kind,
                taxable: faas.taxable === 1,
                market_value: mv,
                assessment_level: al,
                assessed_value: av,
                // Try to find previous TD if available in history (optional logic)
            }));

        } catch (err: any) {
            console.error("Error fetching FAAS for TD:", err);
            setError("Failed to load source FAAS data.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            console.log(formData);
            // await api.post('tax-declaration/create', formData);
            if (onSuccess) {
                printTaxDec(formData)
            }
            // onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create Tax Declaration.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-200">
                
                {/* Header */}
                <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shrink-0 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-200" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">New Tax Declaration</h2>
                            <p className="text-blue-200 text-xs">Based on FAAS NO: {faas.faas_no}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-3" />
                            <p>Loading FAAS data...</p>
                        </div>
                    ) : (
                        <form id="td-form" onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
                                    <Info className="w-5 h-5" /> {error}
                                </div>
                            )}

                            {/* 1. TD Details */}
                            <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-blue-600" /> Document Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">TD Number <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            name="td_no" 
                                            value={formData.td_no} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full border border-slate-300 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="e.g. TD-2024-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Property Index No. (PIN)</label>
                                        <input 
                                            type="text" 
                                            name="property_identification_no" 
                                            value={formData.property_identification_no} 
                                            onChange={handleChange} 
                                            className="w-full border border-slate-300 bg-slate-50 rounded p-2 text-sm font-mono"
                                            readOnly // Usually inherited from FAAS
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Issue Date <span className="text-red-500">*</span></label>
                                        <input 
                                            type="date" 
                                            name="issue_date" 
                                            value={formData.issue_date} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Previous TD No.</label>
                                        <input 
                                            type="text" 
                                            name="previous_td_no" 
                                            value={formData.previous_td_no} 
                                            onChange={handleChange} 
                                            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="If Cancellation/Revision"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* 2. Owner & Admin */}
                            <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" /> Owner & Administrator
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Owner */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded inline-block">Owner Details</h4>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Owner Name</label>
                                            <input type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} required className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                                            <textarea name="owner_address" value={formData.owner_address} onChange={handleChange} rows={2} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">TIN</label>
                                                <input type="text" name="owner_tin" value={formData.owner_tin} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Tel. No</label>
                                                <input type="text" name="owner_tel" value={formData.owner_tel} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin */}
                                    <div className="space-y-3 border-l pl-6 border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">Administrator / Beneficial User</h4>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                                            <input type="text" name="admin_name" value={formData.admin_name} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(Optional)" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                                            <textarea name="admin_address" value={formData.admin_address} onChange={handleChange} rows={2} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">TIN</label>
                                                <input type="text" name="admin_tin" value={formData.admin_tin} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Tel. No</label>
                                                <input type="text" name="admin_tel" value={formData.admin_tel} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Property Location & Identifiers */}
                            <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600" /> Location & Identifiers
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    {/* <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Street / Location</label>
                                        <input type="text" name="location_street" value={formData.location_street} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div> */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Barangay</label>
                                        <input type="text" name="location_barangay" value={formData.location_barangay} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Municipality</label>
                                        <input type="text" name="location_municipality" value={formData.location_municipality} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">CCT / OCT / TCT No.</label>
                                        <input type="text" name="cct_no" value={formData.cct_no} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Title No." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Survey No.</label>
                                        <input type="text" name="survey_no" value={formData.survey_no} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Lot No.</label>
                                        <input type="text" name="lot_no" value={formData.lot_no} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Block No.</label>
                                        <input type="text" name="block_no" value={formData.block_no} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                    </div>
                                </div>

                                {/* Boundaries */}
                                {/* <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Boundaries</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><input type="text" name="boundary_north" value={formData.boundary_north} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" placeholder="North" /></div>
                                        <div><input type="text" name="boundary_south" value={formData.boundary_south} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" placeholder="South" /></div>
                                        <div><input type="text" name="boundary_east" value={formData.boundary_east} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" placeholder="East" /></div>
                                        <div><input type="text" name="boundary_west" value={formData.boundary_west} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" placeholder="West" /></div>
                                    </div>
                                </div> */}
                            </section>

                            {/* 4. Assessment & Valuation (Read-only mostly) */}
                            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-200 pb-2 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Assessment Summary
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-blue-600 mb-1">Property Kind</label>
                                        <p className="font-bold text-slate-800">{formData.property_kind}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-blue-600 mb-1">Taxable</label>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${formData.taxable ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-800'}`}>
                                            {formData.taxable ? 'YES' : 'NO'}
                                        </span>
                                    </div>
                                    
                                    {/* Effectivity Inputs */}
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Effectivity Quarter</label>
                                            <select name="effectivity_qtr" value={formData.effectivity_qtr} onChange={handleChange} className="w-full border border-blue-300 bg-white rounded p-2 text-sm">
                                                <option value="Q1">Q1</option>
                                                <option value="Q2">Q2</option>
                                                <option value="Q3">Q3</option>
                                                <option value="Q4">Q4</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Effectivity Year</label>
                                            <input type="number" name="effectivity_year" value={formData.effectivity_year} onChange={handleChange} className="w-full border border-blue-300 bg-white rounded p-2 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-blue-200">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Market Value</p>
                                        <p className="text-xl font-mono text-slate-800">{formatCurrency(formData.market_value)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Assessment Level</p>
                                        <p className="text-xl font-mono text-blue-700">{formData.assessment_level}%</p>
                                    </div>
                                    <div className="bg-white/50 p-3 rounded border border-blue-200">
                                        <p className="text-xs text-emerald-600 uppercase font-bold">Assessed Value</p>
                                        <p className="text-2xl font-extrabold font-mono text-emerald-700">{formatCurrency(formData.assessed_value)}</p>
                                    </div>
                                </div>
                            </section>

                            {/* 5. Signatory */}
                            <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Approved By</label>
                                        <input type="text" name="approved_by" value={formData.approved_by} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Assessor Name" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Approved Date</label>
                                        <input type="date" name="approved_date" value={formData.approved_date} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            </section>

                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0 rounded-b-xl">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="td-form"
                        disabled={submitting || loading}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Create Tax Declaration
                    </button>
                </div>
            </div>
        </div>
    );
}