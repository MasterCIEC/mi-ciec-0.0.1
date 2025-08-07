import React from 'react';
import Modal from './Modal';
import { useDraft } from '../../contexts/DraftContext';

const ConfirmDiscardModal: React.FC = () => {
    const { isConfirmDiscardModalOpen, handleConfirmDiscard, handleCancelDiscard } = useDraft();

    return (
        <Modal
            isOpen={isConfirmDiscardModalOpen}
            onClose={handleCancelDiscard}
            title="¿Descartar Cambios?"
        >
            <div className="text-ciec-text-secondary">
                <p>Se perderá toda la información que has introducido. ¿Estás seguro de que quieres descartar este borrador?</p>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={handleCancelDiscard}
                    className="border border-ciec-border bg-transparent text-ciec-text-secondary hover:bg-ciec-border hover:text-ciec-text-primary font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-border"
                >
                    Seguir Editando
                </button>
                <button
                    onClick={() => {
                        handleConfirmDiscard();
                    }}
                    className="border border-red-500 bg-transparent text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-red-500"
                >
                    Descartar
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDiscardModal;