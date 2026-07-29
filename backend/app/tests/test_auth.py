def test_register_and_login(client):
    # Register
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"

    # Login
    resp = client.post("/api/auth/login", data={
        "username": "testuser",
        "password": "password123",
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token

    # Me
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["username"] == "testuser"


def test_login_invalid(client):
    resp = client.post("/api/auth/login", data={
        "username": "nope",
        "password": "wrong",
    })
    assert resp.status_code == 401
