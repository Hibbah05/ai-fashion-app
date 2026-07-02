import sqlite3
import os

# Crucial adjustment: This paths the binary file directly into your existing 'database' folder directory
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'app.db')

def get_db_connection():
    """Establishes a connection to the SQLite local database database file."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enables accessing columns by name like a dictionary
    return conn

def init_db():
    """Initializes the database tables for Users and Saved Outfits if they do not exist."""
    # Ensure the database directory exists just in case
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # 2. Saved Wardrobe/Outfits Table (Linked to User ID)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_outfits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            title TEXT NOT NULL,
            top TEXT NOT NULL,
            base TEXT NOT NULL,
            acc TEXT NOT NULL,
            weather_context TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("--- Database Infrastructure Initialized Cleanly inside /database folder ---")

if __name__ == '__main__':
    init_db()