
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className={`bg-ciec-card rounded-lg shadow-xl w-full m-4 flex flex-col ${sizeClasses[size]}`}
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-ciec-border">
                    <h2 className="text-xl font-bold text-ciec-text-primary truncate pr-4">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-ciec-text-secondary hover:bg-ciec-border hover:text-white" title="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </header>
                <main className="flex-grow p-4 md:p-6 overflow-y-auto">
                    {children}
                </main>
                {footer && (
                    <footer className="flex-shrink-0 p-4 border-t border-ciec-border flex justify-end items-center space-x-4">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default Modal;
