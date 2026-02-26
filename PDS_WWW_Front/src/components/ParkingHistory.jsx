import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ParkingHistory = ({ spot, onBack, apiBaseUrl }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [priceData, setPriceData] = useState({});

    const API_BASE_URL = 'http://localhost:3000';

    useEffect(() => {
        if (spot) {
            fetchHistory(spot.spot_id);
        }
    }, [spot]);

    const fetchHistory = async (spotId) => {
        setLoading(true);
        setError(null);

        try {
            const url = `${API_BASE_URL}/api/spot-history/${spotId}`;
            console.log('Fetching history from:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server did not return JSON');
            }

            const data = await response.json();
            console.log('Received history:', data);

            setHistoryData(data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
            setLoading(false);
            setHistoryData(null);
        }
    };

    const getFilteredHistory = () => {
        if (!historyData || !historyData.history) return [];

        return historyData.history.filter(record => {
            if (!record.entry_time) return false;
            const recordDate = new Date(record.entry_time).toISOString().split('T')[0];
            return recordDate === selectedDate;
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Ongoing...';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const calculateParkingHours = (entryTime) => {
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;

        if (diffMs < 0) return 0;

        // Zaokrąglenie w górę do rozpoczętych godzin
        return Math.ceil(diffMs / (1000 * 60 * 60));
    };

    const fetchParkingPrice = async (hours, recordIndex) => {
        try {
            const url = `${API_BASE_URL}/api/calculate-price/${hours}`;
            const response = await axios.get(url);
            setPriceData(prev => ({
                ...prev,
                [recordIndex]: response.data
            }));
        } catch (error) {
            console.error('Error fetching price:', error);
        }
    };

    const isActiveSession = (record) => {
        if (!record.exit_time) return true;
        const exitTime = new Date(record.exit_time);
        const now = new Date();
        return exitTime > now;
    };

    useEffect(() => {
        // Fetch prices for active sessions
        if (historyData && historyData.history) {
            historyData.history.forEach((record, index) => {
                if (isActiveSession(record)) {
                    const hours = calculateParkingHours(record.entry_time);
                    fetchParkingPrice(hours, index);
                }
            });
        }
    }, [historyData]);

    const getPaymentStatusClass = (status) => {
        return status === 'PAID' ? 'payment-paid' : 'payment-unpaid';
    };

    const getPaymentStatusLabel = (status) => {
        return status === 'PAID' ? 'Paid' : 'Unpaid';
    };

    if (!spot) return null;

    const filteredHistory = getFilteredHistory();

    return (
        <div className="history-view">
            <div className="history-header">
                <button className="back-button" onClick={onBack}>
                    ← Back to list
                </button>
                <div className="history-title">
                    <h1>Parking Spot #{spot.spot_number} History</h1>
                    <p className="history-subtitle">Floor {spot.floor}</p>
                    {historyData && (
                        <p className="history-count">Total records: {historyData.count}</p>
                    )}
                </div>
            </div>

            <div className="date-selector">
                <label htmlFor="history-date">Select date:</label>
                <input
                    id="history-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="date-input"
                />
            </div>

            <div className="history-content">
                {loading ? (
                    <div className="loading">Loading history...</div>
                ) : error ? (
                    <div className="error-state">
                        <p>Error loading history: {error}</p>
                        <button
                            onClick={() => fetchHistory(spot.spot_id)}
                            className="retry-button"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="empty-state">
                        {historyData && historyData.count === 0 ? (
                            <p>No parking history available for this spot</p>
                        ) : (
                            <p>No parking history for the selected date</p>
                        )}
                    </div>
                ) : (
                    <div className="history-list">
                        {filteredHistory.map((record, index) => (
                            <div key={index} className="history-item">
                                <div className="history-header-row">
                                    <div className="history-plate">
                                        <span className="plate-label">License plate:</span>
                                        <span className="plate-value">
                      {record.plate_number || 'N/A'}
                    </span>
                                    </div>
                                    <span className={`payment-badge ${getPaymentStatusClass(record.payment_status)}`}>
                    {getPaymentStatusLabel(record.payment_status)}
                  </span>
                                </div>
                                <div className="history-times">
                                    <div className="time-entry">
                                        <span className="time-label">Entry time:</span>
                                        <span className="time-value">{formatDateTime(record.entry_time)}</span>
                                    </div>
                                </div>
                                {isActiveSession(record) && priceData[index] && (
                                    <div className="history-price-info">
                                        <div className="price-entry">
                                            <span className="price-label">Current Fee:</span>
                                            <span className="price-value price-highlight">
                                                {priceData[index].price} {priceData[index].currency}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParkingHistory;
