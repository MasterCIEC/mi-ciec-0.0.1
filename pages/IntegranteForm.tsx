import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Integrante, Establecimiento } from '../types';
import Spinner from '../components/ui/Spinner';
import { Save, X, Edit, User, Briefcase, Mail, Phone, Building } from 'lucide-react';

// --- Helper Components ---
const DetailField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) => (
    <div>
        <label className="text-xs text-ciec-text-secondary flex items-center">{icon}<span className="ml-1">{label}</span></label>
        <p className="text-ciec-text-primary mt-1">{value || 'No disponible'}</p>
    </div>
);

const FormInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <input {...props} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none" />
    </div>
);

const FormSelect = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <select {...props} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 appearance-none text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none">
            {children}
        </select>
    </div>
);
// --- End Helper Components ---

type IntegranteFormData = Partial<Integrante & { establecimiento_nombre: string }>;

const IntegranteForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isCreating = !id;
    const navigate = useNavigate();

    const [isViewMode, setIsViewMode] = useState(!isCreating);
    const [formData, setFormData] = useState<IntegranteFormData>({});
    const [establecimientos, setEstablecimientos] = useState<{id_establecimiento: number, nombre_establecimiento: string}[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRelatedData = async () => {
            const { data, error } = await supabase
                .from('establecimientos')
                .select('id_establecimiento, nombre_establecimiento')
                .order('nombre_establecimiento');
            if (error) {
                setError("Error al cargar los establecimientos");
                console.error(error);
            } else {
                setEstablecimientos(data || []);
            }
        };

        const fetchIntegranteData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('integrantes')
                .select('*, establecimientos(nombre_establecimiento)')
                .eq('id_integrante', id)
                .single();

            if (fetchError) {
                setError('No se pudo cargar la información del integrante.');
            } else if (data) {
                setFormData({
                    ...data,
                    establecimiento_nombre: data.establecimientos?.nombre_establecimiento
                });
            }
            setLoading(false);
        };

        fetchRelatedData().then(() => {
            if (!isCreating) {
                fetchIntegranteData();
            } else {
                setLoading(false);
            }
        });
    }, [id, isCreating]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const processedValue = name === 'id_establecimiento' ? (value ? parseInt(value, 10) : null) : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre_persona || !formData.id_establecimiento) {
            alert('Nombre y Establecimiento son obligatorios.');
            return;
        }
        setSubmitting(true);
        setError(null);

        const dataToSave = {
            nombre_persona: formData.nombre_persona,
            cargo: formData.cargo,
            email: formData.email,
            telefono: formData.telefono,
            id_establecimiento: formData.id_establecimiento,
        };

        const { error: submitError } = isCreating
            ? await supabase.from('integrantes').insert(dataToSave)
            : await supabase.from('integrantes').update(dataToSave).eq('id_integrante', id!);
        
        if (submitError) {
            setError(`Error al guardar: ${submitError.message}`);
        } else {
            alert(`Integrante ${isCreating ? 'creado' : 'actualizado'} exitosamente.`);
            navigate('/integrantes');
        }
        setSubmitting(false);
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-3xl mx-auto bg-ciec-card p-8 rounded-lg">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">{formData.nombre_persona || 'Nuevo Integrante'}</h1>
                 <div className="flex items-center gap-4">
                    {!isCreating && isViewMode && (
                        <button onClick={() => setIsViewMode(false)} className="flex items-center bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <Edit className="w-5 h-5 mr-2" /> Habilitar Edición
                        </button>
                    )}
                    <button onClick={() => navigate(-1)} className="text-ciec-text-secondary hover:text-white p-2 rounded-full hover:bg-ciec-border">
                        <X />
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isViewMode ? <>
                        <DetailField icon={<User size={14}/>} label="Nombre Completo" value={formData.nombre_persona} />
                        <DetailField icon={<Briefcase size={14}/>} label="Cargo" value={formData.cargo} />
                        <DetailField icon={<Mail size={14}/>} label="E-mail" value={formData.email} />
                        <DetailField icon={<Phone size={14}/>} label="Teléfono" value={formData.telefono} />
                        <div className="md:col-span-2">
                            <DetailField icon={<Building size={14}/>} label="Establecimiento" value={formData.establecimiento_nombre} />
                        </div>
                    </> : <>
                        <FormInput label="Nombre Completo*" name="nombre_persona" value={formData.nombre_persona || ''} onChange={handleChange} required />
                        <FormInput label="Cargo" name="cargo" value={formData.cargo || ''} onChange={handleChange} />
                        <FormInput label="E-mail" name="email" value={formData.email || ''} type="email" onChange={handleChange} />
                        <FormInput label="Teléfono" name="telefono" value={formData.telefono || ''} type="tel" onChange={handleChange} />
                        <div className="md:col-span-2">
                            <FormSelect label="Establecimiento*" name="id_establecimiento" value={formData.id_establecimiento || ''} onChange={handleChange} required>
                                <option value="">Seleccione un establecimiento</option>
                                {establecimientos.map(est => (
                                    <option key={est.id_establecimiento} value={est.id_establecimiento}>{est.nombre_establecimiento}</option>
                                ))}
                            </FormSelect>
                        </div>
                    </>}
                </div>

                {!isViewMode && (
                    <div className="flex justify-end space-x-4 pt-6">
                        <button type="button" onClick={() => isCreating ? navigate('/integrantes') : setIsViewMode(true)} className="bg-ciec-border text-ciec-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting} className="bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 transition-colors">
                            <div className="flex items-center">
                                {submitting ? <Spinner size="sm" color="border-white" /> : <Save className="w-5 h-5 mr-2" />}
                                {isCreating ? 'Crear Integrante' : 'Guardar Cambios'}
                            </div>
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default IntegranteForm;