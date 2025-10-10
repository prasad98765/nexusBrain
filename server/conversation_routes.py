from flask import Blueprint, request, jsonify
from models import db, Conversation, Message, Agent, Contact
from datetime import datetime
from uuid import uuid4
from typing import Dict, Any
import re

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route('/conversations/message', methods=['POST'])
def create_conversation_message():
    """Create a new message in a conversation (for embedded chatbot)"""
    try:
        data = request.get_json()
        
        workspace_id = data.get('workspaceId')
        agent_id = data.get('agentId')
        conversation_id = data.get('conversationId')
        message_text = data.get('message')
        sender = data.get('sender', 'user')
        
        if not all([workspace_id, agent_id, message_text]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify agent exists
        agent = Agent.query.filter_by(id=agent_id, workspace_id=workspace_id).first()
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Get or create conversation
        conversation = Conversation.query.filter_by(id=conversation_id).first()
        if not conversation:
            conversation = Conversation()
            conversation.id = conversation_id
            conversation.workspace_id = workspace_id
            conversation.agent_id = agent_id
            conversation.title = f"Chat with {agent.name}"
            db.session.add(conversation)
        
        # Create message
        message = Message()
        message.conversation_id = conversation_id
        message.content = message_text
        message.role = sender
        message.agent_id = agent_id
        
        db.session.add(message)
        
        # Extract and store contact information if user provides it
        if sender == 'user':
            extract_and_store_contact_info(message_text, conversation_id, workspace_id)
        
        db.session.commit()
        
        return jsonify({
            'id': message.id,
            'conversationId': conversation_id,
            'content': message.content,
            'role': message.role,
            'createdAt': message.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/conversations/<conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id):
    """Get all messages for a conversation"""
    try:
        conversation = Conversation.query.get_or_404(conversation_id)
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
        
        messages_data = []
        for message in messages:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'role': message.role,
                'createdAt': message.created_at.isoformat()
            })
        
        return jsonify({
            'conversationId': conversation_id,
            'messages': messages_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """Get conversations with optional filters"""
    try:
        workspace_id = request.args.get('workspace_id')
        agent_id = request.args.get('agent_id')
        
        # Build query
        query = Conversation.query
        
        if workspace_id:
            query = query.filter_by(workspace_id=workspace_id)
        
        # if agent_id:
        #     query = query.filter_by(agent_id=agent_id)
        
        # Order by most recent
        conversations = query.order_by(Conversation.updated_at.desc()).all()
        
        conversations_data = []
        for conversation in conversations:
            # Get message count
            message_count = Message.query.filter_by(conversation_id=conversation.id).count()
            
            # Get last message
            last_message = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.created_at.desc()).first()
            
            conversation_dict = {
                'id': conversation.id,
                'title': conversation.title,
                'workspaceId': conversation.workspace_id,
                'agentId': conversation.agent_id,
                'messageCount': message_count,
                'lastMessage': {
                    'content': last_message.content[:100] + '...' if last_message and len(last_message.content) > 100 else last_message.content if last_message else None,
                    'role': last_message.role if last_message else None,
                    'createdAt': last_message.created_at.isoformat() if last_message else None
                } if last_message else None,
                'createdAt': conversation.created_at.isoformat(),
                'updatedAt': conversation.updated_at.isoformat()
            }
            conversations_data.append(conversation_dict)
        
        return jsonify({
            'conversations': conversations_data,
            'total': len(conversations_data)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a conversation and all its messages"""
    try:
        conversation = Conversation.query.get_or_404(conversation_id)
        
        # Delete all messages in the conversation
        Message.query.filter_by(conversation_id=conversation_id).delete()
        
        # Delete the conversation
        db.session.delete(conversation)
        db.session.commit()
        
        return jsonify({'message': 'Conversation deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/conversations/stats', methods=['GET'])
def get_conversation_stats():
    """Get conversation statistics"""
    try:
        workspace_id = request.args.get('workspace_id')
        agent_id = request.args.get('agent_id')
        
        # Build base query
        query = Conversation.query
        
        if workspace_id:
            query = query.filter_by(workspace_id=workspace_id)
        
        # if agent_id:
        #     query = query.filter_by(agent_id=agent_id)
        
        # Get total conversations
        total_conversations = query.count()
        
        # Get conversations from last 30 days
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_conversations = query.filter(Conversation.created_at >= thirty_days_ago).count()
        
        # Get total messages
        conversation_ids = [c.id for c in query.all()]
        total_messages = Message.query.filter(Message.conversation_id.in_(conversation_ids)).count() if conversation_ids else 0
        
        # Get average messages per conversation
        avg_messages = total_messages / total_conversations if total_conversations > 0 else 0
        
        return jsonify({
            'totalConversations': total_conversations,
            'recentConversations': recent_conversations,
            'totalMessages': total_messages,
            'avgMessagesPerConversation': round(avg_messages, 1)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def extract_and_store_contact_info(message_text, conversation_id, workspace_id):
    """Extract potential contact information from user messages and store as contacts"""
    try:
        # Extract email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, message_text)
        
        # Extract phone numbers (basic patterns)
        phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'
        phones = re.findall(phone_pattern, message_text)
        
        # Extract names (look for "I'm [name]" or "My name is [name]")
        name_patterns = [
            r'\b(?:i\'?m|my name is|name is|call me)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b',
            r'\b([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:here|speaking)\b'
        ]
        names = []
        for pattern in name_patterns:
            matches = re.findall(pattern, message_text.lower())
            names.extend(matches)
        
        # If we found contact info, create or update contact
        if emails or phones or names:
            # Look for existing contact in this workspace
            contact = None
            
            # Search by email first (most reliable)
            if emails:
                email = emails[0].lower()  # Use first email found
                contact = Contact.query.filter_by(
                    workspace_id=workspace_id,
                    email=email
                ).first()
            
            # If no contact found, create new one
            if not contact:
                contact = Contact()
                contact.workspace_id = workspace_id
                
                # Set contact information
                if emails:
                    contact.email = emails[0].lower()
                if phones:
                    # Format phone number
                    phone_parts = phones[0]
                    contact.phone = f"({phone_parts[0]}) {phone_parts[1]}-{phone_parts[2]}"
                if names:
                    name_parts = names[0].strip().split()
                    contact.name = name_parts[0].title() + (' ' + ' '.join(name_parts[1:]).title() if len(name_parts) > 1 else '')
                else:
                    contact.name = 'Chat User'
                
                # Set custom fields for conversation source
                contact.custom_fields = {'conversation_source': conversation_id}
                
                db.session.add(contact)
            else:
                # Update existing contact with new information
                if phones and not contact.phone:
                    phone_parts = phones[0]
                    contact.phone = f"({phone_parts[0]}) {phone_parts[1]}-{phone_parts[2]}"
                
                if names and (not contact.name or contact.name == 'Chat User'):
                    name_parts = names[0].strip().split()
                    contact.name = name_parts[0].title() + (' ' + ' '.join(name_parts[1:]).title() if len(name_parts) > 1 else '')
    
    except Exception as e:
        print(f"Error extracting contact info: {e}")
        # Don't fail the message creation if contact extraction fails