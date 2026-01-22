from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def debug_data():
    with engine.connect() as conn:
        print("\n--- PROJECTS ---")
        projects = conn.execute(text("SELECT id, name FROM projects;")).fetchall()
        for p in projects:
            print(f"ID: {p[0]}, Name: {p[1]}")
        
        print("\n--- USERS ---")
        users = conn.execute(text("SELECT id, username, is_admin FROM users;")).fetchall()
        for u in users:
            print(f"ID: {u[0]}, Username: {u[1]}, Admin: {u[2]}")

if __name__ == "__main__":
    debug_data()
