
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BriefcaseIcon, MapIcon, SettingsIcon } from './icons/NavIcons';

const Sidebar: React.FC = () => {
  const linkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-ciec-gold/20 hover:text-white transition-colors duration-200";
  const activeLinkClasses = "bg-ciec-gold/20 text-white border-l-4 border-ciec-gold";

  return (
    <aside className="w-64 bg-ciec-blue text-white flex-shrink-0 flex flex-col">
      <div className="h-20 flex items-center justify-center bg-black/20">
        <h1 className="text-2xl font-bold text-center leading-tight">
          Mapa<br/>Industrial
        </h1>
      </div>
      <nav className="flex-grow mt-5">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <HomeIcon className="h-6 w-6 mr-3" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/companies" 
          className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <BriefcaseIcon className="h-6 w-6 mr-3" />
          <span>Empresas</span>
        </NavLink>
        <NavLink 
          to="/map" 
          className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <MapIcon className="h-6 w-6 mr-3" />
          <span>Mapa</span>
        </NavLink>
         <NavLink 
          to="/admin" 
          className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <SettingsIcon className="h-6 w-6 mr-3" />
          <span>Administración</span>
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-700">
         <p className="text-sm text-center text-gray-400">© 2024 CIEC</p>
      </div>
    </aside>
  );
};

export default Sidebar;