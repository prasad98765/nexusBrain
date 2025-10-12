"""
Database initialization module
Separates db instance from app factory to avoid circular imports
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy(engine_options={
    "pool_pre_ping": True,
    "pool_recycle": 1800,   # recycle every 30 min
    "pool_size": 10,
    "max_overflow": 20,
})
