-- //schema.sql

DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS HazardEye_reports;
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

CREATE TABLE HazardEye_reports (
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
    FOREIGN KEY (incident_id) REFERENCES HazardEye_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_incident_id (incident_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_timestamp (action_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admins
INSERT INTO admins (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', 'System Administrator', 'admin'),
('moderator', 'mod_kolotos@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', 'Moderator User', 'moderator');

-- Users
INSERT INTO users (username, email, password_hash, ip_address, false_report_count) VALUES
('jhon_reymer', 'jhonEER@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.100', 0),
('reymark_a', 'emartko123xx@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.101', 0),
('kien_bok', 'kienbok@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.101', 0),
('weniel_tam', 'wenieltam@eincimgmt.com', '$2b$10$YQpZ9X7xKx8H3J5RGx6Hxuq7ZW8Yl5JmFKkZx8HqK7L3J5RGx6Hxu', '192.168.1.102', 2);

-- HazardEye Reports (NBSC Campus)
INSERT INTO HazardEye_reports (title, description, latitude, longitude, location_address, status, priority, category, user_id, ip_address) VALUES
(
    'Gate 1 Repair',
    'The main entrance gate (Gate 1) has been repaired and is now fully functional.',
    8.36114924, 124.86793789,
    'Gate 1, Northern Bukidnon State College, Manolo Fortich, Bukidnon',
    'Resolved', 'High', 'Infrastructure', 1, '192.168.1.100'
),
(
    'Billing Office Repair',
    'The Billing Office has undergone necessary repairs to address facility issues affecting daily operations.',
    8.36075118, 124.86921984,
    'Billing Office, Northern Bukidnon State College, Manolo Fortich, Bukidnon',
    'Resolved', 'Medium', 'Infrastructure', 2, '192.168.1.101'
),
(
    'Building Construction Near Billing Office',
    'A new building is currently under construction along the pathway going to the Billing Office. Construction materials may obstruct student pathways and pose safety hazards.',
    8.36096787, 124.86883186,
    'Near Billing Office, Northern Bukidnon State College, Manolo Fortich, Bukidnon',
    'In Progress', 'High', 'Construction Hazard', 3, '192.168.1.101'
),
(
    'Falling Fruit Hazard in Front of SC Building',
    'A tree in front of the Supreme Council (SC) building has branches with heavy fruit that may fall and injure passersby. Immediate trimming or safety barriers are needed.',
    8.35980391, 124.86757405,
    'In front of Supreme Council Building, Northern Bukidnon State College, Manolo Fortich, Bukidnon',
    'Pending', 'Critical', 'Safety Hazard', 1, '192.168.1.100'
),
(
    'Covered Court Under Repair',
    'The school covered court is currently undergoing repairs. The area may be partially restricted and poses hazards to students who may attempt to use the facility.',
    8.35996489, 124.86886941,
    'Covered Court, Northern Bukidnon State College, Manolo Fortich, Bukidnon',
    'In Progress', 'Medium', 'Infrastructure', 2, '192.168.1.101'
),
(
    'Canteen Under Repair',
    'The school canteen is currently being repaired. Students and staff are advised to use alternative food areas during the repair period.',
    8.35946340, 124.86838130,
    'Canteen, Northern Bukidnon State College, Manolo Fortich, Bukidnon',
    'In Progress', 'Low', 'Infrastructure', 3, '192.168.1.101'
);

-- Admin Actions
INSERT INTO admin_actions (incident_id, admin_id, action_type, old_value, new_value, notes) VALUES
(1, 1, 'Status Change', 'Pending', 'Resolved', 'Gate 1 repair confirmed completed by facilities team'),
(2, 1, 'Status Change', 'Pending', 'Resolved', 'Billing office repair completed and inspected'),
(3, 1, 'Status Change', 'Pending', 'In Progress', 'Construction team acknowledged, safety barriers to be set up'),
(4, 1, 'Priority Change', 'High', 'Critical', 'Risk of injury from falling fruit confirmed by security'),
(5, 1, 'Status Change', 'Pending', 'In Progress', 'Repair crew deployed to covered court'),
(6, 1, 'Status Change', 'Pending', 'In Progress', 'Canteen repair crew started work');