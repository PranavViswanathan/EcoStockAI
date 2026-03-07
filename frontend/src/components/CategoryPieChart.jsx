import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ color: payload[0].color, fontWeight: 600 }}>{payload[0].name}: {payload[0].value} items</p>
            </div>
        );
    }
    return null;
};

export default function CategoryPieChart({ data }) {
    return (
        <div className="glass-panel">
            <h2 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>🗂️ Inventory by Category</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                Distribution of items across categories
            </p>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={0.85}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
