

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Estado, Municipio, Parroquia, Institucion, SeccionCaev, DivisionCaev, ClaseCaev } from '../types';
import Spinner from '../components/ui/Spinner';
import { Download, Building } from 'lucide-react';
import ColumnSelectionModal, { ALL_COLUMNS } from '../components/reportes/ColumnSelectionModal';

// Tipo de dato aplanado para el reporte
export type ReportableData = { [key: string]: string | number | null };

const Reportes: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [allData, setAllData] = useState<any[]>([]);
    
    // Listas para los filtros
    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [parroquias, setParroquias] = useState<Parroquia[]>([]);
    const [instituciones, setInstituciones] = useState<Institucion[]>([]);
    const [secciones, setSecciones] = useState<SeccionCaev[]>([]);
    const [divisiones, setDivisiones] = useState<DivisionCaev[]>([]);
    const [clases, setClases] = useState<ClaseCaev[]>([]);

    // Estado de los filtros
    const [selectedEstado, setSelectedEstado] = useState<string>('0');
    const [selectedMunicipio, setSelectedMunicipio] = useState<string>('0');
    const [selectedParroquia, setSelectedParroquia] = useState<string>('0');
    const [selectedInstituciones, setSelectedInstituciones] = useState<string[]>([]);
    const [selectedSeccion, setSelectedSeccion] = useState<string>('0');
    const [selectedDivision, setSelectedDivision] = useState<string>('0');
    const [selectedClase, setSelectedClase] = useState<string>('0');
    const [hasCoords, setHasCoords] = useState<boolean | null>(null);

    // Estado de los filtros de datos faltantes
    const [filterMissingLocation, setFilterMissingLocation] = useState<boolean>(false);
    const [filterMissingAffiliation, setFilterMissingAffiliation] = useState<boolean>(false);
    const [filterMissingCaev, setFilterMissingCaev] = useState<boolean>(false);
    const [filterMissingContact, setFilterMissingContact] = useState<boolean>(false);
    const [filterMissingPersonnel, setFilterMissingPersonnel] = useState<boolean>(false);
    const [filterMissingProduction, setFilterMissingProduction] = useState<boolean>(false);

    // Estado del modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [
                { data: estData }, { data: estadosData }, { data: municipiosData },
                { data: parroquiasData }, { data: instData }, { data: secData },
                { data: divData }, { data: claData }
            ] = await Promise.all([
                supabase.from('establecimientos').select(`
                    *,
                    companias(*),
                    direcciones(*, parroquias(*, municipios(*, estados(*)))),
                    clases_caev(*, divisiones_caev(*, secciones_caev(*))),
                    establecimiento_productos(productos(nombre_producto)),
                    establecimiento_procesos(procesos_productivos(nombre_proceso)),
                    afiliaciones(instituciones(rif, nombre))
                `),
                supabase.from('estados').select('*'),
                supabase.from('municipios').select('*'),
                supabase.from('parroquias').select('*'),
                supabase.from('instituciones').select('*'),
                supabase.from('secciones_caev').select('*'),
                supabase.from('divisiones_caev').select('*'),
                supabase.from('clases_caev').select('*')
            ]);
            
            setAllData(estData || []);
            setEstados(estadosData || []);
            setMunicipios(municipiosData || []);
            setParroquias(parroquiasData || []);
            setInstituciones(instData || []);
            setSecciones(secData || []);
            setDivisiones(divData || []);
            setClases(claData || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredMunicipios = useMemo(() => {
        if (selectedEstado === '0') return municipios;
        return municipios.filter(m => m.id_estado.toString() === selectedEstado);
    }, [municipios, selectedEstado]);

    const filteredParroquias = useMemo(() => {
        if (selectedMunicipio === '0') return [];
        return parroquias.filter(p => p.id_municipio.toString() === selectedMunicipio);
    }, [parroquias, selectedMunicipio]);
    
    const filteredDivisiones = useMemo(() => {
        if (selectedSeccion === '0') return [];
        return divisiones.filter(d => d.id_seccion.toString() === selectedSeccion);
    }, [divisiones, selectedSeccion]);

    const filteredClases = useMemo(() => {
        if (selectedDivision === '0') return [];
        return clases.filter(c => c.id_division.toString() === selectedDivision);
    }, [clases, selectedDivision]);

    const filteredData = useMemo(() => {
        return allData.filter(e => {
            const dir = e.direcciones;
            const caev = e.clases_caev;
            
            if (selectedEstado !== '0' && dir?.parroquias?.municipios?.id_estado.toString() !== selectedEstado) return false;
            if (selectedMunicipio !== '0' && dir?.parroquias?.id_municipio.toString() !== selectedMunicipio) return false;
            if (selectedParroquia !== '0' && dir?.id_parroquia.toString() !== selectedParroquia) return false;
            if (hasCoords !== null && (!!dir?.latitud !== hasCoords)) return false;

            if (selectedInstituciones.length > 0) {
                const establishmentRifs = e.afiliaciones.map((a: any) => a.instituciones?.rif).filter(Boolean);
                if (!selectedInstituciones.some(rif => establishmentRifs.includes(rif))) return false;
            }

            if (selectedSeccion !== '0' && caev?.divisiones_caev?.id_seccion.toString() !== selectedSeccion) return false;
            if (selectedDivision !== '0' && caev?.id_division.toString() !== selectedDivision) return false;
            if (selectedClase !== '0' && caev?.id_clase.toString() !== selectedClase) return false;
            
            // Filtros por datos faltantes
            if (filterMissingLocation && dir?.parroquias?.id_parroquia) return false;
            if (filterMissingAffiliation && e.afiliaciones.length > 0) return false;
            if (filterMissingCaev && caev?.id_clase) return false;
            if (filterMissingContact && (e.email_principal || e.telefono_principal_1)) return false;
            if (filterMissingPersonnel && (e.personal_obrero !== null || e.personal_empleado !== null || e.personal_directivo !== null)) return false;
            if (filterMissingProduction && (e.establecimiento_productos.length > 0 || e.establecimiento_procesos.length > 0)) return false;

            return true;
        });
    }, [
        allData, selectedEstado, selectedMunicipio, selectedParroquia, hasCoords, selectedInstituciones, 
        selectedSeccion, selectedDivision, selectedClase,
        filterMissingLocation, filterMissingAffiliation, filterMissingCaev, filterMissingContact, 
        filterMissingPersonnel, filterMissingProduction
    ]);

    const handleGenerateExcel = (selectedColumns: { [key: string]: boolean }) => {
        setIsModalOpen(false);
        if (filteredData.length === 0) {
            alert("No hay datos para exportar con los filtros seleccionados.");
            return;
        }

        const dataToExport = filteredData.map(e => {
            const flat: ReportableData = {};
            // Flatten the data
            const totalPersonal = (e.personal_obrero || 0) + (e.personal_empleado || 0) + (e.personal_directivo || 0);

            const allFields = {
                rif: e.companias?.rif,
                razon_social: e.companias?.razon_social,
                ano_fundacion: e.companias?.ano_fundacion,
                direccion_fiscal: e.companias?.direccion_fiscal,
                nombre_establecimiento: e.nombre_establecimiento,
                fecha_apertura: e.fecha_apertura,
                email_principal: e.email_principal,
                telefono_principal_1: e.telefono_principal_1,
                telefono_principal_2: e.telefono_principal_2,
                estado: e.direcciones?.parroquias?.municipios?.estados?.nombre_estado,
                municipio: e.direcciones?.parroquias?.municipios?.nombre_municipio,
                parroquia: e.direcciones?.parroquias?.nombre_parroquia,
                direccion_detallada: e.direcciones?.direccion_detallada,
                latitud: e.direcciones?.latitud,
                longitud: e.direcciones?.longitud,
                personal_obrero: e.personal_obrero,
                personal_empleado: e.personal_empleado,
                personal_directivo: e.personal_directivo,
                personal_total: totalPersonal,
                seccion_caev: e.clases_caev?.divisiones_caev?.secciones_caev?.nombre_seccion,
                division_caev: e.clases_caev?.divisiones_caev?.nombre_division,
                clase_caev: e.clases_caev?.nombre_clase,
                productos: e.establecimiento_productos.map((p: any) => p.productos.nombre_producto).join(', '),
                procesos_productivos: e.establecimiento_procesos.map((p: any) => p.procesos_productivos.nombre_proceso).join(', '),
                gremios: e.afiliaciones.map((a: any) => a.instituciones.nombre).join(', '),
            };

            for (const key in allFields) {
                if (selectedColumns[key]) {
                    const header = (ALL_COLUMNS.find(c => c.id === key) || {label: key}).label;
                    flat[header] = allFields[key as keyof typeof allFields] ?? '';
                }
            }
            return flat;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte_CIEC");
        XLSX.writeFile(workbook, `Reporte_CIEC_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const handleInstitutionToggle = (rif: string) => {
        setSelectedInstituciones(prev => 
            prev.includes(rif) 
                ? prev.filter(id => id !== rif) 
                : [...prev, rif]
        );
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="flex h-full gap-6">
            <ColumnSelectionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onGenerate={handleGenerateExcel}
            />

            {/* Filters Panel */}
            <div className="w-1/3 max-w-sm bg-ciec-card p-4 rounded-lg flex flex-col">
                <h2 className="text-xl font-semibold mb-4">Filtros de Reporte</h2>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {/* Filtro Geográfico */}
                    <details className="space-y-2" open>
                        <summary className="cursor-pointer font-semibold text-ciec-text-primary">Filtro Geográfico</summary>
                        <div className="pl-4 space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Estado</label>
                                <select value={selectedEstado} onChange={e => { setSelectedEstado(e.target.value); setSelectedMunicipio('0'); setSelectedParroquia('0'); }} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2">
                                    <option value="0">Todos</option>
                                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Municipio</label>
                                <select value={selectedMunicipio} onChange={e => { setSelectedMunicipio(e.target.value); setSelectedParroquia('0'); }} disabled={selectedEstado === '0'} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 disabled:opacity-50">
                                    <option value="0">Todos</option>
                                    {filteredMunicipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre_municipio}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Parroquia</label>
                                <select value={selectedParroquia} onChange={e => setSelectedParroquia(e.target.value)} disabled={selectedMunicipio === '0'} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 disabled:opacity-50">
                                    <option value="0">Todas</option>
                                    {filteredParroquias.map(p => <option key={p.id_parroquia} value={p.id_parroquia}>{p.nombre_parroquia}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Ubicación</label>
                                <select onChange={e => setHasCoords(e.target.value === 'null' ? null : e.target.value === 'true')} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2">
                                    <option value="null">Ambos</option>
                                    <option value="true">Con Coordenadas</option>
                                    <option value="false">Sin Coordenadas</option>
                                </select>
                            </div>
                        </div>
                    </details>
                    
                    {/* Filtro de Gremio */}
                    <details className="space-y-2">
                        <summary className="cursor-pointer font-semibold text-ciec-text-primary">Filtro por Gremio</summary>
                         <div className="pl-4 max-h-40 overflow-y-auto p-2 bg-ciec-bg rounded-lg border border-ciec-border">
                            {instituciones.map(inst => (
                                <div key={inst.rif} className="flex items-center">
                                    <input type="checkbox" id={`inst-${inst.rif}`} checked={selectedInstituciones.includes(inst.rif)} onChange={() => handleInstitutionToggle(inst.rif)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                    <label htmlFor={`inst-${inst.rif}`} className="ml-2 text-sm">{inst.nombre}</label>
                                </div>
                            ))}
                        </div>
                    </details>
                    
                    {/* Filtro CAEV */}
                     <details className="space-y-2">
                        <summary className="cursor-pointer font-semibold text-ciec-text-primary">Filtro por Actividad Económica</summary>
                         <div className="pl-4 space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Sección CAEV</label>
                                <select value={selectedSeccion} onChange={e => { setSelectedSeccion(e.target.value); setSelectedDivision('0'); setSelectedClase('0'); }} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2">
                                    <option value="0">Todas</option>
                                    {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{`${s.nombre_seccion}${s.descripcion_seccion ? ` - ${s.descripcion_seccion}` : ''}`}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">División CAEV</label>
                                <select value={selectedDivision} onChange={e => { setSelectedDivision(e.target.value); setSelectedClase('0');}} disabled={selectedSeccion === '0'} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 disabled:opacity-50">
                                    <option value="0">Todas</option>
                                    {filteredDivisiones.map(d => <option key={d.id_division} value={d.id_division}>{`${d.nombre_division}${d.descripcion_division ? ` - ${d.descripcion_division}` : ''}`}</option>)}
                                </select>
                            </div>
                              <div>
                                <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Clase CAEV</label>
                                <select value={selectedClase} onChange={e => setSelectedClase(e.target.value)} disabled={selectedDivision === '0'} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 disabled:opacity-50">
                                    <option value="0">Todas</option>
                                    {filteredClases.map(c => <option key={c.id_clase} value={c.id_clase}>{`${c.nombre_clase}${c.descripcion_clase ? ` - ${c.descripcion_clase}` : ''}`}</option>)}
                                </select>
                            </div>
                        </div>
                    </details>

                    {/* Filtros por Datos Faltantes */}
                    <details className="space-y-2">
                        <summary className="cursor-pointer font-semibold text-ciec-text-primary">Filtros por Datos Faltantes</summary>
                         <div className="pl-4 space-y-2 text-sm">
                            <div className="flex items-center">
                                <input type="checkbox" id="filterMissingLocation" checked={filterMissingLocation} onChange={e => setFilterMissingLocation(e.target.checked)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                <label htmlFor="filterMissingLocation" className="ml-2">Sin Ubicación (Estado/Mcpo/Pquia)</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="filterMissingAffiliation" checked={filterMissingAffiliation} onChange={e => setFilterMissingAffiliation(e.target.checked)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                <label htmlFor="filterMissingAffiliation" className="ml-2">Sin Afiliación a Gremio</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="filterMissingCaev" checked={filterMissingCaev} onChange={e => setFilterMissingCaev(e.target.checked)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                <label htmlFor="filterMissingCaev" className="ml-2">Sin Actividad Económica (CAEV)</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="filterMissingContact" checked={filterMissingContact} onChange={e => setFilterMissingContact(e.target.checked)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                <label htmlFor="filterMissingContact" className="ml-2">Sin Contacto (Email/Tlf)</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="filterMissingPersonnel" checked={filterMissingPersonnel} onChange={e => setFilterMissingPersonnel(e.target.checked)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                <label htmlFor="filterMissingPersonnel" className="ml-2">Sin Datos de Personal</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="filterMissingProduction" checked={filterMissingProduction} onChange={e => setFilterMissingProduction(e.target.checked)} className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"/>
                                <label htmlFor="filterMissingProduction" className="ml-2">Sin Productos o Procesos</label>
                            </div>
                        </div>
                    </details>
                </div>
            </div>

            {/* Results Panel */}
            <div className="flex-1 bg-ciec-card p-4 rounded-lg flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Resultado <span className="text-base font-normal text-ciec-text-secondary">{filteredData.length}</span></h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <Download className="w-5 h-5 mr-2" /> Exportar a Excel
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                     <table className="w-full text-sm text-left text-ciec-text-secondary">
                        <thead className="text-xs text-ciec-text-primary uppercase bg-ciec-bg sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre Establecimiento</th>
                                <th scope="col" className="px-6 py-3">Razón Social</th>
                                <th scope="col" className="px-6 py-3">RIF</th>
                                <th scope="col" className="px-6 py-3">Municipio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.slice(0, 100).map(e => ( // Preview first 100 rows
                                <tr key={e.id_establecimiento} className="border-b border-ciec-border hover:bg-ciec-bg">
                                    <td className="px-6 py-4 font-medium text-ciec-text-primary whitespace-nowrap">{e.nombre_establecimiento || 'N/A'}</td>
                                    <td className="px-6 py-4">{e.companias?.razon_social}</td>
                                    <td className="px-6 py-4">{e.companias?.rif}</td>
                                    <td className="px-6 py-4">{e.direcciones?.parroquias?.municipios?.nombre_municipio || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredData.length > 100 && (
                        <div className="text-center py-4 text-ciec-text-secondary">Mostrando 100 de {filteredData.length} resultados. Utilice los filtros para refinar la búsqueda o exporte para ver todos los datos.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reportes;