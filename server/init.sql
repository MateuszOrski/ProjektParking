CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('ADMIN', 'OPERATOR') DEFAULT 'OPERATOR'
);


INSERT INTO users (login, password, first_name, last_name, role) VALUES 
('admin', 'admin123', 'Jan', 'Kowalski', 'ADMIN'),
('operator', 'oper123', 'Anna', 'Nowak', 'OPERATOR');


CREATE DATABASE IF NOT EXISTS parking_db;
USE parking_db;

CREATE TABLE IF NOT EXISTS spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spot_number VARCHAR(10) NOT NULL,
    floor INT NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS parking_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spot_id INT,
    plate_number VARCHAR(20),
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_time DATETIME,
    payment_token VARCHAR(100),
    payment_status ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID',
    FOREIGN KEY (spot_id) REFERENCES spots(id)
);

INSERT INTO spots (spot_number, floor) VALUES 
('A1', 0), ('A2', 0), ('A3', 0), ('A4', 0), ('A5', 0), 
('A6', 0), ('A7', 0), ('A8', 0), ('A9', 0), ('A10', 0),
('A11', 0), ('A12', 0), ('A13', 0), ('A14', 0), ('A15', 0),
('A16', 0), ('A17', 0), ('A18', 0), ('A19', 0), ('A20', 0),
('A21', 0), ('A22', 0), ('A23', 0), ('A24', 0), ('A25', 0);

INSERT INTO spots (spot_number, floor) VALUES 
('B1', 1), ('B2', 1), ('B3', 1), ('B4', 1), ('B5', 1), 
('B6', 1), ('B7', 1), ('B8', 1), ('B9', 1), ('B10', 1),
('B11', 1), ('B12', 1), ('B13', 1), ('B14', 1), ('B15', 1),
('B16', 1), ('B17', 1), ('B18', 1), ('B19', 1), ('B20', 1),
('B21', 1), ('B22', 1), ('B23', 1), ('B24', 1), ('B25', 1);



INSERT INTO parking_sessions (spot_id, plate_number, payment_status, entry_time, exit_time) VALUES 
(1, 'WA 11111', 'PAID', NOW(), NOW()),
(1, 'WA 22222', 'PAID', NOW(), NOW()),
(1, 'WA 33333', 'PAID', NOW(), NOW()),
(1, 'WA 44444', 'PAID', NOW(), NOW()),
(1, 'WA 55555', 'PAID', NOW(), NOW());


INSERT INTO parking_sessions (spot_id, plate_number, payment_status, entry_time, exit_time) VALUES 
(5, 'KR 111', 'PAID', NOW(), NOW()),
(5, 'KR 222', 'PAID', NOW(), NOW());

INSERT INTO parking_sessions (spot_id, plate_number, payment_status, entry_time, exit_time) VALUES 
(35, 'PO 999', 'PAID', NOW(), NOW());

INSERT INTO parking_sessions (spot_id, plate_number, payment_token, payment_status, entry_time, exit_time) 
VALUES (3, 'WA LIVE1', 'tkn-1', 'PAID', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR));

INSERT INTO parking_sessions (spot_id, plate_number, payment_token, payment_status, entry_time, exit_time) 
VALUES (30, 'GD LIVE2', 'tkn-2', 'PAID', NOW(), DATE_ADD(NOW(), INTERVAL 5 HOUR));