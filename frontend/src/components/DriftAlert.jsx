import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

export default function DriftAlert({ status }) {
    if (!status) return null;

    const hasDrift = status.dataset_drift;

    return (
        <div className="glass-panel animate-fade-in" style={{
            borderColor: hasDrift ? 'var(--warning)' : 'var(--glass-border)',
            background: hasDrift ? 'rgba(245, 158, 11, 0.05)' : 'var(--glass-bg)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                {hasDrift ? <AlertTriangle color="var(--warning)" /> : <Activity color="var(--success)" />}
                <h2 style={{ fontSize: '1.2rem', color: hasDrift ? 'var(--warning)' : 'var(--text-primary)' }}>
                    Model Health & Drift Detection
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span style={{ fontWeight: 600, color: hasDrift ? 'var(--warning)' : 'var(--success)' }}>
                        {hasDrift ? 'Drift Detected' : 'Healthy'}
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Drift Share:</span>
                    <span>{(status.drift_share * 100).toFixed(1)}%</span>
                </div>

                {hasDrift && status.drifted_features.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Drifted Features:</span>
                        <span style={{ textAlign: 'right' }}>{status.drifted_features.join(', ')}</span>
                    </div>
                )}

                {status.report_html_path && (
                    <div style={{ marginTop: '12px' }}>
                        <a href={`http://localhost:8001/reports/${status.report_html_path.split('/').pop()}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View Evidently Report ↗
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
