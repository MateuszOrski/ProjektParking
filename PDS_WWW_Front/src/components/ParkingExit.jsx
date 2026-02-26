import React, { useState } from 'react';
import axios from 'axios';
import './../css/ParkingExit.css';

const ParkingExit = ({ userData, refreshUserData }) => {
    const [spotId, setSpotId] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parkingInfo, setParkingInfo] = useState(null);
    const [priceInfo, setPriceInfo] = useState(null);
    const [step, setStep] = useState(1);
    const API_BASE_URL = 'http://localhost:3000';

    const handleCheckSpot = async (e) => {
        e.preventDefault();

        if (!spotId.trim()) {
            setMessage('Please enter a spot ID');
            return;
        }

        const spotIdNumber = parseInt(spotId, 10);
        if (isNaN(spotIdNumber) || spotIdNumber <= 0) {
            setMessage('Please enter a valid spot number');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setParkingInfo(null);

        try {
            const url = API_BASE_URL + `/api/spot-history/${spotIdNumber}`
            const response = await axios.get(url);

            if (response.data && response.data.history && response.data.history.length > 0) {
                const currentSession = response.data.history[0];
                const exitTime = new Date(currentSession.exit_time);
                const now = new Date();

                if (exitTime > now) {
                    setParkingInfo({
                        ...currentSession,
                        spot_id: response.data.spot_id
                    });

                    // Oblicz godziny parkowania i pobierz cenę
                    const hours = calculateParkingHours(currentSession.entry_time);
                    const priceData = await fetchParkingPrice(hours);
                    setPriceInfo(priceData);

                    setStep(2);
                    setMessage('');
                } else {
                    setMessage('✗ No active parking session found for this spot');
                }
            } else {
                setMessage('✗ No parking history found for this spot');
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setMessage('✗ No parking history found for this spot');
            } else {
                const errorMsg = error.response?.data?.message || 'Error fetching parking information';
                setMessage(`✗ ${errorMsg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmExit = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            const url = API_BASE_URL + '/api/exit';
            const response = await axios.post(url, {
                spot_id: parseInt(spotId, 10),
                price: priceInfo?.price || 0,
                user_id: userData?.user_id || userData?.id
            });

            if (response.data.success) {
                setMessage(`✓ ${response.data.message}`);

                // Odśwież dane użytkownika (saldo konta)
                if (refreshUserData) {
                    await refreshUserData();
                }

                setTimeout(() => {
                    setSpotId('');
                    setParkingInfo(null);
                    setPriceInfo(null);
                    setStep(1);
                    setMessage('');
                }, 3000);
            } else {
                setMessage('✗ Exit registration failed');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error during exit';
            setMessage(`✗ ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setSpotId('');
        setParkingInfo(null);
        setPriceInfo(null);
        setStep(1);
        setMessage('');
    };

    const calculateParkingHours = (entryTime) => {
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;

        if (diffMs < 0) return 0;

        // Zaokrąglenie w górę do rozpoczętych godzin
        return Math.ceil(diffMs / (1000 * 60 * 60));
    };

    const fetchParkingPrice = async (hours) => {
        try {
            const url = `${API_BASE_URL}/api/calculate-price/${hours}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching price:', error);
            return null;
        }
    };

    return (
        <div className="parking-exit-container">
            <h2 className="parking-exit-title">Early Exit</h2>

            {step === 1 && (
                <form onSubmit={handleCheckSpot}>
                    <div className="form-group">
                        <label htmlFor="spotId" className="form-label">
                            Parking Spot Number:
                        </label>
                        <input
                            id="spotId"
                            type="number"
                            min="1"
                            value={spotId}
                            onChange={(e) => setSpotId(e.target.value)}
                            placeholder="e.g., 42"
                            className="form-input"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="check-button"
                    >
                        {isLoading ? 'Checking...' : 'Check Spot'}
                    </button>
                </form>
            )}

            {step === 2 && parkingInfo && (
                <div className="confirmation-section">
                    <div className="parking-info-card">
                        <h3>Active Parking Session</h3>
                        <div className="info-row">
                            <span className="info-label">Spot:</span>
                            <span className="info-value">{parkingInfo.spot_id}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">License Plate:</span>
                            <span className="info-value">{parkingInfo.plate_number}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Entry Time:</span>
                            <span className="info-value">
                                {new Date(parkingInfo.entry_time).toLocaleString()}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Scheduled Exit:</span>
                            <span className="info-value">
                                {new Date(parkingInfo.exit_time).toLocaleString()}
                            </span>
                        </div>
                        {priceInfo && (
                            <div className="info-row">
                                <span className="info-label">Parking Fee:</span>
                                <span className="info-value price-value">
                                    {priceInfo.price} {priceInfo.currency}
                                </span>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="info-label">Payment Status:</span>
                            <span className={`info-value status-${parkingInfo.payment_status?.toLowerCase()}`}>
                                {parkingInfo.payment_status}
                            </span>
                        </div>
                    </div>

                    <div className="button-group">
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmExit}
                            disabled={isLoading}
                            className="exit-button"
                        >
                            {isLoading ? 'Processing...' : 'Confirm Exit'}
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <div className={`message-box ${message.startsWith('✓') ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default ParkingExit;
