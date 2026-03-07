import React, { useState } from 'react';
import { createItem } from '../api/client';

export default function AddItemModal({ onClose, onAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Perishable',
        quantity: 10,
        unit: 'units',
        avg_daily_usage: 1.0,
        shelf_life_days: 30,
        reorder_threshold: 5
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await createItem(formData);
            onAdded();
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="title-glow" style={{ fontSize: "1.5rem", marginBottom: "24px" }}>Add New Inventory</h2>
                {error && <div style={{ color: "var(--danger)", marginBottom: "16px", padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Item Name</label>
                        <input name="name" required maxLength={100} value={formData.name} onChange={handleChange} placeholder="e.g., Oat Milk (1L)" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="Perishable">Perishable</option>
                                <option value="Non-Perishable">Non-Perishable</option>
                                <option value="Equipment">Equipment</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unit</label>
                            <input name="unit" required value={formData.unit} onChange={handleChange} placeholder="e.g., cartons" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Initial Quantity</label>
                            <input name="quantity" type="number" step="0.1" min="0" required value={formData.quantity} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Avg Daily Usage</label>
                            <input name="avg_daily_usage" type="number" step="0.1" min="0.1" required value={formData.avg_daily_usage} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Shelf Life (days)</label>
                            <input name="shelf_life_days" type="number" min="1" required value={formData.shelf_life_days} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Reorder Threshold</label>
                            <input name="reorder_threshold" type="number" min="0" required value={formData.reorder_threshold} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
