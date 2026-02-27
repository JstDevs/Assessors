import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, ClipboardList, Download, Filter, Loader, 
    ChevronDown, ChevronUp, X, MapPin, Building2, 
    CheckCircle2, XCircle, User
} from 'lucide-react';
import api from '../../axiosBase'; // Adjust path as needed

// --- Interfaces ---
interface ROARecord {
    id: number;
    td_no: string;
    pin: string;
    owner_name: string;
    admin_name: string | null;
    barangay: string;
    property_kind: string;
    taxable: boolean;
    status: string;
    market_value: number;
    assessed_value: number;
}

interface ReportAggregates {
    total_market_value: number;
    total_assessed_value: number;
    record_count: number;
}

export default function RecordOfAssessments() {
    const [activeTab, setActiveTab] = useState<'taxable' | 'exempt'>('taxable');
    
    const [records, setRecords] = useState<ROARecord[]>([]);
    const [aggregates, setAggregates] = useState<ReportAggregates>({ total_market_value: 0, total_assessed_value: 0, record_count: 0 });
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [barangays, setBarangays] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        year: new Date().getFullYear().toString(),
        barangay: '',
        property_kind: '',
        search_term: ''
    });

    // Load initial dropdowns (Assuming same barangay endpoint exists)
    useEffect(() => {
        api.get('lvg/barangayList')
           .then((res: any) => {
               setBarangays(res.data.map((b: any) => b.barangay_name));
           })
           .catch(err => console.error("Failed to load barangays", err));
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                taxable: activeTab === 'taxable' ? '1' : '0'
            };

            const res = await api.get('faas/roa', { params });
            setRecords(res.data.data.data || []);
            setAggregates(res.data.data.aggregates || { total_market_value: 0, total_assessed_value: 0, record_count: 0 });
        } catch (err) {
            console.error("Failed to fetch ROA:", err);
        } finally {
            setLoading(false);
        }
    }, [filters, activeTab]);

    // Re-fetch when tab or filters change with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchReport();
        }, 300); 
        return () => clearTimeout(timeoutId);
    }, [fetchReport]);

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    };

    const exportToCSV = () => {
        const headers = ['TD No', 'PIN', 'Owner Name', 'Admin Name', 'Barangay', 'Kind', 'Market Value', 'Assessed Value', 'Taxability', 'Status'];
        const csvData = records.map(r => [
            r.td_no, 
            r.pin, 
            `"${r.owner_name || ''}"`, 
            `"${r.admin_name || ''}"`, 
            r.barangay, 
            r.property_kind, 
            r.market_value, 
            r.assessed_value, 
            r.taxable ? 'Taxable' : 'Exempt',
            r.status
        ]);

        // Add Aggregate Footer
        csvData.push(['', '', '', '', '', 'TOTALS:', aggregates.total_market_value.toString(), aggregates.total_assessed_value.toString(), '', '']);

        const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ROA_${activeTab.toUpperCase()}_${filters.year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3.5 rounded-xl text-emerald-700">
                            <ClipboardList size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Record of Assessments (ROA)</h1>
                            <p className="text-slate-500 text-sm font-medium">Master registry of active tax declarations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={filters.year} 
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            className="bg-slate-100 border-none text-slate-700 font-bold py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                        </select>
                        <button
                            onClick={exportToCSV}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-colors"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                    <div className="flex flex-col lg:flex-row gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-between lg:justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors lg:w-48 shrink-0 border border-slate-200"
                        >
                            <span className="flex items-center gap-2"><Filter size={18} className="text-emerald-600"/> Filters</span>
                            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by TD No, PIN, or Owner/Admin Name..."
                                value={filters.search_term}
                                onChange={(e) => handleFilterChange('search_term', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Barangay</label>
                                <select 
                                    value={filters.barangay} onChange={(e) => handleFilterChange('barangay', e.target.value)}
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Barangays</option>
                                    {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Property Kind</label>
                                <select 
                                    value={filters.property_kind} onChange={(e) => handleFilterChange('property_kind', e.target.value)}
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Kinds</option>
                                    <option value="LAND">Land</option>
                                    <option value="BUILDING">Building</option>
                                    <option value="MACHINERY">Machinery</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={() => setFilters({...filters, barangay: '', property_kind: '', search_term: ''})} className="w-full p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                    <X size={16}/> Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs for Taxable vs Exempt */}
                <div className="flex gap-2 border-b border-slate-300 pb-px">
                    <button
                        onClick={() => setActiveTab('taxable')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-lg transition-colors ${
                            activeTab === 'taxable' 
                            ? 'bg-white text-emerald-700 border border-slate-300 border-b-transparent shadow-[0_-4px_6px_-4px_rgba(0,0,0,0.1)] relative top-px z-10' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
                        }`}
                    >
                        <CheckCircle2 size={18} className={activeTab === 'taxable' ? 'text-emerald-600' : ''} />
                        Taxable Properties
                    </button>
                    <button
                        onClick={() => setActiveTab('exempt')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-lg transition-colors ${
                            activeTab === 'exempt' 
                            ? 'bg-white text-emerald-700 border border-slate-300 border-b-transparent shadow-[0_-4px_6px_-4px_rgba(0,0,0,0.1)] relative top-px z-10' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
                        }`}
                    >
                        <XCircle size={18} className={activeTab === 'exempt' ? 'text-emerald-600' : ''} />
                        Exempt Properties
                    </button>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-b-xl rounded-tr-xl shadow-lg border border-slate-300 overflow-hidden relative z-0">
                    
                    {/* Aggregates Banner */}
                    <div className="bg-slate-800 text-white p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-700">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Total Active TDs</p>
                            <p className="text-xl font-bold font-mono">{aggregates.record_count.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Total Market Value</p>
                            <p className="text-xl font-bold font-mono text-emerald-400">{formatCurrency(aggregates.total_market_value)}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Total Assessed Value</p>
                            <p className="text-xl font-bold font-mono text-blue-400">{formatCurrency(aggregates.total_assessed_value)}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Loading ROA records...</p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No records found for this filter.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">TD No / PIN</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Owner & Admin</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Property Info</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-right">Market Value</th>
                                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-right">Assessed Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <div className="font-mono font-bold text-emerald-900">{r.td_no}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{r.pin}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-bold text-slate-800 uppercase flex items-start gap-1">
                                                    <User size={14} className="mt-0.5 text-slate-400 shrink-0"/>
                                                    <span className="truncate max-w-[250px]" title={r.owner_name}>{r.owner_name || 'N/A'}</span>
                                                </div>
                                                {r.admin_name && (
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 ml-4">
                                                        <span className="font-semibold">Admin:</span> {r.admin_name}
                                                    </div>
                                                )}
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1 ml-4">
                                                    <MapPin size={10} /> {r.barangay}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border inline-block mb-1 ${
                                                    r.property_kind === 'LAND' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    r.property_kind === 'BUILDING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {r.property_kind || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="font-mono font-medium text-slate-700">{formatCurrency(r.market_value)}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-right bg-slate-50/50">
                                                <div className="font-mono font-bold text-slate-900">{formatCurrency(r.assessed_value)}</div>
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
    );
}