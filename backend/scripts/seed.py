from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import SessionLocal, engine


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
