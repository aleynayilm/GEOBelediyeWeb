import React, { useState, useEffect } from 'react';
import './NameModal.css';

const NameModal = ({ isOpen, onClose, onSave, onOpenAnalysisPanel, category }) => {
  const [name, setName] = useState('');
  const [population, setPopulation] = useState('');
  const [area, setArea] = useState('');
  const [rainfallIntensity, setRainfallIntensity] = useState('');
  const [duration, setDuration] = useState('');
  const [parkingArea, setParkingArea] = useState('');
  const [usageType, setUsageType] = useState('residential');
  const [gatheringArea, setGatheringArea] = useState('');
  const [populationDensity, setPopulationDensity]=useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPopulation('');
      setArea('');
      setRainfallIntensity('');
      setDuration('');
      setParkingArea('');
      setUsageType('residential');
      setGatheringArea('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Lütfen geçerli bir isim girin');
      return;
    }

    try {
      if (category === 'container') {
        if (!population || Number(population) <= 0 || !area || Number(area) <= 0) {
          alert('Lütfen geçerli bir nüfus ve alan değeri girin');
          return;
        }
        const saveSuccess = await onSave({
          name: name.trim(),
          population: Number(population),
          area: Number(area)
        });
        if (saveSuccess) {
          onOpenAnalysisPanel();
          onClose();
        }
      } else if (category === 'manhole') {
        if (!area || !rainfallIntensity || !duration) {
          alert('Lütfen tüm değerleri girin');
          return;
        }
        const saveSuccess = await onSave({
          name: name.trim(),
          area: Number(area),
          rainfallIntensity: Number(rainfallIntensity),
          duration: Number(duration)
        });
        if (saveSuccess) {
          onOpenAnalysisPanel();
          onClose();
        }
      } else if (category === 'parking') {
        if (!parkingArea || Number(parkingArea) <= 0) {
          alert('Lütfen geçerli bir alan değeri girin');
          return;
        }
        const saveSuccess = await onSave({
          name: name.trim(),
          area: Number(parkingArea),
          usageType
        });
        if (saveSuccess) {
          onOpenAnalysisPanel();
          onClose();
        }

      // } else if (category === 'gatheringArea') {
      //   if (!area || Number(area) <= 0) {
      //     alert('Lütfen geçerli bir alan girin');
      //     return;
      //   }
      
      //   const saveSuccess = await onSave({
      //     name: name.trim(),
      //     area: Number(area),
      //     centroid: selectedCentroid,
      //   });
      
      //   if (saveSuccess) {
      //     onOpenAnalysisPanel();
      //     onClose();
      //   }
      // }
      }
      else {
        const saveSuccess = await onSave(name.trim());
        if (saveSuccess) {
          onOpenAnalysisPanel();
          onClose();
        }
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
              <h3>Alan (m²)</h3>
              <input
                type="number"
                placeholder="Yüzey alanını girin"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
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
              <h3>Alan (m²)</h3>
              <input
                type="number"
                placeholder="Parsel alanını girin"
                value={parkingArea}
                onChange={(e) => setParkingArea(e.target.value)}
              />
            </div>
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
        {/* {category === 'gatheringArea' && (
  <>
    <div className='modal-field'>
      <h3>Alanın Büyüklüğü (m²)</h3>
      <input
        type="number"
        placeholder="Arazinin alanını girin"
        value={area}
        onChange={(e) => setGatheringArea(e.target.value)}
      />
    </div>
  </>
)} */}
          
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