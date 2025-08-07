import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, ProfileUpdate } from '../types';
import Spinner from '../components/ui/Spinner';
import { UserPlus } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('email');
        if (error) {
            setError('Error al cargar los perfiles de usuario.');
            console.error(error);
        } else {
            setProfiles((data as any) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteMessage(null);
        
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail);

        if (error) {
            setInviteMessage({ type: 'error', text: `Error al invitar: ${error.message}` });
        } else {
            setInviteMessage({ type: 'success', text: `Invitación enviada a ${inviteEmail}.` });
            setInviteEmail('');
            // Refetch profiles to show the newly created (but not yet accepted) user profile
            fetchProfiles();
        }
        setInviteLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: Profile['role']) => {
        const originalProfiles = [...profiles];
        // Optimistic UI update
        setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
        
        const payload: ProfileUpdate = { role: newRole };
        const { error } = await supabase.from('profiles').update(payload as any).eq('id', userId);

        if (error) {
            alert(`Error al actualizar el rol: ${error.message}`);
            // Revert on error
            setProfiles(originalProfiles);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    if (error) return <div className="text-red-500 bg-red-900/50 p-4 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="bg-ciec-card p-6 rounded-lg">
                <h2 className="text-xl font-bold flex items-center mb-4"><UserPlus className="mr-3 text-ciec-blue" />Invitar Nuevo Usuario</h2>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <input
                        type="email"
                        placeholder="email@dominio.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        className="flex-grow w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                    />
                    <button type="submit" disabled={inviteLoading} className="bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center w-full sm:w-auto disabled:opacity-50">
                        {inviteLoading ? <Spinner size="sm" color="border-white" /> : 'Enviar Invitación'}
                    </button>
                </form>
                {inviteMessage && (
                    <p className={`mt-3 text-sm p-2 rounded-md ${inviteMessage.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        {inviteMessage.text}
                    </p>
                )}
            </div>
            
            <div className="bg-ciec-card p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Gestión de Usuarios</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-ciec-text-secondary">
                        <thead className="text-xs text-ciec-text-primary uppercase bg-ciec-bg">
                            <tr>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Nombre Completo</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(profile => (
                                <tr key={profile.id} className="border-b border-ciec-border hover:bg-ciec-bg">
                                    <td className="px-6 py-4 font-medium text-ciec-text-primary whitespace-nowrap">{profile.email}</td>
                                    <td className="px-6 py-4">{profile.full_name || <span className="italic">Pendiente</span>}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={profile.role}
                                            onChange={e => handleRoleChange(profile.id, e.target.value as Profile['role'])}
                                            className="bg-ciec-bg border border-ciec-border rounded-lg px-3 py-1.5 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                                        >
                                            <option value="usuario">Usuario</option>
                                            <option value="administrador">Administrador</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;