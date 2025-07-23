
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
                    className="bg-ciec-border text-ciec-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    Seguir Editando
                </button>
                <button
                    onClick={() => {
                        handleConfirmDiscard();
                        // The context now handles closing the modal state internally
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Descartar
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDiscardModal;
