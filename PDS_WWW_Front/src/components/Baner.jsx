import React, { useState, useEffect } from "react";
import "./../css/Baner.css";

const Baner = ({ title, userName, userRole, balance, onProfileClick }) => {
  const [currentBalance, setCurrentBalance] = useState(balance);

  useEffect(() => {
    setCurrentBalance(balance);
    console.log('Baner balance updated:', balance);
  }, [balance]);

  const numericBalance = Number(currentBalance);
  const displayBalance = Number.isFinite(numericBalance) ? numericBalance : 0;

  return (
    <header className="baner">
      <div className="baner-left">
        <h1 className="baner-title">{title}</h1>
      </div>

      <div className="baner-right">
        <div className="baner-balance">
          <span className="baner-balance-label">Account balance:</span>
          <span className="baner-balance-value">{displayBalance.toFixed(2)} PLN</span>
        </div>

        <div className="baner-user">
          <div className="baner-user-text">
            <span className="baner-user-name">{userName}</span>
            <span className="baner-user-role">{userRole}</span>
          </div>

          <button
            type="button"
            className="baner-profile-button"
            onClick={onProfileClick}
          >
            Profile
          </button>
        </div>
      </div>
    </header>
  );
};

export default Baner;