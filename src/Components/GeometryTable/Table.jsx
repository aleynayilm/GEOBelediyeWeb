import React, { useState, useEffect } from 'react';
import { getData, deleteData, updateLocation, addData, deleteLocation } from '../../Api/api';
import { FiEdit2, FiTrash2, FiSave, FiPlusCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../../Css/Table.css';
import SimpleMap from '../Map/Map';

export default function Table({ mapRef, onDataUpdate, dataUpdated }) {
    const [data, setData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', wkt: '' });
    const [newItem, setNewItem] = useState({ name: '', wkt: '' });
    const [showAddForm, setShowAddForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchData();
    }, [dataUpdated]);

    const fetchData = async () => {
        try {
            const response = await getData();
            // Verileri ID'ye göre sırala (büyükten küçüğe)
            const sortedData = (response.data || []).sort((a, b) => b.id - a.id);
            setData(sortedData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setData([]);
        }
    };


    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, wkt: item.wkt });
    };

    const handleSave = async () => {
        if (formData.name.length > 50) {
            alert("Mevki adı 50 karakterden uzun olamaz!");
            return;
        }

        try {
            const updatedData = {
                id: editingId,
                name: formData.name,
                wkt: formData.wkt,
            };

            await updateLocation(editingId, updatedData);
            setEditingId(null);
            await fetchData();
            if (onDataUpdate) onDataUpdate();
        } catch (err) {
            console.error('Error updating data:', err);
            alert('Veri güncellenirken hata oluştu.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteLocation(id);
            await fetchData();
            if (onDataUpdate) onDataUpdate();
        } catch (err) {
            console.error('Error deleting data:', err);
            alert('Veri silinirken hata oluştu.');
        }
    };

    const handleAdd = async () => {
        if (!newItem.name || !newItem.wkt) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        if (newItem.name.length > 50) {
            alert("Mevki adı 50 karakterden uzun olamaz!");
            return;
        }

        try {
            await addData(newItem);
            setNewItem({ name: '', wkt: '' });
            setShowAddForm(false);
            await fetchData();
            if (onDataUpdate) onDataUpdate();
        } catch (err) {
            console.error('Error adding data:', err);
            alert('Veri eklenirken hata oluştu.');
        }
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

            {showAddForm && (
                <div className="add-form">
                    <input
                        className="premium-input"
                        placeholder="Mevki Adı (max 50 karakter)"
                        value={newItem.name}
                        maxLength={50}
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
                    {currentItems.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => mapRef.current?.focusOnFeature(item.id)}
                            className={editingId === item.id ? 'editing-active' : ''}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>{item.id}</td>
                            <td>
                                {editingId === item.id ? (
                                    <input
                                        className="premium-input"
                                        value={formData.name}
                                        maxLength={50}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-ellipsis">{item.name}</div>
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
                                    <div className="wkt-cell">
                                        {item.wkt.length > 100 ? `${item.wkt.substring(0, 100)}...` : item.wkt}
                                    </div>
                                )}
                            </td>
                            <td className="action-cells">
                                {editingId === item.id ? (
                                    <button className="btn save-btn" onClick={handleSave}>
                                        <FiSave /> Kaydet
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn edit-btn" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                                            <FiEdit2 /> Düzenle
                                        </button>
                                        <button className="btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
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

            {/* Pagination Kontrolleri */}
            <div className="pagination-controls">
                <button
                    className="btn pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    <FiChevronLeft /> Önceki
                </button>

                <span className="page-info">
                    Sayfa {currentPage} / {totalPages}
                </span>

                <button
                    className="btn pagination-btn"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Sonraki <FiChevronRight />
                </button>
            </div>
        </div>
    );
}