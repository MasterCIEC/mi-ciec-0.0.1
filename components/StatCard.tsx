
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between transition-transform transform hover:-translate-y-1">
      <div>
        <p className="text-sm font-medium text-ciec-dark-gray uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-ciec-text mt-1">{value}</p>
      </div>
      <div className={`p-4 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
