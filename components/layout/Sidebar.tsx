
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Building2, Share2, Users, FileText, PieChart, ClipboardCheck, Shield } from 'lucide-react';
import { Page } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    setCurrentPage: (page: Page | 'Admin') => void;
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (isOpen: boolean) => void;
}

const navItems = [
    { to: '/mapa', icon: Map, label: 'Mapa' as Page },
    { to: '/empresas', icon: Building2, label: 'Empresas' as Page },
    { to: '/gremios', icon: Share2, label: 'Gremios' as Page },
    { to: '/integrantes', icon: Users, label: 'Integrantes' as Page },
    { to: '/reportes', icon: FileText, label: 'Reportes' as Page },
    { to: '/auditoria', icon: ClipboardCheck, label: 'Auditoría' as Page },
    { to: '/graficos', icon: PieChart, label: 'Gráficos' as Page },
];

const adminItem = { to: '/admin', icon: Shield, label: 'Admin' as const };

const Sidebar: React.FC<SidebarProps> = ({ setCurrentPage, isMobileMenuOpen, setMobileMenuOpen }) => {
    const { profile } = useAuth();

    const baseLinkClass = "flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200";
    const activeLinkClass = "bg-ciec-blue text-white";
    const inactiveLinkClass = "text-ciec-text-secondary hover:bg-ciec-card hover:text-ciec-text-primary";

    const handleLinkClick = (page: Page | 'Admin') => {
        setCurrentPage(page);
        setMobileMenuOpen(false);
    }

    return (
        <div className={`fixed inset-y-0 left-0 z-40 w-20 bg-ciec-bg border-r border-ciec-border flex-col items-center py-4 transition-transform duration-300 ease-in-out md:relative md:flex md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="w-12 h-12 mb-8 flex items-center justify-center">
                <img src="https://flajemusminumtluybwr.supabase.co/storage/v1/object/public/assets/logos/LOGOWHITE@1.5x.png" alt="CIEC Logo" className="w-full h-full object-contain" />
            </div>

            <nav className="flex flex-col items-center space-y-4">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/mapa'}
                        onClick={() => handleLinkClick(item.label)}
                        className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                        title={item.label}
                    >
                        <item.icon className="w-6 h-6" />
                    </NavLink>
                ))}
                {profile?.role === 'administrador' && (
                     <NavLink
                        key={adminItem.to}
                        to={adminItem.to}
                        onClick={() => handleLinkClick(adminItem.label)}
                        className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                        title={adminItem.label}
                    >
                        <adminItem.icon className="w-6 h-6" />
                    </NavLink>
                )}
            </nav>
        </div>
    );
};

export default Sidebar;
