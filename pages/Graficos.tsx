import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Institucion, Estado, Municipio, SeccionCaev, DivisionCaev } from '../types';
import Spinner from '../components/ui/Spinner';
import { Maximize, Building, Users, Share2, X, Download, RotateCw } from 'lucide-react';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#eab308', '#ec4899', '#64748b', '#3b82f6', '#a855f7'];

// --- Componente de Modal para Gráfico Expandido ---
const ExpandedChartModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center transition-opacity" onClick={onClose}>
            <div className="bg-ciec-card rounded-lg shadow-xl w-full max-w-6xl h-[90vh] m-4 transform transition-all flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-ciec-border flex-shrink-0">
                    <h2 className="text-xl font-bold text-ciec-text-primary truncate">{title}</h2>
                    <button onClick={onClose} className="text-ciec-text-secondary hover:text-white p-2 rounded-full hover:bg-ciec-border"><X className="w-5 h-5" /></button>
                </header>
                <main className="flex-grow p-4 overflow-auto">{children}</main>
            </div>
        </div>
    );
};

// --- Componentes del Dashboard ---
const DashboardCard: React.FC<{ title: string; onExpand?: () => void; onExport?: () => void; children: React.ReactNode; className?: string; }> = ({ title, onExpand, onExport, children, className }) => (
    <div className={`bg-ciec-card rounded-lg shadow-lg flex flex-col p-4 ${className}`}>
        <header className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="text-md font-semibold text-ciec-text-primary truncate">{title}</h3>
            <div className="flex items-center space-x-1">
                {onExport && <button onClick={onExport} className="text-ciec-text-secondary hover:text-white p-1 rounded-full" title="Exportar datos (XLSX)"><Download size={16} /></button>}
                {onExpand && <button onClick={onExpand} className="text-ciec-text-secondary hover:text-white p-1 rounded-full" title="Expandir gráfico"><Maximize size={16} /></button>}
            </div>
        </header>
        <div className="w-full flex-grow h-full relative">{children}</div>
    </div>
);

const KpiCard: React.FC<{ title: string; value: number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="flex flex-col justify-center items-center h-full text-center bg-ciec-card rounded-lg shadow-lg p-4">
        <div className="text-ciec-blue">{icon}</div>
        <p className="text-4xl lg:text-5xl font-bold text-ciec-text-primary mt-2">{value.toLocaleString('es-ES')}</p>
        <p className="text-sm text-ciec-text-secondary mt-1">{title}</p>
    </div>
);

const tooltipStyle = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' };
const itemStyle = { color: '#f9fafb' };
const labelStyle = { color: '#f9fafb', fontWeight: 'bold' };

