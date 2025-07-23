
import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Page } from '../../types';


interface HeaderProps {
    currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
    return (
        <header className="flex-shrink-0 bg-ciec-card border-b border-ciec-border h-16 flex items-center justify-between px-6">
            <div className="flex items-center">
                <h1 className="text-xl font-semibold text-ciec-text-primary">{currentPage}</h1>
            </div>

            <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ciec-text-secondary" />
                    <input
                        type="text"
                        placeholder={`Search ${currentPage}...`}
                        className="w-full bg-ciec-bg border border-ciec-border rounded-lg pl-10 pr-4 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button className="p-2 rounded-full text-ciec-text-secondary hover:bg-ciec-bg hover:text-ciec-text-primary transition-colors">
                    <RefreshCw className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center font-bold text-white">
                    R
                </div>
            </div>
        </header>
    );
};

export default Header;
