import React, { useState } from 'react';
import './NameModal.css';

const NameModal = ({ isOpen, onClose, onSave, onOpenAnalysisPanel }) => {
  const [name, setName] = useState('');

  const handleSaveAndOpenPanel = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onOpenAnalysisPanel(); // Analiz panelini aç
    }
  };

  if (!isOpen) return null;

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <h3>Poligon İsmi</h3>
          <input
              type="text"
              placeholder="Bir isim girin"
              value={name}
              onChange={(e) => setName(e.target.value)}
          />
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              İptal
            </button>
            <button className="save-btn" onClick={handleSaveAndOpenPanel}>
              Kaydet ve Analiz Yap
            </button>
          </div>
        </div>
      </div>
  );
};

export default NameModal;