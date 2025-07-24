import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Institucion } from '../types';
import Spinner from '../components/ui/Spinner';
import { Plus, Trash2, Building } from 'lucide-react';

interface GremiosProps {
    searchTerm: string;
}

const Gremios: React.FC<GremiosProps> = ({ searchTerm }) => {
    const [instituciones, setInstituciones] = useState<Institucion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGremios = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('instituciones')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error fetching institutions:', error);
            alert('Error al cargar los gremios.');
        } else {
            setInstituciones(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGremios();
    }, []);

    const filteredInstituciones = useMemo(() => {
        if (!searchTerm) {
            return instituciones;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return instituciones.filter(inst =>
            inst.nombre.toLowerCase().includes(lowercasedFilter) ||
            inst.rif.toLowerCase().replace(/-/g, '').includes(lowercasedFilter.replace(/-/g, ''))
        );
    }, [instituciones, searchTerm]);

    const handleDelete = async (e: React.MouseEvent, rif: string) => {
        // Detiene la propagación del evento para evitar que el Link se active
        e.stopPropagation();
        e.preventDefault();

        if (window.confirm('¿Está seguro de que desea eliminar este gremio? Esta acción no se puede deshacer y podría fallar si hay empresas afiliadas.')) {
            const { error } = await supabase.from('instituciones').delete().eq('rif', rif);
            if (error) {
                console.error('Error deleting institution:', error);
                alert(`Error al eliminar el gremio: ${error.message}`);
            } else {
                alert('Gremio eliminado exitosamente.');
                fetchGremios();
            }
        }
    };
    
    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="bg-ciec-card p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gremios / Instituciones</h1>
                <Link to="/gremios/nuevo" className="flex items-center bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <Plus className="w-5 h-5 mr-2" /> Añadir
                </Link>
            </div>
            <div className="space-y-3">
                {filteredInstituciones.map(gremio => (
                    <Link 
                        key={gremio.rif} 
                        to={`/gremios/editar/${gremio.rif}`}
                        className="flex items-center justify-between bg-ciec-bg p-4 rounded-lg hover:ring-2 hover:ring-ciec-blue transition-all duration-200 cursor-pointer"
                    >
                        <div className="flex items-center space-x-4 flex-grow">
                            <div className="flex-shrink-0 w-12 h-12 bg-ciec-border rounded-lg flex items-center justify-center">
                                {gremio.logo ? (
                                    <img src={gremio.logo} alt="logo" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Building className="w-6 h-6 text-ciec-text-secondary" />
                                )}
                            </div>
                            <div>
                                <span className="font-medium text-ciec-text-primary">{gremio.nombre}</span>
                                <p className="text-sm text-ciec-text-secondary">{gremio.rif}</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                             <button 
                                onClick={(e) => handleDelete(e, gremio.rif)} 
                                className="text-ciec-text-secondary hover:text-red-500 p-2 rounded-full transition-colors z-10" 
                                title="Eliminar"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </Link>
                ))}
                {filteredInstituciones.length === 0 && (
                    <div className="text-center py-10 text-ciec-text-secondary">
                        <p>No se encontraron gremios que coincidan con su búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gremios;