import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Download, Filter, X, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../axiosBase';

interface AssessmentRollRecord {
    revision_year: number;
    barangay: string;
    td_no: string;
    owner_name: string;
    property_kind: 'LAND' | 'BUILDING' | 'MACHINERY';
    market_value: number;
    assessed_value: number;
    effectivity_date: string;
    status: string;
    lot_no?: string;
    block_no?: string;
    arp_no?: string;
}

interface FilterOptions {
    barangay: string;
    lot_no: string;
    block_no: string;
    owner_name: string;
    property_kind: string;
    revision_year: string;
}

export default function AssessmentRoll() {
    const [records, setRecords] = useState<AssessmentRollRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<AssessmentRollRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    // Filter states
    const [showFilters, setShowFilters] = useState<boolean>(true);
    const [filters, setFilters] = useState<FilterOptions>({
        barangay: '',
        lot_no: '',
        block_no: '',
        owner_name: '',
        property_kind: '',
        revision_year: ''
    });

    // Dropdown options
    const [barangayOptions, setBarangayOptions] = useState<string[]>([]);
    const [revisionYearOptions, setRevisionYearOptions] = useState<number[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 50;

    useEffect(() => {
        fetchAssessmentRoll();
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, records]);

    const fetchAssessmentRoll = async () => {
        setLoading(true);
        setError('');

        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const res = await api.get(`td/aroll${queryParams.toString() ? `?${queryParams}` : ''}`);

            // backend returns { count, data }
            const data = res.data.data || [];

            setRecords(data);
            setFilteredRecords(data);
        } catch (err) {
            console.error('Error fetching assessment roll:', err);
            setError('Failed to load assessment roll data');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            // Fetch unique barangays
            const barangayRes = await api.get('lvg/barangayList');
            setBarangayOptions(barangayRes.data || []);

            // Fetch revision years
            const ryRes = await api.get('ry/list');
            const years = ryRes.data.map((ry: any) => ry.year);
            setRevisionYearOptions(years);
        } catch (err) {
            console.error('Error fetching filter options:', err);
        }
    };


    useEffect(()=>{
        fetchAssessmentRoll();
    }, [filters])

    

    const applyFilters = () => {
        let filtered = [...records];

        // if (filters.barangay) {
        //     filtered = filtered.filter(r => 
        //         r.barangay?.toLowerCase().includes(filters.barangay.toLowerCase())
        //     );
        // }

        // if (filters.lot_no) {
        //     filtered = filtered.filter(r => 
        //         r.lot_no?.toLowerCase().includes(filters.lot_no.toLowerCase())
        //     );
        // }

        // if (filters.block_no) {
        //     filtered = filtered.filter(r => 
        //         r.block_no?.toLowerCase().includes(filters.block_no.toLowerCase())
        //     );
        // }

        // if (filters.owner_name) {
        //     filtered = filtered.filter(r => 
        //         r.owner_name.toLowerCase().includes(filters.owner_name.toLowerCase())
        //     );
        // }

        // if (filters.property_kind) {
        //     filtered = filtered.filter(r => r.property_kind === filters.property_kind);
        // }

        // if (filters.revision_year) {
        //     filtered = filtered.filter(r => r.revision_year === Number(filters.revision_year));
        // }

        setFilteredRecords(filtered);
        setCurrentPage(1);
    };

    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            barangay: '',
            lot_no: '',
            block_no: '',
            owner_name: '',
            property_kind: '',
            revision_year: ''
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

    const exportToCSV = () => {
        const headers = ['Revision Year', 'Barangay', 'TD No', 'Owner Name', 'Property Kind', 'Market Value', 'Assessed Value', 'Effectivity Date'];
        const csvData = filteredRecords.map(record => [
            record.revision_year,
            record.barangay,
            record.td_no,
            record.owner_name,
            record.property_kind,
            record.market_value,
            record.assessed_value,
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
        a.download = `assessment-roll-${new Date().toISOString().split('T')[0]}.csv`;
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

    return (
        <div className="min-h-screen w-full bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Assessment Roll</h1>
                                <p className="text-gray-600">Active Tax Declarations Overview</p>
                            </div>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Properties</p>
                        <p className="text-3xl font-bold text-gray-900">{filteredRecords.length.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Market Value</p>
                        <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalMarketValue)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Assessed Value</p>
                        <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalAssessedValue)}</p>
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
                            <span className="font-semibold text-gray-900">Filters</span>
                            {Object.values(filters).some(v => v) && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                    Active
                                </span>
                            )}
                        </div>
                        {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showFilters && (
                        <div className="p-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Barangay Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                                    <select
                                        value={filters.barangay}
                                        onChange={(e) => handleFilterChange('barangay', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Barangays</option>
                                        {barangayOptions.map((brgy, index) => (
                                            <option key={index} value={brgy.barangay_name}>{brgy.barangay_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Lot No Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Lot No</label>
                                    <input
                                        type="text"
                                        value={filters.lot_no}
                                        onChange={(e) => handleFilterChange('lot_no', e.target.value)}
                                        placeholder="Search lot number..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Block No Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Block No</label>
                                    <input
                                        type="text"
                                        value={filters.block_no}
                                        onChange={(e) => handleFilterChange('block_no', e.target.value)}
                                        placeholder="Search block number..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Owner Name Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                                    <input
                                        type="text"
                                        value={filters.owner_name}
                                        onChange={(e) => handleFilterChange('owner_name', e.target.value)}
                                        placeholder="Search owner name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Property Kind Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Kind</label>
                                    <select
                                        value={filters.property_kind}
                                        onChange={(e) => handleFilterChange('property_kind', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Types</option>
                                        <option value="LAND">Land</option>
                                        <option value="BUILDING">Building</option>
                                        <option value="MACHINERY">Machinery</option>
                                    </select>
                                </div>

                                {/* Revision Year Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Revision Year</label>
                                    <select
                                        value={filters.revision_year}
                                        onChange={(e) => handleFilterChange('revision_year', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Years</option>
                                        {revisionYearOptions.map(year => (
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
                            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600">Loading assessment roll data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600">
                            <p>{error}</p>
                            <button
                                onClick={fetchAssessmentRoll}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No records found</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TD No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Barangay</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Market Value</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Assessed Value</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Year</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentRecords.map((record, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-sm font-semibold text-gray-900">{record.td_no}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">{record.owner_name}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-700">{record.barangay || '-'}</span>
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
                                                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(record.assessed_value)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-700">{record.revision_year}</span>
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
                                                        ? 'bg-blue-600 text-white border-blue-600'
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