
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Integrante, Establecimiento, IntegranteInsert, IntegranteUpdate } from '../types';
import Spinner from '../components/ui/Spinner';
import { Save, X, Edit, User, Briefcase, Mail, Phone, Building } from 'lucide-react';
import PhoneInput from '../components/ui/PhoneInput';

// --- Helper Components (Moved outside the main component) ---
const DetailField = React.memo(({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) => (
    <div>
        <label className="text-xs text-ciec-text-secondary flex items-center">{icon}<span className="ml-1">{label}</span></label>
        <p className="text-ciec-text-primary mt-1">{value || 'No disponible'}</p>
    </div>
));

const FormInput = React.memo(({ label, tabIndex, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, tabIndex?: number }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <input {...props} tabIndex={tabIndex} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none" />
    </div>
));

const FormSelect = React.memo(({ label, children, tabIndex, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode, tabIndex?: number }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <select {...props} tabIndex={tabIndex} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 appearance-none text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none">
            {children}
        </select>
    </div>
));
// --- End Helper Components ---

type IntegranteFormData = Partial<Integrante & { establecimiento_nombre: string }>;

const IntegranteForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isCreating = !id;
    const navigate = useNavigate();

    const [isViewMode, setIsViewMode] = useState(!isCreating);
    const [formData, setFormData] = useState<IntegranteFormData>({});
    const [establecimientos, setEstablecimientos] = useState<{id_establecimiento: string, nombre_establecimiento: string}[]>([]);
    
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
                setEstablecimientos(data as any || []);
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
                const typedData = data as any;
                setFormData({
                    ...typedData,
                    establecimiento_nombre: typedData.establecimientos?.nombre_establecimiento
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre_persona || !formData.id_establecimiento) {
            alert('Nombre y Establecimiento son obligatorios.');
            return;
        }
        setSubmitting(true);
        setError(null);

        if (isCreating) {
            const dataToSave: IntegranteInsert = {
                nombre_persona: formData.nombre_persona,
                cargo: formData.cargo || null,
                email: formData.email || null,
                telefono: formData.telefono || null,
                id_establecimiento: formData.id_establecimiento,
            };
            const { error: submitError } = await supabase.from('integrantes').insert(dataToSave as any);
            if (submitError) {
                setError(`Error al guardar: ${submitError.message}`);
            } else {
                alert(`Integrante creado exitosamente.`);
                navigate('/integrantes');
            }
        } else {
            const dataToSave: IntegranteUpdate = {
                nombre_persona: formData.nombre_persona,
                cargo: formData.cargo || null,
                email: formData.email || null,
                telefono: formData.telefono || null,
                id_establecimiento: formData.id_establecimiento,
            };
            const { error: submitError } = await supabase.from('integrantes').update(dataToSave as any).eq('id_integrante', id!);
             if (submitError) {
                setError(`Error al guardar: ${submitError.message}`);
            } else {
                alert(`Integrante actualizado exitosamente.`);
                navigate('/integrantes');
            }
        }
        
        setSubmitting(false);
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
    
    let tabIdx = 1;

    return (
        <div className="max-w-3xl mx-auto bg-ciec-card p-6 sm:p-8 rounded-lg">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">{formData.nombre_persona || 'Nuevo Integrante'}</h1>
                 <div className="flex items-center gap-4">
                    {!isCreating && isViewMode && (
                        <button onClick={() => setIsViewMode(false)} className="flex items-center justify-center bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
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
                        <FormInput label="Nombre Completo*" name="nombre_persona" value={formData.nombre_persona || ''} onChange={handleChange} required tabIndex={tabIdx++} />
                        <FormInput label="Cargo" name="cargo" value={formData.cargo || ''} onChange={handleChange} tabIndex={tabIdx++} />
                        <FormInput label="E-mail" name="email" value={formData.email || ''} type="email" onChange={handleChange} tabIndex={tabIdx++} />
                        <PhoneInput label="Teléfono" value={formData.telefono} onChange={(newValue) => setFormData(prev => ({ ...prev, telefono: newValue }))} selectTabIndex={tabIdx++} numberTabIndex={tabIdx++}/>
                        <div className="md:col-span-2">
                            <FormSelect label="Establecimiento*" name="id_establecimiento" value={formData.id_establecimiento || ''} onChange={handleChange} required tabIndex={tabIdx++}>
                                <option value="">Seleccione un establecimiento</option>
                                {establecimientos.map(est => (
                                    <option key={est.id_establecimiento} value={est.id_establecimiento}>{est.nombre_establecimiento}</option>
                                ))}
                            </FormSelect>
                        </div>
                    </>}
                </div>

                {!isViewMode && (
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-3 sm:gap-0 pt-6">
                        <button type="button" onClick={() => isCreating ? navigate('/integrantes') : setIsViewMode(true)} className="border border-ciec-border bg-transparent text-ciec-text-secondary hover:bg-ciec-border hover:text-ciec-text-primary font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-border">
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting} className="bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                            {submitting ? <Spinner size="sm" color="border-white" /> : <><Save className="w-5 h-5 mr-2" />{isCreating ? 'Crear Integrante' : 'Guardar Cambios'}</>}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default IntegranteForm;
