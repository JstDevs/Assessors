import { AlertOctagon, Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}
interface SearchableSelectProps {
    options: any[]; // Can be any array of objects
    value: string | number | null | undefined;
    onChange: (value: string | number, originalItem?: any) => void;
    placeholder?: string;
    label?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    required?: boolean;
    idKey?: string; 
    labelKey?: string | Array<string>; 
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select...", 
    label, 
    isLoading = false,
    disabled = false,
    className = "",
    required = false,
    idKey = "id",    
    labelKey = "name"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useOnClickOutside(containerRef, () => setIsOpen(false));

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!isOpen) {
            setSearchTerm("");
        }
    }, [isOpen]);

    const resolveLabel = (option: any): string => {
        if (Array.isArray(labelKey)) {
            return labelKey
                .map(part =>
                    option[part] !== undefined ? option[part] : part
                )
                .join(" ")
                .replace(/\s+,/g, ",")
                .replace(/\s+/g, " ")
                .trim();
        }

        return option?.[labelKey] ?? "";
    };

    // Dynamic ID comparison using [idKey]
    const selectedOption = options.find(opt => String(opt[idKey]) === String(value));

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;

        return options.filter(opt =>
            resolveLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleSelect = (option: any) => {
        // Return the dynamic ID and the full object
        onChange(option[idKey], option);
        setIsOpen(false);
    };

    return (
        <div className={`w-full flex-1 relative group ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2 text-left text-sm
                    bg-white border rounded-md shadow-sm transition-all duration-200
                    ${disabled 
                        ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-400' 
                        : 'hover:border-emerald-400 border-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500'
                    }
                    ${isOpen ? 'ring-1 ring-emerald-500 border-emerald-500' : ''}
                `}
            >
                {/* Display dynamic labelKey */}
                <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}>
                    {isLoading
                        ? "Loading..."
                        : selectedOption
                            ? resolveLabel(selectedOption)
                            : placeholder
                    }
                </span>
                <div className="flex items-center gap-2">
                    {isLoading && <Loader2 size={14} className="animate-spin text-slate-500" />}
                    <ChevronDown 
                        size={16} 
                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </div>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top left-0 max-h-50 flex flex-col">
                    
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                <Loader2 size={20} className="animate-spin mb-2 text-slate-500" />
                                <span className="text-xs">Loading options...</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400 px-4 text-center">
                                <AlertOctagon size={20} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium text-slate-500">
                                    {options.length === 0 ? "No items" : "No results"}
                                </span>
                            </div>
                        ) : (
                            <ul className="py-1">
                                {filteredOptions.map((option, index) => {
                                    // Calculate unique key using idKey or fallback to index
                                    const optionId = option[idKey] || index;
                                    const isSelected = String(value) === String(optionId);
                                    
                                    return (
                                        <li 
                                            key={optionId}
                                            onClick={() => handleSelect(option)}
                                            className={`
                                                px-3 py-2 text-xs cursor-pointer flex items-center justify-between group transition-colors
                                                ${isSelected ? 'bg-emerald-50 text-emerald-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                                            `}
                                        >
                                            {/* Display dynamic labelKey */}
                                            <span>{resolveLabel(option)}</span>
                                            {isSelected && <Check size={14} className="text-emerald-600" />}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const SelectField: React.FC<any> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    options, 
    required = false, 
    readOnly = false, 
    isFullWidth = false,
    idKey = "id",
    labelKey = "name"
}) => {

    const handleSearchableChange = (val: string | number) => {
        onChange({ target: { name, value: val } }, val);
    };

    return (
        <div className={`${isFullWidth ? "sm:col-span-2" : "sm:col-span-1"} flex-1`}>
            <SearchableSelect
                label={label}
                required={required}
                disabled={readOnly}
                value={value}
                onChange={handleSearchableChange}
                options={options}
                placeholder={`Select ${label}...`}
                idKey={idKey}
                labelKey={labelKey}
            />
        </div>
    );
};