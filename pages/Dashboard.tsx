
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabase';
import { DashboardStats, CompaniesByMunicipality, Company } from '../types';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import { BriefcaseIcon, MapIcon, HomeIcon } from '../components/icons/NavIcons';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companiesByMun, setCompaniesByMun] = useState<CompaniesByMunicipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: companiesError } = await supabase
          .from('empresas')
          .select('code, empleados, obreros, directivos, afiliacion_id, municipios(nombre_municipio)');

        if (companiesError) throw companiesError;
        
        if (data) {
          const totalCompanies = data.length;
          const totalEmployees = data.reduce((acc, company) => acc + (company.empleados || 0) + (company.obreros || 0) + (company.directivos || 0), 0);
          const affiliatedCompanies = data.filter(c => c.afiliacion_id).length;

          setStats({ totalCompanies, totalEmployees, affiliatedCompanies });
          
          const byMunicipality: { [key: string]: number } = {};
          data.forEach(company => {
            const munName = company.municipios?.nombre_municipio || 'No especificado';
            byMunicipality[munName] = (byMunicipality[munName] || 0) + 1;
          });
          
          const chartData = Object.entries(byMunicipality)
            .map(([municipio, count]) => ({ municipio, count }))
            .sort((a, b) => b.count - a.count);

          setCompaniesByMun(chartData);
        }

      } catch (err: any) {
        setError("Error al cargar los datos del dashboard. " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Spinner size="lg" />;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ciec-text">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total de Empresas" value={stats?.totalCompanies ?? 0} icon={<BriefcaseIcon className="h-8 w-8 text-white"/>} color="bg-blue-500" />
        <StatCard title="Total de Trabajadores" value={stats?.totalEmployees.toLocaleString() ?? 0} icon={<HomeIcon className="h-8 w-8 text-white"/>} color="bg-green-500" />
        <StatCard title="Empresas Afiliadas" value={stats?.affiliatedCompanies ?? 0} icon={<MapIcon className="h-8 w-8 text-white"/>} color="bg-ciec-gold" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-ciec-text mb-4">Empresas por Municipio</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={companiesByMun}
              margin={{ top: 5, right: 20, left: 10, bottom: 95 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="municipio" angle={-45} textAnchor="end" interval={0} style={{ fontSize: '12px' }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Nº de Empresas" fill="#003366" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
