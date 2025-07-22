import React, { useState } from 'react';
import './NameModal.css';

const NameModal = ({ isOpen, onClose, onSave, onOpenAnalysisPanel }) => {
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Lütfen geçerli bir isim girin');
      return;
    }

    try {
      const saveSuccess = await onSave(name.trim());
      if (saveSuccess) {
        onOpenAnalysisPanel();
        onClose();
      } else {
        alert('Kayıt işlemi başarısız oldu');
      }
    } catch (e) {
      console.error('NameModal save error:', e);
      alert('Kayıt işlemi başarısız oldu: ' + e.message);
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
            <button className="save-btn" onClick={handleSave}>
              Kaydet ve Analiz Yap
            </button>
          </div>
        </div>
      </div>
  );
};

export default NameModal;