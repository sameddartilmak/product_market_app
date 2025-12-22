from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config
import os

# Eklentileri başlatıyoruz
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app(config_class=Config):
    """Uygulama Fabrikası (Application Factory)"""
    app = Flask(__name__)
    
    # Uygulama Konfigürasyonu
    app.config.from_object(config_class)
    
    UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
    
    # Klasör yoksa oluştur (Hata almamak için)
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
        
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # --- DÜZELTİLEN KISIM BURASI ---
    # CORS Ayarları: Authorization başlığına ve POST metoduna açıkça izin veriyoruz.
    # Bu olmadan React token gönderemez.
    CORS(app, resources={r"/*": {"origins": "*"}}, 
         allow_headers=["Content-Type", "Authorization"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    # -------------------------------

    # Eklentileri uygulama ile ilişkilendiriyoruz
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # --- Blueprint Kayıtları ---
    
    # 1. Auth Blueprint
    from .api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # 2. Products Blueprint
    from .api.products import products_bp
    app.register_blueprint(products_bp, url_prefix='/api/products')

    # 3. Swap Blueprint
    from .api.swap import swap_bp
    app.register_blueprint(swap_bp, url_prefix='/api/swap')
    
    from .api.transactions import transactions_bp
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    
    from .api.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    from .api.messages import messages_bp
    app.register_blueprint(messages_bp, url_prefix='/api/messages')

    @app.route('/')
    def hello():
        return "Ürün Kiralama API'si Çalışıyor!"

    return app

def create_upload_folders(app):
    """Resimlerin yükleneceği klasörleri ve alt klasörleri oluşturur"""
    base = app.config['UPLOAD_FOLDER']
    subfolders = ['products', 'profiles', 'others']
    
    if not os.path.exists(base):
        os.makedirs(base)
        
    for sub in subfolders:
        path = os.path.join(base, sub)
        if not os.path.exists(path):
            os.makedirs(path)