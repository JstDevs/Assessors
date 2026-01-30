import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Home, Users, Settings, BarChart3, FileText, Mail, Bell, ChevronLeft, ChevronRight,
    Building2, TreePine, Hammer, Layers, Calculator, MapPin, Map, Navigation, 
    Calendar, RefreshCw, Newspaper, Cog, ArrowLeftRight, FolderOpen, Scroll, Book, ClipboardList,
    ChevronDown, ChevronUp, Code
} from 'lucide-react';
// import '../common/extras.css' // External CSS imports are removed for single-file mandate


// Helper component for single item or parent link
// The logic for menu expansion is now contained solely within this component, 
// ensuring that a click on a parent link both navigates and toggles the submenu state.
const NavItem = ({ item, isCollapsed, isActive, isSubMenu }) => {
    const hasChildren = item.children && item.children.length > 0;
    // We use a local state to manage the expansion of the menu item
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Check if any child route is currently active
    const isAnyChildActive = hasChildren && item.children.some(child => child.href === isActive);

    // Determines if the parent menu should be expanded: by user click (isMenuOpen) or if a child is active (isAnyChildActive)
    const shouldBeOpen = hasChildren && (isMenuOpen || isAnyChildActive);

    // Effect to ensure the menu is automatically opened when a child is the active route
    useEffect(() => {
        if (isAnyChildActive) {
            setIsMenuOpen(true);
        }
    }, [isAnyChildActive]);


    const toggleMenuState = () => {
        if (hasChildren) {
            // We only toggle the state if the menu is expanded.
            // We explicitly DO NOT call e.preventDefault(), allowing the Link to navigate.
            setIsMenuOpen(!isMenuOpen);
        }
    };
    
    // Determine if the current item (or its parent) matches the active route
    const isLinkActive = item.href === isActive;
    
    // Classes for the main link container
    const linkClasses = `flex items-center w-full min-h-12 py-3 rounded-lg transition-all duration-200 
        ${isSubMenu ? 'text-sm' : 'text-base'} 
        ${isLinkActive ? 'bg-emerald-900 shadow-inner' : 'hover:bg-emerald-500'}
        ${isCollapsed ? 'justify-center px-0' : 'px-4'}
        ${hasChildren && !isCollapsed ? 'justify-between' : ''}
        group`;

    // Classes for children indentation are not needed here since we apply margin directly to the UL
    const collapsedIconMargin = isCollapsed ? 'mx-auto' : 'mr-3';

    return (
        <li className="list-none">
            {/* Main Link/Parent Button: onClick handles the menu toggle, <Link> handles navigation. */}
            <Link 
                to={item.href} 
                className={linkClasses} 
                onClick={toggleMenuState} // Toggle state but allow navigation to proceed
                title={isCollapsed ? item.label : undefined} // Add tooltip on collapsed state
            >
                <div className="flex items-center">
                    <item.icon size={20} className={collapsedIconMargin} />
                    {!isCollapsed && (
                        <span className={`font-medium whitespace-nowrap ${isSubMenu ? 'ml-2' : 'ml-3'}`}>
                            {item.label}
                        </span>
                    )}
                </div>

                {/* Sub-menu Toggle Icon */}
                {hasChildren && !isCollapsed && (
                    <span className="flex-shrink-0">
                        {shouldBeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                )}
            </Link>

            {/* Sub-menu (Children) */}
            {hasChildren && shouldBeOpen && (
                <ul className="mt-1 space-y-1 border-l border-emerald-500 ml-4 pl-1">
                    {item.children.map((child, childIndex) => (
                        <NavItem
                            key={childIndex}
                            item={{...child, icon: child.icon || FileText}} // Fallback icon for children
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


function LeftNavigation() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    // Extracts the primary route segment (e.g., from "/faas-list" gets "faas-list")
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentLocation = pathSegments.length > 0 ? pathSegments[0] : 'dashboard';

    // Removed unused state 'openMenu' and function 'handleToggleMenu' as per refactoring goal.

    const navigationItems = [
        { 
            icon: Home, 
            label: 'Dashboard', 
            href: 'dashboard', 
            children: [
                {
                    icon: Users,
                    label: 'Owner List',
                    href: 'ol'
                },
                {
                    icon: FolderOpen,
                    label: 'Property Master List',
                    href: 'pml'
                },
                {
                    icon: FileText,
                    label: 'FAAS List',
                    href: 'faas'
                },
                // {
                //     icon: Scroll,
                //     label: 'Tax Declaration List',
                //     href: 'td'
                // },
                // {
                //     icon: Book,
                //     label: 'Record of Assessment (ROA)',
                //     href: 'roa'
                // },
                // {
                //     icon: ClipboardList,
                //     label: 'Assessment Roll',
                //     href: 'ar'
                // },
            ]
        },
        { icon: BarChart3, label: 'Property Classification File', href: 'pc' },
        { icon: MapPin, label: 'Locational Valuation Grouping', href: 'lvg' },
        { icon: BarChart3, label: 'Structural Type, Building Kind & Building Actual Use', href: 'bs' },
        { icon: BarChart3, label: 'Land Other Improvements', href: 'loi' },
        { icon: BarChart3, label: 'Building Additional Items', href: 'bai' },
        { icon: BarChart3, label: 'Machinery Settings', href: 'ms' },
        // { icon: Cog, label: 'Building Kind & Machinery Type', href: 'bkmt' },
        { icon: Newspaper, label: 'SMV Land', href: 'smvl' },
        { icon: Newspaper, label: 'SMV Building', href: 'smvb' },
        { icon: Newspaper, label: 'SMV Machinery', href: 'smvm' },
        { icon: Code, label: 'Transactional Codes', href: 'tc' },
        { icon: Calendar, label: 'General Revision Year File', href: 'gr' },
    ];


    return (
        <div 
            // Width now toggles between w-20 (5rem) and w-72 (18rem)
            className={`bg-emerald-600 text-white h-screen transition-all duration-300 shadow-2xl ${isCollapsed ? 'w-20' : 'w-100'}`}
            style={{ minWidth: isCollapsed ? '5rem' : '18rem' }}
        >
            {/* Header and Toggle Button */}
            <div className="p-4 border-b border-emerald-500 flex items-center h-[3.9rem]">
                <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex flex-col mr-6">
                            {/* The name is removed when collapsed */}
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


            {/* Navigation Items */}
            <nav className="pt-4 pb-4 overflow-x-hidden overflow-y-scroll min-h-[calc(100vh-3.9rem)] max-h-[calc(100vh-3.9rem)]">
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
        </div>
    );
}

export default LeftNavigation;
