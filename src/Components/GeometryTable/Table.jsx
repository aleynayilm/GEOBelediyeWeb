import React, { useState, useEffect } from 'react';
import {getData, deleteData, updateLocation, addData, deleteLocation} from '../../Api/api';
import { FiEdit2, FiTrash2, FiSave, FiPlusCircle } from 'react-icons/fi';
import '../../Css/Table.css';

export default function Table({ onDataChanged }) {
    const [data, setData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', wkt: '' });
    const [newItem, setNewItem] = useState({ name: '', wkt: '' });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const response = await getData();
        setData(response.data);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, wkt: item.wkt });
    };

    const handleSave = async () => {
        const updatedData = {
            id: editingId,
            name: formData.name,
            wkt: formData.wkt,
        };

        await updateLocation(editingId, updatedData);
        setEditingId(null);
        await fetchData();
        if (onDataChanged) onDataChanged(); // Harita güncelle
    };

    const handleDelete = async (id) => {
        await deleteLocation(id);
        await fetchData();
        if (onDataChanged) onDataChanged(); // Harita güncelle
    };

    const handleAdd = async () => {
        if (!newItem.name || !newItem.wkt) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        await addData(newItem);
        setNewItem({ name: '', wkt: '' });
        setShowAddForm(false);
        await fetchData();
        if (onDataChanged) onDataChanged(); // Harita güncelle
    };

    return (
        <div className="premium-container">
            {/* Başlık ve Buton */}
            <div className="table-header">
                <h2>Veri Tablosu</h2>
                <button className="btn add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                    <FiPlusCircle /> Yeni Ekle
                </button>
            </div>

            {/* Yeni Ekleme Formu */}
            {showAddForm && (
                <div className="add-form">
                    <input
                        className="premium-input"
                        placeholder="Mevki Adı"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <input
                        className="premium-input"
                        placeholder="WKT (örnek: POINT(10 70))"
                        value={newItem.wkt}
                        onChange={(e) => setNewItem({ ...newItem, wkt: e.target.value })}
                    />
                    <button className="btn save-btn" onClick={handleAdd}>
                        <FiSave /> Kaydet
                    </button>
                </div>
            )}

            {/* Tablo */}
            <div className="table-responsive">
                <table className="premium-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Mevki</th>
                        <th>WKT</th>
                        <th>İşlemler</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((item) => (
                        <tr key={item.id} className={editingId === item.id ? 'editing-active' : ''}>
                            <td>{item.id}</td>
                            <td>
                                {editingId === item.id ? (
                                    <input
                                        className="premium-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    item.name
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <input
                                        className="premium-input"
                                        value={formData.wkt}
                                        onChange={(e) => setFormData({ ...formData, wkt: e.target.value })}
                                    />
                                ) : (
                                    item.wkt
                                )}
                            </td>
                            <td className="action-cells">
                                {editingId === item.id ? (
                                    <button className="btn save-btn" onClick={handleSave}>
                                        <FiSave /> Kaydet
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn edit-btn" onClick={() => handleEdit(item)}>
                                            <FiEdit2 /> Düzenle
                                        </button>
                                        <button className="btn delete-btn" onClick={() => handleDelete(item.id)}>
                                            <FiTrash2 /> Sil
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
