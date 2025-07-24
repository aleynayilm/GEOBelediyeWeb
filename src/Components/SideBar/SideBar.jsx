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
    'Bölge Planlama ',
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
    { icon: Settings, label: 'Ayarlar', href: '#' }
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
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            transition: 'opacity 0.3s ease'
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
          width: '280px',
          backgroundColor: 'white',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          zIndex: 999,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <nav style={{ padding: '16px' }}>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              marginTop: '64px',
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
                        // if (mapRef?.current?.clearProjects) {
                        //   mapRef.current.clearProjects();
                        // }
                      }
                      toggleSidebar();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      color: '#374151',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.color = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#374151';
                    }}
                  >
                    <item.icon size={20} />
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
                  color: '#374151',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                }}
              >
                <Map size={20} />
                <span style={{ flexGrow: 1 }}>Projeler</span>
                {isProjectsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>

              {isProjectsOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '24px' }}>
                  {categories.map((cat, i) => (
                    <li key={i}>
                      <div
                        onClick={() =>
                          setActiveCategory(activeCategory === cat ? null : cat)
                        }
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          fontWeight: '500',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          color: activeCategory === cat ? '#2563eb' : '#374151',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {activeCategory === cat ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                          {cat}
                        </span>
                      </div>

                      {activeCategory === cat && (
                        <ul style={{ paddingLeft: '24px', marginTop: '4px' }}>
                          {filteredProjects(cat).map((proj) => (
                            proj.wkt.includes("POLYGON") && (
                              <li
                                key={proj.id}
                                style={{
                                  padding: '6px 0',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s ease'
                                }}
                                onClick={() => selectProject(proj)}
                                onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                                onMouseLeave={(e) => e.target.style.color = '#374151'}
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
                  color: '#374151',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                }}
              >
                <BarChart3 size={20} />
                <span style={{ flexGrow: 1 }}>Analiz Sonuçları</span>
                {isAnalysisOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>

              {isAnalysisOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '24px' }}>
                  {categories.map((cat, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        navigate(`/analiz/${encodeURIComponent(cat)}`);
                        toggleSidebar();
                      }}
                      style={{
                        padding: '6px 0',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => (e.target.style.color = '#2563eb')}
                      onMouseLeave={(e) => (e.target.style.color = '#374151')}
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
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#d1d5db',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                K
              </span>
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                margin: 0
              }}>
                Kullanıcı
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
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