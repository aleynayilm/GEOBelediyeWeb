import React, {useState} from 'react';
import './Navbar.css';
import {
    Menu,
    X,
    ChevronDown,
    LayoutGrid,
    Trash2,
    MapPin,
    Clock,
    Calendar,
    Settings,
    LogOut
} from 'lucide-react';

const Navbar = ({isSidebarOpen, toggleSidebar}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('Tüm Projeler');

    const filterOptions = [
        { id: 1, name: 'Tüm Projeler', icon: <LayoutGrid size={18} />, color: '#3b82f6' },
        { id: 2, name: 'Atık Yönetimi', icon: <Trash2 size={18} />, color: '#10b981' },
        { id: 3, name: 'Bölge Planlama', icon: <MapPin size={18} />, color: '#f59e0b' },
        { id: 4, name: 'Zaman Çizelgesi', icon: <Clock size={18} />, color: '#8b5cf6' },
        { id: 5, name: 'Takvim Görünümü', icon: <Calendar size={18} />, color: '#ec4899' }
    ];

    return (
        <header className="custom-navbar">
            {/* Left Side - Hamburger and GEOBelediye */}
            <div className="navbar-left">
                <button
                    onClick={toggleSidebar}
                    className="sidebar-toggle-btn"
                >
                    {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
                </button>
                <h1 className="geo-title">GEOBelediye</h1>
            </div>

            {/* Center - Proje Başlat Button */}
            <button className="project-start-btn">
                Proje Başlat
            </button>

            {/* Right Side - Filter Dropdown */}
            <div className="navbar-right">
                <div className="filter-dropdown">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`filter-trigger ${isFilterOpen ? 'active' : ''}`}
                    >
                        <div className="filter-selected">
                            {filterOptions.find(opt => opt.name === selectedFilter)?.icon}
                            <span>{selectedFilter}</span>
                        </div>
                        <ChevronDown className={`chevron-icon ${isFilterOpen ? 'rotated' : ''}`} size={18}/>
                    </button>

                    {isFilterOpen && (
                        <div className="dropdown-menu filter-menu">
                            <div className="filter-header">
                                <h4>Proje Teması Seçin</h4>
                            </div>

                            <div className="filter-options">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        className={`filter-option ${selectedFilter === option.name ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedFilter(option.name);
                                            setIsFilterOpen(false);
                                        }}
                                    >
                                        <div className="option-icon" style={{ color: option.color }}>
                                            {option.icon}
                                        </div>
                                        <span>{option.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;