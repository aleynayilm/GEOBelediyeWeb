import React, { useState, useEffect } from 'react';
import { calculateManholeNeeds } from '../../utils/calculateManholeNeeds';
import { calculateContainerNeeds } from '../../utils/calculateContainerNeeds';
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
        if (Number(population) <= 0 || !area || !populationDensity) {
          alert('Lütfen geçerli bir nüfus ve nüfus yoğunluğu değeri girin');
          return;
        }
        const { estimatedPopulation, totalWastePerDay, containerCount } = calculateContainerNeeds(
          Number(populationDensity),
          Number(area)
        );
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          population: Number(population),
          area: Number(area),
          populationDensity: Number(populationDensity),
          minCoverCount: containerCount,
          capacity: Number(totalWastePerDay),
        };
      } else if (category === 'manhole') {
        if (!area || !rainfallIntensity || !duration) {
          alert('Lütfen tüm değerleri girin');
          return;
        }
        const { totalRainwater, requiredManholeCount } = calculateManholeNeeds({
          area: Number(area),
          rainfallIntensity: Number(rainfallIntensity),
          duration: Number(duration),
        });
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          area: Number(area),
          rainfallIntensity: Number(rainfallIntensity),
          duration: Number(duration),
          minCoverCount: requiredManholeCount,
          capacity: totalRainwater,
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
          minCoverCount: 1,
          capacity: 0,
        };
      } else {
        saveData = {
          name: name.trim(),
          typeN: selectedFilter,
          area: Number(area) || null,
          minCoverCount: 1,
          capacity: 0,
        };
      }

      console.log('Save button clicked', saveData);
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
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Yeni Poligon Ekle</h2>
        <div className="modal-content">
          <div className="modal-field">
            <label htmlFor="name">Poligon İsmi</label>
            <input
              id="name"
              type="text"
              placeholder="Bir isim girin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="area">Alan (m²)</label>
            <input
              id="area"
              type="text"
              value={area ? area.toFixed(2) : ''}
              readOnly
              placeholder="Poligon alanı otomatik hesaplandı"
            />
          </div>

          {category === 'container' && (
            <>
              <div className="modal-field">
                <label htmlFor="population">Nüfus</label>
                <input
                  id="population"
                  type="number"
                  placeholder="Nüfus girin"
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                  min="0"
                />
              </div>
              <div className="modal-field">
                <label htmlFor="populationDensity">Nüfus Yoğunluğu (kişi/m²)</label>
                <input
                  id="populationDensity"
                  type="number"
                  step="0.0001"
                  placeholder="Örn: 0.002"
                  value={populationDensity}
                  onChange={(e) => setPopulationDensity(e.target.value)}
                  min="0"
                />
              </div>
            </>
          )}

          {category === 'manhole' && (
            <>
              <div className="modal-field">
                <label htmlFor="rainfallIntensity">Yağmur Şiddeti (mm/dk)</label>
                <input
                  id="rainfallIntensity"
                  type="number"
                  placeholder="Yağmur şiddetini girin"
                  value={rainfallIntensity}
                  onChange={(e) => setRainfallIntensity(e.target.value)}
                  min="0"
                />
              </div>
              <div className="modal-field">
                <label htmlFor="duration">Süre (dk)</label>
                <input
                  id="duration"
                  type="number"
                  placeholder="Süreyi girin"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="0"
                />
              </div>
            </>
          )}

          {category === 'parking' && (
            <div className="modal-field">
              <label htmlFor="usageType">Kullanım Türü</label>
              <select
                id="usageType"
                value={usageType}
                onChange={(e) => setUsageType(e.target.value)}
              >
                <option value="residential">Konut</option>
                <option value="commercial">Ticari</option>
                <option value="mixed">Karma</option>
              </select>
            </div>
          )}
        </div>

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