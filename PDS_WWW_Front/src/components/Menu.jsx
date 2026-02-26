import React from "react";
import "./../css/Menu.css"; 
import MenuElement from "./MenuElement.jsx";
import Logout from "./Logout.jsx";
import { AiFillBank } from "react-icons/ai";
import { AiFillCar } from "react-icons/ai";
import { AiFillCalendar } from "react-icons/ai";
import { AiOutlineTeam } from "react-icons/ai";
import { AiFillSetting } from "react-icons/ai";
import { AiOutlineAreaChart } from "react-icons/ai";


const categories = [
    {   
        name: "Dashboard",
        icon: AiFillBank,
        onc: "dashboard"
    }, 
    {
        name:"History",
        icon: AiFillCar,
        onc: "history"
    },
    {   
        name:"Park a car",
        icon: AiFillCalendar,
        onc: "entry"
    }, 
    {
        name:"Users",
        icon: AiOutlineTeam,
        onc: "users"
    },
    {
        name:"Charts",
        icon: AiOutlineAreaChart,
        onc: "stats"
    }
];




const Menu = ({onViewChange, onLogout, userData}) => {
    // Filtruj elementy menu na podstawie roli użytkownika
    const filteredCategories = categories.filter(category => {
        // Dla roli OPERATOR ukryj Charts i Users
        if (userData?.role === 'OPERATOR') {
            return category.name !== 'Charts' && category.name !== 'Users';
        }
        // Dla pozostałych ról pokaż wszystkie elementy
        return true;
    });

    const menuElements = filteredCategories.map((category) =>
        <MenuElement key={category.name} label={category.name} icon={category.icon} onclick={() => onViewChange(category.onc)}/>
    );
    return (
        <div className="menu">
            {menuElements}
            <Logout onLogout={onLogout}/>
        </div>
    );
};
export default Menu;