import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Building2, Share2, Users, FileText, PieChart, Info, MessageSquare, Settings, ClipboardCheck } from 'lucide-react';
import { Page } from '../../types';

interface SidebarProps {
    setCurrentPage: (page: Page) => void;
}

const navItems = [
    { to: '/mapa', icon: Map, label: 'Mapa' as Page },
    { to: '/empresas', icon: Building2, label: 'Empresas' as Page },
    { to: '/gremios', icon: Share2, label: 'Gremios' as Page },
    { to: '/integrantes', icon: Users, label: 'Integrantes' as Page },
    { to: '/reportes', icon: FileText, label: 'Reportes' as Page },
    { to: '/auditoria', icon: ClipboardCheck, label: 'Auditoría' as Page },
    { to: '/graficos', icon: PieChart, label: 'Gráficos' as Page },
    { to: '/info', icon: Info, label: 'Información' as Page },
    { to: '/chat', icon: MessageSquare, label: 'Chat' as Page },
    { to: '/configuracion', icon: Settings, label: 'Configuración' as Page },
];

const Sidebar: React.FC<SidebarProps> = ({ setCurrentPage }) => {
    const baseLinkClass = "flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200";
    const activeLinkClass = "bg-ciec-blue text-white";
    const inactiveLinkClass = "text-ciec-text-secondary hover:bg-ciec-card hover:text-ciec-text-primary";

    return (
        <div className="w-20 bg-ciec-bg border-r border-ciec-border flex flex-col items-center py-4">
            <div className="w-12 h-12 mb-8 flex items-center justify-center">
                <img src="https://picsum.photos/48/48" alt="CIEC Logo" className="rounded-full" />
            </div>

            <nav className="flex flex-col items-center space-y-4">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setCurrentPage(item.label)}
                        className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                        title={item.label}
                    >
                        <item.icon className="w-6 h-6" />
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;