const Graficos: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [expandedChart, setExpandedChart] = useState<{ title: string; chart: React.ReactNode } | null>(null);
    
    // Data stores
    const [allEstablecimientos, setAllEstablecimientos] = useState<any[]>([]);
    const [allInstituciones, setAllInstituciones] = useState<Institucion[]>([]);
    const [allEstados, setAllEstados] = useState<Estado[]>([]);
    const [allMunicipios, setAllMunicipios] = useState<Municipio[]>([]);
    const [allSeccionesCaev, setAllSeccionesCaev] = useState<SeccionCaev[]>([]);
    
    // Filter states
    const [selectedEstado, setSelectedEstado] = useState('0');
    const [selectedMunicipio, setSelectedMunicipio] = useState('0');
    const [selectedSeccion, setSelectedSeccion] = useState('0');
    const [selectedInstituciones, setSelectedInstituciones] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [
                { data: estData }, { data: instData }, { data: estadosData },
                { data: municipiosData }, { data: seccionesData }
            ] = await Promise.all([
                 supabase.from('establecimientos').select(`
                    personal_obrero, personal_empleado, personal_directivo,
                    direcciones ( parroquias ( municipios ( id_municipio, nombre_municipio, estados(id_estado, nombre_estado) ) ) ),
                    clases_caev ( divisiones_caev ( id_seccion, nombre_division, secciones_caev ( id_seccion, nombre_seccion, descripcion_seccion ) ) ),
                    afiliaciones ( rif_institucion )
                `),
                supabase.from('instituciones').select('rif, nombre, abreviacion'),
                supabase.from('estados').select('*').order('nombre_estado'),
                supabase.from('municipios').select('*').order('nombre_municipio'),
                supabase.from('secciones_caev').select('*').order('nombre_seccion'),
            ]);
            
            setAllEstablecimientos((estData as any) || []);
            setAllInstituciones((instData as any) || []);
            setAllEstados((estadosData as any) || []);
            setAllMunicipios((municipiosData as any) || []);
            setAllSeccionesCaev((seccionesData as any) || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    // --- Memoized data for general charts (unfiltered) ---
    const kpiData = useMemo(() => {
        const totalEmp = allEstablecimientos.reduce((sum, est) => sum + (est.personal_obrero || 0) + (est.personal_empleado || 0) + (est.personal_directivo || 0), 0);
        return { totalEst: allEstablecimientos.length, totalEmp: totalEmp, totalGremios: allInstituciones.length };
    }, [allEstablecimientos, allInstituciones]);

    const generalChartsData = useMemo(() => {
        const munCounts = new Map<string, number>();
        allEstablecimientos.forEach(e => {
            const municipio = e.direcciones?.parroquias?.municipios?.nombre_municipio;
            if (municipio) munCounts.set(municipio, (munCounts.get(municipio) || 0) + 1);
        });
        const municipio = Array.from(munCounts.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        
        // --- Gremio Logic using 'abreviacion' field ---
        const rifToGremioLabel = new Map<string, string>();
        allInstituciones.forEach(inst => {
            const label = inst.abreviacion?.trim() || inst.nombre;
            rifToGremioLabel.set(inst.rif, label);
        });
    
        const gremioCounts = new Map<string, number>();
        allEstablecimientos.forEach(est => {
            const affiliatedGremioLabels = new Set<string>();
            est.afiliaciones?.forEach((af: any) => {
                const label = rifToGremioLabel.get(af.rif_institucion);
                if (label) {
                    affiliatedGremioLabels.add(label);
                }
            });
            
            affiliatedGremioLabels.forEach(label => {
                gremioCounts.set(label, (gremioCounts.get(label) || 0) + 1);
            });
        });
    
        const gremio = Array.from(gremioCounts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        // --- END: Gremio Logic ---

        const caevCounts = new Map<string, number>();
        allEstablecimientos.forEach(e => {
            const seccion = e.clases_caev?.divisiones_caev?.secciones_caev;
            if (seccion?.nombre_seccion) {
                const label = seccion.descripcion_seccion ? `${seccion.nombre_seccion} - ${seccion.descripcion_seccion}` : seccion.nombre_seccion;
                caevCounts.set(label, (caevCounts.get(label) || 0) + 1);
            }
        });
        const caev = Array.from(caevCounts.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        return { municipio, gremio, caev };
    }, [allEstablecimientos, allInstituciones]);

    // --- Memos for interactive analysis ---
    const filteredMunicipiosForSelect = useMemo(() => {
        if (selectedEstado === '0') return allMunicipios;
        return allMunicipios.filter(m => String(m.id_estado) === selectedEstado);
    }, [allMunicipios, selectedEstado]);

    const filteredEstablecimientos = useMemo(() => {
        return allEstablecimientos.filter(est => {
            const dir = est.direcciones;
            const caev = est.clases_caev;
            
            if (selectedEstado !== '0' && String(dir?.parroquias?.municipios?.estados?.id_estado) !== selectedEstado) return false;
            if (selectedMunicipio !== '0' && String(dir?.parroquias?.municipios?.id_municipio) !== selectedMunicipio) return false;
            
            if (selectedInstituciones.length > 0) {
                const estRifs = est.afiliaciones.map((a: any) => a.rif_institucion);
                if (!selectedInstituciones.some(rif => estRifs.includes(rif))) return false;
            }

            if (selectedSeccion !== '0' && String(caev?.divisiones_caev?.secciones_caev?.id_seccion) !== selectedSeccion) return false;

            return true;
        });
    }, [allEstablecimientos, selectedEstado, selectedMunicipio, selectedInstituciones, selectedSeccion]);
    
    const interactiveSectorData = useMemo(() => {
        const counts = new Map<string, number>();
        filteredEstablecimientos.forEach(e => {
            const seccion = e.clases_caev?.divisiones_caev?.secciones_caev;
            const sectorName = seccion?.nombre_seccion || 'Sin Sector';
            const label = seccion?.descripcion_seccion
                ? `${sectorName} - ${seccion.descripcion_seccion}`
                : sectorName;
            counts.set(label, (counts.get(label) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredEstablecimientos]);
    
    const interactiveLocationData = useMemo(() => {
        const counts = new Map<string, number>();
        filteredEstablecimientos.forEach(e => {
            const municipioName = e.direcciones?.parroquias?.municipios?.nombre_municipio || 'Sin Ubicación';
            counts.set(municipioName, (counts.get(municipioName) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredEstablecimientos]);
    
    // --- Handlers ---
    const handleExpand = (title: string, chartComponent: React.ReactNode) => setExpandedChart({ title, chart: chartComponent });
    
    const handleExport = (data: any[], fileName: string) => {
        if (!data || data.length === 0) return alert("No hay datos para exportar.");
        
        const dataToExport = data.map(item => ({ 'Categoría': item.name, 'Cantidad': item.value }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
        XLSX.writeFile(workbook, `${fileName.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };
    
    const handleInstitutionToggle = (rif: string) => {
        setSelectedInstituciones(prev => prev.includes(rif) ? prev.filter(id => id !== rif) : [...prev, rif]);
    };
    
    const resetFilters = () => {
        setSelectedEstado('0');
        setSelectedMunicipio('0');
        setSelectedSeccion('0');
        setSelectedInstituciones([]);
    };

    // --- Chart Components ---
    const HorizontalBarChart = ({ data, isExpanded = false }: { data: any[], isExpanded?: boolean }) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9ca3af"
                    width={isExpanded ? 250 : 160}
                    tick={{
                        fontSize: isExpanded ? 12 : 10,
                        width: isExpanded ? 240 : 150,
                    }}
                    interval={0}
                />
                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: '#374151' }} />
                <Bar dataKey="value" name="Establecimientos" barSize={isExpanded ? 20 : 15}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );

    const DonutChart = ({ data, isExpanded = false }: { data: any[], isExpanded?: boolean }) => {
        const truncate = (value: string) => {
            const maxLength = isExpanded ? 60 : 45;
            if (value.length > maxLength) {
                return value.substring(0, maxLength - 3) + '...';
            }
            return value;
        };

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={isExpanded ? "50%" : "40%"} outerRadius={isExpanded ? "80%" : "70%"} fill="#8884d8" paddingAngle={2}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                    <Legend 
                        wrapperStyle={{ fontSize: isExpanded ? '14px' : '10px', paddingTop: isExpanded ? '20px' : '10px' }}
                        formatter={(value) => truncate(value)}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
    };


    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <>
            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard title="Establecimientos Totales" value={kpiData.totalEst} icon={<Building size={32}/>} />
                <KpiCard title="Empleados Registrados" value={kpiData.totalEmp} icon={<Users size={32}/>} />
                <KpiCard title="Gremios Afiliados" value={kpiData.totalGremios} icon={<Share2 size={32}/>} />
            </div>

            {/* General Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 auto-rows-[360px]">
                <DashboardCard title="Top 10 Municipios" onExpand={() => handleExpand('Establecimientos por Municipio', <HorizontalBarChart data={generalChartsData.municipio} isExpanded />)} onExport={() => handleExport(generalChartsData.municipio, 'Establecimientos_por_Municipio')} className="col-span-1 lg:col-span-6">
                    <HorizontalBarChart data={generalChartsData.municipio.slice(0, 10)} />
                </DashboardCard>
                <DashboardCard title="Establecimientos por Gremio" onExpand={() => handleExpand('Establecimientos por Gremio', <HorizontalBarChart data={generalChartsData.gremio} isExpanded />)} onExport={() => handleExport(generalChartsData.gremio, 'Establecimientos_por_Gremio')} className="col-span-1 lg:col-span-6">
                    <HorizontalBarChart data={generalChartsData.gremio.slice(0, 10)} />
                </DashboardCard>
                <DashboardCard title="Establecimientos por Sector Económico (CAEV)" onExpand={() => handleExpand('Establecimientos por Sector CAEV', <DonutChart data={generalChartsData.caev} isExpanded />)} onExport={() => handleExport(generalChartsData.caev, 'Establecimientos_por_Sector_CAEV')} className="col-span-1 lg:col-span-12">
                    <DonutChart data={generalChartsData.caev.slice(0, 10)} />
                </DashboardCard>
            </div>
            
            {/* Interactive Analysis Section */}
            <div className="mt-8 pt-6 border-t-2 border-ciec-border">
                 <h2 className="text-2xl font-bold mb-4">Análisis Interactivo</h2>
                 <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filter Panel */}
                    <div className="w-full lg:w-1/4 bg-ciec-card p-4 rounded-lg flex flex-col self-start">
                        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
                        <div className="flex-1 space-y-4 overflow-y-auto">
                           <details open><summary className="cursor-pointer font-semibold">Ubicación</summary>
                                <div className="pl-4 mt-2 space-y-2">
                                    <label className="block text-sm">Estado</label>
                                    <select value={selectedEstado} onChange={e => { setSelectedEstado(e.target.value); setSelectedMunicipio('0'); }} className="w-full bg-ciec-bg border border-ciec-border rounded-lg p-2"><option value="0">Todos</option>{allEstados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>)}</select>
                                    <label className="block text-sm">Municipio</label>
                                    <select value={selectedMunicipio} onChange={e => setSelectedMunicipio(e.target.value)} disabled={selectedEstado === '0'} className="w-full bg-ciec-bg border border-ciec-border rounded-lg p-2 disabled:opacity-50"><option value="0">Todos</option>{filteredMunicipiosForSelect.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre_municipio}</option>)}</select>
                                </div>
                            </details>
                            <details open><summary className="cursor-pointer font-semibold">Actividad Económica</summary>
                                <div className="pl-4 mt-2 space-y-2">
                                    <label className="block text-sm">Sector (Sección CAEV)</label>
                                    <select value={selectedSeccion} onChange={e => setSelectedSeccion(e.target.value)} className="w-full bg-ciec-bg border border-ciec-border rounded-lg p-2"><option value="0">Todos</option>{allSeccionesCaev.map(s => <option key={s.id_seccion} value={s.id_seccion}>{`${s.nombre_seccion}${s.descripcion_seccion ? ` - ${s.descripcion_seccion}` : ''}`}</option>)}</select>
                                </div>
                            </details>
                             <details><summary className="cursor-pointer font-semibold">Gremio</summary>
                                <div className="pl-4 mt-2 max-h-40 overflow-y-auto space-y-1">
                                    {allInstituciones.map(inst => (<div key={inst.rif} className="flex items-center"><input type="checkbox" id={`inst-filter-${inst.rif}`} checked={selectedInstituciones.includes(inst.rif)} onChange={() => handleInstitutionToggle(inst.rif)} className="w-4 h-4 text-ciec-blue bg-gray-700 rounded"/><label htmlFor={`inst-filter-${inst.rif}`} className="ml-2 text-sm">{inst.nombre}</label></div>))}
                                </div>
                            </details>
                        </div>
                        <button onClick={resetFilters} className="mt-6 w-full border border-ciec-border bg-transparent text-ciec-text-secondary hover:bg-ciec-border hover:text-ciec-text-primary font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-border">
                            <RotateCw className="w-4 h-4 mr-2" />Restablecer Filtros
                        </button>
                    </div>

                    {/* Filtered Charts */}
                    <div className="w-full lg:w-3/4 flex flex-col gap-6">
                        <DashboardCard title="Establecimientos por Sector Económico" onExpand={() => handleExpand('Establecimientos por Sector (Filtrado)', <HorizontalBarChart data={interactiveSectorData} isExpanded />)} onExport={() => handleExport(interactiveSectorData, 'Establecimientos_por_Sector_Filtrado')} className="h-96">
                            {filteredEstablecimientos.length > 0 ? <HorizontalBarChart data={interactiveSectorData} /> : <div className="flex items-center justify-center h-full text-ciec-text-secondary">No hay datos para los filtros seleccionados.</div>}
                        </DashboardCard>
                        <DashboardCard title="Establecimientos por Municipio" onExpand={() => handleExpand(`Establecimientos por Municipio (Filtrado)`, <HorizontalBarChart data={interactiveLocationData} isExpanded />)} onExport={() => handleExport(interactiveLocationData, 'Establecimientos_por_Ubicacion_Filtrado')} className="h-96">
                            {filteredEstablecimientos.length > 0 ? <HorizontalBarChart data={interactiveLocationData} /> : <div className="flex items-center justify-center h-full text-ciec-text-secondary">No hay datos para los filtros seleccionados.</div>}
                        </DashboardCard>
                    </div>
                </div>
            </div>

            {expandedChart && <ExpandedChartModal isOpen={!!expandedChart} onClose={() => setExpandedChart(null)} title={expandedChart.title}>{expandedChart.chart}</ExpandedChartModal>}
        </>
    );
};

export default Graficos;