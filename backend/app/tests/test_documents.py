from io import BytesIO


def _register_and_login(client):
    client.post("/api/auth/register", json={
        "email": "doc@example.com",
        "username": "docuser",
        "password": "password123",
    })
    resp = client.post("/api/auth/login", data={
        "username": "docuser",
        "password": "password123",
    })
    return resp.json()["access_token"]


def test_upload_text_document(client):
    token = _register_and_login(client)
    content = b"This is the first chunk. This is the second chunk."
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("test.txt", BytesIO(content), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["filename"] == "test.txt"
    assert data["status"] == "ready"

    # List documents
    resp = client.get("/api/documents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_unsupported_file_type(client):
    token = _register_and_login(client)
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("test.exe", BytesIO(b"data"), "application/octet-stream")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
