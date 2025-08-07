

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

interface ColumnSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (selectedColumns: { [key: string]: boolean }) => void;
    columns: { id: string; label: string; group: string; }[];
}

export const ALL_COLUMNS = [
    { id: 'rif', label: 'RIF Compañía', group: 'Identificación' },
    { id: 'razon_social', label: 'Razón Social', group: 'Identificación' },
    { id: 'ano_fundacion', label: 'Año Fundación', group: 'Identificación' },
    { id: 'direccion_fiscal', label: 'Dirección Fiscal', group: 'Identificación' },
    { id: 'nombre_establecimiento', label: 'Nombre Establecimiento', group: 'Identificación' },
    { id: 'fecha_apertura', label: 'Fecha Apertura', group: 'Identificación' },
    { id: 'email_principal', label: 'Email Principal', group: 'Contacto' },
    { id: 'telefono_principal_1', label: 'Teléfono 1', group: 'Contacto' },
    { id: 'telefono_principal_2', label: 'Teléfono 2', group: 'Contacto' },
    { id: 'estado', label: 'Estado', group: 'Ubicación' },
    { id: 'municipio', label: 'Municipio', group: 'Ubicación' },
    { id: 'parroquia', label: 'Parroquia', group: 'Ubicación' },
    { id: 'direccion_detallada', label: 'Dirección Detallada', group: 'Ubicación' },
    { id: 'latitud', label: 'Latitud', group: 'Ubicación' },
    { id: 'longitud', label: 'Longitud', group: 'Ubicación' },
    { id: 'personal_obrero', label: 'Nº Obreros', group: 'Capital Humano' },
    { id: 'personal_empleado', label: 'Nº Empleados', group: 'Capital Humano' },
    { id: 'personal_directivo', label: 'Nº Directivos', group: 'Capital Humano' },
    { id: 'personal_total', label: 'Total Empleados', group: 'Capital Humano' },
    { id: 'seccion_caev', label: 'Sección CAEV', group: 'Clasificación' },
    { id: 'division_caev', label: 'División CAEV', group: 'Clasificación' },
    { id: 'clase_caev', label: 'Clase CAEV', group: 'Clasificación' },
    { id: 'productos', label: 'Productos', group: 'Producción' },
    { id: 'procesos_productivos', label: 'Procesos Productivos', group: 'Producción' },
    { id: 'gremios', label: 'Gremios', group: 'Afiliaciones' },
];

const ColumnSelectionModal: React.FC<Partial<ColumnSelectionModalProps>> = ({
    isOpen = false,
    onClose = () => {},
    onGenerate = () => {},
    columns = ALL_COLUMNS,
}) => {
    const [selected, setSelected] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        // Initialize with all columns selected by default when modal opens
        if (isOpen) {
            const allSelected = columns.reduce((acc, col) => {
                acc[col.id] = true;
                return acc;
            }, {} as { [key: string]: boolean });
            setSelected(allSelected);
        }
    }, [isOpen, columns]);

    const handleToggle = (id: string) => {
        setSelected(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectAll = () => {
        const allSelected = columns.reduce((acc, col) => {
            acc[col.id] = true;
            return acc;
        }, {} as { [key: string]: boolean });
        setSelected(allSelected);
    };

    const handleDeselectAll = () => {
        setSelected({});
    };

    const groupedColumns = columns.reduce((acc, col) => {
        (acc[col.group] = acc[col.group] || []).push(col);
        return acc;
    }, {} as { [key: string]: typeof columns });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Columnas para el Reporte">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {Object.entries(groupedColumns).map(([group, cols]) => (
                    <div key={group}>
                        <h3 className="font-semibold text-ciec-blue mb-2">{group}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cols.map(col => (
                                <div key={col.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`col-${col.id}`}
                                        checked={!!selected[col.id]}
                                        onChange={() => handleToggle(col.id)}
                                        className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"
                                    />
                                    <label htmlFor={`col-${col.id}`} className="ml-2 text-sm text-ciec-text-primary">{col.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
                <div className="space-x-2">
                     <button onClick={handleSelectAll} className="text-sm text-ciec-blue hover:underline">Seleccionar Todo</button>
                     <button onClick={handleDeselectAll} className="text-sm text-ciec-blue hover:underline">Deseleccionar Todo</button>
                </div>
                <div className="space-x-4">
                    <button onClick={onClose} className="border border-ciec-border bg-transparent text-ciec-text-secondary hover:bg-ciec-border hover:text-ciec-text-primary font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-border">
                        Cancelar
                    </button>
                    <button onClick={() => onGenerate(selected)} className="bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                        Generar Reporte
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ColumnSelectionModal;