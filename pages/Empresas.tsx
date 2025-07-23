import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Institucion, EstablecimientoFull } from '../types';
import Spinner from '../components/ui/Spinner';
import { Building, AlertTriangle } from 'lucide-react';

const Empresas: React.FC = () => {
    const [establecimientos, setEstablecimientos] = useState<EstablecimientoFull[]>([]);
    const [instituciones, setInstituciones] = useState<Institucion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInstitucion, setSelectedInstitucion] = useState<string>('All');
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

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
            else setEstablecimientos(estData as any || []);

            if (instError) console.error('Error fetching institutions:', instError);
            else setInstituciones(instData || []);

            setLoading(false);
        };
        
        fetchData();

        const channel = supabase.channel('schema-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            fetchData();
          })
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredEstablecimientos = useMemo(() => {
        if (selectedInstitucion === 'All') return establecimientos;
        if (selectedInstitucion === '(empty)') return establecimientos.filter(e => !e.afiliaciones || e.afiliaciones.length === 0);
        return establecimientos.filter(e => e.afiliaciones?.some(a => a.rif_institucion === selectedInstitucion));
    }, [establecimientos, selectedInstitucion]);
    
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

    return (
        <div className="flex h-full relative">
            <div className="w-1/4 max-w-xs bg-ciec-card p-4 rounded-l-lg overflow-y-auto">
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
            <div className="flex-1 bg-ciec-bg rounded-r-lg p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-lg font-semibold">{instituciones.find(a => a.rif === selectedInstitucion)?.nombre || selectedInstitucion} <span className="text-sm font-normal text-ciec-text-secondary">{filteredEstablecimientos.length}</span></h2>
                </div>
                <div className="overflow-y-auto flex-grow pr-2">
                    {filteredEstablecimientos.map(est => (
                         <Link to={`/empresas/editar/${est.id_establecimiento}`} key={est.id_establecimiento} className="block mb-3">
                            <div className="bg-ciec-card p-4 rounded-lg hover:ring-2 hover:ring-ciec-blue transition-all duration-200 flex items-center space-x-4">
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
                                    <div title="Ubicación no disponible">
                                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    </div>
                                ) : null}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Empresas;