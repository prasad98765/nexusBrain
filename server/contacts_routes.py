from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func
from models import Contact, CustomField, Workspace, db
from auth_utils import require_auth
import math

contacts_bp = Blueprint('contacts', __name__)

@contacts_bp.route('/contacts', methods=['GET'])
@require_auth
def get_contacts():
    """Get contacts with pagination, search, and filtering"""
    try:
        workspace_id = request.user.get('workspace_id')
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
def create_contact():
    """Create a new contact"""
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        user_id = request.user.get('user_id')
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
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
        contact.workspace_id = workspace_id
        contact.custom_fields = data.get('customFields', {})
        # contact.created_at = data.get('createdAt')
        # contact.updated_at = data.get('updatedAt')

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
def update_contact(contact_id):
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
def delete_contact(contact_id):
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
def get_custom_fields():
    """Get custom fields for a workspace"""
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        
        # Build query with search and order by updated_at desc (latest first)
        query = CustomField.query.filter_by(workspace_id=workspace_id)
        if search:
            query = query.filter(CustomField.name.ilike(f'%{search}%'))
        
        # Order by created_at desc to show latest created at top (since updated_at may not exist)
        query = query.order_by(CustomField.created_at.desc())
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        custom_fields = query.offset((page - 1) * limit).limit(limit).all()
        
        fields_data = []
        for field in custom_fields:
            field_dict = {
                'id': field.id,
                'name': field.name,
                'type': field.field_type,
                'options': field.options or [],
                'required': field.required,
                'showInForm': field.show_in_form,
                'readonly': field.readonly,
                'workspaceId': field.workspace_id,
                'createdAt': field.created_at.isoformat(),
                'updatedAt': field.created_at.isoformat()  # Using created_at as proxy for updated_at
            }
            fields_data.append(field_dict)
        
        return jsonify({
            'fields': fields_data,
            'total': total_count,
            'page': page,
            'totalPages': (total_count + limit - 1) // limit
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/custom-fields', methods=['POST'])
@require_auth
def create_custom_field():
    """Create a new custom field"""
    try:
        data = request.get_json()
        workspace_id = request.user.get('workspace_id')
        
        if not data.get('name') or not data.get('type'):
            return jsonify({'error': 'Name and type are required'}), 400
        
        if not workspace_id:
            return jsonify({'error': 'workspaceId is required'}), 400
        
        # Validate field type
        valid_types = ['string', 'number', 'date', 'dropdown', 'radio', 'multiselect']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Invalid field type. Must be one of: {valid_types}'}), 400
        
        # Validate option requirements for dropdown/radio/multiselect fields
        if data['type'] in ['dropdown', 'radio', 'multiselect'] and not data.get('options'):
            return jsonify({'error': f'{data["type"]} fields must have at least one option'}), 400
        
        # Validate option count and length
        options = data.get('options', [])
        if options:
            if len(options) > 50:
                return jsonify({'error': 'Maximum 50 options allowed'}), 400
            for option in options:
                if len(option) < 3:
                    return jsonify({'error': 'Each option must be at least 10 characters long'}), 400
        
        # Create new custom field
        custom_field = CustomField()
        custom_field.name = data['name']
        custom_field.field_type = data['type']
        custom_field.options = data.get('options', [])
        custom_field.required = data.get('required', False)
        custom_field.show_in_form = data.get('showInForm', True)
        custom_field.readonly = data.get('readonly', False)
        custom_field.workspace_id = workspace_id
        
        db.session.add(custom_field)
        db.session.commit()
        
        return jsonify({
            'id': custom_field.id,
            'name': custom_field.name,
            'type': custom_field.field_type,
            'options': custom_field.options or [],
            'required': custom_field.required,
            'showInForm': custom_field.show_in_form,
            'readonly': custom_field.readonly,
            'workspaceId': custom_field.workspace_id,
            'createdAt': custom_field.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/custom-fields/<field_id>', methods=['PATCH'])
@require_auth
def update_custom_field(field_id):
    """Update a custom field"""
    try:
        custom_field = CustomField.query.get_or_404(field_id)
        data = request.get_json()
        
        # Validate name length if provided
        if 'name' in data and len(data['name']) > 20:
            return jsonify({'error': 'Field name must be 20 characters or less'}), 400
        
        # Validate options if provided
        if 'options' in data:
            options = data['options']
            if len(options) > 50:
                return jsonify({'error': 'Maximum 50 options allowed'}), 400
            for option in options:
                if len(option) < 3:
                    return jsonify({'error': 'Each option must be at least 10 characters long'}), 400
        
        # Update fields
        if 'name' in data:
            custom_field.name = data['name']
        if 'type' in data:
            custom_field.field_type = data['type']
        if 'options' in data:
            custom_field.options = data['options']
        if 'required' in data:
            custom_field.required = data['required']
        if 'showInForm' in data:
            custom_field.show_in_form = data['showInForm']
        if 'readonly' in data:
            custom_field.readonly = data['readonly']
        
        # Ensure read-only fields are not shown in form
        if custom_field.readonly:
            custom_field.show_in_form = False
        
        db.session.commit()
        
        return jsonify({
            'id': custom_field.id,
            'name': custom_field.name,
            'type': custom_field.field_type,
            'options': custom_field.options or [],
            'required': custom_field.required,
            'showInForm': custom_field.show_in_form,
            'readonly': custom_field.readonly,
            'workspaceId': custom_field.workspace_id,
            'createdAt': custom_field.created_at.isoformat(),
            'updatedAt': custom_field.created_at.isoformat()  # Using created_at as proxy for updated_at
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/custom-fields/<field_id>', methods=['DELETE'])
@require_auth
def delete_custom_field(field_id):
    """Delete a custom field"""
    try:
        custom_field = CustomField.query.get_or_404(field_id)
        db.session.delete(custom_field)
        db.session.commit()
        
        return jsonify({'message': 'Custom field deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
