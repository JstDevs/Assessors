import React, { useState } from 'react';
import { X, Clock, FileText, User, ChevronDown, ChevronUp, Loader2, FileSignature, ArrowRight } from 'lucide-react';

import api from '../../../axiosBase.ts'; 

// const api = {
//     get: async (url: string) => {
//         console.log(`[MockAPI] GET request to: ${url}`);
        
//         // Simulate network delay
//         await new Promise(resolve => setTimeout(resolve, 500));

//         // Return mock details
//         // mimicking: /faas/history/details/{id}
//         // We generate a larger dataset here to demonstrate scrolling
//         return {
//             data: [
//                 {
//                     history_detail_id: Math.random(),
//                     changed_field: 'MARKET_VALUE',
//                     old_value: '1,500,000.00',
//                     new_value: '1,750,000.00'
//                 },
//                 {
//                     history_detail_id: Math.random(),
//                     changed_field: 'IMPROVEMENTS',
//                     // Simulating a large JSON object to test scrolling
//                     old_value: JSON.stringify({ 
//                         "Items": Array.from({length: 20}).map((_, i) => ({ 
//                             name: `Old Item ${i+1}`, 
//                             val: (i+1)*100 
//                         })) 
//                     }),
//                     new_value: JSON.stringify({ 
//                         "Items": Array.from({length: 25}).map((_, i) => ({ 
//                             name: `New Item ${i+1}`, 
//                             val: (i+1)*120 
//                         })) 
//                     })
//                 }
//             ]
//         };
//     }
// };

// --- 1. INTERFACES ---

// The structure of the DETAILS returned from the on-click API call
interface HistoryDetailEntry {
    history_detail_id?: number;
    column_name: string;
    old_value: string | [] | null;
    new_value: string | [] | null;
}

// The structure of the SUMMARY passed via props (from your example)
interface HistorySummary {
    history_id: number;
    property_id: number;
    action: string;
    changed_by: string;
    change_ts: string; // ISO String
    remarks: string;
}

interface JSONValueMap {
    [key: string]: any;
}

interface PropertyChangeHistoryDialogProps {
    propertyId: number;
    isOpen: boolean;
    onClose: () => void;
    history: HistorySummary[]; // Now accepts the list directly
}

// --- 2. HELPERS ---

const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const normalizeFieldName = (fieldName: string) => {
    if (!fieldName) return 'Unknown Field';
    return fieldName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/Id/g, 'ID')
        .replace(/Psc Code/g, 'PSC Code');
};

const parseValue = (value: string | null | undefined): JSONValueMap | string => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    }
    return '';
};

const formatDisplayValue = (value: any): string => {
    if (value === null || value === undefined || value === "" || value === 'null') {
        return '—';
    }
    return String(value);
};

// --- 3. COMPONENT ---

