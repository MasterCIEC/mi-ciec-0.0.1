import React, { useState, useEffect, useMemo } from 'react';
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
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-ciec-border rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-ciec-text-secondary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-ciec-text-primary">{integrante.nombre_persona}</h3>
                        <p className="text-sm text-ciec-text-secondary">{integrante.establecimientos?.nombre_establecimiento || 'Sin establecimiento'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={handleEdit} className="p-2 text-ciec-text-secondary hover:text-ciec-blue rounded-full transition-colors" title="Editar">
                        <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={handleDelete} className="p-2 text-ciec-text-secondary hover:text-red-500 rounded-full transition-colors" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-ciec-border">
                <DetailField icon={<Briefcase size={14}/>} label="Cargo" value={integrante.cargo} />
                <DetailField icon={<Mail size={14}/>} label="E-mail" value={integrante.email} />
                <DetailField icon={<Phone size={14}/>} label="Teléfono" value={integrante.telefono} />
            </div>
        </div>
    );
};


const Integrantes: React.FC = () => {
    const [integrantes, setIntegrantes] = useState<IntegranteDetail[]>([]);
    const [establishmentsForFilter, setEstablishmentsForFilter] = useState<EstablishmentForFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<number | 'all'>('all');
    
    const fetchData = async () => {
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
            const allIntegrantes = (integrantesData as any || []) as IntegranteDetail[];
            setIntegrantes(allIntegrantes);

            // Procesar datos para obtener establecimientos con contadores
            const counts = new Map<number, number>();
            const establishmentMap = new Map<number, EstablishmentForFilter>();

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
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredIntegrantes = useMemo(() => {
        if (selectedEstablishmentId === 'all') {
            return integrantes;
        }
        return integrantes.filter(i => i.id_establecimiento === selectedEstablishmentId);
    }, [integrantes, selectedEstablishmentId]);
    
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
        <div className="flex h-full gap-6">
            {/* Columna de Filtros */}
            <div className="w-1/3 max-w-xs bg-ciec-card p-4 rounded-lg flex flex-col">
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
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold">Integrantes <span className="text-base font-normal text-ciec-text-secondary">{filteredIntegrantes.length}</span></h2>
                    <Link to="/integrantes/nuevo" className="flex items-center bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
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