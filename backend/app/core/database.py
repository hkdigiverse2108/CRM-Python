"""
Database Configuration and Pool Manager
========================================
Manages the SQLAlchemy engine and session pool for the MySQL database.
Provides thread-safe connection pool, pre-ping checks, and context managers
for executing transactions and queries.
"""

from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import get_settings

settings = get_settings()

# Create database engine with connection pooling and pre-ping connectivity check
engine = create_engine(
    settings.db_url,
    pool_size=20,           # Max connections kept in pool
    max_overflow=10,        # Additional overflow connections
    pool_timeout=30,        # Seconds to wait for a free connection
    pool_recycle=1800,      # Recycle connections after 30 minutes
    pool_pre_ping=True      # Check connection status before using
)

# Session factory for transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    Automatically handles commit/rollback and cleanup.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
