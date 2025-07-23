
import React from 'react';
import { Trash2 } from 'lucide-react';

interface DiscardAreaProps {
    isVisible: boolean;
}

const DiscardArea: React.FC<DiscardAreaProps> = ({ isVisible }) => {
    return (
        <div 
            id="discard-area"
            className={`fixed bottom-0 left-0 right-0 h-32 bg-red-900/50 border-t-2 border-red-500 flex flex-col justify-center items-center text-red-300 transition-transform duration-300 ease-in-out z-40 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <Trash2 size={32} />
            <span className="mt-2 font-semibold">Soltar para descartar</span>
        </div>
    );
};

export default DiscardArea;
