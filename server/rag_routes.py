"""
RAG Routes for document upload and management
"""
import os
import tempfile
import logging
import requests
import hashlib
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from .auth_utils import require_auth
from .rag_service import rag_service

logger = logging.getLogger(__name__)

rag_bp = Blueprint('rag', __name__)

# Configuration
MAX_FILE_SIZE = 30 * 1024 * 1024  # 30 MB total for all files
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'pptx', 'csv'}
UPLOAD_FOLDER = tempfile.gettempdir()
FIRECRAWL_API_KEY = 'fc-74999f84259c4614bf86a5ff4e46fb61'
FIRECRAWL_SCRAPE_URL = 'https://api.firecrawl.dev/v1/scrape'
FIRECRAWL_CRAWL_URL = 'https://api.firecrawl.dev/v1/crawl'
FIRECRAWL_CRAWL_STATUS_URL = 'https://api.firecrawl.dev/v1/crawl/status'

# In-memory crawl status storage (in production, use Redis or database)
crawl_status_storage = {}

# In-memory storage for discovered pages (in production, use Redis or database)
discovered_pages_storage = {}

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
    Accepts: PDF, DOCX, TXT, PPTX, CSV files (single or multiple) or raw text
    Max size: 30 MB total for all files
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Check if request contains files or text
        has_files = 'file' in request.files or len(request.files.getlist('files')) > 0
        has_text = 'text' in request.form or (request.is_json and 'text' in request.get_json())
        
        if not has_files and not has_text:
            return jsonify({
                'error': 'Either file(s) or text content is required'
            }), 400
        
        # Handle file upload (single or multiple)
        if has_files:
            # Support both 'file' (single) and 'files' (multiple) form field names
            files = request.files.getlist('files') if 'files' in request.files else [request.files.get('file')]
            files = [f for f in files if f and f.filename]  # Filter out None and empty filenames
            
            if not files:
                return jsonify({'error': 'No files selected'}), 400
            
            # Calculate total size
            total_size = sum(f.content_length or 0 for f in files)
            # If content_length is not available, read file size
            if total_size == 0:
                for f in files:
                    f.seek(0, os.SEEK_END)
                    total_size += f.tell()
                    f.seek(0)  # Reset
            
            if total_size > MAX_FILE_SIZE:
                size_mb = total_size / (1024 * 1024)
                return jsonify({
                    'error': f'Total file size ({size_mb:.2f} MB) exceeds maximum allowed size (30 MB)'
                }), 413
            
            uploaded_files = []
            failed_files = []
            total_chunks = 0
            
            for file in files:
                if not allowed_file(file.filename):
                    failed_files.append({
                        'filename': file.filename,
                        'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
                    })
                    continue
                
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
                        failed_files.append({'filename': filename, 'error': error})
                    else:
                        uploaded_files.append({
                            'filename': filename,
                            'chunks': chunks_count
                        })
                        total_chunks += chunks_count
                    
                finally:
                    # Clean up temporary file
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except Exception as e:
                            logger.warning(f"Failed to remove temp file: {e}")
            
            # Prepare response
            if uploaded_files:
                response_data = {
                    'message': f'Successfully uploaded {len(uploaded_files)} file(s)',
                    'uploaded_files': uploaded_files,
                    'total_chunks': total_chunks,
                    'total_size_mb': round(total_size / (1024 * 1024), 2)
                }
                
                if failed_files:
                    response_data['failed_files'] = failed_files
                    response_data['message'] += f' ({len(failed_files)} failed)'
                
                # For backward compatibility with single file uploads
                if len(uploaded_files) == 1 and not failed_files:
                    response_data['filename'] = uploaded_files[0]['filename']
                    response_data['chunks'] = uploaded_files[0]['chunks']
                
                return jsonify(response_data), 200
            else:
                return jsonify({
                    'error': 'All file uploads failed',
                    'failed_files': failed_files
                }), 500
        
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
            
            # Check text size (approximate 30 MB limit)
            text_size = len(text.encode('utf-8'))
            if text_size > MAX_FILE_SIZE:
                size_mb = text_size / (1024 * 1024)
                return jsonify({
                    'error': f'Text size ({size_mb:.2f} MB) exceeds maximum allowed size (30 MB)'
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
    Note: URL crawls (url_crawl_*) can be deleted to allow re-crawling
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Delete document from Qdrant
        success, error = rag_service.delete_document(workspace_id, filename)
        
        if error:
            return jsonify({'error': error}), 500
        
        # If deleting a URL crawl, reset the limit flag
        if filename.startswith('url_crawl_'):
            logger.info(f"URL crawl deleted: {filename} - user can now crawl a new URL")
        
        return jsonify({
            'message': f'Document "{filename}" deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@rag_bp.route('/rag/documents/<filename>/content', methods=['GET'])
@require_auth
def get_document_content(filename):
    """
    Retrieve the content of a specific document
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Get document content from RAG service
        content, error = rag_service.get_document_content(workspace_id, filename)
        
        if error:
            return jsonify({'error': error}), 404
        
        return jsonify({
            'filename': filename,
            'content': content
        }), 200
        
    except Exception as e:
        logger.error(f"Get document content error: {e}")
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

@rag_bp.route('/rag/crawl-url', methods=['POST'])
@require_auth
def crawl_url():
    """
    Crawl a website using Firecrawl API and store in Qdrant.
    Supports both single page scraping and multi-page crawling.
    Returns a job ID for async crawling which can be polled for status.
    """
    try:
        workspace_id = request.user.get('workspace_id')
        data = request.get_json()
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data.get('url', '').strip()
        crawl_mode = data.get('mode', 'single')  # 'single' or 'multi'
        max_pages = min(int(data.get('max_pages', 10)), 50)  # Default to 10, cap at 50 to conserve API credits
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format. Must start with http:// or https://'}), 400
        
        # Check if workspace already has a crawled URL
        documents = rag_service.list_documents(workspace_id)
        existing_urls = [doc for doc in documents if doc.get('filename', '').startswith('url_crawl_')]
        
        if existing_urls:
            return jsonify({
                'error': 'URL crawl limit reached',
                'message': 'You have already crawled one URL. To crawl additional URLs, please contact support@nexusaihub.co.in',
                'existing_crawl': existing_urls[0].get('filename')
            }), 403
        
        logger.info(f"Starting {crawl_mode} crawl for URL: {url}")
        
        if crawl_mode == 'single':
            # Single page scraping (synchronous)
            return _scrape_single_page(url, workspace_id)
        else:
            # Multi-page crawling (asynchronous)
            return _start_multi_page_crawl(url, workspace_id, max_pages)
            
    except Exception as e:
        logger.error(f"URL crawl error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500


def _scrape_single_page(url, workspace_id):
    """
    Scrape a single page using Firecrawl API
    """
    try:
        firecrawl_response = requests.post(
            FIRECRAWL_SCRAPE_URL,
            headers={
                'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'url': url,
                'formats': ['markdown', 'html'],
                'onlyMainContent': True,
                'includeTags': [],
                'excludeTags': ['nav', 'footer', 'header'],
                'waitFor': 0
            },
            timeout=60
        )
        
        if firecrawl_response.status_code != 200:
            error_data = firecrawl_response.json() if firecrawl_response.headers.get('content-type', '').startswith('application/json') else {}
            error_msg = error_data.get('error', f'Firecrawl API returned status {firecrawl_response.status_code}')
            logger.error(f"Firecrawl API error: {error_msg}")
            return jsonify({'error': f'Failed to crawl URL: {error_msg}'}), 500
        
        crawl_data = firecrawl_response.json()
        
        # Extract content (prefer markdown, fallback to html)
        content = ''
        if crawl_data.get('data', {}).get('markdown'):
            content = crawl_data['data']['markdown']
        elif crawl_data.get('data', {}).get('html'):
            content = crawl_data['data']['html']
        else:
            return jsonify({'error': 'No content extracted from URL'}), 500
        
        if not content.strip():
            return jsonify({'error': 'URL returned empty content'}), 400
        
        # Generate unique filename for the crawled URL
        filename = f"url_crawl_{hashlib.md5(url.encode()).hexdigest()[:12]}.txt"
        
        # Limit content size to prevent token overflow
        max_content_length = 80000  # characters (~20K tokens)
        if len(content) > max_content_length:
            logger.warning(f"Content too large ({len(content)} chars), truncating to {max_content_length}")
            content = content[:max_content_length]
            content += "\n\n[Note: Content truncated due to size limits]"
        
        logger.info(f"Processing content: {len(content)} characters (~{len(content)//4} tokens)")
        
        # Process the crawled content
        chunks_count, error = rag_service.process_raw_text(
            text=content,
            workspace_id=workspace_id,
            title=filename
        )
        
        if error:
            return jsonify({'error': f'Failed to process crawled content: {error}'}), 500
        
        logger.info(f"Successfully crawled and indexed URL: {url} ({chunks_count} chunks)")
        
        return jsonify({
            'message': 'URL crawled and indexed successfully',
            'url': url,
            'filename': filename,
            'chunks': chunks_count,
            'content_length': len(content),
            'title': crawl_data.get('data', {}).get('title', 'Unknown'),
            'mode': 'single',
            'pages_crawled': 1,
            'pages_failed': 0
        }), 200
        
    except requests.Timeout:
        return jsonify({'error': 'URL crawl timeout. Please try a different URL.'}), 504
    except requests.RequestException as e:
        logger.error(f"Firecrawl request error: {e}")
        return jsonify({'error': f'Failed to connect to Firecrawl API: {str(e)}'}), 500


def _start_multi_page_crawl(url, workspace_id, max_pages):
    """
    Start asynchronous multi-page crawl using Firecrawl API
    """
    try:
        # Start the crawl job
        firecrawl_response = requests.post(
            FIRECRAWL_CRAWL_URL,
            headers={
                'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'url': url,
                'limit': max_pages,
                'scrapeOptions': {
                    'formats': ['markdown'],
                    'onlyMainContent': True,
                    'excludeTags': ['nav', 'footer', 'header']
                }
            },
            timeout=30
        )
        
        if firecrawl_response.status_code not in [200, 202]:
            error_data = firecrawl_response.json() if firecrawl_response.headers.get('content-type', '').startswith('application/json') else {}
            error_msg = error_data.get('error', f'Firecrawl API returned status {firecrawl_response.status_code}')
            
            # Check for insufficient credits error
            if 'credit' in error_msg.lower() or 'insufficient' in error_msg.lower():
                logger.warning(f"Firecrawl credits exhausted, falling back to single page crawl: {error_msg}")
                # Fallback to single page scraping
                return _scrape_single_page(url, workspace_id)
            
            logger.error(f"Firecrawl crawl start error: {error_msg}")
            return jsonify({'error': f'Failed to start crawl: {error_msg}'}), 500
        
        result = firecrawl_response.json()
        job_id = result.get('id')
        
        if not job_id:
            return jsonify({'error': 'No job ID returned from Firecrawl'}), 500
        
        # Store crawl job info
        crawl_status_storage[job_id] = {
            'workspace_id': workspace_id,
            'url': url,
            'status': 'started',
            'max_pages': max_pages,
            'pages_crawled': 0,
            'pages_failed': 0,
            'total_chunks': 0,
            'started_at': result.get('createdAt'),
            'crawl_details': []
        }
        
        logger.info(f"Started multi-page crawl job {job_id} for {url}")
        
        return jsonify({
            'message': 'Crawl job started successfully',
            'job_id': job_id,
            'url': url,
            'mode': 'multi',
            'max_pages': max_pages,
            'status': 'started'
        }), 202
        
    except requests.Timeout:
        return jsonify({'error': 'Request timeout starting crawl job'}), 504
    except requests.RequestException as e:
        logger.error(f"Firecrawl crawl start error: {e}")
        # Fallback to single page on network error
        logger.warning(f"Network error with multi-page crawl, falling back to single page")
        return _scrape_single_page(url, workspace_id)


@rag_bp.route('/rag/crawl-status/<job_id>', methods=['GET'])
@require_auth
def get_crawl_status(job_id):
    """
    Get the status of an async crawl job and process results when complete
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Check if job belongs to this workspace
        job_info = crawl_status_storage.get(job_id)
        if not job_info:
            return jsonify({'error': 'Job not found'}), 404
        
        if job_info['workspace_id'] != workspace_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check status with Firecrawl
        status_response = requests.get(
            f'{FIRECRAWL_CRAWL_STATUS_URL}/{job_id}',
            headers={'Authorization': f'Bearer {FIRECRAWL_API_KEY}'},
            timeout=30
        )
        
        if status_response.status_code != 200:
            logger.error(f"Failed to get crawl status: {status_response.status_code}")
            return jsonify({'error': 'Failed to get crawl status'}), 500
        
        status_data = status_response.json()
        crawl_status = status_data.get('status', 'unknown')
        
        # Update local storage
        job_info['status'] = crawl_status
        job_info['total_pages'] = status_data.get('total', 0)
        job_info['completed_pages'] = status_data.get('completed', 0)
        
        # If completed, process the results
        if crawl_status == 'completed':
            if not job_info.get('processed', False):
                _process_crawl_results(job_id, status_data, workspace_id)
                job_info['processed'] = True
        
        return jsonify({
            'job_id': job_id,
            'status': crawl_status,
            'url': job_info['url'],
            'total_pages': job_info.get('total_pages', 0),
            'completed_pages': job_info.get('completed_pages', 0),
            'pages_crawled': job_info.get('pages_crawled', 0),
            'pages_failed': job_info.get('pages_failed', 0),
            'total_chunks': job_info.get('total_chunks', 0),
            'crawl_details': job_info.get('crawl_details', []),
            'processed': job_info.get('processed', False)
        }), 200
        
    except requests.Timeout:
        return jsonify({'error': 'Request timeout checking crawl status'}), 504
    except requests.RequestException as e:
        logger.error(f"Status check error: {e}")
        return jsonify({'error': f'Failed to check status: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Get crawl status error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500


def _process_crawl_results(job_id, status_data, workspace_id):
    """
    Process completed crawl results and index them
    """
    job_info = crawl_status_storage[job_id]
    pages = status_data.get('data', [])
    
    logger.info(f"Processing {len(pages)} crawled pages for job {job_id}")
    
    pages_crawled = 0
    pages_failed = 0
    total_chunks = 0
    crawl_details = []
    
    # Generate a base filename using the root URL
    root_url = job_info['url']
    base_filename = f"url_crawl_{hashlib.md5(root_url.encode()).hexdigest()[:12]}"
    
    for idx, page in enumerate(pages):
        page_url = page.get('url', 'unknown')
        content = page.get('markdown', page.get('html', ''))
        page_title = page.get('metadata', {}).get('title', f'Page {idx + 1}')
        
        if not content or not content.strip():
            pages_failed += 1
            crawl_details.append({
                'url': page_url,
                'title': page_title,
                'status': 'failed',
                'error': 'No content extracted',
                'chunks': 0
            })
            continue
        
        try:
            # Limit content per page
            max_page_content = 50000  # ~12.5K tokens per page
            if len(content) > max_page_content:
                content = content[:max_page_content]
                content += f"\n\n[Note: Page content truncated]"
            
            # Create a unique filename for this page
            page_filename = f"{base_filename}_page{idx + 1}.txt"
            
            # Add page metadata to content
            enriched_content = f"# {page_title}\n\nSource URL: {page_url}\n\n{content}"
            
            # Process the page content
            chunks_count, error = rag_service.process_raw_text(
                text=enriched_content,
                workspace_id=workspace_id,
                title=page_filename
            )
            
            if error:
                pages_failed += 1
                crawl_details.append({
                    'url': page_url,
                    'title': page_title,
                    'status': 'failed',
                    'error': error,
                    'chunks': 0
                })
            else:
                pages_crawled += 1
                total_chunks += chunks_count
                crawl_details.append({
                    'url': page_url,
                    'title': page_title,
                    'status': 'success',
                    'chunks': chunks_count,
                    'content_length': len(content)
                })
            
        except Exception as e:
            pages_failed += 1
            crawl_details.append({
                'url': page_url,
                'title': page_title,
                'status': 'failed',
                'error': str(e),
                'chunks': 0
            })
            logger.error(f"Error processing page {page_url}: {e}")
    
    # Update job info
    job_info['pages_crawled'] = pages_crawled
    job_info['pages_failed'] = pages_failed
    job_info['total_chunks'] = total_chunks
    job_info['crawl_details'] = crawl_details
    
    logger.info(f"Crawl job {job_id} completed: {pages_crawled} pages crawled, {pages_failed} failed, {total_chunks} total chunks")


@rag_bp.route('/rag/crawled-urls', methods=['GET'])
@require_auth
def get_crawled_urls():
    """
    Get list of crawled URLs for the workspace
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        # Get all documents and filter for URL crawls
        documents = rag_service.list_documents(workspace_id)
        crawled_urls = [doc for doc in documents if doc.get('filename', '').startswith('url_crawl_')]
        
        return jsonify({
            'crawled_urls': crawled_urls,
            'count': len(crawled_urls),
            'limit_reached': len(crawled_urls) >= 1
        }), 200
        
    except Exception as e:
        logger.error(f"Get crawled URLs error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@rag_bp.route('/rag/discover-pages', methods=['POST'])
@require_auth
def discover_pages():
    """
    Discover all available pages from a website without crawling content.
    Returns a list of URLs found on the site for user selection.
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        data = request.get_json()
        url = data.get('url', '').strip()
        max_pages = min(int(data.get('max_pages', 1000)), 1000)  # Cap at 500 for discovery
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format. Must start with http:// or https://'}), 400
        
        logger.info(f"Discovering pages from URL: {url}")
        
        try:
            # Use Firecrawl's map endpoint to discover pages without scraping content
            firecrawl_response = requests.post(
                'https://api.firecrawl.dev/v1/map',
                headers={
                    'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'url': url,
                    'limit': max_pages
                },
                timeout=60
            )
            
            if firecrawl_response.status_code != 200:
                error_data = firecrawl_response.json() if firecrawl_response.headers.get('content-type', '').startswith('application/json') else {}
                error_msg = error_data.get('error', f'Firecrawl API returned status {firecrawl_response.status_code}')
                logger.error(f"Firecrawl map error: {error_msg}")
                return jsonify({'error': f'Failed to discover pages: {error_msg}'}), 500
            
            result = firecrawl_response.json()
            discovered_links = result.get('links', [])
            
            if not discovered_links:
                return jsonify({'error': 'No pages discovered from the URL'}), 404
            
            # Generate a discovery session ID
            discovery_id = hashlib.md5(f"{url}_{workspace_id}".encode()).hexdigest()
            
            # Store discovered pages with metadata
            pages = []
            for link in discovered_links:
                pages.append({
                    'url': link,
                    'title': link.split('/')[-1] or 'Home',  # Extract simple title from URL
                    'selected': False  # Default to not selected
                })
            
            discovered_pages_storage[discovery_id] = {
                'workspace_id': workspace_id,
                'base_url': url,
                'pages': pages,
                'discovered_at': result.get('createdAt', ''),
                'total_pages': len(pages)
            }
            
            logger.info(f"Discovered {len(pages)} pages for {url}")
            
            return jsonify({
                'discovery_id': discovery_id,
                'base_url': url,
                'pages': pages,
                'total_pages': len(pages)
            }), 200
            
        except requests.Timeout:
            return jsonify({'error': 'Page discovery timeout. Please try a different URL.'}), 504
        except requests.RequestException as e:
            logger.error(f"Firecrawl request error: {e}")
            return jsonify({'error': f'Failed to connect to Firecrawl API: {str(e)}'}), 500
        
    except Exception as e:
        logger.error(f"Page discovery error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500


@rag_bp.route('/rag/crawl-selected-pages', methods=['POST'])
@require_auth
def crawl_selected_pages():
    """
    Crawl only the user-selected pages from a previous discovery.
    Accepts a discovery_id and list of selected page URLs.
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        data = request.get_json()
        discovery_id = data.get('discovery_id')
        selected_urls = data.get('selected_urls', [])
        
        if not discovery_id:
            return jsonify({'error': 'Discovery ID required'}), 400
        
        if not selected_urls:
            return jsonify({'error': 'No pages selected for crawling'}), 400
        
        # Check if workspace already has a crawled URL
        documents = rag_service.list_documents(workspace_id)
        existing_urls = [doc for doc in documents if doc.get('filename', '').startswith('url_crawl_')]
        
        if existing_urls:
            return jsonify({
                'error': 'URL crawl limit reached',
                'message': 'You have already crawled one URL. To crawl additional URLs, please contact support@nexusaihub.co.in',
                'existing_crawl': existing_urls[0].get('filename')
            }), 403
        
        # Retrieve discovery data
        discovery_data = discovered_pages_storage.get(discovery_id)
        if not discovery_data:
            return jsonify({'error': 'Discovery session not found or expired'}), 404
        
        if discovery_data['workspace_id'] != workspace_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        base_url = discovery_data['base_url']
        logger.info(f"Crawling {len(selected_urls)} selected pages from {base_url}")
        
        # Process each selected page
        pages_crawled = 0
        pages_failed = 0
        total_chunks = 0
        crawl_details = []
        
        # Generate a base filename using the root URL
        base_filename = f"url_crawl_{hashlib.md5(base_url.encode()).hexdigest()[:12]}"
        
        for idx, page_url in enumerate(selected_urls):
            try:
                # Scrape individual page
                firecrawl_response = requests.post(
                    FIRECRAWL_SCRAPE_URL,
                    headers={
                        'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'url': page_url,
                        'formats': ['markdown'],
                        'onlyMainContent': True,
                        'excludeTags': ['nav', 'footer', 'header']
                    },
                    timeout=60
                )
                
                if firecrawl_response.status_code != 200:
                    pages_failed += 1
                    crawl_details.append({
                        'url': page_url,
                        'status': 'failed',
                        'error': f'Firecrawl returned status {firecrawl_response.status_code}',
                        'chunks': 0
                    })
                    continue
                
                page_data = firecrawl_response.json()
                content = page_data.get('data', {}).get('markdown', '')
                page_title = page_data.get('data', {}).get('title', f'Page {idx + 1}')
                
                if not content or not content.strip():
                    pages_failed += 1
                    crawl_details.append({
                        'url': page_url,
                        'title': page_title,
                        'status': 'failed',
                        'error': 'No content extracted',
                        'chunks': 0
                    })
                    continue
                
                # Limit content per page
                max_page_content = 50000  # ~12.5K tokens per page
                if len(content) > max_page_content:
                    content = content[:max_page_content]
                    content += f"\n\n[Note: Page content truncated]"
                
                # Create a unique filename for this page
                page_filename = f"{base_filename}_page{idx + 1}.txt"
                
                # Add page metadata to content
                enriched_content = f"# {page_title}\n\nSource URL: {page_url}\n\n{content}"
                
                # Process the page content
                chunks_count, error = rag_service.process_raw_text(
                    text=enriched_content,
                    workspace_id=workspace_id,
                    title=page_filename
                )
                
                if error:
                    pages_failed += 1
                    crawl_details.append({
                        'url': page_url,
                        'title': page_title,
                        'status': 'failed',
                        'error': error,
                        'chunks': 0
                    })
                else:
                    pages_crawled += 1
                    total_chunks += chunks_count
                    crawl_details.append({
                        'url': page_url,
                        'title': page_title,
                        'status': 'success',
                        'chunks': chunks_count,
                        'content_length': len(content)
                    })
                
            except Exception as e:
                pages_failed += 1
                crawl_details.append({
                    'url': page_url,
                    'status': 'failed',
                    'error': str(e),
                    'chunks': 0
                })
                logger.error(f"Error processing page {page_url}: {e}")
        
        logger.info(f"Selective crawl completed: {pages_crawled} pages crawled, {pages_failed} failed, {total_chunks} total chunks")
        
        return jsonify({
            'message': 'Selective crawl completed',
            'base_url': base_url,
            'pages_crawled': pages_crawled,
            'pages_failed': pages_failed,
            'total_chunks': total_chunks,
            'crawl_details': crawl_details
        }), 200
        
    except Exception as e:
        logger.error(f"Selective crawl error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500
