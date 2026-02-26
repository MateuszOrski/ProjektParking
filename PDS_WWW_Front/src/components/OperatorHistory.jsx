import React, { useState, useEffect, useCallback } from 'react';
import './../css/Dashboard.css';

const API_BASE_URL = 'http://localhost:3000';

const OperatorHistory = ({ userData }) => {
    const [sessions, setSessions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOperatorHistory = useCallback(async () => {
        try {
            const userId = userData?.user_id || userData?.id;
            if (!userId) {
                setError('User ID not found');
                setLoading(false);
                return;
            }

            const url = `${API_BASE_URL}/api/history/${userId}`;
            const response = await fetch(url);

            if (!response.ok) {
                setError('Failed to fetch operator history');
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (Array.isArray(data.history)) {
                setSessions(data.history || []);
                setTotalCount(typeof data.count === 'number' ? data.count : data.history.length);
                setLoading(false);
                setError(null);
            } else {
                setError(data.message || 'Failed to fetch history');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching operator history:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [userData]);

    useEffect(() => {
        let mounted = true;

        const loadData = () => {
            if (mounted) {
                fetchOperatorHistory();
            }
        };

        // Opóźnienie, aby uniknąć synchronicznych wywołań setState
        const timeoutId = setTimeout(loadData, 0);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [fetchOperatorHistory]);

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    if (loading) {
        return (
            <div className="parking-management">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="parking-management">
                <div className="error-state">
                    <p>Error loading parking history: {error}</p>
                    <button onClick={fetchOperatorHistory} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="parking-management">
            <div className="header">
                <div className="stats">
                    <span>Total Parking Sessions: {totalCount}</span>
                </div>
                <button onClick={fetchOperatorHistory} className="refresh-button">
                    ↻ Refresh
                </button>
            </div>

            <div className="parking-list">
                {sessions.length === 0 ? (
                    <div className="empty-state">
                        No parking history found
                    </div>
                ) : (
                    sessions.map((session, index) => {
                        const normalizedStatus = String(session.payment_status || '').toUpperCase();
                        const isPaid = normalizedStatus === 'PAIN' || normalizedStatus === 'PAID';
                        const paymentLabel = isPaid ? 'Paid' : 'Unpaid';
                        const isActive = !session.end_time;

                        return (
                            <div
                                key={`${session.spot_id || 'spot'}-${session.start_time || 'start'}-${session.plate_number || index}`}
                                className={`parking-item ${isActive ? 'active-session' : 'completed-session'}`}
                            >
                                <div className="spot-info">
                                    <span className="spot-number">
                                        Spot #{session.spot_number ?? 'N/A'}
                                    </span>
                                    {session.floor !== undefined && session.floor !== null && (
                                        <span className="spot-number">
                                            Floor: {session.floor}
                                        </span>
                                    )}
                                    <span className={`status-badge ${isActive ? 'status-occupied' : 'status-completed'}`}>
                                        {isActive ? 'Active' : 'Completed'}
                                    </span>
                                </div>

                                <div className="spot-details">
                                    <div className="vehicle-info">
                                        <span className="vehicle-plate">{session.plate_number}</span>
                                        <span className="vehicle-time">
                                            Entry: {formatDateTime(session.start_time)}
                                        </span>
                                        {session.end_time && (
                                            <span className="vehicle-time">
                                                Exit: {formatDateTime(session.end_time)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="session-pricing">
                                    {session.total_cost !== null && session.total_cost !== undefined && (
                                        <div className="pricing-info">
                                            <span className="pricing-label">Total Fee:</span>
                                            <span className="pricing-value price-highlight">
                                                {session.total_cost} PLN
                                            </span>
                                        </div>
                                    )}
                                    <div className="pricing-info">
                                        <span className="pricing-label">Payment Status:</span>
                                        <span className={`payment-status ${isPaid ? 'paid' : 'unpaid'}`}>
                                            {paymentLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default OperatorHistory;

