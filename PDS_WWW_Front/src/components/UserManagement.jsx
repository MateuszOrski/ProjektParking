import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OperatorDashboard from './OperatorDashboard';
import AddUser from './AddUser';
import './../css/UserManagement.css';

const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_CHARGE_AMOUNT = 100;

const UserManagement = ({ userData, refreshUserData }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [chargeAmounts, setChargeAmounts] = useState({});
    const [message, setMessage] = useState('');
    const [chargingUserId, setChargingUserId] = useState(null);
    const [isAddingUser, setIsAddingUser] = useState(false);

    const fetchAllUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/admin/get-all-users`);

            if (response.data.success) {
                setUsers(response.data.users || []);
                setFilteredUsers(response.data.users || []);
                setError(null);
            } else {
                setError(response.data.message || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    const handleSearch = (term) => {
        setSearchTerm(term);

        if (!term.trim()) {
            setFilteredUsers(users);
        } else {
            const lowerTerm = term.toLowerCase();
            const filtered = users.filter(user =>
                user.login.toLowerCase().includes(lowerTerm) ||
                user.first_name.toLowerCase().includes(lowerTerm) ||
                user.last_name.toLowerCase().includes(lowerTerm) ||
                user.id.toString().includes(term)
            );
            setFilteredUsers(filtered);
        }
    };

    const handleChargeAmountChange = (userId, value) => {
        setChargeAmounts({
            ...chargeAmounts,
            [userId]: value
        });
    };

    const handleChargeUser = async (user) => {
        const amount = chargeAmounts[user.id] || DEFAULT_CHARGE_AMOUNT;

        if (amount <= 0) {
            setMessage('Amount must be greater than 0');
            return;
        }

        setChargingUserId(user.id);
        setMessage('');

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/charge-user`, {
                user_id: user.id,
                amount: parseFloat(amount)
            });

            if (response.data.success) {
                setMessage(`✓ ${response.data.message}`);

                // Odśwież listę użytkowników
                await fetchAllUsers();

                // Jeśli doładowujemy zalogowanego użytkownika, odśwież jego profil
                const userIdToCheck = userData?.user_id || userData?.id;
                console.log('Checking if should refresh. userData id:', userIdToCheck, 'charged user id:', user.id);
                if (userIdToCheck && String(user.id) === String(userIdToCheck)) {
                    console.log('Refreshing user data for:', userIdToCheck);
                    if (refreshUserData) {
                        await refreshUserData();
                    }
                }

                // Wyczyść pole wejściowe
                setChargeAmounts({
                    ...chargeAmounts,
                    [user.id]: DEFAULT_CHARGE_AMOUNT
                });

                setTimeout(() => {
                    setMessage('');
                }, 3000);
            } else {
                setMessage(`✗ ${response.data.message || 'Failed to charge user'}`);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error charging user account';
            setMessage(`✗ ${errorMsg}`);
        } finally {
            setChargingUserId(null);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
    };

    const handleBackToList = () => {
        setSelectedUser(null);
    };

    const handleStartAddUser = () => {
        setIsAddingUser(true);
    };

    const handleCancelAddUser = () => {
        setIsAddingUser(false);
    };

    const handleUserAdded = async () => {
        await fetchAllUsers();
        setIsAddingUser(false);
    };

    const handleRefreshSelectedUser = async () => {
        if (!selectedUser) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/admin/get-all-users`);

            if (response.data.success) {
                const updatedUser = response.data.users?.find(u => u.id === selectedUser.id);
                if (updatedUser) {
                    setSelectedUser(updatedUser);
                }
            }
        } catch (err) {
            console.error('Error refreshing selected user:', err);
        }

        const loggedInUserId = userData?.user_id || userData?.id;
        if (loggedInUserId && String(selectedUser.id) === String(loggedInUserId)) {
            await refreshUserData?.();
        }
    };

    // Jeśli użytkownik został wybrany, pokaż jego OperatorDashboard
    if (selectedUser) {
        return (
            <div className="user-management-container">
                <div className="selected-user-header">
                    <button onClick={handleBackToList} className="back-button">
                        ← Back to Users
                    </button>
                    <h3>Managing: {selectedUser.login} ({selectedUser.first_name} {selectedUser.last_name})</h3>
                </div>
                <OperatorDashboard
                    userData={selectedUser}
                    refreshUserData={refreshUserData}
                    billingUserId={userData?.user_id || userData?.id}
                />
            </div>
        );
    }

    if (isAddingUser) {
        return (
            <div className="user-management-container">
                <AddUser onCancel={handleCancelAddUser} onUserAdded={handleUserAdded} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="user-management-container">
                <div className="loading">Loading users...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-management-container">
                <div className="error-state">
                    <p>Error loading users: {error}</p>
                    <button onClick={fetchAllUsers} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-management-container">
            <div className="user-management-header">
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search by login, name, or ID..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="stats">
                    <span>Total Users: {users.length}</span>
                    <span>Showing: {filteredUsers.length}</span>
                </div>
                <div className="header-actions">
                    <button onClick={fetchAllUsers} className="refresh-button">
                        ↻ Refresh
                    </button>
                    <button onClick={handleStartAddUser} className="add-user-button">
                        + Add User
                    </button>
                </div>
            </div>

            <div className="users-list">
                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        {searchTerm ? 'No users found matching your search' : 'No users available'}
                    </div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Login</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Balance (PLN)</th>
                                <th>Charge Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="user-row">
                                    <td className="id-cell">{user.id}</td>
                                    <td className="login-cell">{user.login}</td>
                                    <td className="name-cell">
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td className="role-cell">
                                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="balance-cell">
                                        <span className="balance-value">{user.balance}</span>
                                    </td>
                                    <td className="charge-input-cell">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={chargeAmounts[user.id] !== undefined ? chargeAmounts[user.id] : DEFAULT_CHARGE_AMOUNT}
                                            onChange={(e) => handleChargeAmountChange(user.id, e.target.value)}
                                            className="charge-input"
                                            disabled={chargingUserId === user.id}
                                        />
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleChargeUser(user)}
                                                className="charge-button"
                                                disabled={chargingUserId === user.id}
                                                title="Charge account"
                                            >
                                                {chargingUserId === user.id ? 'Charging...' : 'Charge'}
                                            </button>
                                            <button
                                                onClick={() => handleSelectUser(user)}
                                                className="manage-button"
                                                title="Manage user parkings"
                                            >
                                                Manage
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default UserManagement;

