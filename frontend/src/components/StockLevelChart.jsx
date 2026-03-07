import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ color: '#94a3b8', marginBottom: '4px', fontSize: '0.85rem' }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color, fontWeight: 600, fontSize: '0.9rem' }}>
                        {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {p.name === 'quantity' ? 'units' : ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function StockLevelChart({ data }) {
    const getBarColor = (entry) => {
        if (entry.quantity <= entry.reorder_threshold) return '#ef4444';
        if (entry.quantity <= entry.reorder_threshold * 2) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className="glass-panel">
            <h2 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>📦 Current Stock Levels</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Bar turns red when below reorder threshold
            </p>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="quantity" name="quantity" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={index} fill={getBarColor(entry)} fillOpacity={0.85} />
                        ))}
                    </Bar>
                    {data.map((entry, index) => (
                        <ReferenceLine
                            key={index}
                            y={entry.reorder_threshold}
                            stroke="#f59e0b"
                            strokeDasharray="4 2"
                            strokeOpacity={0.5}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
