import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Home, Users, Settings, BarChart3, FileText, Mail, Bell, ChevronLeft, ChevronRight,
    Building2, TreePine, Hammer, Layers, Calculator, MapPin, Map, Navigation, 
    Calendar, RefreshCw, Newspaper, Cog, ArrowLeftRight, FolderOpen, Scroll, Book, ClipboardList,
    ChevronDown, ChevronUp, Code, LogOut, User as UserIcon, User
} from 'lucide-react';

// Helper component for single item or parent link
const NavItem = ({ item, isCollapsed, isActive, isSubMenu }: any) => {
    const hasChildren = item.children && item.children.length > 0;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Check if any child route is currently active
    const isAnyChildActive = hasChildren && item.children.some((child: any) => child.href === isActive);

    // Determines if the parent menu should be expanded
    const shouldBeOpen = hasChildren && (isMenuOpen || isAnyChildActive);

    // Effect to ensure the menu is automatically opened when a child is the active route
    useEffect(() => {
        if (isAnyChildActive) {
            setIsMenuOpen(true);
        }
    }, [isAnyChildActive]);

    const toggleMenuState = () => {
        if (hasChildren) {
            setIsMenuOpen(!isMenuOpen);
        }
    };
    
    // Determine if the current item matches the active route
    const isLinkActive = item.href === isActive;
    
    // Classes for the main link container
    const linkClasses = `flex items-center w-full min-h-12 py-3 rounded-lg transition-all duration-200 
        ${isSubMenu ? 'text-sm' : 'text-base'} 
        ${isLinkActive ? 'bg-emerald-900 shadow-inner' : 'hover:bg-emerald-500'}
        ${isCollapsed ? 'justify-center px-0' : 'px-4'}
        ${hasChildren && !isCollapsed ? 'justify-between' : ''}
        group`;

    const collapsedIconMargin = isCollapsed ? 'mx-auto' : 'mr-3';

    return (
        <li className="list-none">
            <Link 
                to={item.href} 
                className={linkClasses} 
                onClick={toggleMenuState} 
                title={isCollapsed ? item.label : undefined} 
            >
                <div className="flex items-center">
                    <item.icon size={20} className={collapsedIconMargin} />
                    {!isCollapsed && (
                        <span className={`font-medium whitespace-nowrap ${isSubMenu ? 'ml-2' : 'ml-3'}`}>
                            {item.label}
                        </span>
                    )}
                </div>

                {hasChildren && !isCollapsed && (
                    <span className="flex-shrink-0">
                        {shouldBeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                )}
            </Link>

            {hasChildren && shouldBeOpen && (
                <ul className="mt-1 space-y-1 border-l border-emerald-500 ml-4 pl-1">
                    {item.children.map((child: any, childIndex: number) => (
                        <NavItem
                            key={childIndex}
                            item={{...child, icon: child.icon || FileText}} 
                            isCollapsed={isCollapsed}
                            isActive={isActive}
                            isSubMenu={true}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export interface User {
    id: number;
    username: string;
    role_id: number;
    role_name: string;
    permission_level: number;
}

interface LeftNavProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

function LeftNavigation({ user, setUser }: LeftNavProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const onLogout = () => {
        setUser(null);
    }

    // Extracts the primary route segment
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentLocation = pathSegments.length > 0 ? pathSegments[0] : 'dashboard';

    // 1. Efficiently build the navigation array using derived state.
    // We conditionally spread the User Management object into the array if permission_level >= 3.
    const navigationItems = [
        { 
            icon: Home, 
            label: 'Dashboard', 
            href: 'dashboard', 
            children: [
                { icon: Users, label: 'Owner List', href: 'ol' },
                { icon: FolderOpen, label: 'Property Master List', href: 'pml' },
                { icon: FileText, label: 'FAAS List', href: 'faas' },
                { icon: Scroll, label: 'Tax Declaration List', href: 'td' },
                { icon: ClipboardList, label: 'Assessment Roll', href: 'ar' },
                { icon: Book, label: 'Record of Assessment (ROA)', href: 'roa' },
            ]
        },
        { icon: BarChart3, label: 'Property Classification File', href: 'pc' },
        { icon: MapPin, label: 'Locational Valuation Grouping', href: 'lvg' },
        { icon: BarChart3, label: 'Structural Type, Building Kind & Building Actual Use', href: 'bs' },
        { icon: BarChart3, label: 'Land Other Improvements', href: 'loi' },
        { icon: BarChart3, label: 'Building Additional Items', href: 'bai' },
        { icon: BarChart3, label: 'Machinery Settings', href: 'ms' },
        { icon: Newspaper, label: 'SMV Land', href: 'smvl' },
        { icon: Newspaper, label: 'SMV Building', href: 'smvb' },
        { icon: Newspaper, label: 'SMV Machinery', href: 'smvm' },
        { icon: Code, label: 'Transactional Codes', href: 'tc' },
        { icon: Calendar, label: 'General Revision Year File', href: 'gr' },
        
        // Conditional Rendering: Only injected if user has high enough permissions
        ...(user && user.permission_level >= 3 
            ? [{ icon: User, label: 'User Management', href: 'um' }] 
            : []
        )
    ];

    return (
        <div 
            className={`bg-emerald-600 text-white h-screen flex flex-col transition-all duration-300 shadow-2xl ${isCollapsed ? 'w-20' : 'w-100'}`}
            style={{ minWidth: isCollapsed ? '5rem' : '18rem' }}
        >
            <div className="p-4 border-b border-emerald-500 flex items-center h-[3.9rem] shrink-0">
                <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex flex-col mr-6">
                            <h1 className="text-xl text-nowrap font-bold">ASSESSORS</h1>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-1 rounded-full hover:bg-emerald-500 transition-colors flex-shrink-0 ${isCollapsed ? '' : 'ml-auto'}`}
                        title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
            </div>

            <nav className="flex-1 pt-4 pb-4 overflow-x-hidden overflow-y-auto
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-emerald-700 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500"
            >
                <ul className="space-y-1 px-3">
                    {navigationItems.map((item, index) => (
                        <NavItem
                            key={index}
                            item={item}
                            isCollapsed={isCollapsed}
                            isActive={currentLocation}
                            isSubMenu={false}
                        />
                    ))}
                </ul>
            </nav>

            <div className={`border-t border-emerald-500 p-3 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && user && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-emerald-700 p-2 rounded-full shrink-0">
                            <UserIcon size={18} className="text-emerald-100" />
                        </div>
                        <div className="flex flex-col truncate pr-2">
                            <span className="font-bold text-sm truncate">{user.username}</span>
                            <span className="text-xs text-emerald-200 truncate">{user.role_name}</span>
                        </div>
                    </div>
                )}
                
                <Link 
                    to={"/"} 
                    className={`p-2 hover:bg-emerald-500 rounded-lg transition-colors text-emerald-100 hover:text-white flex-shrink-0 ${isCollapsed ? '' : 'ml-2'}`} 
                    onClick={onLogout} 
                >
                    <LogOut size={20} />
                </Link>
            </div>
        </div>
    );
}

export default LeftNavigation;