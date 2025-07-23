

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  { to: 'estados', label: 'Estados' },
  { to: 'municipios', label: 'Municipios' },
  { to: 'parroquias', label: 'Parroquias' },
  { to: 'urbanizaciones', label: 'Urbanizaciones' },
  { to: 'afiliaciones', label: 'Afiliaciones' },
  { to: 'estados-comision', label: 'Estados Comisión' },
  { to: 'comisiones', label: 'Comisiones' },
  { to: 'integrantes', label: 'Integrantes' },
];

const AdminLayout: React.FC = () => {
  const linkClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
  const activeLinkClasses = "bg-ciec-blue text-white";
  const inactiveLinkClasses = "text-ciec-text hover:bg-ciec-gray";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ciec-text">Administración del Sistema</h1>

      <div className="bg-white p-2 rounded-xl shadow-md">
        <nav className="flex flex-wrap items-center gap-2">
          {adminLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;