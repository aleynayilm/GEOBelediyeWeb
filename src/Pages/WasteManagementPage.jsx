import React, { useState, useRef, useEffect } from 'react';
import SideBar from '../Components/SideBar/SideBar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import Select from 'react-select';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import '../Components/Navbar/Navbar.css';
import { getAllProjects } from '../services/projectService';

const CONTAINER_CAPACITY_KG = 96;

// Accordion Component for expandable POLYGON and POINT list
const ProjectDetailsAccordion = ({ polygonProjects, pointProjects }) => {
    const [openProjectId, setOpenProjectId] = useState(null);

    const toggleProject = (projectId) => {
        setOpenProjectId(openProjectId === projectId ? null : projectId);
    };

    return (
        <div style={{ width: '100%', marginTop: '10px' }}>
            {polygonProjects.map((project, index) => {
                const relatedPoints = pointProjects.filter(point =>
                    point.name && point.name.startsWith(`${project.name}-`)
                );
                return (
                    <div
                        key={project.id || `project-${index}`}
                        style={{
                            borderBottom: '1px solid #e2e8f0',
                            marginBottom: '8px',
                            backgroundColor: '#fff'
                        }}
                    >
                        <button
                            onClick={() => toggleProject(project.id || `project-${index}`)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#f8fafc',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            <span>{project.name || `Nokta-${index + 1}`}</span>
                            {openProjectId === (project.id || `project-${index}`) ? (
                                <ChevronUp size={20} />
                            ) : (
                                <ChevronDown size={20} />
                            )}
                        </button>
                        {openProjectId === (project.id || `project-${index}`) && (
                            <div style={{ padding: '10px', backgroundColor: '#fff', fontSize: '14px' }}>
                                {relatedPoints.length === 0 ? (
                                    <p style={{ margin: '5px 0' }}>Bu proje için ilgili nokta bulunamadı.</p>
                                ) : (
                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '14px',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '8px' }}>Konteynır Noktaları</th>
                                                <th style={{ padding: '8px' }}>WKT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {relatedPoints.map((point, pointIndex) => (
                                                <tr
                                                    key={point.id || `point-${pointIndex}`}
                                                    style={{ borderBottom: '1px solid #e2e8f0' }}
                                                >
                                                    <td style={{ padding: '8px' }}>{point.name || `Nokta-${pointIndex + 1}`}</td>
                                                    <td style={{ padding: '8px' }}>{point.wkt || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// minCoverCount ve capacityLtPerMin props olarak alınıyor
const WasteManagementPage = ({ minCoverCount = 0, capacityLtPerMin = 0 }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [pointProjects, setPointProjects] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProjects, setSelectedProjects] = useState([]); // Seçilen projeler
    const mapRef = useRef();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Renk skalası
    const colors = ['#8884d8', '#82ca9d', '#ff7300', '#ffbb28', '#00c49f', '#ff8b94', '#a6ce39', '#d4a5a5'];

    // Projeleri çekme
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await getAllProjects();
                console.log('Tüm projeler:', response);

                // POLYGON projelerini filtrele
                const polygonProjects = response.filter(project => {
                    const isValid = project.wkt &&
                        project.wkt.startsWith('POLYGON') &&
                        project.typeN === 'Atık Yönetimi' &&
                        project.name;
                    console.log(`POLYGON kontrol - Proje: ${project.name || 'Bilinmiyor'}`, {
                        typeN: project.typeN,
                        wkt: project.wkt,
                        isValid
                    });
                    return isValid;
                });

                // POINT projelerini filtrele
                const points = response.filter(project => {
                    const isValid = project.wkt &&
                        project.wkt.startsWith('POINT') &&
                        project.typeN === 'Atık Yönetimi' &&
                        project.name;
                    console.log(`POINT kontrol - Proje: ${project.name || 'Bilinmiyor'}`, {
                        typeN: project.typeN,
                        wkt: project.wkt,
                        isValid
                    });
                    return isValid;
                });

                // Her POLYGON için ilgili POINT'leri say ve veriyi hazırla
                const projectData = polygonProjects.map(project => {
                    const pointCount = points.filter(point =>
                        point.name && point.name.startsWith(`${project.name}-`)
                    ).length;
                    return {
                        id: project.id,
                        name: project.name,
                        pointCount: pointCount,
                        wasteCapacity: pointCount * CONTAINER_CAPACITY_KG
                    };
                });

                console.log('Listelenecek POLYGON projeler:', projectData);
                setProjects(projectData);
                setPointProjects(points);
                setAllProjects(response);
                setLoading(false);
            } catch (err) {
                setError('Projeler yüklenemedi: ' + err.message);
                setLoading(false);
                console.error('Hata:', err);
            }
        };
        fetchProjects();
    }, []);

    // react-select için proje seçenekleri
    const projectOptions = projects.map(project => ({
        value: project.name,
        label: project.name
    }));

    // Grafik için veri hazırlama
    const chartData = [
        {
            metric: 'Atık Kapasitesi',
            ...projects
                .filter(project => selectedProjects.length === 0 || selectedProjects.includes(project.name))
                .reduce((acc, project) => ({
                    ...acc,
                    [project.name]: project.wasteCapacity
                }), {})
        },
        {
            metric: 'Konteyner Sayısı',
            ...projects
                .filter(project => selectedProjects.length === 0 || selectedProjects.includes(project.name))
                .reduce((acc, project) => ({
                    ...acc,
                    [project.name]: project.pointCount
                }), {})
        }
    ];

    // Ortalama atık kapasitesi
    const averageWasteCapacity = projects
        .filter(project => selectedProjects.length === 0 || selectedProjects.includes(project.name))
        .length > 0
        ? projects
            .filter(project => selectedProjects.length === 0 || selectedProjects.includes(project.name))
            .reduce((sum, project) => sum + project.wasteCapacity, 0) /
        projects.filter(project => selectedProjects.length === 0 || selectedProjects.includes(project.name)).length
        : 0;

    // Proje seçimi handler
    const handleProjectSelection = (selectedOptions) => {
        setSelectedProjects(selectedOptions ? selectedOptions.map(option => option.value) : []);
    };

    // react-select custom styles
    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            borderColor: '#e2e8f0',
            borderRadius: '0.375rem',
            padding: '0.25rem',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#cbd5e1'
            }
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#e2e8f0',
            borderRadius: '0.25rem'
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#1f2937'
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#6b7280',
            '&:hover': {
                backgroundColor: '#d1d5db',
                color: '#1f2937'
            }
        })
    };

    return (
        <div style={{
            minHeight: '100vh',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <button
                onClick={toggleSidebar}
                className="sidebar-toggle-btn"
                aria-label={isSidebarOpen ? 'Sidebarı Kapat' : 'Sidebarı Aç'}
                style={{ zIndex: 2000, position: 'fixed', top: '10px', left: '10px' }}
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <SideBar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                mapRef={mapRef}
            />

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                paddingBottom: '200px',
                maxHeight: 'calc(100vh - 60px)',
                boxSizing: 'border-box'
            }}>
                <h2 style={{ textAlign: 'center', marginTop: '20px' }}>
                    Atık Yönetimi Analiz Grafiği
                </h2>

                {/* Proje Seçimi Dropdown */}
                <div style={{ width: '90%', margin: '20px auto', textAlign: 'center' }}>
                    <label htmlFor="project-select" style={{ marginRight: '10px', fontWeight: '500' }}>
                        Projeleri Seçin:
                    </label>
                    <div style={{ display: 'inline-block', width: '300px', textAlign: 'left' }}>
                        <Select
                            isMulti
                            options={projectOptions}
                            value={projectOptions.filter(option => selectedProjects.includes(option.value))}
                            onChange={handleProjectSelection}
                            placeholder="Projeleri seçin..."
                            styles={customSelectStyles}
                        />
                    </div>
                </div>

                {/* Çubuk Grafiği */}
                <div style={{ width: '90%', height: '500px', margin: '0 auto' }}>
                    {chartData[0] && Object.keys(chartData[0]).length <= 1 && !loading && (
                        <p style={{ textAlign: 'center', color: '#888' }}>
                            Gösterilecek veri bulunamadı. Lütfen bir proje seçin.
                        </p>
                    )}
                    {chartData[0] && Object.keys(chartData[0]).length > 1 && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="metric"
                                    label={{ value: 'Metrik', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    label={{
                                        value: 'Atık Kapasitesi (kg/gün)',
                                        angle: -90,
                                        position: 'insideLeft'
                                    }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    label={{
                                        value: 'Konteyner Sayısı',
                                        angle: 90,
                                        position: 'insideRight'
                                    }}
                                />
                                <Tooltip
                                    formatter={(value, name, props) => {
                                        const metric = props.payload.metric;
                                        return [
                                            `${value} ${metric === 'Atık Kapasitesi' ? 'kg/gün' : 'konteyner'}`,
                                            `${name} - ${metric}`
                                        ];
                                    }}
                                />
                                <Legend />
                                {projects
                                    .filter(project => selectedProjects.length === 0 || selectedProjects.includes(project.name))
                                    .map((project, index) => (
                                        <Bar
                                            key={project.name}
                                            dataKey={project.name}
                                            fill={colors[index % colors.length]}
                                            name={project.name}
                                        />
                                    ))}
                                <ReferenceLine
                                    y={averageWasteCapacity}
                                    yAxisId="left"
                                    stroke="red"
                                    strokeDasharray="3 3"
                                    label={{
                                        value: `Ort. Kapasite: ${averageWasteCapacity.toFixed(2)} kg/gün`,
                                        position: 'top'
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* POLYGON Projeleri Listesi */}
                <div style={{ marginTop: '20px', width: '90%', margin: '0 auto' }}>
                    <h3 style={{ textAlign: 'center' }}>Atık Yönetimi Projeleri</h3>
                    {loading && <p style={{ textAlign: 'center' }}>Yükleniyor...</p>}
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    {!loading && !error && projects.length === 0 && (
                        <p style={{ textAlign: 'center' }}>Atık Yönetimi ve POLYGON içeren proje bulunamadı.</p>
                    )}
                    {!loading && !error && projects.length > 0 && (
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginTop: '10px',
                                fontSize: '14px',
                                textAlign: 'left'
                            }}
                            className="ap-table"
                        >
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '10px' }}>Proje İsmi</th>
                                    <th style={{ padding: '10px' }}>Önerilen Konteynır Sayısı</th>
                                    <th style={{ padding: '10px' }}>Atık Kapasitesi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project, index) => (
                                    <tr
                                        key={project.id || `project-${index}`}
                                        style={{ borderBottom: '1px solid #e2e8f0' }}
                                    >
                                        <td style={{ padding: '10px' }}>{project.name || `Nokta-${index + 1}`}</td>
                                        <td style={{ padding: '10px' }}>{project.pointCount}</td>
                                        <td style={{ padding: '10px' }}>
                                            {project.wasteCapacity.toLocaleString('tr-TR')} kg/gün
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Atık Yönetimi Proje Detayları */}
                <div style={{ marginTop: '40px', width: '90%', margin: '0 auto' }}>
                    <h3 style={{ textAlign: 'center' }}>Atık Yönetimi Proje Detayları</h3>
                    {loading && <p style={{ textAlign: 'center' }}>Yükleniyor...</p>}
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    {!loading && !error && projects.length === 0 && (
                        <p style={{ textAlign: 'center' }}>Atık Yönetimi ve POLYGON içeren proje bulunamadı.</p>
                    )}
                    {!loading && !error && projects.length > 0 && (
                        <ProjectDetailsAccordion
                            polygonProjects={projects}
                            pointProjects={pointProjects}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WasteManagementPage;