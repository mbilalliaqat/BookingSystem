CREATE TABLE Images (
    id SERIAL PRIMARY KEY, 
    user_id INT NOT NULL, 
    file_path TEXT NOT NULL,
    file_description TEXT,
    file_name VARCHAR(255) NOT NULL, 
    file_type VARCHAR(50) NOT NULL, 
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE 
);
