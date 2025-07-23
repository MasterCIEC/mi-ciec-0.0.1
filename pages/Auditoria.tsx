import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Spinner from '../components/ui/Spinner';

// Tipo para los datos de auditoría
interface AuditStat {
    label: string;
    completed: number;
    total: number;
}

// Componente para la barra de progreso
const ProgressBar: React.FC<{ stat: AuditStat }> = ({ stat }) => {
    const percentage = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
    const color = percentage >= 80 ? 'bg-ciec-blue' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-ciec-bg p-4 rounded-lg border border-ciec-border">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-ciec-text-primary">{stat.label}</span>
                <span className="text-xs text-ciec-text-secondary">{stat.completed} / {stat.total}</span>
            </div>
            <div className="w-full bg-ciec-border rounded-full h-2.5">
                <div 
                    className={`${color} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="text-right text-xs mt-1 font-semibold text-ciec-text-primary">
                {percentage.toFixed(1)}% Completo
            </div>
        </div>
    );
};


const Auditoria: React.FC = () => {
    const [stats, setStats] = useState<AuditStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuditData = async () => {
            setLoading(true);

            // 1. Obtener todos los establecimientos con sus relaciones
            const { data, error } = await supabase
                .from('establecimientos')
                .select(`
                    nombre_establecimiento,
                    email_principal,
                    telefono_principal_1,
                    fecha_apertura,
                    personal_obrero,
                    personal_empleado,
                    personal_directivo,
                    companias ( ano_fundacion, direccion_fiscal, logo ),
                    direcciones ( direccion_detallada, latitud, parroquias ( id_parroquia, municipios ( id_municipio, estados ( id_estado ) ) ) ),
                    clases_caev ( id_clase, divisiones_caev ( id_division, secciones_caev ( id_seccion ) ) ),
                    establecimiento_productos ( id_establecimiento ),
                    establecimiento_procesos ( id_establecimiento ),
                    afiliaciones ( id_establecimiento ),
                    integrantes ( id_integrante )
                `);

            if (error) {
                console.error("Error fetching audit data:", error);
                setLoading(false);
                return;
            }

            const total = data.length;
            if (total === 0) {
                setStats([]);
                setLoading(false);
                return;
            }

            // 2. Calcular las estadísticas en el orden de la vista de detalle de empresa
            const calculatedStats: AuditStat[] = [
                 // Datos de la Compañía
                { label: 'Logo de Compañía', completed: data.filter(e => !!e.companias?.logo).length, total },
                { label: 'Año de Fundación', completed: data.filter(e => e.companias?.ano_fundacion).length, total },
                { label: 'Dirección Fiscal', completed: data.filter(e => e.companias?.direccion_fiscal).length, total },
                
                // Datos del Establecimiento
                { label: 'Nombre Establecimiento', completed: data.filter(e => !!e.nombre_establecimiento).length, total },
                { label: 'Fecha de Apertura', completed: data.filter(e => !!e.fecha_apertura).length, total },
                { label: 'Correos', completed: data.filter(e => !!e.email_principal).length, total },
                { label: 'Teléfonos', completed: data.filter(e => !!e.telefono_principal_1).length, total },
                
                // Capital Humano
                { label: 'Cantidad de Obreros', completed: data.filter(e => e.personal_obrero !== null && e.personal_obrero !== undefined).length, total },
                { label: 'Cantidad de Empleados', completed: data.filter(e => e.personal_empleado !== null && e.personal_empleado !== undefined).length, total },
                { label: 'Cantidad de Directivos', completed: data.filter(e => e.personal_directivo !== null && e.personal_directivo !== undefined).length, total },
                { label: 'Persona de Contacto', completed: data.filter(e => e.integrantes && e.integrantes.length > 0).length, total },
                
                // Ubicación Geográfica
                { label: 'Estado', completed: data.filter(e => e.direcciones?.parroquias?.municipios?.estados?.id_estado).length, total },
                { label: 'Municipio', completed: data.filter(e => e.direcciones?.parroquias?.municipios?.id_municipio).length, total },
                { label: 'Parroquia', completed: data.filter(e => e.direcciones?.parroquias?.id_parroquia).length, total },
                { label: 'Dirección Detallada', completed: data.filter(e => !!e.direcciones?.direccion_detallada).length, total },
                { label: 'Coordenadas', completed: data.filter(e => !!e.direcciones?.latitud).length, total },
                
                // Clasificación y Producción
                { label: 'Sección CAEV', completed: data.filter(e => e.clases_caev?.divisiones_caev?.secciones_caev?.id_seccion).length, total },
                { label: 'División CAEV', completed: data.filter(e => e.clases_caev?.divisiones_caev?.id_division).length, total },
                { label: 'Clase CAEV', completed: data.filter(e => e.clases_caev?.id_clase).length, total },
                { label: 'Productos', completed: data.filter(e => e.establecimiento_productos.length > 0).length, total },
                { label: 'Procesos Productivos', completed: data.filter(e => e.establecimiento_procesos.length > 0).length, total },
                
                // Afiliaciones
                { label: 'Afiliación a Gremio', completed: data.filter(e => e.afiliaciones.length > 0).length, total },
            ];
            
            setStats(calculatedStats);
            setLoading(false);
        };

        fetchAuditData();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="bg-ciec-card p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Auditoría de Calidad de Datos</h1>
            <p className="text-sm text-ciec-text-secondary mb-8">
                Esta sección muestra el porcentaje de completitud de los campos clave para todos los establecimientos registrados en el sistema.
                Una barra de progreso indica visualmente el estado de cada campo, ayudando a identificar áreas que requieren atención para mejorar la calidad de los datos.
            </p>
            {stats.length === 0 && !loading ? (
                 <div className="text-center py-10 text-ciec-text-secondary">
                    <p>No hay datos de establecimientos para auditar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map(stat => (
                        <ProgressBar key={stat.label} stat={stat} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Auditoria;
