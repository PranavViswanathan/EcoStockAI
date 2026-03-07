import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const days = payload[0]?.value;
        const urgency = days <= 7 ? '🔴 Critical' : days <= 14 ? '🟡 Low' : '🟢 Healthy';
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>{label}</p>
                <p style={{ color: '#fff', fontWeight: 600 }}>{days?.toFixed(1)} days remaining</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>{urgency}</p>
            </div>
        );
    }
    return null;
};

export default function StockoutCountdownChart({ data }) {
    const chartData = data.map(item => ({
        name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
        days: item.days_until_stockout,
    })).sort((a, b) => a.days - b.days);

    const getColor = (days) => {
        if (days <= 7) return '#ef4444';
        if (days <= 14) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className="glass-panel">
            <h2 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>⏱️ Days Until Stockout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                AI-predicted days until each item runs out (sorted urgency)
            </p>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={7} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.7} />
                    <ReferenceLine x={14} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />
                    <Bar dataKey="days" name="days" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={index} fill={getColor(entry.days)} fillOpacity={0.85} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
