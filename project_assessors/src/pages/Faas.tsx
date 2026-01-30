import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Eye, Download, Filter, X, Loader, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import api from '../../axiosBase.ts';
import FAASViewDialog from '../dialogs/faas/viewDialog.tsx';

// Interfaces
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
}

interface FilterOptions {
    faas_type: string;
    property_kind: string;
    status: string;
    taxable: string;
    revision_year: string;
    barangay: string;
    search: string;
}

interface BarangayOption {
    barangay_id: string;
    barangay_name: string;
}

interface PaginationMeta {
    total_records: number;
    total_pages: number;
    current_page: number;
    limit: number;
}

interface Aggregates {
    total_market_value: number;
    total_assessed_value: number;
    total_active_count: number;
}

const LIMIT = 5;

// Mock API for demonstration
// const mockApi = {
//     get: async (endpoint: string, config?: any) => {
//         // Simulate API delay
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         // Mock data
//         const allRecords: FAASRecord[] = Array.from({ length: 23 }, (_, i) => ({
//             faas_id: i + 1,
//             property_id: i + 1,
//             ry_id: 1,
//             faas_no: `2024-${String(i + 1).padStart(4, '0')}`,
//             faas_type: ['ORIGINAL', 'REVISION', 'TRANSFER', 'CANCELLATION'][i % 4] as any,
//             effectivity_date: '2024-01-01',
//             previous_faas_id: null,
//             taxable: i % 2 === 0,
//             remarks: null,
//             status: i % 3 === 0 ? 'CANCELLED' : 'ACTIVE',
//             created_by: 'admin',
//             created_date: '2024-01-01',
//             property_kind: ['LAND', 'BUILDING', 'MACHINERY'][i % 3] as any,
//             market_value: (i + 1) * 50000,
//             assessment_level: 20,
//             assessed_value: (i + 1) * 10000,
//             notes: null,
//             arp_no: `ARP-2024-${String(i + 1).padStart(4, '0')}`,
//             pin: `PIN-${String(i + 1).padStart(6, '0')}`,
//             owner_name: `Owner ${i + 1}`,
//             barangay: ['Poblacion', 'San Roque', 'Santa Cruz'][i % 3],
//             revision_year: 2024
//         }));

//         const params = config?.params;
//         const page = parseInt(params?.get('page') || '1');
//         const limit = parseInt(params?.get('limit') || '5');
        
//         // Filter records based on search and filters
//         let filtered = [...allRecords];
        
//         const searchTerm = params?.get('search_term')?.toLowerCase();
//         if (searchTerm) {
//             filtered = filtered.filter(r => 
//                 r.faas_no.toLowerCase().includes(searchTerm) ||
//                 r.arp_no.toLowerCase().includes(searchTerm) ||
//                 r.owner_name.toLowerCase().includes(searchTerm)
//             );
//         }

//         if (params?.get('status')) {
//             filtered = filtered.filter(r => r.status === params.get('status'));
//         }

//         if (params?.get('property_kind')) {
//             filtered = filtered.filter(r => r.property_kind === params.get('property_kind'));
//         }

//         // Calculate aggregates for ALL filtered records
//         const totalMarketValue = filtered.reduce((sum, r) => sum + r.market_value, 0);
//         const totalAssessedValue = filtered.reduce((sum, r) => sum + r.assessed_value, 0);
//         const totalActiveCount = filtered.filter(r => r.status === 'ACTIVE').length;

//         // Paginate
//         const start = (page - 1) * limit;
//         const paginatedRecords = filtered.slice(start, start + limit);

//         return {
//             data: {
//                 data: paginatedRecords,
//                 pagination: {
//                     total_records: filtered.length,
//                     total_pages: Math.ceil(filtered.length / limit),
//                     current_page: page,
//                     limit: limit
//                 },
//                 aggregates: {
//                     total_market_value: totalMarketValue,
//                     total_assessed_value: totalAssessedValue,
//                     total_active_count: totalActiveCount
//                 }
//             }
//         };
//     }
// };

