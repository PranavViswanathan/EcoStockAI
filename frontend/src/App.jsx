import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import InventoryTable from './components/InventoryTable';
import AddItemModal from './components/AddItemModal';
import DriftAlert from './components/DriftAlert';
import DevModePanel from './components/DevModePanel';
import StockLevelChart from './components/StockLevelChart';
import UsageTrendChart from './components/UsageTrendChart';
import CategoryPieChart from './components/CategoryPieChart';
import StockoutCountdownChart from './components/StockoutCountdownChart';
import { getItems, getPrediction, getDriftStatus, getUsageHistory, getStockLevels, getCategoryBreakdown } from './api/client';

function App() {
  const [items, setItems] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [driftStatus, setDriftStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [usageHistory, setUsageHistory] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');

  const loadData = async () => {
    try {
      const data = await getItems(search, category);
      setItems(data);

      const preds = {};
      for (const item of data) {
        try {
          preds[item.id] = await getPrediction(item.id);
        } catch (e) {
          console.error(`Failed to get prediction for ${item.id}`, e);
        }
      }
      setPredictions(preds);

      const drift = await getDriftStatus();
      setDriftStatus(drift);

      // Load analytics data
      const [usage, levels, cats] = await Promise.all([
        getUsageHistory(),
        getStockLevels(),
        getCategoryBreakdown(),
      ]);
      setUsageHistory(usage);
      setStockLevels(levels);
      setCategoryBreakdown(cats);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, category]);

  // Build stockout prediction chart data from predictions
  const stockoutChartData = items
    .filter(item => predictions[item.id]?.days_until_stockout !== undefined)
    .map(item => ({
      name: item.name,
      days_until_stockout: Number(predictions[item.id]?.days_until_stockout?.toFixed(1) ?? 0),
    }));

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    border: 'none',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255,255,255,0.07)',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    boxShadow: activeTab === tab ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
  });

  return (
    <div className="app-container">
      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Leaf color="var(--success)" size={32} />
          <h1 className="title-glow">EcoStock AI</h1>
        </div>
        <div className="header-controls">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Perishable">Perishable</option>
            <option value="Non-Perishable">Non-Perishable</option>
            <option value="Equipment">Equipment</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Item
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button style={tabStyle('inventory')} onClick={() => setActiveTab('inventory')}>
          📋 Inventory
        </button>
        <button style={tabStyle('charts')} onClick={() => setActiveTab('charts')}>
          📊 Analytics
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="main-grid">
          <div className="main-content">
            <InventoryTable
              items={items}
              predictions={predictions}
              onRefresh={loadData}
            />
          </div>
          <div className="side-panels">
            <DriftAlert status={driftStatus} />
            <DevModePanel onAdvanced={loadData} />
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div>
          {/* Full-width charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <StockLevelChart data={stockLevels} />
            <StockoutCountdownChart data={stockoutChartData} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <UsageTrendChart data={usageHistory} />
            <CategoryPieChart data={categoryBreakdown} />
          </div>
          {/* Below charts: still show side panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            <DriftAlert status={driftStatus} />
            <DevModePanel onAdvanced={loadData} />
          </div>
        </div>
      )}

      {showModal && <AddItemModal onClose={() => setShowModal(false)} onAdded={loadData} />}
    </div>
  );
}

export default App;
