import React, { useState } from 'react';
import { FastForward, RotateCcw, RefreshCcw } from 'lucide-react';
import { advanceDays, resetToSeed, resetQuantities } from '../api/client';

export default function DevModePanel({ onAdvanced }) {
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [refilling, setRefilling] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            await advanceDays(days);
            onAdvanced();
        } catch (e) {
            console.error(e);
            alert('Failed to simulate time jump.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetQuantities = async () => {
        setRefilling(true);
        try {
            await resetQuantities();
            onAdvanced();
        } catch (e) {
            console.error(e);
            alert('Failed to refill quantities.');
        } finally {
            setRefilling(false);
        }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await resetToSeed();
            onAdvanced();
        } catch (e) {
            console.error(e);
            alert('Failed to reset inventory.');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ borderColor: 'var(--accent-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FastForward color="var(--accent-color)" />
                <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}>Developer Mode</h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Simulate time passing to generate usage history and trigger Airflow drift detection DAGs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                        type="range"
                        min="1"
                        max="60"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>{days} Days</span>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleSimulate}
                    disabled={loading || resetting || refilling}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? 'Simulating...' : '⏩ Advance Time'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleResetQuantities}
                    disabled={loading || resetting || refilling}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <RefreshCcw size={16} />
                    {refilling ? 'Refilling...' : 'Reset Quantities (Refill)'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={loading || resetting || refilling}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}
                >
                    <RotateCcw size={16} />
                    {resetting ? 'Resetting...' : 'Full System Reset'}
                </button>
            </div>
        </div>
    );
}
