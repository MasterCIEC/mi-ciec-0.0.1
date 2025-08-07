
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { Search } from 'lucide-react';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Mapa from './pages/Mapa';
import Empresas from './pages/Empresas';
import Gremios from './pages/Gremios';
import Graficos from './pages/Graficos';
import Reportes from './pages/Reportes';
import Auditoria from './pages/Auditoria';
import Integrantes from './pages/Integrantes';
import GremioForm from './pages/GremioForm';
import IntegranteForm from './pages/IntegranteForm';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Page } from './types';
import { DraftProvider, useDraft } from './contexts/DraftContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EmpresaFormDrawer from './components/empresa/EmpresaFormDrawer';
import FloatingDraftBubble from './components/empresa/FloatingDraftBubble';
import DiscardArea from './components/ui/DiscardArea';
import ConfirmDiscardModal from './components/ui/ConfirmDiscardModal';
import { GOOGLE_MAPS_API_KEY } from './constants';

const UnauthenticatedApp: React.FC = () => {
    return (
        <Routes>
            <Route path="*" element={<Login />} />
        </Routes>
    );
};

const AuthenticatedApp: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page | 'Admin'>('Mapa');
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isDraggingBubble, isDirty } = useDraft();

    const handleClearSearch = () => {
      setSearchTerm('');
    };
    
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!isMobileMenuOpen);
    };

    const isSearchable = ['Empresas', 'Gremios', 'Integrantes'].includes(currentPage);

    return (
        <>
            <div className="flex h-screen bg-ciec-bg text-ciec-text-primary">
                <Sidebar 
                    setCurrentPage={setCurrentPage} 
                    isMobileMenuOpen={isMobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        currentPage={currentPage} 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onClearSearch={handleClearSearch}
                        onToggleMobileMenu={toggleMobileMenu}
                    />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-ciec-bg p-4 md:p-6 lg:p-8">
                        {/* Mobile Search Bar */}
                        <div className="md:hidden">
                          {isSearchable && (
                            <div className="relative w-full mb-4">
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

                        <Routes>
                            <Route path="/" element={<Navigate replace to="/mapa" />} />
                            <Route path="/mapa" element={<Mapa />} />
                            <Route path="/empresas" element={<Empresas searchTerm={searchTerm} />} />
                            <Route path="/gremios/nuevo" element={<GremioForm />} />
                            <Route path="/gremios/editar/:rif" element={<GremioForm />} />
                            <Route path="/gremios" element={<Gremios searchTerm={searchTerm}/>} />
                            <Route path="/integrantes/nuevo" element={<IntegranteForm />} />
                            <Route path="/integrantes/editar/:id" element={<IntegranteForm />} />
                            <Route path="/integrantes" element={<Integrantes searchTerm={searchTerm} />} />
                            <Route path="/reportes" element={<Reportes />} />
                            <Route path="/auditoria" element={<Auditoria />} />
                            <Route path="/graficos" element={<Graficos />} />
                             <Route path="/admin" element={
                                <ProtectedRoute role="administrador">
                                    <AdminDashboard />
                                </ProtectedRoute>
                             } />
                            <Route path="*" element={<Navigate replace to="/mapa" />} />
                        </Routes>
                    </main>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={toggleMobileMenu}
                    aria-hidden="true"
                ></div>
            )}
            <EmpresaFormDrawer />
            <FloatingDraftBubble />
            <DiscardArea isVisible={isDraggingBubble && isDirty} />
            <ConfirmDiscardModal />
        </>
    );
}

const AppRoutes: React.FC = () => {
    const { session } = useAuth();
    return session ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

const App: React.FC = () => {
    return (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <HashRouter>
                <AuthProvider>
                    <DraftProvider>
                        <AppRoutes />
                    </DraftProvider>
                </AuthProvider>
            </HashRouter>
        </LoadScript>
    );
};

export default App;
