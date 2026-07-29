from io import BytesIO


def _register_and_login(client):
    client.post("/api/auth/register", json={
        "email": "chat@example.com",
        "username": "chatuser",
        "password": "password123",
    })
    resp = client.post("/api/auth/login", data={
        "username": "chatuser",
        "password": "password123",
    })
    return resp.json()["access_token"]


def test_chat_with_document(client):
    token = _register_and_login(client)
    content = b"Machine learning is a subset of artificial intelligence."
    client.post(
        "/api/documents/upload",
        files={"file": ("ml.txt", BytesIO(content), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    resp = client.post("/api/chat", json={"query": "What is ML?"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "sources" in data
    assert data["session_id"]
    assert data["answer"] == "This is a test answer based on the context."
