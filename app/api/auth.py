# app/api/auth.py
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from app.models import User
from app import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

# =========================================================
# 1. BLUEPRINT TANIMI (EN ÜSTTE OLMAK ZORUNDA!)
# =========================================================
auth_bp = Blueprint('auth', __name__)

# =========================================================
# 2. KAYIT OL (REGISTER)
# =========================================================
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Eksik bilgi!'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Bu kullanıcı adı zaten alınmış.'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Bu e-posta zaten kayıtlı.'}), 400
    
    new_user = User(
        username=data['username'],
        email=data['email']
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Kayıt başarılı! Giriş yapabilirsiniz.'}), 201

# =========================================================
# 3. GİRİŞ YAP (LOGIN)
# =========================================================
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Eksik bilgi!'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Giriş başarılı',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
    else:
        return jsonify({'message': 'Hatalı e-posta veya şifre'}), 401

# =========================================================
# 4. PROFİL GETİR (GET)
# =========================================================
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str): 
        current_user_id = int(current_user_id)
    
    user = User.query.get_or_404(current_user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'bio': user.bio,
        'location': user.location,
        'profile_image': user.profile_image,
        'role': user.role,
        'created_at': user.created_at
    }), 200

# =========================================================
# 5. PROFİL GÜNCELLE (PUT)
# =========================================================
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str): 
        current_user_id = int(current_user_id)
    
    user = User.query.get_or_404(current_user_id)
    
    # Form Data al
    bio = request.form.get('bio')
    location = request.form.get('location')
    
    if bio is not None: user.bio = bio
    if location is not None: user.location = location

    # Resim Kaydet
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        
        if file and file.filename:
            base_folder = current_app.config['UPLOAD_FOLDER']
            users_folder = os.path.join(base_folder, 'users')
            
            if not os.path.exists(users_folder):
                os.makedirs(users_folder)
            
            ext = os.path.splitext(file.filename)[1]
            filename = f"user_{user.id}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(users_folder, filename)
            
            file.save(file_path)
            
            full_url = f"http://127.0.0.1:5000/static/uploads/users/{filename}"
            user.profile_image = full_url

    db.session.commit()
    
    return jsonify({
        'message': 'Profil güncellendi.',
        'user': {
            'username': user.username,
            'bio': user.bio,
            'location': user.location,
            'profile_image': user.profile_image
        }
    }), 200