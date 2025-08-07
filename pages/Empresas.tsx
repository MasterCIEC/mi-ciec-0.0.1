import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Institucion } from '../types';
import Spinner from '../components/ui/Spinner';
import { Building, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import EmpresaDetailModal from '../components/empresa/EmpresaDetailModal';
import { useDraft } from '../contexts/DraftContext';

interface EmpresasProps {
    searchTerm: string;
}

type EstablecimientoForList = {
    id_establecimiento: string;
    nombre_establecimiento: string | null;
    companias: {
        rif: string;
        razon_social: string;
        logo: string | null;
    } | null;
    direcciones: {
        latitud: number | null;
        longitud: number | null;
    } | null;
    afiliaciones: {
        rif_institucion: string;
    }[];
};

const Empresas: React.FC<EmpresasProps> = ({ searchTerm }) => {
    const [establecimientos, setEstablecimientos] = useState<EstablecimientoForList[]>([]);
    const [instituciones, setInstituciones] = useState<Institucion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInstitucion, setSelectedInstitucion] = useState<string>('All');
    const [modalEstablecimientoId, setModalEstablecimientoId] = useState<string | null>(null);
    const [startInEditMode, setStartInEditMode] = useState(false);
    const { openDrawer } = useDraft();

    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);

        const [
            { data: estData, error: estError },
            { data: instData, error: instError }
        ] = await Promise.all([
            supabase.from('establecimientos').select(`
                id_establecimiento,
                nombre_establecimiento,
                companias ( rif, razon_social, logo ),
                direcciones ( latitud, longitud ),
                afiliaciones!left ( rif_institucion )
            `),
            supabase.from('instituciones').select('*')
        ]);

        if (estError) console.error('Error fetching establishments:', estError);
        else setEstablecimientos((estData as any) || []);

        if (instError) console.error('Error fetching institutions:', instError);
        else setInstituciones((instData as any) || []);
        
        if (showLoadingSpinner) setLoading(false);
    }, []);

    useEffect(() => {
        fetchData(true);

        const channel = supabase.channel('empresas-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'establecimientos' }, () => fetchData(false))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'companias' }, () => fetchData(false))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'afiliaciones' }, () => fetchData(false))
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const handleOpenModalForViewing = (id: string) => {
        setStartInEditMode(false);
        setModalEstablecimientoId(id);
    };

    const handleOpenModalForEditing = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setStartInEditMode(true);
        setModalEstablecimientoId(id);
    };
    
    const handleDelete = async (e: React.MouseEvent, id: string, name: string | null) => {
        e.stopPropagation();
        const confirmationMessage = `¿Está seguro de que desea eliminar "${name || 'este establecimiento'}"? Esta acción no se puede deshacer y eliminará todos los datos asociados (integrantes, productos, etc.).`;

        if (window.confirm(confirmationMessage)) {
            try {
                // The order is important to respect foreign key constraints if CASCADE is not set ON.
                await supabase.from('afiliaciones').delete().eq('id_establecimiento', id);
                await supabase.from('integrantes').delete().eq('id_establecimiento', id);
                await supabase.from('establecimiento_productos').delete().eq('id_establecimiento', id);
                await supabase.from('establecimiento_procesos').delete().eq('id_establecimiento', id);
                
                // Finally, delete the establishment itself
                const { error: estError } = await supabase.from('establecimientos').delete().eq('id_establecimiento', id);

                if (estError) throw estError;

                alert('Establecimiento eliminado exitosamente.');
                fetchData(false);
            } catch (error: any) {
                 alert(`Error al eliminar el establecimiento: ${error.message}`);
            }
        }
    };


    const handleCloseModal = (refreshed?: boolean) => {
        setModalEstablecimientoId(null);
        if (refreshed) {
            fetchData(false);
        }
    };

    const filteredEstablecimientos = useMemo(() => {
        const normalizeText = (str: string | null | undefined): string => {
            if (!str) return '';
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
        };

        let results: EstablecimientoForList[];

        // 1. Filter by Gremio
        if (selectedInstitucion === 'All') {
            results = establecimientos;
        } else if (selectedInstitucion === '(empty)') {
            results = establecimientos.filter(e => !e.afiliaciones || e.afiliaciones.length === 0);
        } else {
            results = establecimientos.filter(e => e.afiliaciones?.some(a => a.rif_institucion === selectedInstitucion));
        }
        
        // 2. Filter by Search Term
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            const normalizedSearchTerm = normalizeText(searchTerm);

            results = results.filter(est => 
                normalizeText(est.nombre_establecimiento).includes(normalizedSearchTerm) ||
                normalizeText(est.companias?.razon_social).includes(normalizedSearchTerm) ||
                est.companias?.rif.toLowerCase().replace(/-/g, '').includes(lowercasedFilter.replace(/-/g, ''))
            );
        }

        return results;
    }, [establecimientos, selectedInstitucion, searchTerm]);
    
    const institucionCounts = useMemo(() => {
        const counts: { [key: string]: number } = {'(empty)': 0};
        establecimientos.forEach(est => {
            if (est.afiliaciones && est.afiliaciones.length > 0) {
                 est.afiliaciones.forEach(afiliacion => {
                    counts[afiliacion.rif_institucion] = (counts[afiliacion.rif_institucion] || 0) + 1;
                 })
            } else {
                counts['(empty)']++;
            }
        });
        return counts;
    }, [establecimientos]);

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    const desktopTitle = instituciones.find(a => a.rif === selectedInstitucion)?.nombre || (selectedInstitucion === 'All' ? 'Todas las empresas' : 'Empresas sin afiliar');

    return (
        <>
            <div className="flex flex-col md:flex-row h-full gap-4">
                {/* Desktop filter list */}
                <div className="hidden md:block flex-shrink-0 md:w-1/4 md:max-w-xs bg-ciec-card p-4 rounded-lg overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4">Gremios</h2>
                    <ul>
                        <li
                            onClick={() => setSelectedInstitucion('All')}
                            className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${selectedInstitucion === 'All' ? 'bg-ciec-blue' : 'hover:bg-ciec-border'}`}
                        >
                           <span>Todos</span>
                           <span className="text-xs bg-gray-500 text-white rounded-full px-2 py-0.5">{establecimientos.length}</span>
                        </li>
                         <li
                            onClick={() => setSelectedInstitucion('(empty)')}
                            className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${selectedInstitucion === '(empty)' ? 'bg-ciec-blue' : 'hover:bg-ciec-border'}`}
                        >
                            <span>(Sin afiliar)</span>
                            <span className="text-xs bg-gray-500 text-white rounded-full px-2 py-0.5">{institucionCounts['(empty)'] || 0}</span>
                        </li>
                        {instituciones.map(inst => (
                            <li key={inst.rif}
                                onClick={() => setSelectedInstitucion(inst.rif)}
                                className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${selectedInstitucion === inst.rif ? 'bg-ciec-blue' : 'hover:bg-ciec-border'}`}
                            >
                                <span className="truncate pr-2">{inst.nombre}</span>
                                <span className="text-xs bg-gray-500 text-white rounded-full px-2 py-0.5">{institucionCounts[inst.rif] || 0}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 bg-ciec-card p-4 flex flex-col rounded-lg">
                    {/* Mobile filter dropdown */}
                    <div className="md:hidden mb-4">
                        <label htmlFor="gremio-select" className="text-lg font-semibold mb-2 block">Gremios</label>
                        <select
                           id="gremio-select"
                           value={selectedInstitucion}
                           onChange={(e) => setSelectedInstitucion(e.target.value)}
                           className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                        >
                            <option value="All">Todos ({establecimientos.length})</option>
                            <option value="(empty)">(Sin afiliar) ({institucionCounts['(empty)'] || 0})</option>
                            {instituciones.map(inst => (
                                <option key={inst.rif} value={inst.rif}>
                                    {inst.nombre} ({institucionCounts[inst.rif] || 0})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-lg font-semibold">
                            <span className="hidden md:inline">{desktopTitle}</span>
                            <span className="md:hidden">Empresas</span>
                            <span className="text-sm font-normal text-ciec-text-secondary ml-2">{filteredEstablecimientos.length}</span>
                        </h2>
                        <button
                            onClick={openDrawer}
                            className="flex items-center justify-center bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue"
                        >
                           <Plus className="w-5 h-5 sm:mr-2" />
                           <span className="hidden sm:inline">Añadir</span>
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-grow pr-2">
                        {filteredEstablecimientos.map(est => (
                             <div key={est.id_establecimiento} className="block mb-3">
                                <div className="bg-ciec-bg p-4 rounded-lg hover:ring-2 hover:ring-ciec-blue transition-all duration-200">
                                    <div onClick={() => handleOpenModalForViewing(est.id_establecimiento)} className="flex items-center space-x-4 cursor-pointer">
                                        <div className="flex-shrink-0 w-12 h-12 bg-ciec-border rounded-lg flex items-center justify-center">
                                                {est.companias?.logo ? (
                                                    <img src={est.companias.logo} alt="logo" className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <Building className="w-6 h-6 text-ciec-text-secondary" />
                                                )}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-ciec-text-primary">{est.nombre_establecimiento || est.companias?.razon_social}</h3>
                                            <p className="text-sm text-ciec-text-secondary">{est.companias?.rif || 'Sin RIF'}</p>
                                        </div>
                                        {!est.direcciones?.latitud || !est.direcciones?.longitud ? (
                                            <div title="Ubicación no disponible" className="flex-shrink-0">
                                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-ciec-border">
                                        <button
                                            onClick={(e) => handleOpenModalForEditing(e, est.id_establecimiento)}
                                            className="flex items-center justify-center text-sm font-bold py-1.5 px-3 rounded-lg border transition-colors border-yellow-400 bg-transparent text-yellow-400 hover:bg-yellow-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-bg focus:ring-yellow-400"
                                        >
                                            <Edit className="w-4 h-4 mr-2"/>
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, est.id_establecimiento, est.nombre_establecimiento)}
                                            className="flex items-center justify-center text-sm font-bold py-1.5 px-3 rounded-lg border transition-colors border-red-500 bg-transparent text-red-500 hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-bg focus:ring-red-500"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2"/>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                         {filteredEstablecimientos.length === 0 && (
                            <div className="text-center py-10 text-ciec-text-secondary">
                                <p>No se encontraron establecimientos que coincidan con su búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {modalEstablecimientoId && (
                <EmpresaDetailModal
                    key={modalEstablecimientoId}
                    establecimientoId={modalEstablecimientoId}
                    startInEditMode={startInEditMode}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default Empresas;