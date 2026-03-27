import os
import sys
import tempfile
import unittest
from pathlib import Path

from pydantic import ValidationError

PROJECT_BACKEND = Path(__file__).resolve().parents[1]
if str(PROJECT_BACKEND) not in sys.path:
    sys.path.insert(0, str(PROJECT_BACKEND))

DATABASE_FILE = Path(tempfile.gettempdir()) / "leadflow_auth_register_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{DATABASE_FILE}"

from app.db.session import Base, SessionLocal, engine
from app.models.user import User
from app.schemas.auth import RegisterIn
from app.services.auth_service import create_user


class AuthRegisterFlowTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    @classmethod
    def tearDownClass(cls) -> None:
        Base.metadata.drop_all(bind=engine)
        if DATABASE_FILE.exists():
            DATABASE_FILE.unlink()

    def setUp(self) -> None:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self) -> None:
        self.db.close()

    def test_register_payload_accepts_snake_case_and_persists(self) -> None:
        payload = RegisterIn.model_validate(
            {
                "full_name": "  Maria Silva  ",
                "email": "  maria@example.com  ",
                "password": "segredo123",
                "confirm_password": "segredo123",
            }
        )

        user = create_user(self.db, payload)
        saved_user = self.db.query(User).filter(User.id == user.id).one_or_none()

        self.assertIsNotNone(saved_user)
        assert saved_user is not None
        self.assertEqual(saved_user.name, "Maria Silva")
        self.assertEqual(saved_user.email, "maria@example.com")
        self.assertNotEqual(saved_user.password_hash, "segredo123")

    def test_register_payload_accepts_legacy_aliases(self) -> None:
        payload = RegisterIn.model_validate(
            {
                "username": "Joao Legacy",
                "email": "joao@example.com",
                "password": "segredo123",
                "confirmPassword": "segredo123",
            }
        )

        self.assertEqual(payload.name, "Joao Legacy")
        self.assertEqual(payload.confirm_password, "segredo123")

    def test_register_payload_rejects_invalid_fields_with_friendly_messages(self) -> None:
        with self.assertRaises(ValidationError) as context:
            RegisterIn.model_validate(
                {
                    "full_name": "   ",
                    "email": "email-invalido",
                    "password": "123",
                    "confirm_password": "456",
                }
            )

        messages = [error["msg"] for error in context.exception.errors()]
        self.assertTrue(any("at least 1 character" in message or "nome completo" in message.lower() for message in messages))
        self.assertTrue(any("valid email" in message.lower() for message in messages))

    def test_register_duplicate_email_is_blocked(self) -> None:
        first_payload = RegisterIn.model_validate(
            {
                "name": "Primeiro Usuario",
                "email": "duplicado@example.com",
                "password": "segredo123",
                "confirm_password": "segredo123",
            }
        )
        create_user(self.db, first_payload)

        duplicate_payload = RegisterIn.model_validate(
            {
                "name": "Segundo Usuario",
                "email": "duplicado@example.com",
                "password": "segredo123",
                "confirm_password": "segredo123",
            }
        )

        with self.assertRaises(Exception) as context:
            create_user(self.db, duplicate_payload)

        self.assertIn("Ja existe usuario com este email", str(context.exception))


if __name__ == "__main__":
    unittest.main()
