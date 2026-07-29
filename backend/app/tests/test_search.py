from io import BytesIO


def _register_and_login(client):
    client.post("/api/auth/register", json={
        "email": "search@example.com",
        "username": "searchuser",
        "password": "password123",
    })
    resp = client.post("/api/auth/login", data={
        "username": "searchuser",
        "password": "password123",
    })
    return resp.json()["access_token"]


def test_search_returns_results(client):
    token = _register_and_login(client)
    content = b"The sky is blue. Water is wet."
    client.post(
        "/api/documents/upload",
        files={"file": ("facts.txt", BytesIO(content), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    resp = client.get("/api/search?q=sky", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert "text" in data[0]
    assert "score" in data[0]
