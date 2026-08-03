import pytest
from fastapi import HTTPException
from app.auth import authenticate
from app.chats import can_access, conversation_history, create_direct, recipient_ids, save_chat_message
from app.database import initialize
from app.families import create_family_account, family_for_user, set_child_chat
from fastapi.testclient import TestClient
from app.main import app

def test_family_boundaries_and_parent_permissions():
    initialize()
    parent = authenticate("apa", "apa1234")
    child = authenticate("mano", "mano1234")
    sibling = create_family_account(parent, "testver", "Testvér", "testver-jelszo", "child")
    other_parent = create_family_account(parent, "anya", "Anya", "anya-biztonsagos", "parent")
    family_conversation = "family-default"

    save_chat_message(sibling, family_conversation, "text", "csak a szülőknek")
    visible_to_child = conversation_history(child, family_conversation)
    assert all(message["sender_id"] != sibling["id"] for message in visible_to_child)
    assert recipient_ids(sibling, family_conversation) == {parent["id"], sibling["id"], other_parent["id"]}

    set_child_chat(parent, True)
    assert child["id"] in recipient_ids(sibling, family_conversation)

    direct = create_direct(parent, "anya")
    assert can_access(parent["id"], direct["id"])
    assert can_access(other_parent["id"], direct["id"])
    assert not can_access(child["id"], direct["id"])
    with pytest.raises(HTTPException) as denied:
        create_direct(child, "anya")
    assert denied.value.status_code == 403

    family = family_for_user(parent["id"])
    assert family["is_admin"] is True
    assert len(family["members"]) == 4

def test_child_cannot_change_password():
    initialize()
    with TestClient(app) as client:
        login = client.post("/api/login", json={"username": "mano", "password": "mano1234"})
        assert login.status_code == 200
        response = client.post("/api/password", json={"current_password": "mano1234", "new_password": "uj-gyerek-jelszo"})
        assert response.status_code == 403