export default function FAASManagement() {
    const [currentPageRecords, setCurrentPageRecords] = useState<FAASRecord[]>([]);

    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedFaasId, setSelectedFaasId] = useState<number | null>(null);
    
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
        total_records: 0,
        total_pages: 1,
        current_page: 1,
        limit: LIMIT,
    });

    const [aggregates, setAggregates] = useState<Aggregates>({
        total_market_value: 0,
        total_assessed_value: 0,
        total_active_count: 0
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
        barangay: '',
        search: ''
    });

    const [barangayOptions, setBarangayOptions] = useState<BarangayOption[]>([
        { barangay_id: '1', barangay_name: 'Poblacion' },
        { barangay_id: '2', barangay_name: 'San Roque' },
        { barangay_id: '3', barangay_name: 'Santa Cruz' }
    ]);
    
    const [revisionYearOptions, setRevisionYearOptions] = useState<any[]>([
        { ry_id: 1, year: 2024 },
        { ry_id: 2, year: 2023 }
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
                barangay: currentFilters.barangay, 
                search_term: currentFilters.search, 
                taxable: currentFilters.taxable
            });
            
            for (const [key, value] of params.entries()) {
                if (!value || value === '') {
                    params.delete(key);
                }
            }

            const res = await api.get('faas/list', { params });
            
            // Update state with server-side response including aggregates
            setCurrentPageRecords(res.data.data || []);
            setPaginationMeta(res.data.pagination);
            setAggregates(res.data.aggregates || {
                total_market_value: 0,
                total_assessed_value: 0,
                total_active_count: 0
            });

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
            barangay: '',
            search: ''
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
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
        console.log('View FAAS:', faasId);
        setViewDialogOpen(true);
        setSelectedFaasId(faasId);
    };

    const exportToCSV = () => {
        const headers = ['FAAS No', 'ARP No', 'Owner', 'Type', 'Property Kind', 'Status', 'Market Value', 'Assessed Value', 'Revision Year'];
        const csvData = currentPageRecords.map(record => [
            record.faas_no,
            record.arp_no,
            record.owner_name.replace(/"/g, '""'), 
            record.faas_type,
            record.property_kind,
            record.status,
            record.market_value,
            record.assessed_value,
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

                {/* Summary Cards - Now showing ALL filtered records totals */}
                {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-gray-400">
                        <p className="text-sm text-gray-500 mb-1">Total Records (Filtered)</p>
                        <p className="text-2xl font-bold text-gray-900">{totalRecordsText}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-emerald-500">
                        <p className="text-sm text-gray-500 mb-1">Active (All Filtered)</p>
                        <p className="text-2xl font-bold text-emerald-600">{aggregates.total_active_count.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 mb-1">Market Value (All Filtered)</p>
                        <p className="text-xl font-bold text-blue-600 truncate">{formatCurrency(aggregates.total_market_value)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
                        <p className="text-sm text-gray-500 mb-1">Assessed Value (All Filtered)</p>
                        <p className="text-xl font-bold text-purple-600 truncate">{formatCurrency(aggregates.total_assessed_value)}</p>
                    </div>
                </div> */}

                {/* Main Content Area: Search and Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* TOP SECTION: Filters Toggle & Search Bar */}
                    <div className="flex max-h-fit flex-row lg:col-span-4 gap-4 z-100">
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
                                <div className="p-4 space-y-4 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Filter Options</h3>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">FAAS Type</label>
                                        <select
                                            value={filters.faas_type}
                                            onChange={(e) => handleFilterChange('faas_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">All Years</option>
                                            {revisionYearOptions.map((year, i) => (
                                                <option key={i} value={year.ry_id}>{year.year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Barangay</label>
                                        <select
                                            value={filters.barangay}
                                            onChange={(e) => handleFilterChange('barangay', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">All Barangays</option>
                                            {barangayOptions.map((brgy, index) => (
                                                <option key={index} value={brgy.barangay_name}>{brgy.barangay_name}</option>
                                            ))}
                                        </select>
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
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner text-sm"
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
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
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
                                            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[150px]">FAAS No / RY</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[120px]">ARP No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[200px]">Owner / Barangay</th>
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
                                                            <p className="text-xs text-gray-500">RY: {record.revision_year}</p>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="text-sm font-medium text-gray-900">{record.arp_no}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {/* <p className="text-sm font-medium text-gray-900">{record.owner_name}</p>
                                                            {record.barangay && (
                                                                <p className="text-xs text-gray-500 mt-0.5">{record.barangay}</p>
                                                            )} */}
                                                            <p className="text-sm font-medium text-gray-900"> --- </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold border ${getFaasTypeBadgeColor(record.faas_type)}`}>
                                                                    {record.faas_type}
                                                                </span>
                                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold w-fit ${
                                                                    record.property_kind === 'LAND' ? 'bg-indigo-100 text-indigo-800' :
                                                                    record.property_kind === 'BUILDING' ? 'bg-sky-100 text-sky-800' :
                                                                    'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {record.property_kind}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold border w-fit ${getStatusBadgeColor(record.status)}`}>
                                                                    {record.status || "INACTIVE"}
                                                                </span>
                                                                {record.taxable && (
                                                                    <span className="px-2 py-1 text-xs rounded-full font-semibold bg-blue-100 text-blue-800 w-fit">
                                                                        Taxable
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleViewDetails(record.faas_id)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {paginationMeta.total_records > 0 && (
                                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <p className="text-sm text-gray-600">
                                                Showing <span className="font-semibold">{displayFrom}</span> to <span className="font-semibold">{displayTo}</span> of <span className="font-semibold">{totalRecordsText}</span> total records
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => paginate(paginationMeta.current_page - 1)}
                                                    disabled={paginationMeta.current_page === 1}
                                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                                {paginationMeta.current_page + 2 < paginationMeta.total_pages && <span className="px-2 py-1 text-gray-500">...</span>}
                                                <button
                                                    onClick={() => paginate(paginationMeta.current_page + 1)}
                                                    disabled={paginationMeta.current_page === paginationMeta.total_pages}
                                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
    );
}