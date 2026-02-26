import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import './../css/ParkingStats.css';


const API_BASE_URL = 'http://localhost:3000';

const ParkingStats = () => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState('all');
    const [showOnlyUsed, setShowOnlyUsed] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);

        try {
            const url = `${API_BASE_URL}/api/stats`;
            console.log('Fetching stats from:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server did not return JSON');
            }

            const data = await response.json();
            console.log('Received stats:', data);

            setStatsData(data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        if (!statsData || !statsData.data) return [];

        let filtered = statsData.data;

        if (selectedFloor !== 'all') {
            filtered = filtered.filter(spot => spot.floor === parseInt(selectedFloor));
        }

        if (showOnlyUsed) {
            filtered = filtered.filter(spot => spot.count > 0);
        }

        return filtered.sort((a, b) => b.count - a.count);
    };

    const getUniqueFloors = () => {
        if (!statsData || !statsData.data) return [];
        const floors = [...new Set(statsData.data.map(spot => spot.floor))];
        return floors.sort((a, b) => a - b);
    };

    const getTotalUsage = () => {
        if (!statsData || !statsData.data) return 0;
        return statsData.data.reduce((sum, spot) => sum + spot.count, 0);
    };

    const getMostUsedSpot = () => {
        const data = getFilteredData();
        if (data.length === 0) return null;
        return data[0];
    };

    const getAverageUsage = () => {
        if (!statsData || !statsData.data) return 0;
        const usedSpots = statsData.data.filter(s => s.count > 0);
        if (usedSpots.length === 0) return 0;
        const total = usedSpots.reduce((sum, spot) => sum + spot.count, 0);
        return (total / usedSpots.length).toFixed(1);
    };

    // Custom bar colors based on usage
    const getBarColor = (count) => {
        if (count === 0) return '#e0e0e0';
        if (count <= 2) return '#81c784';
        if (count <= 5) return '#4caf50';
        return '#2e7d32';
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-title">Spot {data.spot_number}</p>
                    <p className="tooltip-floor">Floor {data.floor}</p>
                    <p className="tooltip-count">Usage: {data.count} times</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="stats-container">
                <div className="loading">Loading statistics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-container">
                <div className="error-state">
                    <h2>Error loading statistics</h2>
                    <p className="error-message">{error}</p>
                    <div className="error-details">
                        <p>Check the browser console for more details.</p>
                        <p>Make sure the API is running at: <code>{API_BASE_URL}/api/stats</code></p>
                    </div>
                    <button onClick={fetchStats} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const filteredData = getFilteredData();
    const mostUsed = getMostUsedSpot();

    return (
        <div className="stats-container">
            <div className="stats-header">
                <div>
                    <h1>Parking Usage Statistics</h1>
                    <p className="stats-date">
                        Date: {new Date(statsData.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                    </p>
                </div>
                <button onClick={fetchStats} className="refresh-button">
                    ↻ Refresh
                </button>
            </div>

            <div className="stats-summary">
                <div className="summary-card">
                    <span className="summary-label">Total Usage</span>
                    <span className="summary-value">{getTotalUsage()}</span>
                    <span className="summary-desc">parking sessions</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Active Spots</span>
                    <span className="summary-value">
            {statsData.data.filter(s => s.count > 0).length}
          </span>
                    <span className="summary-desc">out of {statsData.data.length} total</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Average Usage</span>
                    <span className="summary-value">{getAverageUsage()}</span>
                    <span className="summary-desc">per active spot</span>
                </div>
                {mostUsed && (
                    <div className="summary-card highlight">
                        <span className="summary-label">Most Used Spot</span>
                        <span className="summary-value">
              {mostUsed.spot_number}
            </span>
                        <span className="summary-desc">{mostUsed.count} times</span>
                    </div>
                )}
            </div>

            <div className="stats-filters">
                <div className="filter-group">
                    <label htmlFor="floor-filter">Floor:</label>
                    <select
                        id="floor-filter"
                        value={selectedFloor}
                        onChange={(e) => setSelectedFloor(e.target.value)}
                        className="filter-dropdown"
                    >
                        <option value="all">All floors</option>
                        {getUniqueFloors().map(floor => (
                            <option key={floor} value={floor}>
                                Floor {floor}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group checkbox-group">
                    <input
                        type="checkbox"
                        id="show-used"
                        checked={showOnlyUsed}
                        onChange={(e) => setShowOnlyUsed(e.target.checked)}
                    />
                    <label htmlFor="show-used">Show only used spots</label>
                </div>
            </div>

            <div className="chart-container">
                {filteredData.length === 0 ? (
                    <div className="empty-state">
                        No data available for the selected filters
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="spot_number"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                label={{ value: 'Number of Uses', angle: -90, position: 'insideLeft' }}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                content={() => (
                                    <div className="chart-legend">
                                        <span>Parking spot usage count</span>
                                    </div>
                                )}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ParkingStats;
