import React, {useState} from 'react';
import Login from './components/Login.jsx';
import Menu from './components/Menu.jsx';
import Baner from './components/Baner.jsx';
import MainPanel from './components/MainPanel.jsx';
import UserManagement from './components/UserManagement.jsx';


const App=() => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard');

    const API_BASE_URL = 'http://localhost:3000';

    const handleLogin = (user) => {
        setUserData(user);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setUserData(null);
        setIsLoggedIn(false);
        setCurrentView('dashboard');
    };

    const refreshUserData = async () => {
        if (!userData?.user_id && !userData?.id) return;

        const hasUserShape = (candidate) => {
            if (!candidate || typeof candidate !== 'object') return false;
            return Boolean(candidate.id || candidate.user_id || candidate.login);
        };

        try {
            const userId = userData.user_id || userData.id;
            const url = `${API_BASE_URL}/api/user/${userId}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                console.log('User data refreshed:', data);

                let userDataToSet = null;

                if (hasUserShape(data?.user)) {
                    userDataToSet = data.user;
                } else if (hasUserShape(data)) {
                    const { success, ...rest } = data;
                    userDataToSet = data.success ? rest : data;
                }

                if (userDataToSet) {
                    const parsedBalance = Number(userDataToSet.balance);
                    setUserData((prev) => {
                        const safeBalance = Number.isFinite(parsedBalance)
                            ? parsedBalance
                            : prev?.balance;

                        const updatedUserData = {
                            ...prev,
                            ...userDataToSet,
                            balance: safeBalance
                        };

                        console.log('Updated userData with balance:', updatedUserData.balance);
                        console.log('User data updated in App:', updatedUserData);
                        return updatedUserData;
                    });
                    return userDataToSet;
                }
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
        return null;
    };

    const getTitle = () => {
        switch (currentView) {
            case 'dashboard':
                return 'Dashboard';
            case 'history':
                return 'Parking History';
            case 'stats':
                return 'Parking Statistics';
            case 'entry':
                return 'Parking Entry';
            case 'exit':
                return 'End parking';
            case 'profile':
                return 'Profile';
            case 'users':
                return 'User Management';
            default:
                return 'Dashboard';
        }
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

  return(
    <>
      <Baner title="Parking" userName={userData?.login} userRole={userData?.role} balance={userData?.balance} onProfileClick={() => setCurrentView('profile')}/>
      <div className="app-container">
        <Menu onViewChange={setCurrentView} onLogout={handleLogout} userData={userData}/>
        <MainPanel title={getTitle()} userData={userData} refreshUserData={refreshUserData}/>
      </div>
    </>
  );
}

export default App
