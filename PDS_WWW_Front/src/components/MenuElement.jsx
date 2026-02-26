import React from "react";
import "./../css/MenuElement.css"; 

const MenuElement = (props) => {
    return (
    <button
      type="button"
      className="menu-element"
      onClick={props.onclick}
    >
      <props.icon/>
      <span className="menu-label">{props.label}</span>
    </button>
  );

};

export default MenuElement;