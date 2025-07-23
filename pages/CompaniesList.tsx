
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Company } from '../types';
import Spinner from '../components/Spinner';
import { PlusIcon } from '../components/icons/NavIcons';

const CompaniesList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*, municipios(nombre_municipio), afiliaciones(nombre_afiliacion)')
        .order('razon_social', { ascending: true });

      if (error) {
        setError('Failed to fetch companies: ' + error.message);
        console.error(error);
      } else {
        setCompanies(data);
      }
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    return companies.filter(company =>
      company.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.rif && company.rif.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [companies, searchTerm]);

  const handleDelete = async (code: string) => {
      if (window.confirm('¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer.')) {
          const { error } = await supabase.from('empresas').delete().eq('code', code);
          if (error) {
              alert('Error al eliminar la empresa: ' + error.message);
          } else {
              setCompanies(companies.filter(c => c.code !== code));
              alert('Empresa eliminada exitosamente.');
          }
      }
  }


  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ciec-text">Directorio de Empresas</h1>
        <Link
          to="/company/new"
          className="bg-ciec-blue hover:bg-ciec-gold text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          <span>Añadir Empresa</span>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <input
            type="text"
            placeholder="Buscar por Razón Social o RIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ciec-blue"
        />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ciec-gray border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 font-bold text-ciec-text uppercase tracking-wider">Razón Social</th>
                <th className="px-6 py-3 font-bold text-ciec-text uppercase tracking-wider">RIF</th>
                <th className="px-6 py-3 font-bold text-ciec-text uppercase tracking-wider">Municipio</th>
                <th className="px-6 py-3 font-bold text-ciec-text uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 font-bold text-ciec-text uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompanies.map(company => (
                <tr key={company.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-ciec-text">{company.razon_social}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-ciec-dark-gray">{company.rif || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-ciec-dark-gray">{company.municipios?.nombre_municipio || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-ciec-dark-gray">{company.telefono || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                    <Link to={`/company/edit/${company.code}`} className="text-ciec-blue hover:text-ciec-gold font-medium">Editar</Link>
                    <button onClick={() => handleDelete(company.code)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {filteredCompanies.length === 0 && (
                <p className="text-center py-8 text-ciec-dark-gray">No se encontraron empresas.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesList;
