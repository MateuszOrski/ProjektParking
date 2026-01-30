CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR'
);

INSERT INTO users (first_name, last_name, login, password, role) 
VALUES ('Jan', 'Kowalski', 'admin', 'admin123', 'ADMIN');

CREATE DATABASE IF NOT EXISTS parking_db;
USE parking_db;

CREATE TABLE IF NOT EXISTS spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spot_number VARCHAR(10) NOT NULL, 
    floor INT NOT NULL,  
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (spot_number, floor)
);

CREATE TABLE IF NOT EXISTS tariffs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_type ENUM('WEEKDAY', 'WEEKEND') NOT NULL UNIQUE,
    price_per_hour DECIMAL(10, 2) NOT NULL
);

INSERT INTO tariffs (day_type, price_per_hour) VALUES ('WEEKDAY', 5.00);
INSERT INTO tariffs (day_type, price_per_hour) VALUES ('WEEKEND', 2.00);

CREATE TABLE IF NOT EXISTS parking_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spot_id INT NOT NULL, 
    plate_number VARCHAR(20) NOT NULL,
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP, 
    exit_time DATETIME NULL, 
    payment_token VARCHAR(64) NOT NULL UNIQUE, 
    payment_status ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID', 
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (spot_id) REFERENCES spots(id)
);