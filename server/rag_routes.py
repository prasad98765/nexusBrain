"""
RAG Routes for document upload and management
"""
import os
import tempfile
import logging
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from .auth_utils import require_auth
from .rag_service import rag_service

logger = logging.getLogger(__name__)

rag_bp = Blueprint('rag', __name__)

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'pptx'}
UPLOAD_FOLDER = tempfile.gettempdir()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename):
    """Get file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

@rag_bp.route('/rag/upload', methods=['POST'])
@require_auth
def upload_document():
    """
    Upload and index documents
    Accepts: PDF, DOCX, TXT, PPTX files or raw text
    Max size: 10 MB
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Check if request contains file or text
        has_file = 'file' in request.files
        has_text = 'text' in request.form or (request.is_json and 'text' in request.get_json())
        
        if not has_file and not has_text:
            return jsonify({
                'error': 'Either file or text content is required'
            }), 400
        
        # Handle file upload
        if has_file:
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({
                    'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
                }), 400
            
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)  # Reset file pointer
            
            if file_size > MAX_FILE_SIZE:
                size_mb = file_size / (1024 * 1024)
                return jsonify({
                    'error': f'File size ({size_mb:.2f} MB) exceeds maximum allowed size (10 MB)'
                }), 413
            
            # Save file temporarily
            filename = secure_filename(file.filename)
            file_extension = get_file_extension(filename)
            temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{workspace_id}_{filename}")
            
            try:
                file.save(temp_path)
                
                # Process document
                chunks_count, error = rag_service.process_document(
                    file_path=temp_path,
                    filename=filename,
                    workspace_id=workspace_id,
                    file_type=file_extension
                )
                
                if error:
                    return jsonify({'error': error}), 500
                
                return jsonify({
                    'message': 'Document stored successfully',
                    'filename': filename,
                    'chunks': chunks_count,
                    'file_size_mb': round(file_size / (1024 * 1024), 2)
                }), 200
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception as e:
                        logger.warning(f"Failed to remove temp file: {e}")
        
        # Handle raw text upload
        elif has_text:
            if request.is_json:
                data = request.get_json()
                text = data.get('text', '')
                title = data.get('title', 'Raw Text')
            else:
                text = request.form.get('text', '')
                title = request.form.get('title', 'Raw Text')
            
            if not text.strip():
                return jsonify({'error': 'Text content is empty'}), 400
            
            # Check text size (approximate 10 MB limit)
            text_size = len(text.encode('utf-8'))
            if text_size > MAX_FILE_SIZE:
                size_mb = text_size / (1024 * 1024)
                return jsonify({
                    'error': f'Text size ({size_mb:.2f} MB) exceeds maximum allowed size (10 MB)'
                }), 413
            
            # Process text
            chunks_count, error = rag_service.process_raw_text(
                text=text,
                workspace_id=workspace_id,
                title=title
            )
            
            if error:
                return jsonify({'error': error}), 500
            
            return jsonify({
                'message': 'Text stored successfully',
                'title': title,
                'chunks': chunks_count,
                'text_size_kb': round(text_size / 1024, 2)
            }), 200
        
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@rag_bp.route('/rag/documents', methods=['GET'])
@require_auth
def list_documents():
    """
    List user's uploaded documents
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Get documents from RAG service
        documents = rag_service.list_documents(workspace_id)
        
        return jsonify({
            'documents': documents,
            'count': len(documents)
        }), 200
        
    except Exception as e:
        logger.error(f"List documents error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@rag_bp.route('/rag/search', methods=['POST'])
@require_auth
def search_documents():
    """
    Search through uploaded documents
    """
    try:
        workspace_id = request.user.get('workspace_id')
        data = request.get_json()
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        query = data.get('query')
        top_k = data.get('top_k', 5)
        threshold = data.get('threshold', 0.5)
        
        # Retrieve relevant contexts
        contexts = rag_service.retrieve_context(
            query=query,
            workspace_id=workspace_id,
            top_k=top_k,
            similarity_threshold=threshold
        )
        
        return jsonify({
            'query': query,
            'results': contexts,
            'count': len(contexts)
        }), 200
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@rag_bp.route('/rag/documents/<filename>', methods=['DELETE'])
@require_auth
def delete_document(filename):
    """
    Delete a document and all its chunks
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Delete document from Qdrant
        success, error = rag_service.delete_document(workspace_id, filename)
        
        if error:
            return jsonify({'error': error}), 500
        
        return jsonify({
            'message': f'Document "{filename}" deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@rag_bp.route('/rag/debug', methods=['POST'])
@require_auth
def debug_rag():
    """
    Debug endpoint to test RAG retrieval with detailed logs
    """
    try:
        workspace_id = request.user.get('workspace_id')
        data = request.get_json()
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        query = data.get('query')
        top_k = data.get('top_k', 10)  # Higher default for debugging
        threshold = data.get('threshold', 0.0)  # No threshold for debugging
        
        # Retrieve contexts with detailed logging
        contexts = rag_service.retrieve_context(
            query=query,
            workspace_id=workspace_id,
            top_k=top_k,
            similarity_threshold=threshold
        )
        
        # Also get document count
        documents = rag_service.list_documents(workspace_id)
        
        return jsonify({
            'query': query,
            'workspace_id': workspace_id,
            'parameters': {
                'top_k': top_k,
                'threshold': threshold
            },
            'total_documents': len(documents),
            'total_results': len(contexts),
            'results': contexts,
            'documents': documents,
            'message': 'Check backend logs for detailed debug information'
        }), 200
        
    except Exception as e:
        logger.error(f"Debug error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
