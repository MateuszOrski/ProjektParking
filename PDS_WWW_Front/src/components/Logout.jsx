import React from "react";
import "./../css/Logout.css";
import { AiOutlinePoweroff } from "react-icons/ai";

const Logout = ({ onLogout }) => {
    const handleLogoutClick = () => {
        onLogout();
    };

    return (
    <button type="button" className="logout-element" onClick={handleLogoutClick}>
        <AiOutlinePoweroff />
        <span className="logout-label">Logout</span>
      </button>  
    ); 
};

export default Logout;