export default function PropertyChangeHistoryDialog({
    propertyId,
    isOpen,
    onClose,
    history
}: PropertyChangeHistoryDialogProps) {
    
    // State to track which item is expanded
    const [expandedId, setExpandedId] = useState<number | null>(null);
    
    // State to store fetched details (Cache), key is history_id
    const [detailsCache, setDetailsCache] = useState<Record<number, HistoryDetailEntry[]>>({});
    
    // State for local loading of details
    const [loadingId, setLoadingId] = useState<number | null>(null);

    // --- Interaction Handler ---
    const handleExpand = async (item: HistorySummary) => {
        // If clicking the already open item, close it
        if (expandedId === item.history_id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(item.history_id);

        // If we already have the details in cache, don't fetch again
        if (detailsCache[item.history_id]) {
            return;
        }

        // Otherwise, fetch details
        setLoadingId(item.history_id);
        try {
            // TEMPORARY API CALL based on requirements
            const response = await api.get(`pml/history/details/${item.history_id}`);
            
            // Assuming the backend returns an array of details directly, 
            // or an object containing the list. Adjust based on actual response.
            const details = response.data.general || [];
            const landImprovements = response.data.land_improvements ?? [];
            const buildingAreas = response.data.building_areas ?? [];
            const buildingMaterials = response.data.building_materials ?? [];
            const buildingItems = response.data.building_items ?? [];
            //for land improvements
            if(item.property_kind === 'Land' && landImprovements.length > 0){
                details.push({column_name: "land_improvements", old_value: landImprovements.filter(item=>item.type === 'OLD'), new_value: landImprovements.filter(item=>item.type === 'NEW')})
            }else if(item.property_kind === 'Building'){
                details.push({column_name: "building_areas", old_value: buildingAreas.filter(item=>item.type === 'OLD'), new_value: buildingAreas.filter(item=>item.type === 'NEW')})
                details.push({column_name: "building_materials", old_value: buildingMaterials.filter(item=>item.type === 'OLD'), new_value: buildingMaterials.filter(item=>item.type === 'NEW')})
                details.push({column_name: "building_items", old_value: buildingItems.filter(item=>item.type === 'OLD'), new_value: buildingItems.filter(item=>item.type === 'NEW')})
            }
            console.log(details);
            setDetailsCache(prev => ({
                ...prev,
                [item.history_id]: details
            }));

        } catch (error) {
            console.error("Failed to fetch details", error);
            // Optionally set an error state here specifically for this ID
        } finally {
            setLoadingId(null);
        }
    };

    // --- Rendering Logic for Complex JSON Objects (Reused from original) ---
    const renderDetailContent = (detail: HistoryDetailEntry, type:string) => {
        const { column_name, old_value, new_value } = detail;
        // console.log(old_value);
        if(old_value === null){
            return(
                <div className="mt-2 flex items-center gap-4 text-sm">
                    
                    <div className="flex-1 bg-green-50 border border-green-100 rounded px-3 py-2 text-green-700 break-words">
                        <span className="text-[10px] font-bold text-green-400 block uppercase mb-1">Value</span>
                        {formatDisplayValue(new_value)}
                    </div>
                </div>
            )
        }

        if (column_name === 'owners') {
            const oldList = old_value
                ? old_value.split('|').filter(Boolean)
                : [];

            const newList = new_value
                ? new_value.split('|').filter(Boolean)
                : [];

            const removed = oldList.filter(o => !newList.includes(o));
            const added = newList.filter(o => !oldList.includes(o));

            return (
                <div className="mt-2 space-y-3 text-sm">
                    <div className="font-semibold text-gray-700">Owners</div>

                    {/* ALL CURRENT OWNERS */}
                    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Current Owners
                        </div>
                        {newList.length ? (
                            <ul className="list-disc ml-4 space-y-1 text-gray-800">
                                {newList.map((o, i) => (
                                    <li key={`current-${i}`}>{o}</li>
                                ))}
                            </ul>
                        ) : (
                            <span className="opacity-50">None</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* REMOVED */}
                        <div className="bg-red-50 border border-red-100 rounded px-3 py-2">
                            
                            {type === 'TRANSFER'?
                                <>
                                    <div className="text-[10px] font-bold text-red-400 uppercase mb-1">
                                        Old
                                    </div>
                                    {old_value?.split('||').length ? (
                                        <ul className="list-disc ml-4 space-y-1 text-red-700">
                                            {old_value?.split('||').filter(Boolean).map((o, i) => (
                                                <li key={`removed-${i}`}>{o}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="opacity-50">NONE</span>
                                    )}
                                </>
                                
                            :<>
                                <div className="text-[10px] font-bold text-red-400 uppercase mb-1">
                                    Removed
                                </div>
                                {removed.length ? (
                                    <ul className="list-disc ml-4 space-y-1 text-red-700">
                                        {removed.map((o, i) => (
                                            <li key={`removed-${i}`}>{o}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="opacity-50">None</span>
                                )}
                            </>
                            }
                        </div>

                        {/* ADDED */}
                        <div className="bg-green-50 border border-green-100 rounded px-3 py-2">
                            {type === 'TRANSFER'?
                                <>
                                    <div className="text-[10px] font-bold text-green-700 uppercase mb-1">
                                        New
                                    </div>
                                    {new_value?.split('||').length ? (
                                        <ul className="list-disc ml-4 space-y-1 text-green-700">
                                            {new_value?.split('||').filter(Boolean).map((o, i) => (
                                                <li key={`added-${i}`}>{o}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="opacity-50">None</span>
                                    )}
                                </>
                            :<>
                                <div className="text-[10px] font-bold text-green-400 uppercase mb-1">
                                    Added
                                </div>
                                {added.length ? (
                                    <ul className="list-disc ml-4 space-y-1 text-green-700">
                                        {added.map((o, i) => (
                                            <li key={`added-${i}`}>{o}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="opacity-50">None</span>
                                )}
                            </>
                            }
                        </div>
                    </div>
                </div>
            );
        }
        if (Array.isArray(old_value) && Array.isArray(new_value) && ((old_value?.length ?? 0) > 0 || (new_value?.length ?? 0) > 0) ){ 
            if ((column_name === 'land_improvements')) {
                const oldList = [...old_value];
                const newList = [...new_value];

                const renderTable = (list: any[], tone: 'neutral' | 'old' | 'new') => {
                    const styles = {
                        neutral: 'border-gray-200 text-gray-800',
                        old: 'border-red-200 text-red-700',
                        new: 'border-green-200 text-green-700'
                    };

                    return (
                        <div className={`border rounded ${styles[tone]} max-h-56 overflow-y-auto`}>
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="px-2 py-1 text-left font-semibold">Improvement</th>
                                        <th className="px-2 py-1 text-right font-semibold">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length ? (
                                        list.map((i: any) => (
                                            <tr key={i.i_id} className="border-t">
                                                <td className="px-2 py-1">{i.improvement_name}</td>
                                                <td className="px-2 py-1 text-right font-mono">
                                                    {i.quantity}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="px-2 py-2 text-center opacity-50">
                                                None
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                };

                return (
                    <div className="mt-2 space-y-4 text-sm">
                        <div className="font-semibold text-gray-700">Land Improvements</div>

                        {/* CURRENT */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Current
                            </div>
                            {renderTable(newList, 'neutral')}
                        </div>

                        {/* OLD | NEW */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Old | New
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTable(oldList, 'old')}
                                {renderTable(newList, 'new')}
                            </div>
                        </div>
                    </div>
                );
            }
            if (column_name === 'building_areas') {
                const oldList = [...old_value];
                const newList = [...new_value];

                const renderTable = (list: any[], tone: 'neutral' | 'old' | 'new') => {
                    const colors = {
                        neutral: 'border-gray-200 text-gray-800',
                        old: 'border-red-200 text-red-700',
                        new: 'border-green-200 text-green-700'
                    };

                    return (
                        <div className={`border rounded ${colors[tone]} max-h-56 overflow-y-auto`}>
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="px-2 py-1 text-left">Floor</th>
                                        <th className="px-2 py-1 text-right">Area</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length ? list.map((r: any) => (
                                        <tr key={r.bfa_id} className="border-t">
                                            <td className="px-2 py-1">Floor {r.floor_no}</td>
                                            <td className="px-2 py-1 text-right font-mono">{r.floor_area}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={2} className="text-center py-2 opacity-50">None</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                };

                return (
                    <div className="mt-2 space-y-4">
                        <div className="font-semibold text-gray-700">Building Floor Areas</div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Current</div>
                            {renderTable(newList, 'neutral')}
                        </div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Old | New</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTable(oldList, 'old')}
                                {renderTable(newList, 'new')}
                            </div>
                        </div>
                    </div>
                );
            }
            if (column_name === 'building_materials') {
                const oldList = Array.isArray(old_value) ? old_value : JSON.parse(old_value || '[]');
                const newList = Array.isArray(new_value) ? new_value : JSON.parse(new_value || '[]');

                const renderTable = (list: any[], tone: 'neutral' | 'old' | 'new') => {
                    const colors = {
                        neutral: 'border-gray-200 text-gray-800',
                        old: 'border-red-200 text-red-700',
                        new: 'border-green-200 text-green-700'
                    };

                    return (
                        <div className={`border rounded ${colors[tone]} max-h-56 overflow-y-auto`}>
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="px-2 py-1 text-left">Part</th>
                                        <th className="px-2 py-1 text-left">Floor</th>
                                        <th className="px-2 py-1 text-left">Material</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length ? list.map((r: any) => (
                                        <tr key={r.bsm_id} className="border-t">
                                            <td className="px-2 py-1">{r.part}</td>
                                            <td className="px-2 py-1">{r.floor_no ?? '-'}</td>
                                            <td className="px-2 py-1">{r.material}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="text-center py-2 opacity-50">None</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                };

                return (
                    <div className="mt-2 space-y-4">
                        <div className="font-semibold text-gray-700">Building Structural Materials</div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Current</div>
                            {renderTable(newList, 'neutral')}
                        </div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Old | New</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTable(oldList, 'old')}
                                {renderTable(newList, 'new')}
                            </div>
                        </div>
                    </div>
                );
            }
            if (column_name === 'building_items') {
                const oldList = Array.isArray(old_value) ? old_value : JSON.parse(old_value || '[]');
                const newList = Array.isArray(new_value) ? new_value : JSON.parse(new_value || '[]');

                const renderTable = (list: any[], tone: 'neutral' | 'old' | 'new') => {
                    const colors = {
                        neutral: 'border-gray-200 text-gray-800',
                        old: 'border-red-200 text-red-700',
                        new: 'border-green-200 text-green-700'
                    };

                    return (
                        <div className={`border rounded ${colors[tone]} max-h-56 overflow-y-auto`}>
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="px-2 py-1 text-left">Item</th>
                                        <th className="px-2 py-1 text-right">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length ? list.map((r: any) => (
                                        <tr key={r.bai_id} className="border-t">
                                            <td className="px-2 py-1">{r.item_name}</td>
                                            <td className="px-2 py-1 text-right font-mono">{r.quantity}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={2} className="text-center py-2 opacity-50">None</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                };

                return (
                    <div className="mt-2 space-y-4">
                        <div className="font-semibold text-gray-700">Building Additional Items</div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Current</div>
                            {renderTable(newList, 'neutral')}
                        </div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Old | New</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTable(oldList, 'old')}
                                {renderTable(newList, 'new')}
                            </div>
                        </div>
                    </div>
                );
            }

        }

        // Simple Field Update
        return (
            <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex-1 bg-red-50 border border-red-100 rounded px-3 py-2 text-red-700 break-words">
                    <span className="text-[10px] font-bold text-red-400 block uppercase mb-1">Previous</span>
                    {formatDisplayValue(old_value)}
                </div>
                <ArrowRight size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 bg-green-50 border border-green-100 rounded px-3 py-2 text-green-700 break-words">
                    <span className="text-[10px] font-bold text-green-400 block uppercase mb-1">New</span>
                    {formatDisplayValue(new_value)}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Added style for custom scrollbar logic if needed, though Tailwind overflow-auto usually works well */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="bg-emerald-600 text-white p-6 flex items-center justify-between rounded-t-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <Clock className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold">History Log</h2>
                            <p className="text-sm opacity-90">
                                Property ID: <span className='font-mono font-bold'>{propertyId}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content List - Main Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-lg font-medium">No History Available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => {
                                const isExpanded = expandedId === item.history_id;
                                const isLoading = loadingId === item.history_id;
                                const details = detailsCache[item.history_id] || [];

                                return (
                                    <div 
                                        key={item.history_id} 
                                        className={`bg-white rounded-lg border transition-all duration-200 overflow-hidden ${
                                            isExpanded ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-gray-200 hover:border-emerald-300'
                                        }`}
                                    >
                                        {/* Summary Row (Clickable) */}
                                        <div 
                                            onClick={() => handleExpand(item)}
                                            className="p-4 cursor-pointer flex items-center justify-between gap-4"
                                        >
                                            <div className="flex flex-col gap-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                                        ${item.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 
                                                          item.action === 'CREATE' ? 'bg-green-100 text-green-700' : 
                                                          'bg-gray-100 text-gray-700'}`
                                                    }>
                                                        {item.action}
                                                    </span>
                                                    <span className="text-gray-500 text-xs font-mono">
                                                        {formatDateTime(item.change_ts)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User size={14} /> {item.changed_by || 'System'}
                                                    </span>
                                                    {item.remarks && (
                                                        <span className="flex items-center gap-1 text-gray-400 italic">
                                                            <FileSignature size={14} /> {item.remarks}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="text-gray-400">
                                                {isLoading ? (
                                                    <Loader2 size={20} className="animate-spin text-emerald-600" />
                                                ) : isExpanded ? (
                                                    <ChevronUp size={20} />
                                                ) : (
                                                    <ChevronDown size={20} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Details Section */}
                                        {isExpanded && (
                                            <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-200">
                                                {isLoading ? (
                                                    <div className="flex justify-center py-4 text-gray-500 text-sm gap-2">
                                                        <Loader2 size={16} className="animate-spin" /> Fetching details...
                                                    </div>
                                                ) : details.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {details.map((detail, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                                <h4 className="font-bold text-gray-800 text-sm border-b pb-1 mb-2">
                                                                    {normalizeFieldName(detail.column_name)}
                                                                </h4>
                                                                {renderDetailContent(detail, item.action)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-center text-gray-500 italic text-sm py-2">
                                                        No detailed changes recorded for this transaction.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}