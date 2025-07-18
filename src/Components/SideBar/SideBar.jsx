import React, { useState } from 'react';
import { Menu, X, Home, BarChart3, Settings, Users, FileText, Bell, Map } from 'lucide-react';
import './SideBar.css';

const SideBar = ({ isSidebarOpen, toggleSidebar }) => {

  const menuItems = [
    { icon: Home, label: 'Ana Sayfa', href: '#' },
    { icon: Map, label: 'Harita Görünümü', href: '#' },
    { icon: BarChart3, label: 'Analiz Sonuçları', href: '#' },
    { icon: FileText, label: 'Raporlar', href: '#' },
    { icon: Users, label: 'Kullanıcılar', href: '#' },
    { icon: Bell, label: 'Bildirimler', href: '#' },
    { icon: Settings, label: 'Ayarlar', href: '#' }
  ];

  return (
    <>
      {/* Overlay */}
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

      {/* Sidebar */}
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
        {/* Sidebar Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {/* <div>
            <h2 style={{
              paddingLeft: '70px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Analiz Portalı
            </h2>
          </div> */}
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '16px' }}>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    color: '#374151',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500'
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
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
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