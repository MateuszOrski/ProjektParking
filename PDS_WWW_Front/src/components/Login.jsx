import React, { useState } from "react";
import "./../css/Login.css";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const API_BASE_URL = 'http://localhost:3000';

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Proszę wpisać nazwę użytkownika i hasło");
      return;
    }

    setLoading(true);

    try {
        const url = API_BASE_URL + '/login';
      const response = await fetch( url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Wysyłamy cały obiekt użytkownika do App.jsx
        onLogin(data.user);
      } else {
        setError(data.message || "Błąd logowania");
      }
    } catch (err) {
      setError("Błąd połączenia z serwerem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <p className="login-welcome">Welcome !</p>
          <h1 className="login-title">Sign in to</h1>
          <p className="login-subtitle">Parking Admin Panel</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              User name
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Enter your user name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label="Toggle password visibility"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                👁
              </button>
            </div>
          </div>



          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;