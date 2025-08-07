import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, OverlayViewF, InfoWindow } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';
import Spinner from '../components/ui/Spinner';
import { darkMapStyle } from '../styles/mapStyles';
import { Briefcase, MapPin, Mail, Phone } from 'lucide-react';
import { caevColorMap, caevSvgData } from '../data/mapData';
import EmpresaDetailModal from '../components/empresa/EmpresaDetailModal';

// ... (El resto de tus constantes y tipos no cambian)
const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
};

const center = {
    lat: 10.24,
    lng: -67.9,
};

const mapOptions = {
    styles: darkMapStyle,
    mapTypeControl: true,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
};

type MapPinData = {
    id: number | string;
    nombre: string;
    lat: number;
    lng: number;
    razon_social?: string;
    type: 'establecimiento' | 'institucion';
    actividad_economica?: string;
    caev_seccion?: string | null;
    ubicacion?: string;
    email?: string;
    telefono?: string;
};

const colorizeSvg = (svgString: string, color: string): string => {
    return svgString.replace(/fill="#000000"/g, `fill="${color}"`);
};

const CustomMarker: React.FC<{ pin: MapPinData, onClick: () => void }> = ({ pin, onClick }) => {
    const caevLetter = pin.caev_seccion as keyof typeof caevSvgData;
    const color = caevLetter ? caevColorMap[caevLetter] : '#7f8c8d'; // Gris por defecto
    
    // Icon will be white
    const iconSvgString = caevLetter && caevSvgData[caevLetter] ? caevSvgData[caevLetter] : null;
    const finalIconSvg = iconSvgString ? colorizeSvg(iconSvgString, 'white') : null;
    
    // Pin will have the CAEV color
    const basePinSvg = `<svg viewBox="0 0 32 32" style="width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C9.37 0 4 5.37 4 12c0 8.01 10.26 18.2 11.25 19.51a1 1 0 001.5 0C17.74 30.2 28 20.01 28 12 28 5.37 22.63 0 16 0z" fill="${color}" stroke="black" stroke-width="0.5"/></svg>`;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                transform: 'translate(-50%, -100%)', // Ancla la punta del pin
                cursor: 'pointer',
            }}
            onClick={handleClick}
        >
            <div dangerouslySetInnerHTML={{ __html: basePinSvg }} />
            {finalIconSvg && (
                <div
                    style={{
                        position: 'absolute',
                        top: '4px',
                        left: '9px',
                        width: '22px',
                        height: '22px',
                    }}
                    dangerouslySetInnerHTML={{ __html: finalIconSvg }}
                />
            )}
        </div>
    );
};


