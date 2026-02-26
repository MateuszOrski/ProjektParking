import React from 'react';
import Dashboard from './Dashboard.jsx';
import "./../css/MainPanel.css";
import ParkingStats from "./ParkingStats.jsx";
import ParkingEntry from "./ParkingEntry.jsx";
import ParkingExit from "./ParkingExit.jsx";
import Profile from "./Profile.jsx";
import OperatorHistory from "./OperatorHistory.jsx";
import UserManagement from "./UserManagement.jsx";

const MainPanel = ({title, userData, refreshUserData}) => {

    const renderContent = () => {
        switch (title) {
            case "Dashboard":
                return <Dashboard userData={userData} refreshUserData={refreshUserData}/>;
            case "Parking History":
                return <OperatorHistory userData={userData}/>;
            case "Parking Statistics":
                return <ParkingStats/>;
            case "Parking Entry":
                return <ParkingEntry userData={userData}/>;
            case "End parking":
                return <ParkingExit userData={userData} refreshUserData={refreshUserData}/>;
            case "Profile":
                return <Profile userData={userData}/>;
            case "User Management":
                return <UserManagement userData={userData} refreshUserData={refreshUserData}/>;
            default: return <Dashboard userData={userData} refreshUserData={refreshUserData}/>;
        }
    };
  return (
    <section className="main-panel">
      <header className="main-panel-header">
        <h2 className="main-panel-title">{title}</h2>
      </header>

      <div className="main-panel-body">
          {renderContent()}
      </div>
    </section>
  );
};

export default MainPanel;