import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ color: '#94a3b8', marginBottom: '4px', fontSize: '0.85rem' }}>{label}</p>
                <p style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.9rem' }}>
                    Used: {payload[0]?.value?.toFixed(2)} units
                </p>
            </div>
        );
    }
    return null;
};

export default function UsageTrendChart({ data }) {
    return (
        <div className="glass-panel">
            <h2 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>📈 Usage Trend (Last 30 Days)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Total daily units consumed across all items
            </p>
            {data.length === 0 ? (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    No usage history yet. Use "Advance Time" in Developer Mode to generate data.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="quantity_used"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#usageGrad)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#60a5fa' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
