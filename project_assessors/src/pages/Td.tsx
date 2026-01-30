import React, { useState, useEffect } from 'react';
import { Search, Receipt, Eye, Download, Filter, X, Loader, ChevronDown, ChevronUp, Calendar, MapPin } from 'lucide-react';
import api from '../../axiosBase.js';
import Loading from '../common/Loading.js';

interface TaxDeclarationRecord {
    td_id: number;
    faas_id: number;
    td_no: string;
    effectivity_date: string;
    owner_name: string;
    owner_address: string | null;
    property_location: string | null;
    property_kind: 'LAND' | 'BUILDING' | 'MACHINERY';
    market_value: number;
    assessment_level: number;
    assessed_value: number;
    taxable: boolean;
    status: 'ACTIVE' | 'CANCELLED';
    created_by: string | null;
    created_date: string;
    // Additional fields from joins
    faas_no?: string;
    arp_no?: string;
    barangay?: string;
    revision_year?: number;
}

interface FilterOptions {
    property_kind: string;
    status: string;
    taxable: string;
    barangay: string;
    search: string;
    year: string;
}

export default function TaxDeclarationManagement() {
    const [tdRecords, setTdRecords] = useState<TaxDeclarationRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<TaxDeclarationRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    // Filter states
    const [showFilters, setShowFilters] = useState<boolean>(true);
    const [filters, setFilters] = useState<FilterOptions>({
        property_kind: '',
        status: '',
        taxable: '',
        barangay: '',
        search: '',
        year: ''
    });

    // Dropdown options
    const [barangayOptions, setBarangayOptions] = useState<string[]>([]);
    const [yearOptions, setYearOptions] = useState<number[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 50;

    useEffect(() => {
        fetchTaxDeclarations();
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, tdRecords]);

    const fetchTaxDeclarations = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('taxdeclaration/list-all');
            setTdRecords(res.data || []);
            setFilteredRecords(res.data || []);
        } catch (err) {
            console.error('Error fetching tax declarations:', err);
            setError('Failed to load tax declaration records');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            // Fetch unique barangays
            const barangayRes = await api.get('property/barangays');
            setBarangayOptions(barangayRes.data || []);

            // Extract unique years from effectivity dates
            const res = await api.get('taxdeclaration/list-all');
            const records = res.data || [];
            const years = [...new Set(records.map((r: TaxDeclarationRecord) => 
                new Date(r.effectivity_date).getFullYear()
            ))].sort((a, b) => b - a);
            setYearOptions(years);
        } catch (err) {
            console.error('Error fetching filter options:', err);
        }
    };

    const applyFilters = () => {
        let filtered = [...tdRecords];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(r => 
                r.td_no.toLowerCase().includes(searchLower) ||
                r.owner_name.toLowerCase().includes(searchLower) ||
                r.faas_no?.toLowerCase().includes(searchLower) ||
                r.arp_no?.toLowerCase().includes(searchLower) ||
                r.property_location?.toLowerCase().includes(searchLower)
            );
        }

        // Property Kind filter
        if (filters.property_kind) {
            filtered = filtered.filter(r => r.property_kind === filters.property_kind);
        }

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(r => r.status === filters.status);
        }

        // Taxable filter
        if (filters.taxable) {
            filtered = filtered.filter(r => 
                filters.taxable === 'true' ? r.taxable : !r.taxable
            );
        }

        // Barangay filter
        if (filters.barangay) {
            filtered = filtered.filter(r => 
                r.barangay?.toLowerCase().includes(filters.barangay.toLowerCase())
            );
        }

        // Year filter
        if (filters.year) {
            filtered = filtered.filter(r => 
                new Date(r.effectivity_date).getFullYear() === Number(filters.year)
            );
        }

        setFilteredRecords(filtered);
        setCurrentPage(1);
    };

    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            property_kind: '',
            status: '',
            taxable: '',
            barangay: '',
            search: '',
            year: ''
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeColor = (status: string) => {
        return status === 'ACTIVE' 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const handleViewDetails = (tdId: number) => {
        // Navigate to TD details or open preview dialog
        console.log('View TD:', tdId);
    };

    const exportToCSV = () => {
        const headers = ['TD No', 'FAAS No', 'Owner', 'Property Kind', 'Location', 'Market Value', 'Assessed Value', 'Status', 'Effectivity Date'];
        const csvData = filteredRecords.map(record => [
            record.td_no,
            record.faas_no || '',
            record.owner_name,
            record.property_kind,
            record.property_location || '',
            record.market_value,
            record.assessed_value,
            record.status,
            record.effectivity_date
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-declarations-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Calculate totals
    const totalMarketValue = filteredRecords.reduce((sum, r) => sum + Number(r.market_value), 0);
    const totalAssessedValue = filteredRecords.reduce((sum, r) => sum + Number(r.assessed_value), 0);
    const activeCount = filteredRecords.filter(r => r.status === 'ACTIVE').length;
    const taxableCount = filteredRecords.filter(r => r.taxable).length;

    return (
        <div className="min-h-screen w-full bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-fuchsia-100 p-3 rounded-lg">
                                <Receipt className="w-8 h-8 text-fuchsia-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Tax Declaration Management</h1>
                                <p className="text-gray-600">Manage and monitor tax declaration records</p>
                            </div>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors font-semibold"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Declarations</p>
                        <p className="text-3xl font-bold text-gray-900">{filteredRecords.length.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Active / Taxable</p>
                        <p className="text-3xl font-bold text-emerald-600">{activeCount} / {taxableCount}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Market Value</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalMarketValue)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Assessed Value</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalAssessedValue)}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by TD No, FAAS No, Owner Name, or Location..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gray-600" />
                            <span className="font-semibold text-gray-900">Advanced Filters</span>
                            {Object.values(filters).some(v => v && v !== filters.search) && (
                                <span className="px-2 py-1 bg-fuchsia-100 text-fuchsia-800 rounded-full text-xs font-semibold">
                                    Active
                                </span>
                            )}
                        </div>
                        {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showFilters && (
                        <div className="p-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Property Kind */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Kind</label>
                                    <select
                                        value={filters.property_kind}
                                        onChange={(e) => handleFilterChange('property_kind', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                                    >
                                        <option value="">All Kinds</option>
                                        <option value="LAND">Land</option>
                                        <option value="BUILDING">Building</option>
                                        <option value="MACHINERY">Machinery</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                {/* Taxable */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxable</label>
                                    <select
                                        value={filters.taxable}
                                        onChange={(e) => handleFilterChange('taxable', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                                    >
                                        <option value="">All</option>
                                        <option value="true">Taxable</option>
                                        <option value="false">Non-Taxable</option>
                                    </select>
                                </div>

                                {/* Barangay */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                                    <select
                                        value={filters.barangay}
                                        onChange={(e) => handleFilterChange('barangay', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                                    >
                                        <option value="">All Barangays</option>
                                        {barangayOptions.map(brgy => (
                                            <option key={brgy} value={brgy}>{brgy}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Effectivity Year</label>
                                    <select
                                        value={filters.year}
                                        onChange={(e) => handleFilterChange('year', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                                    >
                                        <option value="">All Years</option>
                                        {yearOptions.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={16} />
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader className="w-12 h-12 text-fuchsia-600 animate-spin mb-4" />
                            <p className="text-gray-600">Loading tax declaration records...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600">
                            <p>{error}</p>
                            <button
                                onClick={fetchTaxDeclarations}
                                className="mt-4 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-12 text-center">
                            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No tax declarations found</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TD No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">FAAS No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kind</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Market Value</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Assessed Value</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentRecords.map((record) => (
                                            <tr key={record.td_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-sm font-bold text-fuchsia-700">{record.td_no}</span>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <Calendar size={12} />
                                                        {formatDate(record.effectivity_date)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-900">{record.faas_no || '-'}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">{record.owner_name}</p>
                                                    {record.owner_address && (
                                                        <p className="text-xs text-gray-500 truncate max-w-xs">{record.owner_address}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-900 flex items-center gap-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {record.property_location || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                        record.property_kind === 'LAND' ? 'bg-green-100 text-green-800' :
                                                        record.property_kind === 'BUILDING' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {record.property_kind}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(record.market_value)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-fuchsia-700">{formatCurrency(record.assessed_value)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold border ${getStatusBadgeColor(record.status)}`}>
                                                            {record.status}
                                                        </span>
                                                        {record.taxable && (
                                                            <span className="px-2 py-1 text-xs rounded-full font-semibold bg-blue-100 text-blue-800">
                                                                Taxable
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleViewDetails(record.td_id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-fuchsia-600 hover:text-fuchsia-800 hover:bg-fuchsia-50 rounded-lg transition-colors"
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
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => paginate(pageNum)}
                                                className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                                    currentPage === pageNum
                                                        ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && <span className="px-2 py-1">...</span>}
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}