import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './../css/Dashboard.css';

const API_BASE_URL = 'http://localhost:3000';

const OperatorDashboard = ({ userData, refreshUserData, billingUserId }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [priceInfo, setPriceInfo] = useState({});
    const [exitingSessionId, setExitingSessionId] = useState(null);
    const [message, setMessage] = useState('');

    const calculateParkingHours = useCallback((entryTime) => {
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;

        if (diffMs < 0) return 0;

        // Zaokrąglenie w górę do rozpoczętych godzin
        return Math.ceil(diffMs / (1000 * 60 * 60));
    }, []);

    const fetchParkingPrice = useCallback(async (hours) => {
        try {
            const url = `${API_BASE_URL}/api/calculate-price/${hours}`;
            const response = await fetch(url);

            if (!response.ok) {
                return { hours: 0, price: 0, currency: 'PLN' };
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching price:', error);
            return { hours: 0, price: 0, currency: 'PLN' };
        }
    }, []);

    const calculatePricesForSessions = useCallback(async (sessions) => {
        const prices = {};

        for (const session of sessions) {
            if (session.entry_time) {
                const hours = calculateParkingHours(session.entry_time);
                try {
                    prices[session.session_id] = await fetchParkingPrice(hours);
                } catch (err) {
                    console.error(`Error fetching price for session ${session.session_id}:`, err);
                }
            }
        }

        setPriceInfo(prices);
    }, [calculateParkingHours, fetchParkingPrice]);

    const fetchOperatorSessions = useCallback(async () => {
        try {
            const userId = userData?.user_id || userData?.id;
            if (!userId) {
                setError('User ID not found');
                setLoading(false);
                return;
            }

            const url = `${API_BASE_URL}/api/spots/${userId}`;
            const response = await fetch(url);

            if (!response.ok) {
                setError('Failed to fetch operator sessions');
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setSessions(data.sessions || []);
                // Oblicz ceny dla wszystkich sesji
                await calculatePricesForSessions(data.sessions || []);
            } else {
                setError(data.message || 'Failed to fetch sessions');
            }

            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching operator sessions:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [userData, calculatePricesForSessions]);

    useEffect(() => {
        let mounted = true;

        const loadData = () => {
            if (mounted) {
                fetchOperatorSessions();
            }
        };

        // Opóźnienie, aby uniknąć synchronicznych wywołań setState
        const timeoutId = setTimeout(loadData, 0);

        const interval = setInterval(() => {
            if (mounted) {
                fetchOperatorSessions();
            }
        }, 30000);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, [fetchOperatorSessions]);

    const handleEndParking = async (session) => {
        setExitingSessionId(session.session_id);
        setMessage('');

        try {
            const price = priceInfo[session.session_id];
            const url = `${API_BASE_URL}/api/exit`;
            const response = await axios.post(url, {
                spot_id: parseInt(session.spot_id, 10),
                price: price?.price || 0,
                user_id: billingUserId || userData?.user_id || userData?.id
            });

            if (response.data.success) {
                setMessage(`✓ ${response.data.message}`);

                // Odśwież dane użytkownika (saldo konta)
                if (refreshUserData) {
                    await refreshUserData();
                }

                // Odśwież listę sesji
                await fetchOperatorSessions();

                setTimeout(() => {
                    setMessage('');
                }, 3000);
            } else {
                setMessage('✗ Exit registration failed');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error during exit';
            setMessage(`✗ ${errorMsg}`);
        } finally {
            setExitingSessionId(null);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
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
                    <p>Error loading your parking sessions: {error}</p>
                    <button onClick={fetchOperatorSessions} className="retry-button">
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
                    <span>Your Active Parkings: {sessions.length}</span>
                </div>
                <button onClick={fetchOperatorSessions} className="refresh-button">
                    ↻ Refresh
                </button>
            </div>

            <div className="parking-list">
                {sessions.length === 0 ? (
                    <div className="empty-state">
                        You have no active parking sessions
                    </div>
                ) : (
                    sessions.map((session) => {
                        const price = priceInfo[session.session_id];
                        const hours = session.entry_time ? calculateParkingHours(session.entry_time) : 0;

                        return (
                            <div
                                key={session.session_id}
                                className="parking-item operator-session"
                            >
                                <div className="spot-info">
                                    <span className="spot-number">Spot #{session.spot_id}</span>
                                    <span className={`status-badge status-occupied`}>
                                        Active
                                    </span>
                                </div>

                                <div className="spot-details">
                                    <div className="vehicle-info">
                                        <span className="vehicle-plate">{session.plate_number}</span>
                                        <span className="vehicle-time">
                                            Entry: {formatDateTime(session.entry_time)}
                                        </span>
                                    </div>
                                </div>

                                <div className="session-pricing">
                                    <div className="pricing-info">
                                        <span className="pricing-label">Parking Time:</span>
                                        <span className="pricing-value">{hours} {hours === 1 ? 'hour' : 'hours'}</span>
                                    </div>
                                    {price && (
                                        <div className="pricing-info">
                                            <span className="pricing-label">Current Fee:</span>
                                            <span className="pricing-value price-highlight">
                                                {price.price} {price.currency}
                                            </span>
                                        </div>
                                    )}
                                    <div className="pricing-info">
                                        <span className="pricing-label">Payment Status:</span>
                                        <span className="payment-status unpaid">
                                            {session.payment_status}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleEndParking(session)}
                                    className="end-parking-button"
                                    disabled={exitingSessionId === session.session_id}
                                >
                                    {exitingSessionId === session.session_id ? 'Processing...' : 'End Parking'}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {message && (
                <div className={`message-box ${message.startsWith('✓') ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default OperatorDashboard;

