from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func
from server.models import Contact, CustomField, Workspace, db
from server.auth_utils import require_auth
import math

contacts_bp = Blueprint('contacts', __name__)

@contacts_bp.route('/contacts', methods=['GET'])
@require_auth
def get_contacts(current_user):
    """Get contacts with pagination, search, and filtering"""
    try:
        workspace_id = request.args.get('workspace_id')
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 25)), 100)  # Max 100 per page
        search = request.args.get('search', '').strip()
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Build query
        query = Contact.query.filter_by(workspace_id=workspace_id)
        
        # Add search functionality
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Contact.name.ilike(search_term),
                    Contact.email.ilike(search_term),
                    Contact.phone.ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        contacts = query.order_by(Contact.created_at.desc()).offset(offset).limit(limit).all()
        
        # Calculate pagination info
        total_pages = math.ceil(total / limit) if total > 0 else 1
        
        # Format response
        contacts_data = []
        for contact in contacts:
            contact_dict = {
                'id': contact.id,
                'name': contact.name,
                'email': contact.email,
                'phone': contact.phone,
                'workspaceId': contact.workspace_id,
                'customFields': contact.custom_fields or {},
                'createdAt': contact.created_at.isoformat(),
                'updatedAt': contact.updated_at.isoformat()
            }
            contacts_data.append(contact_dict)
        
        return jsonify({
            'contacts': contacts_data,
            'total': total,
            'page': page,
            'limit': limit,
            'totalPages': total_pages
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/contacts', methods=['POST'])
@require_auth
def create_contact(current_user):
    """Create a new contact"""
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        if not data.get('workspaceId'):
            return jsonify({'error': 'workspaceId is required'}), 400
        
        # Check if contact already exists
        existing_contact = Contact.query.filter_by(
            email=data['email'], 
            workspace_id=data['workspaceId']
        ).first()
        
        if existing_contact:
            return jsonify({'error': 'Contact with this email already exists'}), 409
        
        # Create new contact
        contact = Contact()
        contact.name = data['name']
        contact.email = data['email']
        contact.phone = data.get('phone')
        contact.workspace_id = data['workspaceId']
        contact.custom_fields = data.get('customFields', {})
        
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({
            'id': contact.id,
            'name': contact.name,
            'email': contact.email,
            'phone': contact.phone,
            'workspaceId': contact.workspace_id,
            'customFields': contact.custom_fields or {},
            'createdAt': contact.created_at.isoformat(),
            'updatedAt': contact.updated_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/contacts/<contact_id>', methods=['PATCH'])
@require_auth
def update_contact(current_user, contact_id):
    """Update a contact"""
    try:
        contact = Contact.query.get_or_404(contact_id)
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            contact.name = data['name']
        if 'email' in data:
            contact.email = data['email']
        if 'phone' in data:
            contact.phone = data['phone']
        if 'customFields' in data:
            # Merge custom fields
            current_fields = contact.custom_fields or {}
            current_fields.update(data['customFields'])
            contact.custom_fields = current_fields
        
        db.session.commit()
        
        return jsonify({
            'id': contact.id,
            'name': contact.name,
            'email': contact.email,
            'phone': contact.phone,
            'workspaceId': contact.workspace_id,
            'customFields': contact.custom_fields or {},
            'createdAt': contact.created_at.isoformat(),
            'updatedAt': contact.updated_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/contacts/<contact_id>', methods=['DELETE'])
@require_auth
def delete_contact(current_user, contact_id):
    """Delete a contact"""
    try:
        contact = Contact.query.get_or_404(contact_id)
        db.session.delete(contact)
        db.session.commit()
        
        return jsonify({'message': 'Contact deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/custom-fields', methods=['GET'])
@require_auth
def get_custom_fields(current_user):
    """Get custom fields for a workspace"""
    try:
        workspace_id = request.args.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        custom_fields = CustomField.query.filter_by(workspace_id=workspace_id).all()
        
        fields_data = []
        for field in custom_fields:
            field_dict = {
                'id': field.id,
                'name': field.name,
                'type': field.field_type,
                'options': field.options,
                'required': field.required,
                'workspaceId': field.workspace_id
            }
            fields_data.append(field_dict)
        
        return jsonify(fields_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/custom-fields', methods=['POST'])
@require_auth
def create_custom_field(current_user):
    """Create a new custom field"""
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('type'):
            return jsonify({'error': 'Name and type are required'}), 400
        
        if not data.get('workspaceId'):
            return jsonify({'error': 'workspaceId is required'}), 400
        
        # Validate field type
        valid_types = ['string', 'number', 'date', 'dropdown', 'radio']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Invalid field type. Must be one of: {valid_types}'}), 400
        
        # Create new custom field
        custom_field = CustomField()
        custom_field.name = data['name']
        custom_field.field_type = data['type']
        custom_field.options = data.get('options', [])
        custom_field.required = data.get('required', False)
        custom_field.workspace_id = data['workspaceId']
        
        db.session.add(custom_field)
        db.session.commit()
        
        return jsonify({
            'id': custom_field.id,
            'name': custom_field.name,
            'type': custom_field.field_type,
            'options': custom_field.options,
            'required': custom_field.required,
            'workspaceId': custom_field.workspace_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500