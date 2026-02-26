import React, { useState } from 'react';
import axios from 'axios';
import './../css/UserManagement.css';

const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_ROLE = 'USER';

const AddUser = ({ onCancel, onUserAdded }) => {
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        role: DEFAULT_ROLE,
        firstName: '',
        lastName: ''
    });
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        const { login, password, role, firstName, lastName } = formData;
        if (!login || !password || !role || !firstName || !lastName) {
            setMessage('All fields are required.');
            return;
        }

        setSaving(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/add-user`, {
                login,
                password,
                role,
                first_name: firstName,
                last_name: lastName
            });

            if (response.data.success) {
                setMessage(`✓ ${response.data.message || 'User added successfully.'}`);
                setFormData({
                    login: '',
                    password: '',
                    role: DEFAULT_ROLE,
                    firstName: '',
                    lastName: ''
                });
                onUserAdded?.();
            } else {
                setMessage(`✗ ${response.data.message || 'Failed to add user.'}`);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error adding user.';
            setMessage(`✗ ${errorMsg}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-user-container">
            <div className="selected-user-header">
                <button onClick={onCancel} className="back-button" type="button">
                    ← Back to Users
                </button>
                <h3>Add New User</h3>
            </div>

            <form className="add-user-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="login">Login</label>
                        <input
                            id="login"
                            name="login"
                            type="text"
                            value={formData.login}
                            onChange={handleChange}
                            placeholder="Enter login"
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            autoComplete="given-name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            autoComplete="family-name"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange}>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OPERATOR">OPERATOR</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={saving}>
                        {saving ? 'Creating...' : 'Create User'}
                    </button>
                    <button className="secondary-button" type="button" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </form>

            {message && (
                <div className={`message-box ${message.startsWith('✓') ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default AddUser;

