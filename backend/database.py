from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Neon.tech and some providers use "postgres://" but SQLAlchemy requires "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback to SQLite for local development
if not DATABASE_URL:
    DB_PATH = os.path.join(os.path.dirname(__file__), "finance.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import Base as ModelsBase
    from sqlalchemy import text

    if DATABASE_URL.startswith("sqlite"):
        ModelsBase.metadata.create_all(bind=engine)
        return

    # For PostgreSQL: drop orphan sequences from failed partial migrations,
    # then create all tables
    try:
        with engine.begin() as conn:
            # Get existing tables
            result = conn.execute(text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
            ))
            existing_tables = {row[0] for row in result}

            if not existing_tables:
                # Fresh database — drop any orphan sequences from partial creates
                seqs = conn.execute(text(
                    "SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'"
                ))
                for (seq_name,) in seqs:
                    conn.execute(text(f'DROP SEQUENCE IF EXISTS "{seq_name}" CASCADE'))

            ModelsBase.metadata.create_all(bind=conn, checkfirst=True)
    except Exception as e:
        print(f"init_db warning: {e}")
        # If tables already fully exist, this is fine
        pass
