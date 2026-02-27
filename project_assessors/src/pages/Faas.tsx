import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Eye, Download, Filter, X, Loader, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Save, MapPin, Map, UserCheck, Calendar } from 'lucide-react';
import api from '../../axiosBase.ts'; // Commented out for standalone preview
import FAASViewDialog from '../dialogs/faas/viewDialog.tsx';

// --- Tax Declaration Creation Dialog ---
const TaxDeclarationDialog = ({ isOpen, onClose, faasId, onSuccess }: any) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [faasData, setFaasData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        admin_name: '',
        admin_tin: '',
        admin_address: '',
        admin_contact_no: '',
        oct_no: '',
        survey_no: '',
        cct_no: '',
        title_date: '',
        boundary_north: '',
        boundary_south: '',
        boundary_east: '',
        boundary_west: '',
        assessment_effectivity_qtr: Math.ceil((new Date().getMonth() + 1) / 3).toString(),
        assessment_effectivity_year: new Date().getFullYear().toString(),
        memoranda: '',
        ordinance_no: ''
    });

    useEffect(() => {
        if (isOpen && faasId) {
            fetchFAASDetails();
        } else {
            setFaasData(null);
            setFormData({
                admin_name: '', admin_tin: '', admin_address: '', admin_contact_no: '',
                oct_no: '', survey_no: '', cct_no: '', title_date: '',
                boundary_north: '', boundary_south: '', boundary_east: '', boundary_west: '',
                assessment_effectivity_qtr: Math.ceil((new Date().getMonth() + 1) / 3).toString(),
                assessment_effectivity_year: new Date().getFullYear().toString(),
                memoranda: '', ordinance_no: ''
            });
            setError(null);
        }
    }, [isOpen, faasId]);

    const fetchFAASDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`faas/${faasId}`);
            setFaasData(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch FAAS details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Structure matches the SQL table requirements
            const payload = {
                faas_id: faasData.faas.faas_id,
                property_id: faasData.faas.property_id,
                td_no: `TD-${faasData.faas.arp_no}`, // Auto-generating TD No based on ARP
                property_identification_no: faasData.faas.pin,
                
                admin_name: formData.admin_name,
                admin_tin: formData.admin_tin,
                admin_address: formData.admin_address,
                admin_contact_no: formData.admin_contact_no,

                street: "", // Extract if needed
                barangay: faasData.faas.barangay,
                municipality: faasData.faas.municipality || faasData.faas.lg_code,
                
                oct_no: formData.oct_no,
                survey_no: formData.survey_no,
                cct_no: formData.cct_no,
                lot_no: faasData.faas.lot_no,
                block_no: faasData.faas.block_no,
                title_date: formData.title_date || null,
                
                boundary_north: formData.boundary_north,
                boundary_south: formData.boundary_south,
                boundary_east: formData.boundary_east,
                boundary_west: formData.boundary_west,
                
                property_kind: faasData.faas.property_kind,
                total_market_value: faasData.land?.assessment.market_value || faasData.building?.assessment.market_value || faasData.machinery?.assessment.market_value || 0,
                total_assessed_value: faasData.land?.assessment.assessed_value || faasData.building?.assessment.assessed_value || faasData.machinery?.assessment.assessed_value || 0,
                taxable: faasData.faas.taxable,
                
                assessment_effectivity_qtr: parseInt(formData.assessment_effectivity_qtr),
                assessment_effectivity_year: parseInt(formData.assessment_effectivity_year),
                
                memoranda: formData.memoranda,
                ordinance_no: formData.ordinance_no,
                status: 'ACTIVE'
            };

            await api.post('td/create', payload);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to generate Tax Declaration. Please check your inputs.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const assessment = faasData?.land?.assessment || faasData?.building?.assessment || faasData?.machinery?.assessment;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">Create Tax Declaration</h2>
                            <p className="text-sm text-blue-700 font-medium">Generate TD from FAAS {faasData?.faas?.faas_no}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Loading FAAS details...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-red-700 font-bold">{error}</p>
                            <button onClick={onClose} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50">Close</button>
                        </div>
                    ) : faasData ? (
                        <form id="td-form" onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* PREVIEW SECTION (Read Only) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Property Preview (From FAAS)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">ARP No.</p>
                                            <p className="text-sm font-bold text-gray-900">{faasData.faas.arp_no || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">PIN</p>
                                            <p className="text-sm font-bold text-gray-900">{faasData.faas.pin || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Property Kind</p>
                                            <p className="text-sm font-bold text-gray-900 uppercase">{faasData.faas.property_kind}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Owner(s)</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {faasData.owners?.map((o:any) => `${o.first_name} ${o.last_name}`).join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Location</p>
                                            <p className="text-sm font-bold text-gray-900 truncate" title={faasData.faas.barangay}>
                                                {faasData.faas.barangay}, {faasData.faas.municipality || faasData.faas.lg_code}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                        <div>
                                            <p className="text-xs text-blue-600 font-semibold uppercase">Market Value</p>
                                            <p className="text-lg font-mono font-bold text-blue-900">₱{parseFloat(assessment?.market_value || '0').toLocaleString('en-US', {minimumFractionDigits:2})}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 font-semibold uppercase">Assessed Value</p>
                                            <p className="text-xl font-mono font-black text-blue-900">₱{parseFloat(assessment?.assessed_value || '0').toLocaleString('en-US', {minimumFractionDigits:2})}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* TITLES & SURVEY */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b pb-2"><FileText size={16} className="text-blue-500"/> Title & Survey Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">OCT/TCT/CLOA No.</label>
                                            <input type="text" name="oct_no" value={formData.oct_no} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="Optional" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Survey No.</label>
                                            <input type="text" name="survey_no" value={formData.survey_no} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="Optional" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">CCT No.</label>
                                            <input type="text" name="cct_no" value={formData.cct_no} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="Optional" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Title Date</label>
                                            <input type="date" name="title_date" value={formData.title_date} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* BOUNDARIES */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b pb-2"><Map size={16} className="text-blue-500"/> Boundaries</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">North</label>
                                            <input type="text" name="boundary_north" value={formData.boundary_north} onChange={handleChange} required className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">South</label>
                                            <input type="text" name="boundary_south" value={formData.boundary_south} onChange={handleChange} required className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">East</label>
                                            <input type="text" name="boundary_east" value={formData.boundary_east} onChange={handleChange} required className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">West</label>
                                            <input type="text" name="boundary_west" value={formData.boundary_west} onChange={handleChange} required className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* ADMIN INFO */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b pb-2"><UserCheck size={16} className="text-blue-500"/> Administrator / Beneficial User</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                                            <input type="text" name="admin_name" value={formData.admin_name} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="Leave blank if same as owner" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">TIN</label>
                                            <input type="text" name="admin_tin" value={formData.admin_tin} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Contact No.</label>
                                            <input type="text" name="admin_contact_no" value={formData.admin_contact_no} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                            <textarea name="admin_address" rows={2} value={formData.admin_address} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500"></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* EFFECTIVITY & REMARKS */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b pb-2"><Calendar size={16} className="text-blue-500"/> Effectivity & Remarks</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Effectivity Qtr</label>
                                            <select name="assessment_effectivity_qtr" value={formData.assessment_effectivity_qtr} onChange={handleChange} required className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500 bg-white">
                                                <option value="1">1st Quarter</option>
                                                <option value="2">2nd Quarter</option>
                                                <option value="3">3rd Quarter</option>
                                                <option value="4">4th Quarter</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Effectivity Year</label>
                                            <input type="number" name="assessment_effectivity_year" value={formData.assessment_effectivity_year} onChange={handleChange} required min="1900" max="2100" className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Ordinance No.</label>
                                            <input type="text" name="ordinance_no" value={formData.ordinance_no} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Memoranda / Notes</label>
                                            <textarea name="memoranda" rows={3} value={formData.memoranda} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : null}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button 
                        form="td-form" 
                        type="submit" 
                        disabled={saving || loading || !faasData} 
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Tax Declaration
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Interfaces ---
interface FAASRecord {
    faas_id: number;
    property_id?: number;
    ry_id?: number;
    faas_no: string;
    faas_type: 'ORIGINAL' | 'REVISION' | 'TRANSFER' | 'CANCELLATION';
    effectivity_date: string;
    previous_faas_id: number | null;
    taxable: boolean;
    remarks: string | null;
    status: 'ACTIVE' | 'CANCELLED';
    created_by: string | null;
    created_date: string;
    property_kind: 'LAND' | 'BUILDING' | 'MACHINERY';
    market_value: number;
    assessment_level: number;
    assessed_value: number;
    notes: string | null;
    arp_no: string;
    pin: string | null;
    owner_name: string;
    barangay: string | null;
    revision_year: number;
    has_taxdec?: boolean; // NEW: Added to check Tax Dec existence
}

interface FilterOptions {
    faas_type: string;
    property_kind: string;
    status: string;
    taxable: string;
    revision_year: string;
    search: string;
}

interface PaginationMeta {
    total_records: number;
    total_pages: number;
    current_page: number;
    limit: number;
}

const LIMIT = 5;

export default function FAASManagement() {
    const [currentPageRecords, setCurrentPageRecords] = useState<FAASRecord[]>([]);

    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [tdDialogOpen, setTdDialogOpen] = useState(false);
    const [selectedFaasId, setSelectedFaasId] = useState<number | null>(null);
    
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
        total_records: 0,
        total_pages: 1,
        current_page: 1,
        limit: LIMIT,
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterOptions>({
        faas_type: '',
        property_kind: '',
        status: '',
        taxable: '',
        revision_year: '',
        search: ''
    });

    const [revisionYearOptions, setRevisionYearOptions] = useState<any[]>([
        { ry_id: 1, year: 2026 },
        { ry_id: 2, year: 2025 }
    ]);

    const fetchFAASRecords = useCallback(async (page: number, currentFilters: FilterOptions) => {
        setLoading(true);
        setError('');
        
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: LIMIT.toString(),
                faas_type: currentFilters.faas_type,
                property_kind: currentFilters.property_kind,
                status: currentFilters.status,
                ry_id: currentFilters.revision_year, 
                search_term: currentFilters.search, 
                taxable: currentFilters.taxable
            });
            
            for (const [key, value] of params.entries()) {
                if (!value || value === '') {
                    params.delete(key);
                }
            }

            const res = await api.get('faas/list', { params });
            
            setCurrentPageRecords(res.data.data || []);
            setPaginationMeta(res.data.pagination || { total_records: 0, total_pages: 1, current_page: 1, limit: LIMIT });

        } catch (err) {
            console.error('Error fetching FAAS records:', err);
            setError('Failed to load FAAS records. Please check the network connection and server status.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFAASRecords(1, filters);
    }, [filters, fetchFAASRecords]);

    useEffect(() => {    
        fetchFAASRecords(paginationMeta.current_page, filters);
    }, [paginationMeta.current_page]);

    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            faas_type: '',
            property_kind: '',
            status: '',
            taxable: '',
            revision_year: '',
            search: ''
        });
    };

    const getFaasTypeBadgeColor = (type: string) => {
        const colors = {
            ORIGINAL: 'bg-green-100 text-green-800 border-green-300',
            REVISION: 'bg-blue-100 text-blue-800 border-blue-300',
            TRANSFER: 'bg-orange-100 text-orange-800 border-orange-300',
            CANCELLATION: 'bg-red-100 text-red-800 border-red-300'
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusBadgeColor = (status: string) => {
        return status === 'ACTIVE' 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const handleViewDetails = (faasId: number) => {
        setSelectedFaasId(faasId);
        setViewDialogOpen(true);
    };

    const handleCreateTD = (faasId: number) => {
        setSelectedFaasId(faasId);
        setTdDialogOpen(true);
    };

    const exportToCSV = () => {
        const headers = ['FAAS No', 'ARP No', 'Owner', 'Type', 'Property Kind', 'Status', 'Has TaxDec', 'Revision Year'];
        const csvData = currentPageRecords.map(record => [
            record.faas_no,
            record.arp_no,
            record.owner_name.replace(/"/g, '""'), 
            record.faas_type,
            record.property_kind,
            record.status,
            record.has_taxdec ? 'Yes' : 'No',
            record.revision_year
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(item => `"${item}"`).join(',')) 
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `faas-records-page-${paginationMeta.current_page}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const paginate = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= paginationMeta.total_pages) {
            setPaginationMeta(prev => ({ ...prev, current_page: pageNumber }));
        }
    };

    const displayFrom = Math.min(paginationMeta.total_records, (paginationMeta.current_page - 1) * paginationMeta.limit + 1);
    const displayTo = Math.min(paginationMeta.current_page * paginationMeta.limit, paginationMeta.total_records);
    const totalRecordsText = paginationMeta.total_records.toLocaleString();


    return (
        <div className="min-h-screen w-full bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-emerald-500">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-4 rounded-full">
                                <FileText className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">FAAS Management</h1>
                                <p className="text-gray-500 text-sm">Field Appraisal and Assessment Sheets Overview</p>
                            </div>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Main Content Area: Search and Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* TOP SECTION: Filters Toggle & Search Bar */}
                    <div className="flex max-h-fit flex-row lg:col-span-4 gap-4 z-10">
                        <div className="bg-white max-h-20 flex-1 rounded-xl shadow-lg">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 lg:border-none rounded-t-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Filter size={20} className="text-emerald-600" />
                                    <span className="font-bold text-gray-900">Filter Records</span>
                                    {Object.values(filters).some(v => v && v !== filters.search) && (
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                                            Active
                                        </span>
                                    )}
                                </div>
                                {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {showFilters && (
                                <div className="p-4 space-y-4 bg-gray-50 shadow-md rounded-b-xl border-t border-gray-200 absolute w-full max-w-4xl z-50">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Filter Options</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">FAAS Type</label>
                                            <select
                                                value={filters.faas_type}
                                                onChange={(e) => handleFilterChange('faas_type', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                            >
                                                <option value="">All Types</option>
                                                <option value="ORIGINAL">Original</option>
                                                <option value="REVISION">Revision</option>
                                                <option value="TRANSFER">Transfer</option>
                                                <option value="CANCELLATION">Cancellation</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Property Kind</label>
                                            <select
                                                value={filters.property_kind}
                                                onChange={(e) => handleFilterChange('property_kind', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                            >
                                                <option value="">All Kinds</option>
                                                <option value="LAND">Land</option>
                                                <option value="BUILDING">Building</option>
                                                <option value="MACHINERY">Machinery</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={filters.status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                            >
                                                <option value="">All Status</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Taxable</label>
                                            <select
                                                value={filters.taxable}
                                                onChange={(e) => handleFilterChange('taxable', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                            >
                                                <option value="">All</option>
                                                <option value="true">Taxable</option>
                                                <option value="false">Non-Taxable</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Revision Year</label>
                                            <select
                                                value={filters.revision_year}
                                                onChange={(e) => handleFilterChange('revision_year', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                            >
                                                <option value="">All Years</option>
                                                {revisionYearOptions.map((year, i) => (
                                                    <option key={i} value={year.ry_id}>{year.year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={clearFilters}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold mt-4"
                                    >
                                        <X size={16} />
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Search Bar */}
                        <div className="flex-4 max-h-fit bg-white rounded-xl shadow-lg p-4 mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by FAAS No, ARP No, PIN, or Owner Name..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner text-sm outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Data Table */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                                    <p className="text-gray-600">Loading FAAS records...</p>
                                </div>
                            ) : error ? (
                                <div className="p-6 text-center bg-red-50 rounded-xl m-4 border border-red-200">
                                    <p className="text-red-700 font-medium mb-3">{error}</p>
                                    <button
                                        onClick={() => fetchFAASRecords(paginationMeta.current_page, filters)}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm"
                                    >
                                        Retry Loading
                                    </button>
                                </div>
                            ) : currentPageRecords.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg font-medium">No FAAS records found</p>
                                    <p className="text-gray-400 text-sm mt-2">Try clearing your filters or search terms.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[150px]">FAAS No / RY</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[120px]">ARP No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[200px]">Tax Dec</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type / Kind</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {currentPageRecords.map((record) => (
                                                    <tr key={record.faas_id} className="hover:bg-emerald-50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="font-mono text-sm font-semibold text-gray-900">{record.faas_no}</span>
                                                            <p className="text-xs text-gray-500 mt-0.5">RY: {record.revision_year}</p>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="text-sm font-medium text-gray-900">{record.arp_no}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            
                                                            {record.has_taxdec ? (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                    <CheckCircle size={10} /> Has TaxDec
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                                                                    <AlertCircle size={10} /> No TaxDec
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider border w-fit ${getFaasTypeBadgeColor(record.faas_type)}`}>
                                                                    {record.faas_type}
                                                                </span>
                                                                <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider w-fit border ${
                                                                    record.property_kind === 'LAND' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                                                    record.property_kind === 'BUILDING' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                                                                    'bg-amber-50 border-amber-200 text-amber-700'
                                                                }`}>
                                                                    {record.property_kind}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider border w-fit ${getStatusBadgeColor(record.status)}`}>
                                                                    {record.status || "INACTIVE"}
                                                                </span>
                                                                {record.taxable && (
                                                                    <span className="px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                                                                        Taxable
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleViewDetails(record.faas_id)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors font-semibold border border-transparent hover:border-emerald-200"
                                                                    title="View FAAS Details"
                                                                >
                                                                    <Eye size={16} />
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCreateTD(record.faas_id)}
                                                                    disabled={record.has_taxdec}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-semibold border ${
                                                                        record.has_taxdec 
                                                                        ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' 
                                                                        : 'text-blue-600 bg-blue-50 hover:text-blue-800 hover:bg-blue-100 border-blue-200'
                                                                    }`}
                                                                    title={record.has_taxdec ? "Tax Declaration already exists" : "Create Tax Declaration"}
                                                                >
                                                                    <FileText size={16} />
                                                                    {record.has_taxdec ? 'TD Created' : 'Create TD'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {paginationMeta.total_records > 0 && (
                                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                                            <p className="text-sm text-gray-600">
                                                Showing <span className="font-semibold text-gray-900">{displayFrom}</span> to <span className="font-semibold text-gray-900">{displayTo}</span> of <span className="font-semibold text-gray-900">{totalRecordsText}</span> records
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => paginate(paginationMeta.current_page - 1)}
                                                    disabled={paginationMeta.current_page === 1}
                                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Previous
                                                </button>
                                                {Array.from({ length: paginationMeta.total_pages }, (_, i) => i + 1)
                                                    .slice(
                                                        Math.max(0, paginationMeta.current_page - 3), 
                                                        Math.min(paginationMeta.total_pages, paginationMeta.current_page + 2)
                                                    ).map((pageNum) => (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => paginate(pageNum)}
                                                        className={`px-3 py-1 border rounded-lg text-sm font-medium transition-colors ${
                                                            paginationMeta.current_page === pageNum
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                                {paginationMeta.current_page + 2 < paginationMeta.total_pages && <span className="px-2 py-1 text-gray-500">...</span>}
                                                <button
                                                    onClick={() => paginate(paginationMeta.current_page + 1)}
                                                    disabled={paginationMeta.current_page === paginationMeta.total_pages}
                                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <FAASViewDialog
                faasId={selectedFaasId ?? 0} 
                isOpen={viewDialogOpen} 
                onClose={() => setViewDialogOpen(false)} 
            />

            <TaxDeclarationDialog
                faasId={selectedFaasId ?? 0}
                isOpen={tdDialogOpen}
                onClose={() => setTdDialogOpen(false)}
                onSuccess={() => fetchFAASRecords(paginationMeta.current_page, filters)}
            />
        </div>
    );
}