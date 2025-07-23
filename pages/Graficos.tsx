import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabase';
import { EstablecimientoFull, Institucion } from '../types';
import Spinner from '../components/ui/Spinner';
import { Maximize, Building, Users, Share2, Minimize, X } from 'lucide-react';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#eab308', '#ec4899'];

// --- Componente de Modal Arrastrable y Redimensionable (movido fuera de Graficos) ---
const ResizableDraggableModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 300 });
    const [size, setSize] = useState({ width: 900, height: 600 });
    
    const [lastPosition, setLastPosition] = useState({ ...position });
    const [lastSize, setLastSize] = useState({ ...size });
    
    const dragStartOffset = useRef({ x: 0, y: 0 });

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMaximized) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return; 
        setIsDragging(true);
        dragStartOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); 
        if (isMaximized) return;
        setIsResizing(true);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStartOffset.current.x,
                y: e.clientY - dragStartOffset.current.y,
            });
        }
        if (isResizing) {
            setSize(currentSize => ({
                width: Math.max(400, currentSize.width + e.movementX),
                height: Math.max(300, currentSize.height + e.movementY),
            }));
        }
    }, [isDragging, isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if(isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
    
    const toggleMaximize = () => {
        if(isMaximized) {
            setPosition(lastPosition);
            setSize(lastSize);
        } else {
            setLastPosition(position);
            setLastSize(size);
            setPosition({ x: 0, y: 0 }); // Reset position for maximization
            setSize({ width: window.innerWidth, height: window.innerHeight });
        }
        setIsMaximized(!isMaximized);
    };

    useEffect(() => {
        if (isMaximized) {
            const handleResize = () => {
                setSize({ width: window.innerWidth, height: window.innerHeight });
            };
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isMaximized]);


    if (!isOpen) return null;
    
    const modalStyle: React.CSSProperties = isMaximized ? {
        top: 0, left: 0, width: '100vw', height: '100vh', transform: 'none', borderRadius: 0, transition: 'all 0.2s ease'
    } : {
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
        transition: isDragging ? 'none' : 'all 0.2s ease',
    };

    return (
        <div 
            ref={modalRef} 
            style={modalStyle}
            className="fixed bg-ciec-card rounded-lg shadow-2xl flex flex-col z-50 border border-ciec-border"
        >
            <div 
                onMouseDown={handleDragStart}
                className={`flex justify-between items-center p-3 border-b border-ciec-border flex-shrink-0 ${!isMaximized ? 'cursor-move' : ''}`}
            >
                <h2 className="text-xl font-bold text-ciec-text-primary truncate">{title}</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={toggleMaximize} className="text-ciec-text-secondary hover:text-white p-2 rounded-full hover:bg-ciec-border">
                        {isMaximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                    <button onClick={onClose} className="text-ciec-text-secondary hover:text-white p-2 rounded-full hover:bg-ciec-border">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-hidden">
                {children}
            </div>
            {!isMaximized && (
                <div 
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
                >
                  <div className="w-full h-full border-r-2 border-b-2 border-ciec-border opacity-50 hover:opacity-100 transition-opacity"></div>
                </div>
            )}
        </div>
    );
};

// --- Componentes del Dashboard ---
const DashboardCard: React.FC<{ title: string; onExpand?: () => void; children: React.ReactNode; className?: string; }> = ({ title, onExpand, children, className }) => (
    <div className={`bg-ciec-card rounded-lg shadow-lg flex flex-col p-4 ${className}`}>
        {(title || onExpand) && (
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="text-md font-semibold text-ciec-text-primary truncate">{title}</h3>
                {onExpand && (
                    <button onClick={onExpand} className="text-ciec-text-secondary hover:text-white p-1 rounded-full">
                        <Maximize size={16} />
                    </button>
                )}
            </div>
        )}
        <div className="w-full flex-grow h-full relative">
            {children}
        </div>
    </div>
);

const KpiCard: React.FC<{ title: string; value: number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="flex flex-col justify-center items-center h-full text-center">
        <div className="text-ciec-blue">{icon}</div>
        <p className="text-4xl lg:text-5xl font-bold text-ciec-text-primary mt-2">{value.toLocaleString('es-ES')}</p>
        <p className="text-sm text-ciec-text-secondary mt-1">{title}</p>
    </div>
);


const Graficos: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({ totalEst: 0, totalEmp: 0, totalGremios: 0 });
    const [chartData, setChartData] = useState<{municipio: any[], gremio: any[], caev: any[]}>({ municipio: [], gremio: [], caev: [] });
    const [expandedChart, setExpandedChart] = useState<{ title: string; chart: React.ReactNode } | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
             const [
                { data: estData, error: estError },
                { data: instData, error: instError },
            ] = await Promise.all([
                 supabase.from('establecimientos').select(`
                    personal_obrero, personal_empleado, personal_directivo,
                    direcciones ( parroquias ( municipios ( nombre_municipio ) ) ),
                    clases_caev ( divisiones_caev ( secciones_caev ( nombre_seccion ) ) ),
                    afiliaciones ( rif_institucion )
                `),
                supabase.from('instituciones').select('rif, nombre'),
            ]);

            if (estError || instError) {
                console.error({ estError, instError });
                setLoading(false);
                return;
            }

            const ests = (estData as any || []) as EstablecimientoFull[];
            const insts = (instData as any || []) as Institucion[];
            
            // --- KPIs ---
            const totalEmp = ests.reduce((sum, est) => sum + (est.personal_obrero || 0) + (est.personal_empleado || 0) + (est.personal_directivo || 0), 0);
            setKpiData({
                totalEst: ests.length,
                totalEmp: totalEmp,
                totalGremios: insts.length,
            });

             // --- Chart Data ---
            const munCounts = new Map<string, number>();
            ests.forEach(e => {
                const municipio = e.direcciones?.parroquias?.municipios?.nombre_municipio;
                if (municipio) munCounts.set(municipio, (munCounts.get(municipio) || 0) + 1);
            });
            const municipioChartData = Array.from(munCounts.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

            const gremioCounts = new Map<string, number>();
            ests.forEach(e => {
                e.afiliaciones?.forEach(af => {
                    gremioCounts.set(af.rif_institucion, (gremioCounts.get(af.rif_institucion) || 0) + 1);
                })
            });
            const gremioChartData = Array.from(gremioCounts.entries()).map(([institucionRif, value]) => ({
                name: insts.find(i => i.rif === institucionRif)?.nombre || 'Desconocido',
                value,
            })).sort((a,b) => b.value - a.value);
            
            const caevCounts = new Map<string, number>();
            ests.forEach(e => {
                const seccion = e.clases_caev?.divisiones_caev?.secciones_caev?.nombre_seccion;
                if (seccion) caevCounts.set(seccion, (caevCounts.get(seccion) || 0) + 1);
            });
            const caevChartData = Array.from(caevCounts.entries()).map(([name, value]) => ({ name, value, })).sort((a,b) => b.value - a.value);

            setChartData({
                municipio: municipioChartData,
                gremio: gremioChartData,
                caev: caevChartData
            });

            setLoading(false);
        };
        fetchData();
    }, []);
    
    const handleExpand = (title: string, chartComponent: React.ReactNode) => {
        setExpandedChart({ title, chart: chartComponent });
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    const tooltipStyle = { 
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        color: '#f9fafb'
    };

    // --- Componentes de Gráficos Reutilizables ---
    const MunicipioChart = ({ data, isExpanded = false }: { data: any[], isExpanded?: boolean }) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={isExpanded ? 120 : 80} tick={{ fontSize: isExpanded ? 14 : 10 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#374151' }} />
                <Bar dataKey="value" name="Establecimientos" barSize={isExpanded ? 20 : 15}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[0]} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
    
    const GremioChart = ({ data, isExpanded = false }: { data: any[], isExpanded?: boolean }) => (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isExpanded ? "80%" : "70%"} fill="#8884d8">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: isExpanded ? '14px' : '12px', paddingTop: '10px' }}/>
            </PieChart>
        </ResponsiveContainer>
    );

    const CaevChart = ({ data, isExpanded = false }: { data: any[], isExpanded?: boolean }) => (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={isExpanded ? "50%" : "40%"} outerRadius={isExpanded ? "80%" : "70%"} fill="#8884d8" paddingAngle={2}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: isExpanded ? '14px' : '12px', paddingTop: '10px' }}/>
            </PieChart>
        </ResponsiveContainer>
    );

    return (
        <>
            <div className="grid grid-cols-12 gap-4 auto-rows-[180px]">
                {/* KPIs */}
                <DashboardCard title="" className="col-span-12 sm:col-span-6 lg:col-span-4">
                    <KpiCard title="Establecimientos Totales" value={kpiData.totalEst} icon={<Building size={32}/>} />
                </DashboardCard>
                <DashboardCard title="" className="col-span-12 sm:col-span-6 lg:col-span-4">
                     <KpiCard title="Empleados Registrados" value={kpiData.totalEmp} icon={<Users size={32}/>} />
                </DashboardCard>
                 <DashboardCard title="" className="col-span-12 sm:col-span-12 lg:col-span-4">
                     <KpiCard title="Gremios Afiliados" value={kpiData.totalGremios} icon={<Share2 size={32}/>} />
                </DashboardCard>

                {/* Gráfico de Municipios */}
                <DashboardCard 
                    title="Top 10 Municipios por Establecimiento"
                    onExpand={() => handleExpand('Establecimientos por Municipio', <MunicipioChart data={chartData.municipio} isExpanded />)}
                    className="col-span-12 lg:col-span-7 row-span-2"
                >
                    <MunicipioChart data={chartData.municipio.slice(0, 10)} />
                </DashboardCard>
                
                {/* Gráfico de Gremios */}
                <DashboardCard 
                    title="Establecimientos por Gremio"
                    onExpand={() => handleExpand('Establecimientos por Gremio', <GremioChart data={chartData.gremio} isExpanded />)}
                    className="col-span-12 lg:col-span-5 row-span-2"
                >
                    <GremioChart data={chartData.gremio.slice(0, 5)} />
                </DashboardCard>
                
                {/* Gráfico de Sección CAEV */}
                <DashboardCard
                    title="Establecimientos por Sector Económico (CAEV)"
                    onExpand={() => handleExpand('Establecimientos por Sección CAEV', <CaevChart data={chartData.caev} isExpanded />)}
                    className="col-span-12 row-span-2"
                >
                    <CaevChart data={chartData.caev.slice(0, 10)} />
                </DashboardCard>
            </div>

            {expandedChart && (
                <ResizableDraggableModal 
                    isOpen={!!expandedChart} 
                    onClose={() => setExpandedChart(null)} 
                    title={expandedChart.title}
                >
                    {expandedChart.chart}
                </ResizableDraggableModal>
            )}
            
        </>
    );
};

export default Graficos;