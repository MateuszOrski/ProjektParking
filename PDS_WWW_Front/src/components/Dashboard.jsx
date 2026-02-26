import React, { useState, useEffect } from 'react';
import ParkingDashboard from './ParkingDashboard';
import ParkingHistory from './ParkingHistory';
import OperatorDashboard from './OperatorDashboard';
import './../css/Dashboard.css';

const API_BASE_URL = 'http://localhost:3000';

const Dashboard = ({ userData, refreshUserData }) => {
    const [parkingData, setParkingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'history'
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [occupantsById, setOccupantsById] = useState({});

    useEffect(() => {
        fetchParkingStatus();
        const interval = setInterval(fetchParkingStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchParkingStatus = async () => {
        try {
            const url = `${API_BASE_URL}/api/parking-status`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch parking status');
            }
            const data = await response.json();
            setParkingData(data);
            setLoading(false);
            setError(null);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!parkingData?.spots) return;

        const occupiedUserIds = Array.from(new Set(
            parkingData.spots
                .filter((spot) => spot.status === 'OCCUPIED' && spot.user_id)
                .map((spot) => spot.user_id)
        ));

        const idsToFetch = occupiedUserIds.filter((id) => !occupantsById[id]);
        if (idsToFetch.length === 0) return;

        let cancelled = false;

        const fetchOccupants = async () => {
            try {
                const results = await Promise.all(
                    idsToFetch.map(async (id) => {
                        const response = await fetch(`${API_BASE_URL}/api/user/${id}`);
                        if (!response.ok) return null;
                        const data = await response.json();
                        return { id, user: data?.user };
                    })
                );

                if (cancelled) return;

                setOccupantsById((prev) => {
                    const next = { ...prev };
                    results.forEach((result) => {
                        if (result?.user) {
                            next[result.id] = result.user;
                        }
                    });
                    return next;
                });
            } catch (fetchError) {
                console.error('Failed to fetch occupant data:', fetchError);
            }
        };

        fetchOccupants();

        return () => {
            cancelled = true;
        };
    }, [parkingData, occupantsById]);

    const handleSpotClick = (spot) => {
        setSelectedSpot(spot);
        setCurrentView('history');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedSpot(null);
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
                    <p>Error loading parking data: {error}</p>
                    <button onClick={fetchParkingStatus} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="parking-management">
            {userData?.role === 'OPERATOR' ? (
                <OperatorDashboard userData={userData} refreshUserData={refreshUserData} />
            ) : currentView === 'dashboard' ? (
                <ParkingDashboard
                    parkingData={parkingData}
                    occupantsById={occupantsById}
                    onSpotClick={handleSpotClick}
                    onRefresh={fetchParkingStatus}
                />
            ) : (
                <ParkingHistory
                    spot={selectedSpot}
                    onBack={handleBackToDashboard}
                />
            )}
        </div>
    );
};

export default Dashboard;
