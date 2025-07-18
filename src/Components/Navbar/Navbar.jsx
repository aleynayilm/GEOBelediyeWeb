import React, {useState} from 'react';
import './Navbar.css';
import { User, Menu, X, ChevronDown} from 'lucide-react';

function PencilIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="ap-pencil-icon"
    >
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.33H5v-0.92L14.06 7.52l0.92 0.92L5.92 19.58ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
        fill="currentColor"
      />
    </svg>
  );
}

const Navbar = ({isSidebarOpen, toggleSidebar}) => {
  const [selectedCategory, setSelectedCategory] = useState('Atık Toplama Optimizasyonu');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const categories = [
    'Atık Toplama Optimizasyonu',
    'Otopark Optimizasyonu',
    'Sosyal Alan Optimizasyonu',
    'Altyapı Optimizasyonu'
  ];
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };
  
  return (
    <header className="custom-navbar">
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="sidebar-toggle-btn"
        style={{
          padding: '12px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {/* App Title */}
  <h1 className="app-title">AKILLI DAĞITIM VE PLANLAMA SİSTEMİ</h1>

{/* Kategori Dropdown */}
<div className="navbar-right"><div className="category-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="dropdown-trigger"
        >
          <span>{selectedCategory}</span>
          <ChevronDown className={`chevron-icon ${isDropdownOpen ? 'rotated' : ''}`} size={16} />
        </button>
        
        {isDropdownOpen && (
          <div className="dropdown-menu">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedCategory(category);
                  setIsDropdownOpen(false);
                }}
                className={`dropdown-item ${selectedCategory === category ? 'active' : ''}`}
              >
                <div className={`category-dot ${selectedCategory === category ? 'active' : ''}`} />
                <span>{category}</span>
              </button>
            ))}
          </div>
        )}
      </div></div>
      
      <div className="project-add-section">
  <div className="project-add-header">
    <span className="project-add-title">Proje Ekle</span>
    {!isEditing ? (
      <button
      onClick={handleEdit}
        className="pencil-btn"
        title="Düzenle"
      >
        <PencilIcon size={18} />
      </button>
    ) : (
      <div className="edit-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          className="save-btn"
        >
          SAVE
        </button>
        <button
          onClick={handleCancel}
          className="cancel-btn"
        >
          CANCEL
        </button>
      </div>
    )}
  </div>
</div>
      {/* <div className="navbar-right">
        <div className="step-indicator">
          <span className="step-label">{currentStepLabel}</span>
        </div>
      </div> */}
    </header>
  );
};

export default Navbar;
