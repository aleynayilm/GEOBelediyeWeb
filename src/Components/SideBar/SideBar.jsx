import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, Settings, Wrench, FileText, Map, ChevronDown, ChevronRight } from 'lucide-react';
import './SideBar.css';

const SideBar = ({ isSidebarOpen, toggleSidebar, mapRef }) => {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [projectData, setProjectData] = useState([]);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [activeAnalysisCategory, setActiveAnalysisCategory] = useState(null);
  const categories = [
    'Atık Yönetimi',
    'Bölge Planlama',
    'Altyapı Yönetimi',
    'Otopark Planlama',
  ];
  const navigate = useNavigate();
  const menuItems = [
    { icon: Home, label: 'Ana Sayfa', href: '/' },
    { icon: Map, label: 'Projeler', href: '#' },
    { icon: BarChart3, label: 'Analiz Sonuçları', href: '#' },
    { icon: FileText, label: 'Raporlar', href: '#' },
    { icon: Wrench, label: 'Modifikasyonlar', href: '#' },
    { icon: Settings, label: 'Ayarlar', href: '#' },
  ];

  useEffect(() => {
    fetch('http://localhost:7096/Point/GetAll')
      .then(res => res.json())
      .then(data => setProjectData(data))
      .catch(err => console.error('Proje verileri alınamadı:', err));
  }, []);

  const selectProject = (proj) => {
    if (mapRef?.current?.zoomToProject) {
      mapRef.current.zoomToProject(proj.id);
    }
  };

  const filteredProjects = (cat) => projectData.filter(p => p.typeN === cat);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 998,
            transition: 'opacity 0.3s ease-in-out',
            opacity: isSidebarOpen ? 1 : 0,
          }}
        />
      )}

      <div
        className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '300px',
          backgroundColor: '#ffffff',
          color: '#1f2a44',
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.1)',
          zIndex: 999,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <nav style={{ padding: '24px', flexGrow: 1, overflowY: 'auto' }}>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              marginTop: '48px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Ana Sayfa, Raporlar, Modifikasyonlar, Ayarlar */}
            {menuItems.map((item, index) => {
              if (item.label === 'Projeler' || item.label === 'Analiz Sonuçları') return null;
              return (
                <li key={index}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.label === 'Ana Sayfa') {
                        navigate('/');
                      }
                      toggleSidebar();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      color: '#1f2a44',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.color = '#3b82f6';
                      e.target.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#1f2a44';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    <item.icon size={20} strokeWidth={2} />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}

            {/* Projeler */}
            <li>
              <div
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  color: '#1f2a44',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease, transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateX(0)';
                }}
              >
                <Map size={20} strokeWidth={2} />
                <span style={{ flexGrow: 1 }}>Projeler</span>
                {isProjectsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>

              {isProjectsOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '28px', marginTop: '8px' }}>
                  {categories.map((cat, i) => (
                    <li key={i}>
                      <div
                        onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                        style={{
                          padding: '8px 0',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: activeCategory === cat ? '#3b82f6' : '#1f2a44',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease, transform 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#3b82f6';
                          e.target.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = activeCategory === cat ? '#3b82f6' : '#1f2a44';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        {cat}
                      </div>
                      {activeCategory === cat && (
                        <ul style={{ paddingLeft: '28px', marginTop: '4px' }}>
                          {filteredProjects(cat).map((proj) => (
                            proj.wkt.includes("POLYGON") && (
                              <li
                                key={proj.id}
                                style={{
                                  padding: '8px 0',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#1f2a44',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s ease, transform 0.1s ease',
                                }}
                                onClick={() => selectProject(proj)}
                                onMouseEnter={(e) => {
                                  e.target.style.color = '#3b82f6';
                                  e.target.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = '#1f2a44';
                                  e.target.style.transform = 'translateX(0)';
                                }}
                              >
                                {proj.name}
                              </li>
                            )
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Analiz Sonuçları */}
            <li>
              <div
                onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  color: '#1f2a44',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease, transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateX(0)';
                }}
              >
                <BarChart3 size={20} strokeWidth={2} />
                <span style={{ flexGrow: 1 }}>Analiz Sonuçları</span>
                {isAnalysisOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>

              {isAnalysisOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '28px', marginTop: '8px' }}>
                  {categories.map((cat, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        navigate(`/analiz/${encodeURIComponent(cat)}`);
                        toggleSidebar();
                      }}
                      style={{
                        padding: '8px 0',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2a44',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease, transform 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = '#3b82f6';
                        e.target.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = '#1f2a44';
                        e.target.style.transform = 'translateX(0)';
                      }}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                }}
              >
                K
              </span>
            </div>
            <div>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2a44',
                  margin: 0,
                }}
              >
                Kullanıcı
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                admin@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBar;