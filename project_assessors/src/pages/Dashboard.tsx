import { Link } from "react-router-dom";
import { 
    FileText, 
    Building2, 
    Factory, 
    MapPin, 
    DollarSign, 
    Users, 
    FolderOpen, 
    Calculator,
    TrendingUp,
    FileBarChart,
    Settings,
    ClipboardList,
    Scroll,
    Book
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../axiosBase";

function Dashboard() {
    const menuItems = [
        {
            title: "Property Management",
            items: [
                {
                    name: "Owner Information List",
                    description: "Manage all of the available users in the system.",
                    icon: <Users size={24} />,
                    path: "../ol",
                    color: "bg-amber-500"
                },
                {
                    name: "Property Master List",
                    description: "Central record of all taxable real properties, including land, buildings, and machinery.",
                    icon: <FolderOpen size={24} />,
                    path: "../pml",
                    color: "bg-emerald-500"
                },
                {
                    name: "FAAS List",
                    description: "Manage the Field Appraisal and Assessment Sheets (FAAS) for property classifications and updates.",
                    icon: <FileText size={24} />,
                    path: "../faas",
                    color: "bg-indigo-500"
                },
                // {
                //     name: "Record of Assessment (ROA)",
                //     description: "Detailed listing of individual property assessments, forming the basis for the Assessment Roll.",
                //     icon: <Book size={24} />,
                //     path: "../roa",
                //     color: "bg-rose-500"
                // },
                // {
                //     name: "Assessment Roll",
                //     description: "Summarized list of all assessed properties in the locality for the current assessment year.",
                //     icon: <ClipboardList size={24} />,
                //     path: "../ar",
                //     color: "bg-blue-500"
                // }

            ]
        },
        // {
        //     title: "Valuation & Assessment",
        //     items: [
        //         {
        //             name: "Schedule of Market Values",
        //             description: "Manage market values for land, building, and machinery",
        //             icon: <DollarSign size={24} />,
        //             path: "/schedule-market-values",
        //             color: "bg-green-500"
        //         },
        //         {
        //             name: "Locational Groups",
        //             description: "Manage locational groups and zone classifications",
        //             icon: <MapPin size={24} />,
        //             path: "/locational-groups",
        //             color: "bg-orange-500"
        //         },
        //         {
        //             name: "Assessment Calculator",
        //             description: "Calculate property assessments and valuations",
        //             icon: <Calculator size={24} />,
        //             path: "/assessment-calculator",
        //             color: "bg-cyan-500"
        //         }
        //     ]
        // },
        // {
        //     title: "Tax Management",
        //     items: [
        //         {
        //             name: "Tax Declaration",
        //             description: "Process and manage tax declarations",
        //             icon: <FileText size={24} />,
        //             path: "/tax-declaration",
        //             color: "bg-red-500"
        //         },
        //         {
        //             name: "Tax Payments",
        //             description: "Record and track tax payments",
        //             icon: <TrendingUp size={24} />,
        //             path: "/tax-payments",
        //             color: "bg-indigo-500"
        //         },
        //         {
        //             name: "Tax Clearance",
        //             description: "Issue tax clearance certificates",
        //             icon: <FileBarChart size={24} />,
        //             path: "/tax-clearance",
        //             color: "bg-pink-500"
        //         }
        //     ]
        // },
        // {
        //     title: "Records & Reports",
        //     items: [
        //         {
        //             name: "Property Owners",
        //             description: "Manage property owner records",
        //             icon: <Users size={24} />,
        //             path: "/property-owners",
        //             color: "bg-teal-500"
        //         },
        //         {
        //             name: "Reports & Analytics",
        //             description: "Generate reports and view analytics",
        //             icon: <FileBarChart size={24} />,
        //             path: "/reports",
        //             color: "bg-violet-500"
        //         },
        //         {
        //             name: "System Settings",
        //             description: "Configure system settings and preferences",
        //             icon: <Settings size={24} />,
        //             path: "/settings",
        //             color: "bg-gray-500"
        //         }
        //     ]
        // }
    ];

    const [pTotal, setPTotal] = useState(0);
    const [dTotal, setDTotal] = useState(0);
    useEffect(()=>{
        async function get(){
            // const pres = await api.get('pml/count');
            // setPTotal(pres.data.data.total);
            // const dres = await api.get('td/count');
            // setDTotal(dres.data.data.total);
        }
        get();
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Real Property Assessment System
                </h1>
                <p className="text-gray-600">
                    Welcome to the RPAS Dashboard. Select a module to get started.
                </p>
            </div>

            {/* Dashboard Grid */}
            <div className="space-y-8">
                {menuItems.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {section.title}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map((item, itemIndex) => (
                                <Link
                                    key={itemIndex}
                                    to={item.path}
                                    className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-emerald-300"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className={`${item.color} text-white p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                                                {item.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                                        <span className="text-sm text-emerald-600 font-medium group-hover:text-emerald-700">
                                            Open Module →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats - Optional */}
            {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Properties</p>
                            <p className="text-2xl font-bold text-gray-900">{pTotal}</p>
                        </div>
                        <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
                            <FolderOpen size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Declarations</p>
                            <p className="text-2xl font-bold text-gray-900">{dTotal}</p>
                        </div>
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                            <FileText size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Property Owners</p>
                            <p className="text-2xl font-bold text-gray-900">-</p>
                        </div>
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default Dashboard;