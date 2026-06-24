import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy import text

from backend.app.api.dependencies.auth import get_current_user
from backend.app.core.database import get_db
from backend.app.core.security import decode_token
from backend.app.utils.response import success_response

router = APIRouter()

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Map user_id -> set of active WebSockets
        self.active_connections: dict[str, set[WebSocket]] = {}
        # Map workspace_id -> set of active WebSockets
        self.workspace_connections: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, workspace_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        if workspace_id not in self.workspace_connections:
            self.workspace_connections[workspace_id] = set()
        self.workspace_connections[workspace_id].add(websocket)

        # Notify others in workspace that user is online
        await self.broadcast_status(workspace_id, user_id, "online")

    async def disconnect(self, user_id: str, workspace_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # User is completely offline
                await self.broadcast_status(workspace_id, user_id, "offline")
                
        if workspace_id in self.workspace_connections:
            self.workspace_connections[workspace_id].discard(websocket)
            if not self.workspace_connections[workspace_id]:
                del self.workspace_connections[workspace_id]

    async def broadcast_status(self, workspace_id: str, user_id: str, status: str):
        payload = {
            "type": "user_status",
            "user_id": user_id,
            "status": status
        }
        if workspace_id in self.workspace_connections:
            for ws in self.workspace_connections[workspace_id]:
                try:
                    await ws.send_json(payload)
                except Exception:
                    pass

    async def broadcast_to_members(self, db, workspace_id: str, channel_id: str, message_data: dict):
        # 1. Fetch channel type
        ch_type = db.execute(
            text("SELECT type FROM chat_channels WHERE channel_id = :channel_id"),
            {"channel_id": channel_id}
        ).scalar()
        
        allowed_user_ids = []
        if ch_type == 'general':
            # All users in workspace
            cursor = db.execute(
                text("SELECT user_id FROM users WHERE workspace_id = :ws_id AND deleted_at IS NULL"),
                {"ws_id": workspace_id}
            )
            allowed_user_ids = [row[0] for row in cursor.fetchall()]
        else:
            # Members of the channel
            cursor = db.execute(
                text("SELECT user_id FROM chat_channel_members WHERE channel_id = :channel_id"),
                {"channel_id": channel_id}
            )
            allowed_user_ids = [row[0] for row in cursor.fetchall()]
            
        # Send to all connected members
        for uid in allowed_user_ids:
            if uid in self.active_connections:
                for ws in self.active_connections[uid]:
                    try:
                        await ws.send_json(message_data)
                    except Exception:
                        pass

manager = ConnectionManager()

# Request Models
class ChannelCreatePayload(BaseModel):
    name: Optional[str] = None
    type: str = "direct" # "direct", "group", or "general"
    recipient_id: Optional[str] = None
    member_ids: Optional[List[str]] = None

class MessageForwardPayload(BaseModel):
    message_id: str
    channel_ids: List[str]

class AddMembersPayload(BaseModel):
    user_ids: List[str]

# HTTP Endpoints

@router.post("/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Save an uploaded chat attachment and return its static URL path."""
    chat_dir = os.path.join("uploads", "chat")
    os.makedirs(chat_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(chat_dir, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/uploads/chat/{filename}"
    return success_response(data={
        "file_url": file_url,
        "file_name": file.filename,
        "file_type": file.content_type
    })

@router.put("/channels/{channel_id}/mute")
async def toggle_mute_channel(
    channel_id: str,
    current_user: dict = Depends(get_current_user)
):
    workspace_id = current_user.get("tenant_id")
    user_id = current_user.get("id")
    
    with get_db() as db:
        exists = db.execute(text("""
            SELECT channel_id FROM chat_channels 
            WHERE channel_id = :ch_id AND workspace_id = :ws_id
        """), {"ch_id": channel_id, "ws_id": workspace_id}).scalar()
        
        if not exists:
            raise HTTPException(status_code=404, detail="Channel not found.")
            
        mute_id = db.execute(text("""
            SELECT id FROM chat_channel_mutes 
            WHERE channel_id = :ch_id AND user_id = :uid
        """), {"ch_id": channel_id, "uid": user_id}).scalar()
        
        muted = False
        if mute_id:
            db.execute(text("DELETE FROM chat_channel_mutes WHERE id = :id"), {"id": mute_id})
        else:
            db.execute(text("""
                INSERT INTO chat_channel_mutes (id, workspace_id, channel_id, user_id)
                VALUES (:id, :ws_id, :ch_id, :uid)
            """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "ch_id": channel_id, "uid": user_id})
            muted = True
            
    return success_response(data={"is_muted": muted}, message="Channel mute status updated.")

@router.put("/messages/{message_id}/pin")
async def toggle_pin_message(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    workspace_id = current_user.get("tenant_id")
    with get_db() as db:
        msg = db.execute(text("""
            SELECT channel_id, is_pinned FROM chat_messages 
            WHERE message_id = :msg_id AND workspace_id = :ws_id AND deleted_at IS NULL
        """), {"msg_id": message_id, "ws_id": workspace_id}).mappings().first()
        
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found.")
            
        new_status = 1 if msg["is_pinned"] == 0 else 0
        db.execute(text("""
            UPDATE chat_messages SET is_pinned = :status WHERE message_id = :msg_id
        """), {"status": new_status, "msg_id": message_id})
        
        broadcast_payload = {
            "type": "message_pinned_update",
            "message_id": message_id,
            "channel_id": msg["channel_id"],
            "is_pinned": bool(new_status)
        }
        await manager.broadcast_to_members(db, workspace_id, msg["channel_id"], broadcast_payload)
        
    return success_response(data={"is_pinned": bool(new_status)}, message="Message pin status updated.")

@router.delete("/messages/{message_id}")
async def recall_chat_message(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft-delete a message (recall) and notify all participants."""
    workspace_id = current_user.get("tenant_id")
    user_id = current_user.get("id")
    
    with get_db() as db:
        msg = db.execute(text("""
            SELECT channel_id, sender_id FROM chat_messages 
            WHERE message_id = :msg_id AND workspace_id = :ws_id AND deleted_at IS NULL
        """), {"msg_id": message_id, "ws_id": workspace_id}).mappings().first()
        
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found.")
            
        # Only sender can delete their message
        if msg["sender_id"] != user_id and current_user.get("role_name") not in ("Super Admin", "Organization Admin"):
            raise HTTPException(status_code=403, detail="Access denied. You cannot recall this message.")
            
        # Soft delete message
        db.execute(text("""
            UPDATE chat_messages 
            SET deleted_at = CURRENT_TIMESTAMP(6), message_text = '', file_url = NULL, file_name = NULL, file_type = NULL, is_pinned = 0
            WHERE message_id = :msg_id
        """), {"msg_id": message_id})
        
        # Broadcast deletion over WebSocket
        broadcast_payload = {
            "type": "message_deleted",
            "message_id": message_id,
            "channel_id": msg["channel_id"]
        }
        await manager.broadcast_to_members(db, workspace_id, msg["channel_id"], broadcast_payload)
        
    return success_response(message="Message recalled successfully.")

@router.post("/messages/forward")
async def forward_chat_message(
    payload: MessageForwardPayload,
    current_user: dict = Depends(get_current_user)
):
    """Clones a message and inserts it into multiple destination channels."""
    workspace_id = current_user.get("tenant_id")
    user_id = current_user.get("id")
    
    with get_db() as db:
        sender_name = db.execute(
            text("SELECT full_name FROM users WHERE user_id = :uid"),
            {"uid": user_id}
        ).scalar() or "User"
 
        # 1. Fetch original message
        orig = db.execute(text("""
            SELECT message_text, file_url, file_name, file_type FROM chat_messages 
            WHERE message_id = :msg_id AND workspace_id = :ws_id AND deleted_at IS NULL
        """), {"msg_id": payload.message_id, "ws_id": workspace_id}).mappings().first()
        
        if not orig:
            raise HTTPException(status_code=404, detail="Original message not found.")
            
        forwarded_msg_ids = []
        for ch_id in payload.channel_ids:
            msg_id = str(uuid.uuid4())
            timestamp = datetime.now()
            
            # Save into DB
            db.execute(text("""
                INSERT INTO chat_messages (message_id, workspace_id, channel_id, sender_id, message_text, file_url, file_name, file_type, created_at)
                VALUES (:msg_id, :ws_id, :ch_id, :sender_id, :text, :file_url, :file_name, :file_type, :timestamp)
            """), {
                "msg_id": msg_id,
                "ws_id": workspace_id,
                "ch_id": ch_id,
                "sender_id": user_id,
                "text": orig["message_text"],
                "file_url": orig["file_url"],
                "file_name": orig["file_name"],
                "file_type": orig["file_type"],
                "timestamp": timestamp
            })
            
            # Mark read for sender
            db.execute(text("""
                INSERT INTO chat_message_reads (id, workspace_id, message_id, user_id)
                VALUES (:id, :ws_id, :msg_id, :uid)
            """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "msg_id": msg_id, "uid": user_id})
            
            # Broadcast over WebSocket
            broadcast_payload = {
                "message_id": msg_id,
                "channel_id": ch_id,
                "sender_id": user_id,
                "sender_name": sender_name,
                "text": orig["message_text"],
                "file_url": orig["file_url"],
                "file_name": orig["file_name"],
                "file_type": orig["file_type"],
                "is_pinned": False,
                "reactions": [],
                "read_by": [user_id],
                "created_at": timestamp.isoformat()
            }
            await manager.broadcast_to_members(db, workspace_id, ch_id, broadcast_payload)
            forwarded_msg_ids.append(msg_id)
            
    return success_response(data={"message_ids": forwarded_msg_ids}, message="Message forwarded successfully.")

@router.get("/channels/{channel_id}/members")
async def list_group_members(
    channel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List all user details belonging to a specific group chat."""
    workspace_id = current_user.get("tenant_id")
    with get_db() as db:
        # Check channel existence and type
        ch = db.execute(text("""
            SELECT type FROM chat_channels WHERE channel_id = :ch_id AND workspace_id = :ws_id
        """), {"ch_id": channel_id, "ws_id": workspace_id}).mappings().first()
        
        if not ch:
            raise HTTPException(status_code=404, detail="Group not found.")
            
        if ch["type"] == "general":
            # Return all workspace users
            members = db.execute(text("""
                SELECT u.user_id, u.full_name, u.email, u.role_id 
                FROM users u
                WHERE u.workspace_id = :ws_id AND u.deleted_at IS NULL
            """), {"ws_id": workspace_id}).mappings().all()
        else:
            members = db.execute(text("""
                SELECT u.user_id, u.full_name, u.email, u.role_id 
                FROM chat_channel_members m
                JOIN users u ON m.user_id = u.user_id
                WHERE m.channel_id = :ch_id AND u.deleted_at IS NULL
            """), {"ch_id": channel_id}).mappings().all()
            
        members_list = []
        for m in members:
            role_name = db.execute(
                text("SELECT role_name FROM roles WHERE role_id = :role_id"),
                {"role_id": m["role_id"]}
            ).scalar() or "Sales Executive"
            
            members_list.append({
                "user_id": m["user_id"],
                "full_name": m["full_name"],
                "email": m["email"],
                "role_name": role_name,
                "is_online": m["user_id"] in manager.active_connections
            })
            
    return success_response(data=members_list)

@router.post("/channels/{channel_id}/members")
async def add_group_members(
    channel_id: str,
    payload: AddMembersPayload,
    current_user: dict = Depends(get_current_user)
):
    """Add new user members to a group chat."""
    workspace_id = current_user.get("tenant_id")
    with get_db() as db:
        # Verify group
        ch_type = db.execute(text("""
            SELECT type FROM chat_channels WHERE channel_id = :ch_id AND workspace_id = :ws_id
        """), {"ch_id": channel_id, "ws_id": workspace_id}).scalar()
        
        if not ch_type or ch_type != "group":
            raise HTTPException(status_code=400, detail="Cannot add members. Chat room must be a group.")
            
        for uid in payload.user_ids:
            # Check already member
            exists = db.execute(text("""
                SELECT id FROM chat_channel_members WHERE channel_id = :ch_id AND user_id = :uid
            """), {"ch_id": channel_id, "uid": uid}).scalar()
            if not exists:
                db.execute(text("""
                    INSERT INTO chat_channel_members (id, workspace_id, channel_id, user_id)
                    VALUES (:id, :ws_id, :ch_id, :uid)
                """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "ch_id": channel_id, "uid": uid})
                
    return success_response(message="Members added successfully.")

@router.delete("/channels/{channel_id}/members/{member_id}")
async def remove_group_member(
    channel_id: str,
    member_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a user member from a group chat."""
    workspace_id = current_user.get("tenant_id")
    with get_db() as db:
        ch_type = db.execute(text("""
            SELECT type FROM chat_channels WHERE channel_id = :ch_id AND workspace_id = :ws_id
        """), {"ch_id": channel_id, "ws_id": workspace_id}).scalar()
        
        if not ch_type or ch_type != "group":
            raise HTTPException(status_code=400, detail="Cannot remove members. Chat room must be a group.")
            
        db.execute(text("""
            DELETE FROM chat_channel_members WHERE channel_id = :ch_id AND user_id = :uid
        """), {"ch_id": channel_id, "uid": member_id})
        
    return success_response(message="Member removed successfully.")

@router.get("/users")
async def list_chat_users_duplicate(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    workspace_id = current_user.get("tenant_id")
    with get_db() as db:
        employees = db.execute(text("""
            SELECT e.employee_id, e.name AS full_name, e.email, e.role AS role_name, u.user_id, e.deleted_at
            FROM hrms_employees e
            LEFT JOIN users u ON e.email = u.email AND u.workspace_id = e.workspace_id
            WHERE e.workspace_id = :ws_id
        """), {"ws_id": workspace_id}).mappings().all()
        
        users_list = []
        for emp in employees:
            uid = emp["user_id"] or f"emp_{emp['employee_id']}"
            name_suffix = " (Former Employee)" if emp["deleted_at"] is not None else ""
            users_list.append({
                "user_id": uid,
                "full_name": emp["full_name"] + name_suffix,
                "email": emp["email"],
                "role_name": emp["role_name"] or "Sales Executive",
                "is_online": uid in manager.active_connections if emp["user_id"] else False
            })
    return success_response(data=users_list)

@router.get("/channels")
async def list_chat_channels_duplicate(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    workspace_id = current_user.get("tenant_id")
    user_id = current_user.get("id")
    
    with get_db() as db:
        channels = db.execute(text("""
            SELECT c.channel_id, c.name, c.type, c.created_at,
                   (SELECT COUNT(*) FROM chat_channel_mutes m WHERE m.channel_id = c.channel_id AND m.user_id = :uid) > 0 AS is_muted
            FROM chat_channels c
            WHERE c.workspace_id = :ws_id AND (
                c.type = 'general' OR
                c.channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = :uid)
            )
        """), {"ws_id": workspace_id, "uid": user_id}).mappings().all()
        
        channels_list = []
        for ch in channels:
            members = []
            recipient = None
            ch_name = ch["name"]
            
            if ch["type"] == "general":
                pass
            else:
                member_rows = db.execute(text("""
                    SELECT u.user_id, u.full_name, u.email
                    FROM chat_channel_members m
                    JOIN users u ON m.user_id = u.user_id
                    WHERE m.channel_id = :ch_id AND u.deleted_at IS NULL
                """), {"ch_id": ch["channel_id"]}).mappings().all()
                for mr in member_rows:
                    m_data = {
                        "user_id": mr["user_id"],
                        "full_name": mr["full_name"],
                        "email": mr["email"],
                        "is_online": mr["user_id"] in manager.active_connections
                    }
                    members.append(m_data)
                    if ch["type"] == "direct" and mr["user_id"] != user_id:
                        recipient = m_data
                        ch_name = mr["full_name"]
            
            latest = db.execute(text("""
                SELECT message_text, created_at, sender_id, deleted_at, file_name FROM chat_messages 
                WHERE channel_id = :ch_id
                ORDER BY created_at DESC LIMIT 1
            """), {"ch_id": ch["channel_id"]}).mappings().first()
            
            latest_msg = None
            if latest:
                is_deleted = latest["deleted_at"] is not None
                latest_msg = {
                    "text": "This message was recalled." if is_deleted else (latest["message_text"] or f"📎 {latest['file_name']}" if latest["file_name"] else latest["message_text"]),
                    "created_at": latest["created_at"].isoformat() if latest["created_at"] else None,
                    "sender_id": latest["sender_id"]
                }

            unread_count = db.execute(text("""
                SELECT COUNT(*) FROM chat_messages m
                LEFT JOIN chat_message_reads r ON m.message_id = r.message_id AND r.user_id = :uid
                WHERE m.channel_id = :ch_id AND m.sender_id != :uid AND r.id IS NULL AND m.deleted_at IS NULL
            """), {"ch_id": ch["channel_id"], "uid": user_id}).scalar() or 0

            channels_list.append({
                "channel_id": ch["channel_id"],
                "name": ch_name,
                "type": ch["type"],
                "is_muted": bool(ch["is_muted"]),
                "members": members,
                "recipient": recipient,
                "latest_message": latest_msg,
                "unread_count": unread_count,
                "created_at": ch["created_at"].isoformat() if ch["created_at"] else None
            })
            
    return success_response(data=channels_list)

@router.post("/channels")
async def create_chat_channel(
    payload: ChannelCreatePayload,
    current_user: dict = Depends(get_current_user)
):
    workspace_id = current_user.get("tenant_id")
    user_id = current_user.get("id")
    
    with get_db() as db:
        if payload.type == "direct":
            if not payload.recipient_id:
                raise HTTPException(status_code=400, detail="Recipient ID is required for direct chat.")
            
            recipient_id = payload.recipient_id
            if recipient_id.startswith("emp_"):
                emp_id = recipient_id.replace("emp_", "")
                emp_row = db.execute(text("""
                    SELECT name, email, role FROM hrms_employees 
                    WHERE employee_id = :emp_id AND workspace_id = :ws_id
                """), {"emp_id": emp_id, "ws_id": workspace_id}).mappings().first()
                if not emp_row:
                    raise HTTPException(status_code=404, detail="Employee not found.")
                
                usr_id = db.execute(text("""
                    SELECT user_id FROM users WHERE email = :email AND workspace_id = :ws_id
                """), {"email": emp_row["email"], "ws_id": workspace_id}).scalar()
                
                if not usr_id:
                    usr_id = str(uuid.uuid4())
                    db.execute(text("""
                        INSERT INTO users (user_id, workspace_id, username, full_name, email, role_id, status)
                        VALUES (:uid, :ws_id, :email, :name, :email, :role, 'active')
                    """), {
                        "uid": usr_id,
                        "ws_id": workspace_id,
                        "email": emp_row["email"],
                        "name": emp_row["name"],
                        "role": "role_employee_" + workspace_id
                    })
                recipient_id = usr_id

            member_count = 1 if user_id == recipient_id else 2
            existing_channel_id = db.execute(text("""
                SELECT c.channel_id
                FROM chat_channels c
                WHERE c.type = 'direct' AND c.workspace_id = :ws_id
                  AND (
                      SELECT COUNT(DISTINCT user_id) 
                      FROM chat_channel_members 
                      WHERE channel_id = c.channel_id
                  ) = :member_count
                  AND EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = c.channel_id AND user_id = :uid1)
                  AND EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = c.channel_id AND user_id = :uid2)
            """), {
                "ws_id": workspace_id,
                "member_count": member_count,
                "uid1": user_id,
                "uid2": recipient_id
            }).scalar()
            
            if existing_channel_id:
                return success_response(data={"channel_id": existing_channel_id}, message="Direct channel already exists.")
            
            channel_id = str(uuid.uuid4())
            recipient_name = db.execute(
                text("SELECT full_name FROM users WHERE user_id = :uid"),
                {"uid": recipient_id}
            ).scalar() or "User"
            
            db.execute(text("""
                INSERT INTO chat_channels (channel_id, workspace_id, name, type)
                VALUES (:ch_id, :ws_id, :name, 'direct')
            """), {"ch_id": channel_id, "ws_id": workspace_id, "name": f"Direct: {recipient_name}"})
            
            uids = [user_id] if user_id == recipient_id else [user_id, recipient_id]
            for uid in uids:
                db.execute(text("""
                    INSERT INTO chat_channel_members (id, workspace_id, channel_id, user_id)
                    VALUES (:id, :ws_id, :ch_id, :uid)
                """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "ch_id": channel_id, "uid": uid})
                
            return success_response(data={"channel_id": channel_id}, message="Direct channel created.")
            
        elif payload.type == "group":
            if not payload.name or not payload.name.strip():
                raise HTTPException(status_code=400, detail="Group name is required.")
                
            channel_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO chat_channels (channel_id, workspace_id, name, type)
                VALUES (:ch_id, :ws_id, :name, 'group')
            """), {"ch_id": channel_id, "ws_id": workspace_id, "name": payload.name.strip()})
            
            db.execute(text("""
                INSERT INTO chat_channel_members (id, workspace_id, channel_id, user_id)
                VALUES (:id, :ws_id, :ch_id, :uid)
            """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "ch_id": channel_id, "uid": user_id})
            
            if payload.member_ids:
                for uid in payload.member_ids:
                    if uid != user_id:
                        db.execute(text("""
                            INSERT INTO chat_channel_members (id, workspace_id, channel_id, user_id)
                            VALUES (:id, :ws_id, :ch_id, :uid)
                        """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "ch_id": channel_id, "uid": uid})

            # Add an initial system message
            msg_id = str(uuid.uuid4())
            timestamp = datetime.now()
            creator_name = db.execute(
                text("SELECT full_name FROM users WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar() or "User"
            
            db.execute(text("""
                INSERT INTO chat_messages (message_id, workspace_id, channel_id, sender_id, message_text, created_at)
                VALUES (:msg_id, :ws_id, :ch_id, :sender_id, :text, :timestamp)
            """), {
                "msg_id": msg_id,
                "ws_id": workspace_id,
                "ch_id": channel_id,
                "sender_id": user_id,
                "text": f"👥 Group created by {creator_name}.",
                "timestamp": timestamp
            })
                        
            return success_response(data={"channel_id": channel_id}, message="Group channel created.")
            
        elif payload.type == "general":
            if current_user.get("role_name") not in ("Super Admin", "Organization Admin"):
                raise HTTPException(status_code=403, detail="Only admins can create General channels.")
            if not payload.name or not payload.name.strip():
                raise HTTPException(status_code=400, detail="General channel name is required.")
                
            channel_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO chat_channels (channel_id, workspace_id, name, type)
                VALUES (:ch_id, :ws_id, :name, 'general')
            """), {"ch_id": channel_id, "ws_id": workspace_id, "name": payload.name.strip()})
            
            db.execute(text("""
                INSERT INTO chat_channel_members (id, workspace_id, channel_id, user_id)
                VALUES (:id, :ws_id, :ch_id, :uid)
            """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "ch_id": channel_id, "uid": user_id})

            # Add an initial system message
            msg_id = str(uuid.uuid4())
            timestamp = datetime.now()
            creator_name = db.execute(
                text("SELECT full_name FROM users WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar() or "Admin"
            
            db.execute(text("""
                INSERT INTO chat_messages (message_id, workspace_id, channel_id, sender_id, message_text, created_at)
                VALUES (:msg_id, :ws_id, :ch_id, :sender_id, :text, :timestamp)
            """), {
                "msg_id": msg_id,
                "ws_id": workspace_id,
                "ch_id": channel_id,
                "sender_id": user_id,
                "text": f"📢 General channel #{payload.name.strip()} created by {creator_name}.",
                "timestamp": timestamp
            })

            return success_response(data={"channel_id": channel_id}, message="General channel created.")
            
        else:
            raise HTTPException(status_code=400, detail="Invalid channel type.")

@router.get("/channels/{channel_id}/messages")
async def list_channel_messages_duplicate(
    channel_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    workspace_id = current_user.get("tenant_id")
    user_id = current_user.get("id")
    
    with get_db() as db:
        ch = db.execute(text("""
            SELECT type FROM chat_channels WHERE channel_id = :ch_id AND workspace_id = :ws_id
        """), {"ch_id": channel_id, "ws_id": workspace_id}).mappings().first()
        
        if not ch:
            raise HTTPException(status_code=404, detail="Channel not found.")
            
        if ch["type"] != "general":
            is_member = db.execute(text("""
                SELECT id FROM chat_channel_members WHERE channel_id = :ch_id AND user_id = :uid
            """), {"ch_id": channel_id, "uid": user_id}).scalar()
            if not is_member:
                raise HTTPException(status_code=403, detail="Access denied.")

        offset = (page - 1) * per_page
        
        msg_rows = db.execute(text("""
            SELECT m.message_id, m.channel_id, m.sender_id, u.full_name AS sender_name,
                   m.message_text, m.file_url, m.file_name, m.file_type, m.is_pinned,
                   m.reply_to_message_id, m.deleted_at, m.created_at
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.channel_id = :ch_id AND m.workspace_id = :ws_id
            ORDER BY m.created_at ASC
            LIMIT :limit OFFSET :offset
        """), {"ch_id": channel_id, "ws_id": workspace_id, "limit": per_page, "offset": offset}).mappings().all()
        
        messages_list = []
        for mr in msg_rows:
            is_deleted = mr["deleted_at"] is not None
            
            read_rows = db.execute(text("""
                SELECT user_id FROM chat_message_reads WHERE message_id = :msg_id
            """), {"msg_id": mr["message_id"]}).scalars().all()
            
            react_rows = db.execute(text("""
                SELECT r.emoji, r.user_id, u.full_name AS user_name
                FROM chat_message_reactions r
                JOIN users u ON r.user_id = u.user_id
                WHERE r.message_id = :msg_id
            """), {"msg_id": mr["message_id"]}).mappings().all()
            
            reactions_list = []
            for rr in react_rows:
                reactions_list.append({
                    "emoji": rr["emoji"],
                    "user_id": rr["user_id"],
                    "user_name": rr["user_name"]
                })
                
            reply_to_text = None
            reply_to_sender_name = None
            if mr["reply_to_message_id"]:
                quoted_row = db.execute(text("""
                    SELECT m.message_text, m.file_name, u.full_name 
                    FROM chat_messages m
                    JOIN users u ON m.sender_id = u.user_id
                    WHERE m.message_id = :reply_to_id
                """), {"reply_to_id": mr["reply_to_message_id"]}).mappings().first()
                if quoted_row:
                    reply_to_text = quoted_row["message_text"] if not quoted_row["file_name"] else f"📎 {quoted_row['file_name']}"
                    reply_to_sender_name = quoted_row["full_name"]
                    
            messages_list.append({
                "message_id": mr["message_id"],
                "channel_id": mr["channel_id"],
                "sender_id": mr["sender_id"],
                "sender_name": mr["sender_name"],
                "text": "" if is_deleted else mr["message_text"],
                "file_url": None if is_deleted else mr["file_url"],
                "file_name": None if is_deleted else mr["file_name"],
                "file_type": None if is_deleted else mr["file_type"],
                "is_pinned": bool(mr["is_pinned"]) if not is_deleted else False,
                "reply_to_id": mr["reply_to_message_id"],
                "reply_to_text": reply_to_text,
                "reply_to_sender_name": reply_to_sender_name,
                "is_deleted": is_deleted,
                "reactions": reactions_list,
                "read_by": list(read_rows),
                "created_at": mr["created_at"].isoformat() if mr["created_at"] else None
            })
            
    return success_response(data=messages_list)

# WebSocket Endpoint
@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(...)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4008)
        return
        
    user_id = payload.get("sub")
    workspace_id = payload.get("tenant_id")
    
    if not user_id or not workspace_id:
        await websocket.close(code=4008)
        return
        
    await manager.connect(user_id, workspace_id, websocket)

    online_user_ids = [uid for uid in manager.active_connections.keys()]
    try:
        await websocket.send_json({
            "type": "online_users_list",
            "user_ids": online_user_ids
        })
    except Exception:
        pass
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            channel_id = data.get("channel_id")
            
            with get_db() as db:
                sender_name = db.execute(
                    text("SELECT full_name FROM users WHERE user_id = :uid"),
                    {"uid": user_id}
                ).scalar() or "User"
                
                # ─── ACTION: TYPING INDICATOR ─────────────────────────────
                if action == "typing":
                    is_typing = bool(data.get("is_typing", False))
                    broadcast_payload = {
                        "type": "typing",
                        "channel_id": channel_id,
                        "user_id": user_id,
                        "sender_name": sender_name,
                        "is_typing": is_typing
                    }
                    await manager.broadcast_to_members(db, workspace_id, channel_id, broadcast_payload)
                    continue

                # ─── ACTION: EMOJI REACTION ───────────────────────────────
                elif action == "react":
                    message_id = data.get("message_id")
                    emoji = data.get("emoji")
                    if not message_id or not emoji:
                        continue
                        
                    existing = db.execute(text("""
                        SELECT id FROM chat_message_reactions 
                        WHERE message_id = :msg_id AND user_id = :uid AND emoji = :emoji
                    """), {"msg_id": message_id, "uid": user_id, "emoji": emoji}).scalar()
                    
                    react_action = "add"
                    if existing:
                        db.execute(text("DELETE FROM chat_message_reactions WHERE id = :id"), {"id": existing})
                        react_action = "remove"
                    else:
                        db.execute(text("""
                            INSERT INTO chat_message_reactions (id, workspace_id, message_id, user_id, emoji)
                            VALUES (:id, :ws_id, :msg_id, :uid, :emoji)
                        """), {
                            "id": str(uuid.uuid4()), "ws_id": workspace_id,
                            "msg_id": message_id, "uid": user_id, "emoji": emoji
                        })

                    broadcast_payload = {
                        "type": "reaction",
                        "channel_id": channel_id,
                        "message_id": message_id,
                        "user_id": user_id,
                        "user_name": sender_name,
                        "emoji": emoji,
                        "action": react_action
                    }
                    await manager.broadcast_to_members(db, workspace_id, channel_id, broadcast_payload)
                    continue

                # ─── ACTION: READ CHANNEL (Ticks update) ──────────────────
                elif action == "read_channel":
                    unread_msgs = db.execute(text("""
                        SELECT m.message_id FROM chat_messages m
                        LEFT JOIN chat_message_reads r ON m.message_id = r.message_id AND r.user_id = :uid
                        WHERE m.channel_id = :ch_id AND m.sender_id != :uid AND r.id IS NULL
                    """), {"ch_id": channel_id, "uid": user_id}).scalars().all()
                    
                    for msg_id in unread_msgs:
                        db.execute(text("""
                            INSERT INTO chat_message_reads (id, workspace_id, message_id, user_id)
                            VALUES (:id, :ws_id, :msg_id, :uid)
                        """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "msg_id": msg_id, "uid": user_id})
                        
                    broadcast_payload = {
                        "type": "channel_read",
                        "channel_id": channel_id,
                        "user_id": user_id
                    }
                    await manager.broadcast_to_members(db, workspace_id, channel_id, broadcast_payload)
                    continue

                # ─── STANDARD MESSAGE (Text, File or Reply Quote) ─────────
                message_text = data.get("text", "")
                file_url = data.get("file_url")
                file_name = data.get("file_name")
                file_type = data.get("file_type")
                reply_to_id = data.get("reply_to_id")
                
                if (not message_text or not message_text.strip()) and not file_url:
                    continue
                    
                msg_id = str(uuid.uuid4())
                timestamp = datetime.now()
                
                db.execute(text("""
                    INSERT INTO chat_messages (message_id, workspace_id, channel_id, sender_id, message_text, file_url, file_name, file_type, reply_to_message_id, created_at)
                    VALUES (:msg_id, :ws_id, :ch_id, :sender_id, :text, :file_url, :file_name, :file_type, :reply_to_id, :timestamp)
                """), {
                    "msg_id": msg_id,
                    "ws_id": workspace_id,
                    "ch_id": channel_id,
                    "sender_id": user_id,
                    "text": message_text,
                    "file_url": file_url,
                    "file_name": file_name,
                    "file_type": file_type,
                    "reply_to_id": reply_to_id,
                    "timestamp": timestamp
                })
                
                db.execute(text("""
                    INSERT INTO chat_message_reads (id, workspace_id, message_id, user_id)
                    VALUES (:id, :ws_id, :msg_id, :uid)
                """), {"id": str(uuid.uuid4()), "ws_id": workspace_id, "msg_id": msg_id, "uid": user_id})

                reply_to_text = None
                reply_to_sender_name = None
                if reply_to_id:
                    quoted_row = db.execute(text("""
                        SELECT m.message_text, m.file_name, u.full_name 
                        FROM chat_messages m
                        JOIN users u ON m.sender_id = u.user_id
                        WHERE m.message_id = :reply_to_id
                    """), {"reply_to_id": reply_to_id}).mappings().first()
                    if quoted_row:
                        reply_to_text = quoted_row["message_text"] if not quoted_row["file_name"] else f"📎 {quoted_row['file_name']}"
                        reply_to_sender_name = quoted_row["full_name"]

            broadcast_payload = {
                "message_id": msg_id,
                "channel_id": channel_id,
                "sender_id": user_id,
                "sender_name": sender_name,
                "text": message_text,
                "file_url": file_url,
                "file_name": file_name,
                "file_type": file_type,
                "reply_to_id": reply_to_id,
                "reply_to_text": reply_to_text,
                "reply_to_sender_name": reply_to_sender_name,
                "is_pinned": False,
                "reactions": [],
                "read_by": [user_id],
                "created_at": timestamp.isoformat()
            }
            
            with get_db() as db:
                await manager.broadcast_to_members(db, workspace_id, channel_id, broadcast_payload)
                
    except WebSocketDisconnect:
        await manager.disconnect(user_id, workspace_id, websocket)
    except Exception as e:
        print(f"[!] Error in chat WebSocket: {e}")
        await manager.disconnect(user_id, workspace_id, websocket)
