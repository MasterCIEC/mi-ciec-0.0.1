
import React from 'react';
import { Search, RefreshCw, LogOut, Menu } from 'lucide-react';
import { Page, Profile } from '../../types';
import DropdownMenu, { DropdownMenuItem } from '../ui/DropdownMenu';
import { useAuth } from '../../contexts/AuthContext';


interface HeaderProps {
    currentPage: Page | 'Admin';
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onClearSearch: () => void;
    onToggleMobileMenu: () => void;
}

const UserAvatar: React.FC<{ profile: Profile | null }> = ({ profile }) => {
    const getInitials = (name: string | null, email: string) => {
        if (name && name.trim()) {
            const parts = name.split(' ').filter(Boolean);
            if (parts.length > 1) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return parts[0].substring(0, 2).toUpperCase();
        }
        return email.charAt(0).toUpperCase();
    }
    
    return (
        <div className="w-9 h-9 bg-ciec-blue rounded-full flex items-center justify-center font-bold text-white">
            {profile ? getInitials(profile.full_name, profile.email) : '?'}
        </div>
    )
}

const Header: React.FC<HeaderProps> = ({ currentPage, searchTerm, setSearchTerm, onClearSearch, onToggleMobileMenu }) => {
    const { signOut, profile } = useAuth();
    const isSearchable = ['Empresas', 'Gremios', 'Integrantes'].includes(currentPage);
    
    return (
        <header className="flex-shrink-0 bg-ciec-card border-b border-ciec-border h-16 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
                 <button 
                    onClick={onToggleMobileMenu}
                    className="p-2 rounded-full text-ciec-text-secondary hover:bg-ciec-bg md:hidden mr-2"
                    aria-label="Abrir menú"
                 >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold text-ciec-text-primary">{currentPage}</h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
                 {isSearchable && (
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ciec-text-secondary" />
                        <input
                            type="text"
                            placeholder={`Buscar en ${currentPage}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-ciec-bg border border-ciec-border rounded-lg pl-10 pr-4 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                <button 
                    onClick={onClearSearch} 
                    className="p-2 rounded-full text-ciec-text-secondary hover:bg-ciec-bg hover:text-ciec-text-primary transition-colors"
                    title="Refrescar y limpiar búsqueda"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
                <DropdownMenu trigger={<UserAvatar profile={profile} />}>
                    <div className="px-4 py-2 border-b border-ciec-border">
                        <p className="text-sm font-medium text-ciec-text-primary truncate">{profile?.full_name || 'Usuario'}</p>
                        <p className="text-xs text-ciec-text-secondary truncate">{profile?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </DropdownMenuItem>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Header;
