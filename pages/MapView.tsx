
import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { getCompaniesWithLocation } from '../services/supabase';
import { Company } from '../types';
import Spinner from '../components/Spinner';

const MapView: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Default center for Carabobo, Venezuela
    const defaultCenter = { lat: 10.24, lng: -68.0 };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getCompaniesWithLocation();
                setCompanies(data);
            } catch (err: any) {
                setError("Failed to load company locations: " + err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Spinner size="lg" />;
    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
    
    return (
        <div className="h-full w-full flex flex-col space-y-4">
            <h1 className="text-3xl font-bold text-ciec-text">Mapa de Empresas</h1>
            <div className="flex-grow rounded-xl shadow-lg overflow-hidden">
                <Map
                    style={{ width: '100%', height: '100%' }}
                    defaultCenter={defaultCenter}
                    defaultZoom={9}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    mapId={'industrial_map_style'} // Optional: for custom map styling
                >
                    {companies.map((company) =>
                        (company.latitude && company.longitude) ? (
                            <AdvancedMarker
                                key={company.code}
                                position={{ lat: company.latitude, lng: company.longitude }}
                                onClick={() => setSelectedCompany(company)}
                            />
                        ) : null
                    )}

                    {selectedCompany && (
                        <InfoWindow
                            position={{ lat: selectedCompany.latitude!, lng: selectedCompany.longitude! }}
                            onCloseClick={() => setSelectedCompany(null)}
                        >
                            <div className="p-2">
                                <h3 className="font-bold text-lg text-ciec-blue">{selectedCompany.razon_social}</h3>
                                <p className="text-sm text-ciec-text">{selectedCompany.nombre_establecimiento || ''}</p>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </div>
        </div>
    );
};

export default MapView;
