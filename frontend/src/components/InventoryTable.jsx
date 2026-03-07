import React from 'react';
import PredictionBadge from './PredictionBadge';

export default function InventoryTable({ items, predictions, onRefresh }) {
    const getStockoutBadge = (days) => {
        if (days === undefined) return <span className="badge badge-secondary">Loading...</span>;
        if (days <= 7) return <span className="badge badge-danger">{days} days (Critical)</span>;
        if (days <= 14) return <span className="badge badge-warning">{days} days (Low)</span>;
        return <span className="badge badge-success">{days} days (Healthy)</span>;
    };

    return (
        <div className="glass-panel">
            <h2 style={{ marginBottom: "16px", color: "var(--text-primary)", fontSize: "1.2rem" }}>Inventory Status</h2>
            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Daily Usage</th>
                            <th>Stockout Prediction</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => {
                            const pred = predictions[item.id];
                            return (
                                <React.Fragment key={item.id}>
                                    <tr>
                                        <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.name}</td>
                                        <td>{item.category}</td>
                                        <td>{item.quantity.toFixed(1)} {item.unit}</td>
                                        <td>{item.avg_daily_usage} / day</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>{getStockoutBadge(pred?.days_until_stockout)}</div>
                                                {pred?.insight_message && pred.days_until_stockout <= 14 && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', maxWidth: '250px', lineHeight: '1.3' }}>
                                                        ✨ {pred.insight_message}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{pred ? <PredictionBadge source={pred.prediction_source} /> : '-'}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="6" style={{ padding: 0 }}></td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", fontStyle: "italic", padding: "32px" }}>
                                    No items found. Add some inventory!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
