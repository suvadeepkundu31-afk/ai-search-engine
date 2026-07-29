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


def _upload_sample(client, token):
    content = b"Machine learning is a subset of artificial intelligence."
    client.post(
        "/api/documents/upload",
        files={"file": ("ml.txt", BytesIO(content), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )


def test_chat_with_document(client):
    token = _register_and_login(client)
    _upload_sample(client, token)

    resp = client.post("/api/chat", json={"query": "What is ML?"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "sources" in data
    assert data["session_id"]
    assert data["answer"] == "This is a test answer based on the context."


def test_chat_stream(client):
    token = _register_and_login(client)
    _upload_sample(client, token)

    resp = client.post(
        "/api/chat/stream",
        json={"query": "What is ML?"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.text
    assert 'data: {"type": "text"' in body
    assert 'data: {"type": "done"' in body


def test_chat_history(client):
    token = _register_and_login(client)
    _upload_sample(client, token)

    resp = client.post("/api/chat", json={"query": "What is ML?"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    session_id = resp.json()["session_id"]

    sessions = client.get("/api/chat/sessions", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(sessions) == 1
    assert sessions[0]["id"] == session_id

    messages = client.get(
        f"/api/chat/sessions/{session_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"
