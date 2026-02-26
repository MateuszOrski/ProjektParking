import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './../css/ParkingEntry.css';

const ParkingEntry = ({ userData }) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parkingData, setParkingData] = useState(null);
    const qrCodeRef = useRef(null);

    const API_BASE_URL = 'http://localhost:3000';
    const DURATION = 999;

    const getRandomSpotId = () => {
        return Math.floor(Math.random() * 50) + 1;
    };

    useEffect(() => {
        if (parkingData && qrCodeRef.current) {
            generateQRCode(parkingData);
        }
    }, [parkingData]);

    const generateQRCode = (data) => {
        const tryGenerateQR = () => {
            if (!window.QRCode) {
                console.error('QRCode library not loaded yet, retrying...');
                setTimeout(tryGenerateQR, 100);
                return;
            }

            if (!qrCodeRef.current) {
                console.error('QR Code container ref not available');
                return;
            }

            if (!data?.ticketUrl) {
                console.error('Missing ticket URL for QR generation');
                return;
            }

            qrCodeRef.current.innerHTML = '';

            const qrData = data.ticketUrl;

            try {
                new window.QRCode(qrCodeRef.current, {
                    text: qrData,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.H
                });
                console.log('QR Code generated successfully');
            } catch (error) {
                console.error('QR Code generation error:', error);
            }
        };

        tryGenerateQR();
    };

    const handlePark = async () => {
        setIsLoading(true);
        setMessage('Analyzing license plate...');
        setParkingData(null);

        try {
            // Krok 1: Pobierz tablicę rejestracyjną z /api/analyze-random
            const analyzeUrl = API_BASE_URL + '/api/analyze-random';
            const analyzeResponse = await axios.get(analyzeUrl);

            if (!analyzeResponse.data.success) {
                setMessage('✗ Failed to analyze license plate');
                setIsLoading(false);
                return;
            }

            // Poprawne odczytanie tablicy z zagnieżdżonej struktury
            const results = analyzeResponse.data.analysis?.results;

            if (!results || results.length === 0) {
                setMessage('✗ No plate number detected');
                setIsLoading(false);
                return;
            }

            const plateNumber = results[0].plate;

            if (!plateNumber) {
                setMessage('✗ No plate number detected');
                setIsLoading(false);
                return;
            }

            setMessage(`Detected plate: ${plateNumber}. Parking...`);

            // Krok 2: Losuj spot_id
            const spotId = getRandomSpotId();

            // Krok 3: Zaparkuj pojazd
            const entryUrl = API_BASE_URL + '/api/entry';
            const entryResponse = await axios.post(entryUrl, {
                spot_id: spotId,
                plate_number: plateNumber,
                duration_hours: DURATION,
                user_id: userData?.user_id || userData?.id
            });

            const token = entryResponse.data?.token;
            if (!token) {
                setMessage('✗ Brak tokenu biletu z serwera');
                setIsLoading(false);
                return;
            }

            const entryTime = new Date().toISOString();
            const ticketUrl = `${API_BASE_URL}/api/get-ticket/${encodeURIComponent(token)}`;
            const data = {
                plateNumber: plateNumber,
                entryTime: entryTime,
                spotId: spotId,
                duration: DURATION,
                token: token,
                ticketUrl: ticketUrl
            };

            setMessage(`✓ Parking successful!`);
            setParkingData(data);

        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error while parking';
            setMessage(`✗ ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="parking-entry-container">
            <h2 className="parking-entry-title">Parking Entry</h2>

            <div className="parking-info">
                <p className="parking-info-text">
                    Click the button below to automatically detect a license plate and assign a parking spot.
                </p>
            </div>

            <button
                type="button"
                onClick={handlePark}
                disabled={isLoading}
                className="park-button"
            >
                {isLoading ? 'Processing...' : 'Park a car'}
            </button>

            {message && (
                <div className={`message-box ${message.startsWith('✓') ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}

            {parkingData && (
                <div className="ticket-container">
                    <h3 className="ticket-title">Parking Ticket</h3>
                    <div ref={qrCodeRef} className="qr-code-wrapper" />
                    <div className="ticket-info">
                        <p>
                            <strong>Plate:</strong> {parkingData.plateNumber}
                        </p>
                        <p>
                            <strong>Entry Time:</strong> {new Date(parkingData.entryTime).toLocaleString()}
                        </p>
                        <p>
                            <strong>Spot:</strong> {parkingData.spotId}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParkingEntry;
