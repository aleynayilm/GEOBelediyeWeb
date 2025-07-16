import React, { useEffect, useState, useMemo } from "react";
import "../../Css/AnalysisPanel.css";

export function AnalysisPanel({
                                  minCoverCount,              // number
                                  capacityLtPerMin,           // number
                                  points,                     // [{id,name,lat,lon,waterLt,mahalle}]
                                  onMapClick,                 // () => void
                                  onEditClick,                // () => void  (Items düzenle)
                                  onEditMinCap,               // () => void  (Kalem tıklanınca)
                                  onSave,                     // (points) => void
                                  className = "",
                              }) {
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        // allow next paint, then add enter class for transition
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);

    /* ---- Scroll logic: >6 satırda tablo scroll olsun ---- */
    const scrollRowsThreshold = 6;
    const shouldScroll = points.length > scrollRowsThreshold;

    /* Tek tablo markup'ı; iki yerde kullanacağız */
    const tableMarkup = useMemo(() => (
        <table className="ap-table">
            <thead>
            <tr>
                <th>Nokta Adı</th>
                <th>Konum</th>
                <th>Tahmini Su Tutma (lt)</th>
                <th>Mahalle İsmi</th>
            </tr>
            </thead>
            <tbody>
            {points.map((p) => (
                <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                        {Number(p.lat).toFixed(4)}, {Number(p.lon).toFixed(4)}
                    </td>
                    <td>{p.waterLt}</td>
                    <td>{p.mahalle}</td>
                </tr>
            ))}
            </tbody>
        </table>
    ), [points]);

    return (
        <div
            className={`ap-root ${entered ? "ap-entered" : "ap-enter"} ${className}`}
            role="region"
            aria-label="Analiz Sonuçları"
        >
            <header className="ap-header">
                <h2>Analiz Sonuçları</h2>
                <div className="ap-header-actions">
                    <button type="button" className="ap-btn" onClick={onMapClick}>
                        Haritayı Görüntüle
                    </button>
                    <button type="button" className="ap-btn" onClick={onEditClick}>
                        Öğeleri Düzenle
                    </button>
                </div>
            </header>

            <div className="ap-metrics">
                <div className="ap-metric-card ap-metric-orange">
                    <div className="ap-metric-body">
                        <span className="ap-metric-label">Önerilen Minimum Kapak Sayısı</span>
                        <span className="ap-metric-value">{minCoverCount}</span>
                    </div>
                    <button
                        type="button"
                        className="ap-metric-edit"
                        aria-label="Minimum kapak sayısını düzenle"
                        onClick={onEditMinCap}
                    >
                        <PencilIcon />
                    </button>
                </div>

                <div className="ap-metric-card ap-metric-blue">
                    <div className="ap-metric-body">
                        <span className="ap-metric-label">Altyapı Kapasitesi</span>
                        <span className="ap-metric-value">
              {capacityLtPerMin.toLocaleString("tr-TR")}{" "}
                            <span className="ap-metric-unit">lt/dk</span>
            </span>
                    </div>
                </div>
            </div>

            <div className="ap-table-wrapper">
                {shouldScroll ? (
                    <div className="ap-table-scroll">
                        {tableMarkup}
                    </div>
                ) : (
                    tableMarkup
                )}

                <div className="ap-table-actions">
                    <button
                        type="button"
                        className="ap-save-btn"
                        onClick={() => onSave?.(points)}
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}

/* --- Small inline SVGs --- */
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
