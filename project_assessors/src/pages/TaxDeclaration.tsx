import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, FileText, Eye, Download, Filter, X, Loader, ChevronDown, ChevronUp, 
    ScrollText, MapPin, User, Building, Wrench, Package, Calculator, Info, 
    LandPlot, Factory, Map, Hash, AlertCircle, 
    Printer
} from 'lucide-react';

// Commented out to prevent compilation errors in this preview environment.
import api from '../../axiosBase';
import { generateTDPdf } from '../dialogs/td/print';


// --- Interfaces ---
interface TDRecord {
    td_id: number;
    td_no: string;
    faas_no: string;
    arp_no: string | null;
    pin: string | null;
    admin_name: string | null;
    barangay: string | null;
    property_kind: 'LAND' | 'BUILDING' | 'MACHINERY' | 'OTHERS';
    status: 'ACTIVE' | 'CANCELLED';
    taxable: number;
    total_market_value: number;
    total_assessed_value: number;
    created_at: string;
}

interface FilterOptions {
    property_kind: string;
    status: string;
    taxable: string;
    search: string;
}

interface PaginationMeta {
    total_records: number;
    total_pages: number;
    current_page: number;
    limit: number;
}

interface TDViewDialogProps {
    tdId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

// --- TD View Dialog Component ---
const TDViewDialog = ({ tdId, isOpen, onClose }: TDViewDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && tdId) {
            fetchTDData(tdId);
        } else if (!isOpen) {
            setData(null);
            setError('');
        }
    }, [isOpen, tdId]);

    const fetchTDData = async (id: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`td/${id}`);
            setData(res.data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load Tax Declaration data.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: string | number | null | undefined) => {
        if (val === null || val === undefined || val === '') return <span className="text-slate-400">-</span>;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return <span className="text-slate-400">-</span>;
        return <span className="font-mono font-medium">₱{num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    };

    const renderValue = (val: string | number | null | undefined, suffix = '') => {
        if (!val) return <span className="text-slate-400 font-normal text-sm">-</span>;
        return <span className="font-medium text-slate-800 text-sm">{val}{suffix}</span>;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2 uppercase tracking-wide">
            {Icon && <Icon className="w-4 h-4 text-blue-600" />}
            {title}
        </h3>
    );

    const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
        <div className="flex justify-between items-baseline py-1.5 border-b border-slate-50 last:border-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide pr-4">{label}</span>
            <div className="text-right flex-shrink-0 text-sm">{value}</div>
        </div>
    );

    const handlePrint = () => {
        if (data) {
            generateTDPdf(data);
        }
    };

    if (!isOpen) return null;

    const td = data?.td;
    const owners = data?.owners || [];
    const assessments = data?.assessment || [];

    const PropertyIcon = () => {
        if (td?.property_kind === 'LAND') return <LandPlot size={24} className="text-emerald-400" />;
        if (td?.property_kind === 'BUILDING') return <Building size={24} className="text-blue-400" />;
        if (td?.property_kind === 'MACHINERY') return <Factory size={24} className="text-amber-400" />;
        return <Package size={24} className="text-slate-400" />;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-100 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white/10 border border-white/5">
                            <ScrollText size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Tax Declaration</h2>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5 ml-1">
                                <span className="font-mono text-white/90 font-semibold">{td?.td_no || 'Loading...'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* NEW PRINT BUTTON ADDED HERE */}
                        <button 
                            onClick={handlePrint} 
                            disabled={!data || loading}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Print TD"
                        >
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                            <p className="text-slate-500 font-medium">Loading Tax Declaration data...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="bg-red-100 p-4 rounded-full mb-3"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                            <h3 className="text-lg font-bold text-slate-800">Unable to load data</h3>
                            <p className="text-slate-500 mb-4">{error}</p>
                        </div>
                    ) : data ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Status & Effectivity" icon={Info} />
                                    <div className="space-y-2 pt-2">
                                        <InfoRow label="Status" value={
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${td.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                {td.status}
                                            </span>
                                        } />
                                        <InfoRow label="Taxability" value={
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${td.taxable ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                {td.taxable ? 'TAXABLE' : 'EXEMPT'}
                                            </span>
                                        } />
                                        <InfoRow label="Effectivity" value={`${td.assessment_effectivity_qtr}Q ${td.assessment_effectivity_year}`} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Owner(s)" icon={User} />
                                    <div className="space-y-4 pt-2">
                                        {owners.map((o: any, i: number) => (
                                            <div key={i} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                                <p className="font-bold text-slate-800 text-sm uppercase">
                                                    {o.last_name}, {o.first_name} {o.middle_name} {o.suffix}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                                                    <MapPin size={14} className="shrink-0 mt-0.5" /> 
                                                    {o.address_house_no || '-'}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {o.tin_no && <p className="text-xs text-slate-500"><span className="font-semibold text-slate-400">TIN:</span> {o.tin_no}</p>}
                                                    {o.contact_no && <p className="text-xs text-slate-500"><span className="font-semibold text-slate-400">TEL:</span> {o.contact_no}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        {owners.length === 0 && <p className="text-sm italic text-slate-400">No owners recorded.</p>}
                                    </div>
                                </div>

                                {(td.admin_name || td.admin_address) && (
                                    <div className="bg-slate-50 p-5 rounded-xl shadow-sm border border-slate-200">
                                        <SectionHeader title="Administrator" icon={User} />
                                        <div className="pt-2">
                                            <p className="font-bold text-slate-800 text-sm uppercase">{td.admin_name || '-'}</p>
                                            <p className="text-xs text-slate-500 mt-1">{td.admin_address || '-'}</p>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {td.admin_tin && <p className="text-xs text-slate-500"><span className="font-semibold text-slate-400">TIN:</span> {td.admin_tin}</p>}
                                                {td.admin_contact_no && <p className="text-xs text-slate-500"><span className="font-semibold text-slate-400">TEL:</span> {td.admin_contact_no}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Property Details" icon={Hash} />
                                    <div className="space-y-2 pt-2">
                                        <InfoRow label="PIN" value={<span className="font-mono text-blue-700 bg-blue-50 px-1 rounded">{td.property_identification_no || '-'}</span>} />
                                        <InfoRow label="Location" value={`${td.street ? td.street+', ' : ''}${td.barangay}, ${td.municipality}`} />
                                        {(td.lot_no || td.block_no) && (
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
                                                <InfoRow label="Lot No" value={td.lot_no} />
                                                <InfoRow label="Block No" value={td.block_no} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Title & Survey" icon={FileText} />
                                    <div className="space-y-2 pt-2">
                                        <InfoRow label="OCT/TCT/CLOA" value={td.oct_no} />
                                        <InfoRow label="CCT" value={td.cct_no} />
                                        <InfoRow label="Survey No" value={td.survey_no} />
                                        <InfoRow label="Title Date" value={formatDate(td.title_date)} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Boundaries" icon={Map} />
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">North</span>
                                            <span className="text-xs font-medium text-slate-700">{td.boundary_north || '-'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">South</span>
                                            <span className="text-xs font-medium text-slate-700">{td.boundary_south || '-'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">East</span>
                                            <span className="text-xs font-medium text-slate-700">{td.boundary_east || '-'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">West</span>
                                            <span className="text-xs font-medium text-slate-700">{td.boundary_west || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 text-white relative overflow-hidden">
                                    <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none">
                                        <Calculator size={120} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-300 mb-4 pb-2 border-b border-slate-700 flex items-center gap-2 uppercase tracking-wide">
                                        Assessment Summary
                                    </h3>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-medium text-slate-400 uppercase">Total Market Value</span>
                                            <span className="text-sm font-bold text-white font-mono">
                                                {formatCurrency(td.total_market_value)}
                                            </span>
                                        </div>
                                        <div className="pt-4 mt-2 border-t border-slate-700/50">
                                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Total Assessed Value</p>
                                            <p className="text-3xl font-extrabold text-white font-mono tracking-tight leading-none drop-shadow-md">
                                                {formatCurrency(td.total_assessed_value)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                    <SectionHeader title="Assessment Details" icon={Calculator} />
                                    <div className="overflow-x-auto pt-2">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 text-slate-600">
                                                <tr>
                                                    <th className="p-2 font-semibold rounded-tl-lg">Actual Use</th>
                                                    <th className="p-2 font-semibold">Area/Class</th>
                                                    <th className="p-2 font-semibold text-right">MV</th>
                                                    <th className="p-2 font-semibold text-center">AL</th>
                                                    <th className="p-2 font-semibold text-right rounded-tr-lg">AV</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {assessments.map((a: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="p-2 font-medium text-slate-800">{a.actual_use}</td>
                                                        <td className="p-2 text-slate-500">{a.area ? `${a.area}sqm` : ''} {a.classification && `(${a.classification})`}</td>
                                                        <td className="p-2 text-right font-mono text-slate-600">{formatCurrency(a.market_value)}</td>
                                                        <td className="p-2 text-center text-slate-600">{a.assessment_level}%</td>
                                                        <td className="p-2 text-right font-mono font-bold text-slate-800">{formatCurrency(a.assessed_value)}</td>
                                                    </tr>
                                                ))}
                                                {assessments.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic">No assessment details found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {(td.memoranda || td.ordinance_no) && (
                                    <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-200">
                                        <SectionHeader title="Memoranda & Notes" icon={AlertCircle} />
                                        <div className="pt-2 space-y-3">
                                            {td.ordinance_no && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-yellow-700 uppercase mb-0.5">Ordinance No.</p>
                                                    <p className="text-sm font-medium text-yellow-900">{td.ordinance_no}</p>
                                                </div>
                                            )}
                                            {td.memoranda && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-yellow-700 uppercase mb-0.5">Notes</p>
                                                    <p className="text-sm text-yellow-900 whitespace-pre-wrap">{td.memoranda}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="text-xs text-slate-400 italic">
                        {data?.td && `Created by ${data.td.approved_by || 'System'} on ${formatDate(data.td.created_at)}`}
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors text-sm border border-slate-300 shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Management Component ---
const LIMIT = 50;

export default function TaxDeclarationManagement() {
    const [records, setRecords] = useState<TDRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta>({ total_records: 0, total_pages: 1, current_page: 1, limit: LIMIT });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({ property_kind: '', status: '', taxable: '', search: '' });

    // State for View Dialog
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedTdId, setSelectedTdId] = useState<number | null>(null);

    const fetchTDRecords = useCallback(async (page: number, currentFilters: FilterOptions) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: LIMIT.toString(),
                property_kind: currentFilters.property_kind,
                status: currentFilters.status,
                taxable: currentFilters.taxable,
                search_term: currentFilters.search
            });
            for (const [key, value] of params.entries()) { if (!value) params.delete(key); }

            const res = await api.get('td/list', { params });
            setRecords(res.data.data || []);
            setPagination(res.data.pagination || { total_records: 0, total_pages: 1, current_page: 1, limit: LIMIT });
        } catch (err) {
            console.error('Error fetching TD records:', err);
            setError('Failed to load Tax Declarations. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTDRecords(1, filters); }, [filters, fetchTDRecords]);
    useEffect(() => { fetchTDRecords(pagination.current_page, filters); }, [pagination.current_page]);

    const handleFilterChange = (field: keyof FilterOptions, value: string) => setFilters(prev => ({ ...prev, [field]: value }));
    const clearFilters = () => setFilters({ property_kind: '', status: '', taxable: '', search: '' });
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);

    const handleViewDetails = (tdId: number) => {
        setSelectedTdId(tdId);
        setViewDialogOpen(true);
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-blue-500">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-4 rounded-full">
                                <ScrollText className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tax Declarations</h1>
                                <p className="text-gray-500 text-sm">Manage and View all Tax Declarations</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters & Search */}
                    <div className="flex flex-col lg:col-span-4 gap-4">
                        <div className="bg-white rounded-xl shadow-lg">
                            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 lg:border-none rounded-t-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Filter size={20} className="text-blue-600" />
                                    <span className="font-bold text-gray-900">Filter Records</span>
                                </div>
                                {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {showFilters && (
                                <div className="p-4 space-y-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Property Kind</label>
                                        <select value={filters.property_kind} onChange={(e) => handleFilterChange('property_kind', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">All Kinds</option>
                                            <option value="LAND">Land</option>
                                            <option value="BUILDING">Building</option>
                                            <option value="MACHINERY">Machinery</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                        <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">All Status</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Taxability</label>
                                        <select value={filters.taxable} onChange={(e) => handleFilterChange('taxable', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">All</option>
                                            <option value="1">Taxable</option>
                                            <option value="0">Exempt</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-3 flex justify-end">
                                        <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold">
                                            <X size={16} /> Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" placeholder="Search by TD No, FAAS No, ARP, PIN, or Admin Name..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner text-sm outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                                    <p className="text-gray-600">Loading Tax Declarations...</p>
                                </div>
                            ) : error ? (
                                <div className="p-6 text-center bg-red-50 rounded-xl m-4 border border-red-200">
                                    <p className="text-red-700 font-medium mb-3">{error}</p>
                                </div>
                            ) : records.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg font-medium">No Tax Declarations found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-100 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">TD No / FAAS No</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">PIN / ARP</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Admin / Location</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type & Value</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {records.map((r) => (
                                                <tr key={r.td_id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="font-mono text-sm font-bold text-gray-900 block">{r.td_no}</span>
                                                        <span className="text-xs text-blue-600 font-semibold mt-0.5 inline-flex items-center gap-1">
                                                            FAAS: {r.faas_no || <span className="text-gray-400 italic">Unlinked</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium text-gray-800 block">{r.pin || '-'}</span>
                                                        <span className="text-xs text-gray-500 block">{r.arp_no || '-'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[200px] truncate">
                                                        <span className="text-sm font-semibold text-gray-800 block truncate" title={r.admin_name || ''}>{r.admin_name || '-'}</span>
                                                        <span className="text-xs text-gray-500">{r.barangay || '-'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                                                                r.property_kind === 'LAND' ? 'bg-emerald-100 text-emerald-800' :
                                                                r.property_kind === 'BUILDING' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                {r.property_kind}
                                                            </span>
                                                            {r.taxable ? <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-200">TAXABLE</span> : <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 rounded border border-gray-200">EXEMPT</span>}
                                                        </div>
                                                        <span className="text-sm font-mono font-bold text-slate-700">{formatCurrency(r.total_assessed_value)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-bold border ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleViewDetails(r.td_id)} 
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors font-medium border border-transparent hover:border-blue-200"
                                                        >
                                                            <Eye size={16} /> View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Embedded TD View Dialog */}
            <TDViewDialog 
                tdId={selectedTdId}
                isOpen={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
            />
        </div>
    );
}