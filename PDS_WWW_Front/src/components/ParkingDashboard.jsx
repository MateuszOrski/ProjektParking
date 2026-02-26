import React, { useState, useEffect } from 'react';

const ParkingDashboard = ({ parkingData, occupantsById, onSpotClick, onRefresh }) => {
    const [filteredSpots, setFilteredSpots] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterFloor, setFilterFloor] = useState('all');


    const filterSpots = () => {
        let filtered = parkingData.spots;

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(spot =>
                filterStatus === 'free' ? spot.status === 'FREE' : spot.status === 'OCCUPIED'
            );
        }

        // Filter by floor
        if (filterFloor !== 'all') {
            filtered = filtered.filter(spot => spot.floor === parseInt(filterFloor));
        }

        setFilteredSpots(filtered);
    };

    useEffect(() => {
        if (parkingData && parkingData.spots) {
            filterSpots();
        }
    }, [filterStatus, filterFloor, parkingData]);

    const getUniqueFloors = () => {
        if (!parkingData || !parkingData.spots) return [];
        const floors = [...new Set(parkingData.spots.map(spot => spot.floor))];
        return floors.sort((a, b) => a - b);
    };

    const getStatusLabel = (status) => {
        return status === 'FREE' ? 'Available' : 'Occupied';
    };

    const getStatusClass = (status) => {
        return status === 'FREE' ? 'status-free' : 'status-occupied';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getOccupantLabel = (spot) => {
        if (!spot?.user_id) return 'User: unknown';
        const occupant = occupantsById?.[spot.user_id];
        if (!occupant) return `User: #${spot.user_id}`;
        const fullName = [occupant.firstName, occupant.lastName].filter(Boolean).join(' ');
        return `User: #${occupant.id} ${fullName || occupant.login || ''}`.trim();
    };

    if (!parkingData) return null;

    return (
        <>
            <div className="header">
                <div className="stats">
                    <span>Total: {parkingData.summary.total}</span>
                    <span>Available: {parkingData.summary.free}</span>
                    <span>Occupied: {parkingData.summary.occupied}</span>
                </div>
            </div>

            <div className="filter-section">
                <div className="filter-group">
                    <label htmlFor="status-filter">Filter by status: </label>
                    <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-dropdown"
                    >
                        <option value="all">All spots</option>
                        <option value="free">Available only</option>
                        <option value="occupied">Occupied only</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="floor-filter">Filter by floor: </label>
                    <select
                        id="floor-filter"
                        value={filterFloor}
                        onChange={(e) => setFilterFloor(e.target.value)}
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

                <button onClick={onRefresh} className="refresh-button">
                    ↻ Refresh
                </button>
            </div>

            <div className="parking-list">
                {filteredSpots.length === 0 ? (
                    <div className="empty-state">
                        No spots matching the criteria
                    </div>
                ) : (
                    filteredSpots.map((spot) => (
                        <div
                            key={spot.spot_id}
                            className="parking-item"
                            onClick={() => onSpotClick(spot)}
                        >
                            <div className="spot-info">
                                <span className="spot-number">#{spot.spot_number}</span>
                                <span className="spot-section">Floor {spot.floor}</span>
                            </div>
                            <div className="spot-details">
                <span className={`status-badge ${getStatusClass(spot.status)}`}>
                  {getStatusLabel(spot.status)}
                </span>
                                {spot.status === 'OCCUPIED' && spot.plate_number && (
                                    <div className="vehicle-info">
                                        <span className="vehicle-plate">{spot.plate_number}</span>
                                        <span className="vehicle-user">{getOccupantLabel(spot)}</span>
                                        {spot.start_time && (
                                            <span className="vehicle-time">
                        Since: {formatDateTime(spot.start_time)}
                      </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default ParkingDashboard;
