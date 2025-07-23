import React from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { Building, Tag, Users, Factory, Link as LinkIcon, Briefcase, Hash, Calendar, Mail, Phone, Globe, Image as ImageIcon, MapPin, CheckSquare, List } from 'lucide-react';
import { EstablecimientoFormData } from '../../types';
import { darkMapStyle } from '../../styles/mapStyles';

const Fieldset: React.FC<{ legend: string; children: React.ReactNode }> = ({ legend, children }) => (
    <fieldset className="border border-ciec-border p-4 rounded-lg">
        <legend className="text-lg font-semibold text-ciec-blue px-2">{legend}</legend>
        <div className="mt-4">{children}</div>
    </fieldset>
);

const DetailItem: React.FC<{ icon?: React.ReactNode; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ icon, label, value, children }) => (
    <div>
        <div className="flex items-center">
            {icon && <div className="flex-shrink-0 w-5 h-5 text-ciec-text-secondary mr-3">{icon}</div>}
            <p className="text-sm font-medium text-ciec-text-secondary">{label}</p>
        </div>
        <div className={`mt-1 ${icon ? 'ml-8' : ''}`}>
            {children ? (
                <div className="text-base text-ciec-text-primary">{children}</div>
            ) : (
                <p className="text-base text-ciec-text-primary">{value || <span className="italic opacity-70">No disponible</span>}</p>
            )}
        </div>
    </div>
);


interface EmpresaDetailViewProps {
    data: EstablecimientoFormData;
    logoPreview: string | null;
    dropdowns: {
        estados: any[];
        municipios: any[];
        parroquias: any[];
        instituciones: any[];
        secCaev: any[];
        divCaev: any[];
        classCaev: any[];
    };
}

const EmpresaDetailView: React.FC<EmpresaDetailViewProps> = ({ data, logoPreview, dropdowns }) => {
    
    const estado = dropdowns.estados.find(e => e.id_estado === data.id_estado)?.nombre_estado;
    const municipio = dropdowns.municipios.find(m => m.id_municipio === data.id_municipio)?.nombre_municipio;
    const parroquia = dropdowns.parroquias.find(p => p.id_parroquia === data.id_parroquia)?.nombre_parroquia;
    
    const seccionCaev = dropdowns.secCaev.find(s => s.id_seccion === data.id_seccion)?.nombre_seccion;
    const divisionCaev = dropdowns.divCaev.find(d => d.id_division === data.id_division)?.nombre_division;
    const claseCaev = dropdowns.classCaev.find(c => c.id_clase === data.id_clase_caev)?.nombre_clase;
    
    const totalPersonal = (data.personal_obrero || 0) + (data.personal_empleado || 0) + (data.personal_directivo || 0);

    return (
        <div className="space-y-6">
            <Fieldset legend="Datos de la Compañía">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <DetailItem icon={<Hash />} label="RIF" value={data.rif} />
                        <DetailItem icon={<Briefcase />} label="Razón Social" value={data.razon_social} />
                        <DetailItem icon={<Calendar />} label="Año de Fundación" value={data.ano_fundacion} />
                        <DetailItem icon={<MapPin />} label="Dirección Fiscal" value={data.direccion_fiscal} />
                    </div>
                    <div>
                        <DetailItem icon={<ImageIcon />} label="Logo" />
                        <div className="ml-8 mt-2 w-32 h-32 rounded-lg bg-ciec-bg border border-ciec-border flex items-center justify-center text-ciec-text-secondary">
                             {logoPreview ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain rounded-md p-1" /> : <Building size={48}/>}
                        </div>
                    </div>
                </div>
            </Fieldset>
            
            <Fieldset legend="Datos del Establecimiento">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={<Globe />} label="Nombre Establecimiento" value={data.nombre_establecimiento} />
                    <DetailItem icon={<Mail />} label="E-mail Principal" value={data.email_principal} />
                    <DetailItem icon={<Phone />} label="Teléfono Principal 1" value={data.telefono_principal_1} />
                    <DetailItem icon={<Phone />} label="Teléfono Principal 2" value={data.telefono_principal_2} />
                    <DetailItem icon={<Calendar />} label="Fecha de Apertura" value={data.fecha_apertura} />
                </div>
            </Fieldset>
            
            <Fieldset legend="Capital Humano">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <DetailItem icon={<Users />} label="Nº de Obreros" value={data.personal_obrero} />
                    <DetailItem icon={<Users />} label="Nº de Empleados" value={data.personal_empleado} />
                    <DetailItem icon={<Users />} label="Nº de Directivos" value={data.personal_directivo} />
                    <DetailItem icon={<Users />} label="Total" value={totalPersonal} />
                </div>
            </Fieldset>
            
            <Fieldset legend="Ubicación Geográfica">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                         <DetailItem label="Estado" value={estado} />
                         <DetailItem label="Municipio" value={municipio} />
                         <DetailItem label="Parroquia" value={parroquia} />
                         <DetailItem label="Dirección Detallada" value={data.direccion_detallada} />
                         <DetailItem label="Coordenadas" value={data.latitud && data.longitud ? `${data.latitud}, ${data.longitud}`: 'No disponible'} />
                    </div>
                    {data.latitud && data.longitud && (
                        <div className="h-64 rounded-lg overflow-hidden border border-ciec-border">
                            <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: data.latitud, lng: data.longitud }} zoom={15} options={{ styles: darkMapStyle, mapTypeControl: false, zoomControl: true, streetViewControl: false }}>
                                <MarkerF position={{ lat: data.latitud, lng: data.longitud }} />
                            </GoogleMap>
                        </div>
                    )}
                </div>
            </Fieldset>

            <Fieldset legend="Clasificación y Producción">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <DetailItem icon={<Tag />} label="Sección CAEV" value={seccionCaev} />
                    <DetailItem icon={<Tag />} label="División CAEV" value={divisionCaev} />
                    <DetailItem icon={<Tag />} label="Clase CAEV" value={claseCaev} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={<List />} label="Productos">
                        <ul className="list-disc list-inside space-y-1">
                            {data.selectedProducts && data.selectedProducts.length > 0 ? data.selectedProducts.map((p, i) => <li key={i}>{p.nombre_producto}</li>) : <li className="list-none italic opacity-70">No hay productos registrados.</li>}
                        </ul>
                    </DetailItem>
                    <DetailItem icon={<Factory />} label="Procesos Productivos">
                        <ul className="list-disc list-inside space-y-1">
                             {data.selectedProcesses && data.selectedProcesses.length > 0 ? data.selectedProcesses.map((p, i) => <li key={i}>{p.nombre_proceso} ({p.porcentaje_capacidad_uso || 0}%)</li>) : <li className="list-none italic opacity-70">No hay procesos registrados.</li>}
                        </ul>
                    </DetailItem>
                </div>
            </Fieldset>
            
            <Fieldset legend="Afiliaciones">
                <DetailItem icon={<LinkIcon />} label="Gremios / Instituciones">
                    <ul className="list-disc list-inside space-y-1">
                        {data.selectedInstitutions && data.selectedInstitutions.length > 0 ? (
                           dropdowns.instituciones
                                .filter(i => data.selectedInstitutions?.includes(i.rif))
                                .map(inst => <li key={inst.rif}>{inst.nombre}</li>)
                        ) : <li className="list-none italic opacity-70">No está afiliado a ninguna institución.</li>}
                    </ul>
                </DetailItem>
            </Fieldset>
        </div>
    );
};

export default EmpresaDetailView;
