from app.services.auth_service import hash_password, verify_password


def test_password_is_hashed_and_can_be_verified():
    password = "FinSight-Test-Password-123!"

    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("Wrong-Password-123!", hashed)


def test_same_password_produces_different_hashes():
    password = "FinSight-Test-Password-123!"

    first_hash = hash_password(password)
    second_hash = hash_password(password)

    assert first_hash != second_hash
    assert verify_password(password, first_hash)
    assert verify_password(password, second_hash)


def test_register_endpoint():
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.db.database import Base, get_db
    import app.models
    from app.main import app
    from app.models.user import User
    from app.models.plan import Plan

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    with sessionmaker(bind=engine)() as seed_db:
        seed_db.add(Plan(
            id="free",
            name="Free",
            api_call_limit=1000,
            token_limit=100000,
        ))
        seed_db.commit()
    TestingSessionLocal = sessionmaker(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as client:
            response = client.post(
                "/auth/register",
                json={
                    "full_name": "FinSight Test",
                    "email": "finsight-test@example.com",
                    "password": "FinSight-Test-Password-123!",
                },
            )

            assert response.status_code == 201
            data = response.json()
            assert data["email"] == "finsight-test@example.com"
            assert "password" not in data
            assert "password_hash" not in data

            duplicate = client.post(
                "/auth/register",
                json={
                    "full_name": "FinSight Test",
                    "email": "finsight-test@example.com",
                    "password": "FinSight-Test-Password-123!",
                },
            )
            assert duplicate.status_code == 409
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()



