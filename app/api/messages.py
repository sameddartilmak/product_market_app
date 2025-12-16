# app/api/messages.py
from flask import Blueprint, request, jsonify
from app import db
from app.models import Message, User, Product
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    """
    Mesaj gönderir.
    JSON: { "receiver_id": 2, "product_id": 5, "content": "Merhaba..." }
    """
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)
         
    data = request.get_json()
    receiver_id = data.get('receiver_id')
    product_id = data.get('product_id') # Opsiyonel
    content = data.get('content')

    if not receiver_id or not content:
        return jsonify({'message': 'Alıcı ve mesaj içeriği zorunludur.'}), 400

    if current_user_id == receiver_id:
        return jsonify({'message': 'Kendinize mesaj atamazsınız.'}), 400

    new_msg = Message(
        sender_id=current_user_id,
        receiver_id=receiver_id,
        product_id=product_id,
        content=content
    )

    db.session.add(new_msg)
    db.session.commit()

    return jsonify({'message': 'Mesaj gönderildi!'}), 201

@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """
    Kullanıcının sohbet ettiği kişileri listeler (Gelen Kutusu Mantığı).
    """
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)

    # Benim gönderdiğim veya bana gelen mesajların olduğu tüm benzersiz kullanıcıları bulmalıyız
    # Bu SQL sorgusu biraz karmaşıktır, basitleştirilmiş mantık kullanacağız:
    
    # Tüm mesajlarımı çek
    all_msgs = Message.query.filter(
        or_(Message.sender_id == current_user_id, Message.receiver_id == current_user_id)
    ).order_by(Message.created_at.desc()).all()

    # Benzersiz kişileri ayıkla
    conversations = {}
    for msg in all_msgs:
        # Karşı taraf kim?
        other_user_id = msg.receiver_id if msg.sender_id == current_user_id else msg.sender_id
        
        if other_user_id not in conversations:
            other_user = User.query.get(other_user_id)
            if other_user:
                conversations[other_user_id] = {
                    'user_id': other_user.id,
                    'username': other_user.username,
                    'last_message': msg.content,
                    'date': msg.created_at.strftime('%Y-%m-%d %H:%M')
                }
    
    return jsonify(list(conversations.values())), 200

@messages_bp.route('/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_chat_history(other_user_id):
    """
    Belirli bir kişiyle olan tüm mesaj geçmişini getirir.
    """
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)

    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user_id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user_id)
        )
    ).order_by(Message.created_at.asc()).all()

    results = []
    for msg in messages:
        results.append({
            'id': msg.id,
            'sender_id': msg.sender_id,
            'sender_name': msg.sender.username,
            'content': msg.content,
            'is_me': (msg.sender_id == current_user_id), # Frontend'de sağa/sola yaslamak için
            'date': msg.created_at.strftime('%H:%M')
        })

    return jsonify(results), 200