const Mapa: React.FC = () => {
    const [pins, setPins] = useState<MapPinData[]>([]);
    const [selectedPin, setSelectedPin] = useState<MapPinData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [modalEstablecimientoId, setModalEstablecimientoId] = useState<string | null>(null);

    const fetchMapData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [{ data: estData, error: estError }, { data: instData, error: instError }] = await Promise.all([
                supabase
                    .from('establecimientos')
                    .select(`
                        id_establecimiento, 
                        nombre_establecimiento,
                        email_principal,
                        telefono_principal_1,
                        companias ( razon_social ), 
                        direcciones ( latitud, longitud, direccion_detallada, parroquias ( nombre_parroquia, municipios ( nombre_municipio, estados ( nombre_estado ) ) ) ),
                        clases_caev ( nombre_clase, divisiones_caev ( secciones_caev ( nombre_seccion ) ) )
                    `),
                supabase
                    .from('instituciones')
                    .select(`
                        rif,
                        nombre,
                        direcciones ( latitud, longitud, direccion_detallada, parroquias ( nombre_parroquia, municipios ( nombre_municipio, estados ( nombre_estado ) ) ) )
                    `)
            ]);

            if (estError) throw estError;
            if (instError) throw instError;

            const establishmentPins: MapPinData[] = (estData || [])
                .filter((est: any) => est.direcciones?.latitud && est.direcciones?.longitud)
                .map((est: any) => {
                    const dir = est.direcciones;
                    const ubicacion = dir ? `${dir.parroquias?.nombre_parroquia}, ${dir.parroquias?.municipios?.nombre_municipio}, ${dir.parroquias?.municipios?.estados?.nombre_estado}` : 'No disponible';
                    return {
                        id: est.id_establecimiento,
                        nombre: est.nombre_establecimiento || 'Establecimiento sin nombre',
                        lat: est.direcciones.latitud,
                        lng: est.direcciones.longitud,
                        razon_social: est.companias?.razon_social,
                        type: 'establecimiento',
                        actividad_economica: est.clases_caev?.nombre_clase || 'No especificada',
                        caev_seccion: est.clases_caev?.divisiones_caev?.secciones_caev?.nombre_seccion || null,
                        ubicacion: ubicacion,
                        email: est.email_principal,
                        telefono: est.telefono_principal_1,
                    }
                });

            const institutionPins: MapPinData[] = (instData || [])
                .filter((inst: any) => inst.direcciones?.latitud && inst.direcciones?.longitud)
                .map((inst: any) => {
                     const dir = inst.direcciones;
                     const ubicacion = dir ? `${dir.parroquias?.nombre_parroquia}, ${dir.parroquias?.municipios?.nombre_municipio}, ${dir.parroquias?.municipios?.estados?.nombre_estado}` : 'No disponible';
                    return {
                        id: inst.rif,
                        nombre: inst.nombre,
                        lat: inst.direcciones.latitud,
                        lng: inst.direcciones.longitud,
                        type: 'institucion',
                        ubicacion: ubicacion,
                    }
                });

            setPins([...establishmentPins, ...institutionPins]);

        } catch (err: any) {
            console.error("Error fetching map data:", err);
            setError("No se pudieron cargar los datos del mapa. Por favor, intente de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    const handleMarkerClick = (pin: MapPinData) => {
        setSelectedPin(pin);
    };

    const handleInfoWindowClose = () => {
        setSelectedPin(null);
    };

    const handleViewDetails = (pin: MapPinData | null) => {
        if (pin && pin.type === 'establecimiento' && pin.id) {
            setModalEstablecimientoId(String(pin.id));
            setSelectedPin(null);
        }
    };

    const handleCloseModal = (refreshed?: boolean) => {
        setModalEstablecimientoId(null);
        if (refreshed) {
            fetchMapData();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-400 bg-red-900/50 p-4 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <>
            <div className="h-full w-full bg-ciec-card p-1 rounded-lg">
                 <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={10}
                    options={mapOptions}
                    onClick={handleInfoWindowClose}
                >
                    {pins.map((pin) => (
                         <OverlayViewF
                            key={`${pin.type}-${pin.id}`}
                            position={{ lat: pin.lat, lng: pin.lng }}
                            mapPaneName={'overlayMouseTarget'}
                        >
                            <CustomMarker pin={pin} onClick={() => handleMarkerClick(pin)} />
                        </OverlayViewF>
                    ))}

                    {selectedPin && (
                        <InfoWindow
                            position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
                            onCloseClick={handleInfoWindowClose}
                            options={{
                                pixelOffset: new (window as any).google.maps.Size(0, -45)
                            }}
                        >
                            <div className="p-3 bg-ciec-card text-ciec-text-primary rounded-lg shadow-xl max-w-xs border border-white/20 space-y-2">
                               <div>
                                    <h3 className="font-bold text-md">{selectedPin.nombre}</h3>
                                    {selectedPin.razon_social && (
                                        <p className="text-sm text-ciec-text-secondary">{selectedPin.razon_social}</p>
                                    )}
                               </div>
                               
                               <div className="border-t border-ciec-border pt-2 space-y-1 text-sm">
                                    {selectedPin.actividad_economica && (
                                        <p className="flex items-center"><Briefcase size={14} className="mr-2 text-ciec-blue flex-shrink-0" /> {selectedPin.actividad_economica}</p>
                                    )}
                                    {selectedPin.ubicacion && (
                                        <p className="flex items-center"><MapPin size={14} className="mr-2 text-ciec-blue flex-shrink-0" /> {selectedPin.ubicacion}</p>
                                    )}
                                    {selectedPin.email && (
                                        <p className="flex items-center"><Mail size={14} className="mr-2 text-ciec-blue flex-shrink-0" /> {selectedPin.email}</p>
                                    )}
                                    {selectedPin.telefono && (
                                        <p className="flex items-center"><Phone size={14} className="mr-2 text-ciec-blue flex-shrink-0" /> {selectedPin.telefono}</p>
                                    )}
                               </div>
                               
                               {selectedPin.type === 'establecimiento' && (
                                    <button
                                        onClick={() => handleViewDetails(selectedPin)}
                                        className="w-full mt-2 justify-center bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-1.5 px-3 rounded-lg text-sm transition-colors flex items-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue"
                                    >
                                        Ver más detalles
                                    </button>
                               )}
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </div>
            
            {modalEstablecimientoId !== null && (
                <EmpresaDetailModal
                    key={modalEstablecimientoId}
                    establecimientoId={modalEstablecimientoId}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default Mapa;