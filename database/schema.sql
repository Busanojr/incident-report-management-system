DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS incident_reports;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    ip_address VARCHAR(45),
    false_report_count INT DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_flagged (is_flagged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE incident_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_address VARCHAR(500),
    status ENUM('Pending', 'Verified', 'In Progress', 'Resolved', 'False Report') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    category VARCHAR(100),
    user_id INT,
    ip_address VARCHAR(45),
    admin_notes TEXT,
    image_url VARCHAR(500),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_reported_at (reported_at),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    admin_id INT NOT NULL,
    action_type ENUM('Status Change', 'Note Added', 'Priority Change', 'Verified', 'Marked False') NOT NULL,
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    notes TEXT,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_incident_id (incident_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_timestamp (action_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO admins (username, email, password_hash, full_name, role) VALUES ('admin', 'admin@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', 'System Administrator', 'admin'), ('moderator', 'mod_kolotos@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', 'Moderator User', 'moderator'); INSERT INTO users (username, email, password_hash, ip_address, false_report_count) VALUES ('jhon_reymer', 'jhonEER@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.100', 0), ('reymark_a', 'emartko123xx@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.101', 0), ('kien_bok', 'kienbok@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.101', 0), ('weniel_tam', 'wenieltam@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.102', 2);

INSERT INTO incident_reports (title, description, latitude, longitude, location_address, status, priority, category, user_id, ip_address) VALUES
('Broken Streetlight', 'Streetlight not working at night, creating safety hazard', 8.39, 124.83, 'Barangay Alae, Manolo Fortich, Bukidnon', 'Verified', 'High', 'Infrastructure', 1, '192.168.1.100'),
('Pothole on Highway', 'Large pothole causing vehicle damage on main road', 8.38, 124.83, 'Sayre Highway, Barangay Diclum, Manolo Fortich, Bukidnon', 'In Progress', 'Critical', 'Road Maintenance', 2, '192.168.1.101'),
('Graffiti on Building', 'Vandalism reported on barangay hall building', 8.37, 124.95, 'Barangay Maluko, Manolo Fortich, Bukidnon', 'Pending', 'Low', 'Vandalism', 1, '192.168.1.100'),
('Water Leak', 'Fire hydrant leaking water continuously', 8.36, 124.80, 'Barangay Santiago, Manolo Fortich, Bukidnon', 'Resolved', 'Medium', 'Utilities', 3, '192.168.1.102'),
('Fallen Tree', 'Tree blocking sidewalk after storm', 8.35, 124.82, 'Barangay Diclum, Manolo Fortich, Bukidnon', 'Pending', 'High', 'Emergency', 2, '192.168.1.101');

INSERT INTO admin_actions (incident_id, admin_id, action_type, old_value, new_value, notes) VALUES
(1, 1, 'Status Change', 'Pending', 'Verified', 'Confirmed by barangay inspection'),
(1, 1, 'Priority Change', 'Medium', 'High', 'Safety concern for pedestrians'),
(2, 1, 'Status Change', 'Pending', 'In Progress', 'Repair crew dispatched'),
(4, 1, 'Status Change', 'In Progress', 'Resolved', 'Hydrant repaired successfully');
