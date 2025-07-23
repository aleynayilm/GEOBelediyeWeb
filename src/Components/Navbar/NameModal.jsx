import React, { useState, useEffect } from 'react';
import './NameModal.css';

const NameModal = ({ isOpen, onClose, onSave, onOpenAnalysisPanel, category, selectedFilter, area }) => {
  const [name, setName] = useState('');
  const [population, setPopulation] = useState('');
  const [rainfallIntensity, setRainfallIntensity] = useState('');
  const [duration, setDuration] = useState('');
  const [usageType, setUsageType] = useState('residential');
  const [populationDensity, setPopulationDensity] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPopulation('');
      setRainfallIntensity('');
      setDuration('');
      setUsageType('residential');
      setPopulationDensity('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Lütfen geçerli bir isim girin');
      return;
    }

    try {
      let saveData;
      if (category === 'container') {
        if (Number(population) <= 0 || !area) {
          alert('Lütfen geçerli bir nüfus değeri girin');
          return;
        }
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          population: Number(population),
          area: Number(area),
          populationDensity: Number(populationDensity),
        };
      } else if (category === 'manhole') {
        if (!area || !rainfallIntensity || !duration) {
          alert('Lütfen tüm değerleri girin');
          return;
        }
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          area: Number(area),
          rainfallIntensity: Number(rainfallIntensity),
          duration: Number(duration),
        };
      } else if (category === 'parking') {
        if (!area) {
          alert('Lütfen geçerli bir alan değeri sağlayın');
          return;
        }
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          area: Number(area),
          usageType,
        };
      } else {
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          area: Number(area) || null, // Alan isteğe bağlı
        };
      }

      const saveSuccess = await onSave(saveData);
      if (saveSuccess) {
        onOpenAnalysisPanel();
        onClose();
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
          <div className="modal-field">
            <h3>Poligon İsmi</h3>
            <input
                type="text"
                placeholder="Bir isim girin"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <h3>Alan (m²)</h3>
            <input
                type="text"
                value={area ? area.toFixed(2) : ''}
                readOnly
                placeholder="Poligon alanı otomatik hesaplandı"
            />
          </div>

          {category === 'container' && (
              <>
                <div className="modal-field">
                  <h3>Nüfus</h3>
                  <input
                      type="number"
                      placeholder="Nüfus girin"
                      value={population}
                      onChange={(e) => setPopulation(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <h3>Nüfus Yoğunluğu (kişi/m²)</h3>
                  <input
                      type="number"
                      step="0.0001"
                      placeholder="Örn: 0.002"
                      value={populationDensity}
                      onChange={(e) => setPopulationDensity(e.target.value)}
                  />
                </div>
              </>
          )}

          {category === 'manhole' && (
              <>
                <div className="modal-field">
                  <h3>Yağmur Şiddeti (mm/dk)</h3>
                  <input
                      type="number"
                      placeholder="Yağmur şiddetini girin"
                      value={rainfallIntensity}
                      onChange={(e) => setRainfallIntensity(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <h3>Süre (dk)</h3>
                  <input
                      type="number"
                      placeholder="Süreyi girin"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </>
          )}

          {category === 'parking' && (
              <>
                <div className="modal-field">
                  <h3>Kullanım Türü</h3>
                  <select
                      value={usageType}
                      onChange={(e) => setUsageType(e.target.value)}
                  >
                    <option value="residential">Konut</option>
                    <option value="commercial">Ticari</option>
                    <option value="mixed">Karma</option>
                  </select>
                </div>
              </>
          )}

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