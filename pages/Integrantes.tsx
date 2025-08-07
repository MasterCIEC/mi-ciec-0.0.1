import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Integrante, Establecimiento, Compania } from '../types';
import Spinner from '../components/ui/Spinner';
import { Plus, User, Building, Briefcase, Mail, Phone, Edit, Trash2 } from 'lucide-react';

// Tipos de datos para esta vista
type IntegranteDetail = Integrante & {
    establecimientos: { 
        nombre_establecimiento: string, 
        companias: { 
            razon_social: string,
            rif: string
        } | null 
    } | null;
};

type EstablishmentForFilter = Establecimiento & {
    companias: Compania | null;
    integrante_count: number; // Propiedad para el contador
};

// Componente para mostrar un campo de detalle en la tarjeta
const DetailField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) => (
    <div>
        <label className="text-xs text-ciec-text-secondary flex items-center">{icon}<span className="ml-1">{label}</span></label>
        <p className="text-ciec-text-primary mt-1 text-sm">{value || 'No disponible'}</p>
    </div>
);

// Componente para la tarjeta de detalle del integrante
const IntegranteCard: React.FC<{ integrante: IntegranteDetail, onDelete: (id: number) => void }> = ({ integrante, onDelete }) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/integrantes/editar/${integrante.id_integrante}`);
    };
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(integrante.id_integrante);
    }

    return (
        <div className="bg-ciec-bg p-4 rounded-lg border border-ciec-border space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 bg-ciec-border rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-ciec-text-secondary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-lg text-ciec-text-primary truncate">{integrante.nombre_persona}</h3>
                        <p className="text-sm text-ciec-text-secondary truncate">{integrante.establecimientos?.nombre_establecimiento || 'Sin establecimiento'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-0 sm:space-x-2 flex-shrink-0">
                     <button onClick={handleEdit} className="p-2 text-ciec-text-secondary hover:text-ciec-blue rounded-full transition-colors" title="Editar">
                        <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={handleDelete} className="p-2 text-ciec-text-secondary hover:text-red-500 rounded-full transition-colors" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-ciec-border">
                <DetailField icon={<Briefcase size={14}/>} label="Cargo" value={integrante.cargo} />
                <DetailField icon={<Mail size={14}/>} label="E-mail" value={integrante.email} />
                <DetailField icon={<Phone size={14}/>} label="Teléfono" value={integrante.telefono} />
            </div>
        </div>
    );
};


interface IntegrantesProps {
    searchTerm: string;
}

const Integrantes: React.FC<IntegrantesProps> = ({ searchTerm }) => {
    const [integrantes, setIntegrantes] = useState<IntegranteDetail[]>([]);
    const [establishmentsForFilter, setEstablishmentsForFilter] = useState<EstablishmentForFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | 'all'>('all');
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: integrantesData, error: integrantesError } = await supabase
            .from('integrantes')
            .select('*, establecimientos(*, companias(*))')
            .order('nombre_persona', { ascending: true });

        if (integrantesError) {
            console.error('Error fetching data:', integrantesError);
            setIntegrantes([]);
            setEstablishmentsForFilter([]);
        } else {
            const allIntegrantes = ((integrantesData as any) || []) as IntegranteDetail[];
            setIntegrantes(allIntegrantes);

            // Procesar datos para obtener establecimientos con contadores
            const counts = new Map<string, number>();
            const establishmentMap = new Map<string, EstablishmentForFilter>();

            allIntegrantes.forEach(integrante => {
                if (integrante.id_establecimiento && integrante.establecimientos) {
                    // Incrementar contador
                    counts.set(integrante.id_establecimiento, (counts.get(integrante.id_establecimiento) || 0) + 1);
                    
                    // Almacenar establecimiento único
                    if (!establishmentMap.has(integrante.id_establecimiento)) {
                        establishmentMap.set(integrante.id_establecimiento, {
                            ...integrante.establecimientos,
                            integrante_count: 0 // se asignará después
                        } as EstablishmentForFilter);
                    }
                }
            });

            // Combinar establecimientos con sus contadores
            const establishmentsWithCounts = Array.from(establishmentMap.values()).map(est => ({
                ...est,
                integrante_count: counts.get(est.id_establecimiento) || 0
            })).sort((a, b) => a.nombre_establecimiento.localeCompare(b.nombre_establecimiento));
            
            setEstablishmentsForFilter(establishmentsWithCounts);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredIntegrantes = useMemo(() => {
        // 1. Filter by Establishment
        let results = integrantes;
        if (selectedEstablishmentId !== 'all') {
            results = integrantes.filter(i => i.id_establecimiento === selectedEstablishmentId);
        }
        
        // 2. Filter by Search Term
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            results = results.filter(i => 
                i.nombre_persona.toLowerCase().includes(lowercasedFilter) ||
                (i.cargo && i.cargo.toLowerCase().includes(lowercasedFilter)) ||
                (i.email && i.email.toLowerCase().includes(lowercasedFilter)) ||
                (i.telefono && i.telefono.replace(/[^0-9]/g, '').includes(lowercasedFilter.replace(/[^0-9]/g, ''))) ||
                (i.establecimientos?.nombre_establecimiento && i.establecimientos.nombre_establecimiento.toLowerCase().includes(lowercasedFilter))
            );
        }

        return results;
    }, [integrantes, selectedEstablishmentId, searchTerm]);
    
    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este integrante?')) {
            const { error } = await supabase.from('integrantes').delete().eq('id_integrante', id);
            if (error) {
                alert(`Error al eliminar: ${error.message}`);
            } else {
                alert('Integrante eliminado.');
                fetchData(); // Recargar todos los datos para actualizar contadores
            }
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            {/* Columna de Filtros */}
            <div className="w-full md:w-1/3 md:max-w-xs bg-ciec-card p-4 rounded-lg flex flex-col flex-shrink-0">
                <h2 className="text-lg font-semibold mb-4">Establecimientos</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    <ul>
                        <li
                            onClick={() => setSelectedEstablishmentId('all')}
                            className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${selectedEstablishmentId === 'all' ? 'bg-ciec-blue' : 'hover:bg-ciec-border'}`}
                        >
                           <span>Todos</span>
                           <span className="text-xs bg-gray-500 text-white rounded-full px-2 py-0.5">{integrantes.length}</span>
                        </li>
                        {establishmentsForFilter.map(est => (
                            <li key={est.id_establecimiento}
                                onClick={() => setSelectedEstablishmentId(est.id_establecimiento)}
                                className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${selectedEstablishmentId === est.id_establecimiento ? 'bg-ciec-blue' : 'hover:bg-ciec-border'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{est.nombre_establecimiento}</p>
                                    <p className="text-xs text-ciec-text-secondary truncate">{est.companias?.razon_social}</p>
                                </div>
                                <span className="text-xs bg-gray-500 text-white rounded-full px-2 py-0.5 flex-shrink-0 ml-2">{est.integrante_count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Columna de Integrantes */}
            <div className="flex-1 bg-ciec-card p-4 rounded-lg flex flex-col">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold">Integrantes <span className="text-base font-normal text-ciec-text-secondary">{filteredIntegrantes.length}</span></h2>
                    <Link to="/integrantes/nuevo" className="flex items-center justify-center bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                        <Plus className="w-5 h-5 mr-2" /> Añadir
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredIntegrantes.map(integrante => (
                        <IntegranteCard key={integrante.id_integrante} integrante={integrante} onDelete={handleDelete} />
                    ))}
                     {filteredIntegrantes.length === 0 && (
                        <div className="text-center py-10 text-ciec-text-secondary">
                            <p>No hay integrantes para mostrar.</p>
                            <p className="text-sm">Seleccione otro establecimiento o añada un nuevo integrante.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Integrantes;