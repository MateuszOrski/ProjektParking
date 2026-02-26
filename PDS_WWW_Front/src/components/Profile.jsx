import React, { useState, useEffect } from "react";
import "./../css/Profile.css";
import { AiOutlineUser, AiOutlineIdcard, AiOutlineWallet } from "react-icons/ai";

const Profile = ({ userData }) => {
  const [displayData, setDisplayData] = useState(userData);

  useEffect(() => {
    setDisplayData(userData);
    console.log('Profile userData updated:', userData);
  }, [userData]);

  if (!displayData) {
    return <div className="profile-error">No user data</div>;
  }

  const profileFields = [
    {
      label: "ID",
      value: displayData.id,
      icon: AiOutlineIdcard,
    },
    {
      label: "Username",
      value: displayData.login,
      icon: AiOutlineUser,
    },
    {
      label: "Role",
      value: displayData.role,
      icon: AiOutlineUser,
    },
    {
      label: "First name",
      value: displayData.firstName,
      icon: AiOutlineUser,
    },
    {
      label: "Last name",
      value: displayData.lastName,
      icon: AiOutlineUser,
    },
    {
      label: "Account balance",
      value: `${displayData.balance?.toFixed(2) || '0.00'} PLN`,
      icon: AiOutlineWallet,
    },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <AiOutlineUser className="profile-avatar-icon" />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{displayData.firstName} {displayData.lastName}</h2>
          <p className="profile-role">{displayData.role}</p>
        </div>
      </div>

      <div className="profile-fields">
        {profileFields.map((field, index) => {
          const IconComponent = field.icon;
          return (
            <div key={index} className="profile-field">
              <div className="profile-field-icon">
                <IconComponent />
              </div>
              <div className="profile-field-content">
                <label className="profile-field-label">{field.label}</label>
                <p className="profile-field-value">{field.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Profile;

