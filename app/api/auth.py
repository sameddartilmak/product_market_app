# /app/api/auth.py

from flask import request, jsonify, Blueprint
from app.models import User
from app import db, bcrypt, jwt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

# 'auth' adında yeni bir Blueprint (alt-rota grubu) oluşturuyoruz
auth_bp = Blueprint('auth', __name__)


# app/api/auth.py dosyasının en altına ekle:

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Yeni kullanıcı kaydı oluşturur.
    """
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # 1. Boş alan kontrolü
    if not username or not email or not password:
        return jsonify({'message': 'Tüm alanları doldurunuz.'}), 400

    # 2. Kullanıcı adı veya Email zaten var mı?
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'message': 'Bu kullanıcı adı veya email zaten kullanılıyor.'}), 400

    # 3. Yeni kullanıcı oluştur
    new_user = User(username=username, email=email)
    new_user.set_password(password) # Şifreyi hashleyerek kaydeder
    
    # Varsayılan rol 'customer' olarak ayarlanır (Modelde tanımlı)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Kayıt başarılı! Giriş yapabilirsiniz.'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Kayıt sırasında hata oluştu.', 'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Kullanıcıyı bul
    user = User.query.filter_by(username=username).first()

    # Şifre kontrolü
    if user and user.check_password(password):
        # Token oluştur (user.id'yi string'e çevirmek daha garantidir)
        access_token = create_access_token(identity=str(user.id))

        # Frontend'e hem Token hem de Kullanıcı Bilgilerini dönüyoruz
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'email': user.email
            }
        }), 200
    
    return jsonify({'message': 'Geçersiz kullanıcı adı veya şifre'}), 401