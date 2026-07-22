"""File upload API routes."""
import os
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from database import get_db
from database.models import User, UploadedFile
from services.parser import file_parser
from services.vector import vector_service
from models import FileUploadResponse

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file (PDF, DOCX, TXT, Markdown) and extract its content."""
    # Verify user exists
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check file extension
    ext = Path(file.filename).suffix.lower().lstrip(".")
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Read and save file
    content = await file.read()

    # Check file size
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    # Create database record
    uploaded_file = UploadedFile(
        user_id=user_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=ext,
        file_size=len(content),
        file_path=file_path,
        status="processing",
    )
    db.add(uploaded_file)
    await db.flush()

    try:
        # Parse file content
        extracted_text = file_parser.parse_file(file_path, ext)
        uploaded_file.content_text = extracted_text
        uploaded_file.status = "processed"

        # Add to vector store
        try:
            vector_service.add_documents(
                texts=[extracted_text],
                metadata_list=[{
                    "file_id": uploaded_file.id,
                    "user_id": user_id,
                    "filename": file.filename,
                    "file_type": ext,
                }],
            )
        except Exception as ve:
            # Vector store failure shouldn't block upload
            print(f"Vector store warning: {ve}")

    except Exception as e:
        uploaded_file.status = "failed"
        uploaded_file.content_text = f"解析失败: {str(e)}"

    await db.flush()
    await db.commit()
    await db.refresh(uploaded_file)

    return uploaded_file


@router.get("", response_model=List[FileUploadResponse])
async def list_files(user_id: str, db: AsyncSession = Depends(get_db)):
    """List all uploaded files for a user."""
    result = await db.execute(
        select(UploadedFile).where(UploadedFile.user_id == user_id).order_by(UploadedFile.created_at.desc())
    )
    files = result.scalars().all()
    return files


@router.get("/{file_id}")
async def get_file_content(file_id: str, db: AsyncSession = Depends(get_db)):
    """Get the extracted content of a file."""
    file_record = await db.get(UploadedFile, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "id": file_record.id,
        "filename": file_record.original_filename,
        "file_type": file_record.file_type,
        "content": file_record.content_text,
        "status": file_record.status,
    }


@router.delete("/{file_id}")
async def delete_file(file_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an uploaded file."""
    file_record = await db.get(UploadedFile, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete physical file
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)

    await db.delete(file_record)
    await db.commit()

    return {"message": "File deleted successfully"}
