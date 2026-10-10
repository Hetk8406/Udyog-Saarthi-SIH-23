import os
import uuid
import zipfile
import re
from pathlib import Path
from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.core.exceptions import ValidationError

MAX_DOCUMENT_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_DOCUMENTS_PER_CANDIDATE = 10

ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
}


def sanitize_filename(filename: str) -> str:
    """Sanitize user filename for safe download headers, preserving extension."""
    base = os.path.basename(filename)
    # Remove any characters other than alphanumeric, space, dot, underscore, hyphen
    cleaned = re.sub(r'[^a-zA-Z0-9._ -]', '', base).strip()
    return cleaned or 'document'


def validate_document_file(file_obj) -> str:
    """
    Validates file extension, size limit, and real magic bytes.
    Returns verified MIME content type if valid, otherwise raises ValidationError.
    """
    # 1. Size verification
    if file_obj.size > MAX_DOCUMENT_SIZE:
        max_mb = MAX_DOCUMENT_SIZE / (1024 * 1024)
        size_mb = round(file_obj.size / (1024 * 1024), 2)
        raise ValidationError(
            f"The file size ({size_mb} MB) exceeds the maximum allowed limit of {int(max_mb)} MB. "
            f"Please compress or optimize your document before uploading."
        )

    # 2. Extension check
    filename = file_obj.name or ''
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"The file extension '.{ext}' is not supported. "
            f"Only PDF, DOCX, JPG, and PNG documents are accepted."
        )

    # 3. Magic bytes / structure inspection
    head = file_obj.read(1024)
    file_obj.seek(0)

    if ext == 'pdf':
        if not head.startswith(b'%PDF-'):
            raise ValidationError(
                "The file content does not match the PDF format. "
                "Please upload a valid, uncorrupted PDF document."
            )
        return 'application/pdf'

    elif ext == 'png':
        if not head.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValidationError(
                "The file content does not match the PNG image format. "
                "Please upload a valid PNG image."
            )
        return 'image/png'

    elif ext in ('jpg', 'jpeg'):
        if not head.startswith(b'\xff\xd8\xff'):
            raise ValidationError(
                "The file content does not match the JPEG image format. "
                "Please upload a valid JPEG/JPG image."
            )
        return 'image/jpeg'

    elif ext == 'docx':
        if not head.startswith(b'PK\x03\x04'):
            raise ValidationError(
                "The file content is not a valid Microsoft Word (DOCX) document package."
            )
        # Deep inspection of zip archive to confirm WordprocessingML structure
        try:
            file_obj.seek(0)
            with zipfile.ZipFile(file_obj, 'r') as zf:
                names = zf.namelist()
                has_docx_structure = 'word/document.xml' in names or any(
                    name.startswith('word/') for name in names
                )
                if not has_docx_structure:
                    raise ValidationError(
                        "The archive is missing standard Word document components. "
                        "Please verify the file was saved as a genuine Microsoft Word (.docx) document."
                    )
        except zipfile.BadZipFile:
            raise ValidationError(
                "The file is corrupted or not a valid DOCX document package."
            )
        finally:
            file_obj.seek(0)
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    raise ValidationError("Unsupported file format.")


class DocumentStorage:
    """
    Unified storage manager supporting S3-compatible private buckets (AWS S3, Cloudflare R2)
    and secure private local disk storage.
    """

    def __init__(self):
        self.use_s3 = getattr(settings, 'USE_S3_STORAGE', False)
        self.private_root = Path(getattr(settings, 'PRIVATE_STORAGE_ROOT', settings.BASE_DIR / 'private_storage'))
        self.signer = TimestampSigner(salt='candidate_document_download_salt')

    def _get_s3_client(self):
        import boto3
        kwargs = {
            'aws_access_key_id': settings.AWS_ACCESS_KEY_ID,
            'aws_secret_access_key': settings.AWS_SECRET_ACCESS_KEY,
            'region_name': getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1'),
        }
        endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
        if endpoint_url:
            kwargs['endpoint_url'] = endpoint_url
        return boto3.client('s3', **kwargs)

    def save_file(self, file_obj, candidate_id: str, original_filename: str) -> tuple[str, int]:
        """
        Saves file to private storage with a random UUID-based stored key.
        Returns (stored_key, size).
        """
        ext = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else 'bin'
        doc_uuid = uuid.uuid4().hex
        stored_key = f"documents/{candidate_id}/{doc_uuid}.{ext}"

        file_obj.seek(0)
        content = file_obj.read()
        size = len(content)

        if self.use_s3:
            s3 = self._get_s3_client()
            bucket = settings.AWS_STORAGE_BUCKET_NAME
            content_type = ALLOWED_EXTENSIONS.get(ext, 'application/octet-stream')
            s3.put_object(
                Bucket=bucket,
                Key=stored_key,
                Body=content,
                ContentType=content_type,
                ServerSideEncryption='AES256',
            )
        else:
            local_path = self.private_root / stored_key
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, 'wb') as f:
                f.write(content)

        return stored_key, size

    def delete_file(self, stored_key: str):
        """Removes the file from storage."""
        if not stored_key:
            return

        if self.use_s3:
            try:
                s3 = self._get_s3_client()
                s3.delete_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=stored_key,
                )
            except Exception:
                pass
        else:
            local_path = self.private_root / stored_key
            try:
                if local_path.exists():
                    local_path.unlink()
            except Exception:
                pass

    def get_local_file_path(self, stored_key: str) -> Path | None:
        """Returns Path to local file if it exists."""
        if self.use_s3:
            return None
        local_path = self.private_root / stored_key
        return local_path if local_path.exists() else None

    def generate_signed_download_url(self, document, request=None, expires_in: int = 300) -> str:
        """
        Generates a short-lived download URL (valid for expires_in seconds, default 5 mins).
        """
        safe_name = sanitize_filename(document.original_filename)

        if self.use_s3:
            s3 = self._get_s3_client()
            url = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': document.stored_key,
                    'ResponseContentDisposition': f'attachment; filename="{safe_name}"',
                    'ResponseContentType': document.content_type,
                },
                ExpiresIn=expires_in,
            )
            return url
        else:
            token = self.signer.sign(str(document.id))
            base_url = ''
            if request:
                base_url = request.build_absolute_uri('/')[:-1]
            return f"{base_url}/api/profiles/documents/{document.id}/stream/?token={token}"

    def verify_token(self, document_id: str, token: str, max_age: int = 300) -> bool:
        """Verifies timestamp signature token for local download streaming."""
        try:
            val = self.signer.unsign(token, max_age=max_age)
            return val == str(document_id)
        except (BadSignature, SignatureExpired):
            return False


document_storage = DocumentStorage()
