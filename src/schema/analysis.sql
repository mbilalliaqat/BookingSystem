CREATE TABLE Analysis (
    id SERIAL PRIMARY KEY, 
    image_id INT NOT NULL, 
    status VARCHAR(50) DEFAULT 'processing', 
    result TEXT, 
    analyzed_at TIMESTAMP DEFAULT NULL, 
    FOREIGN KEY (image_id) REFERENCES Images(id) ON DELETE CASCADE 
);
