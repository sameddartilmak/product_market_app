# app/api/products.py
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from app.models import Product, ProductImage, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

products_bp = Blueprint('products', __name__)

# 1. TÜM ÜRÜNLERİ GETİR (Vitrin - Herkese Açık)
@products_bp.route('/', methods=['GET'])
def get_products():
    """Sisteme kayıtlı TÜM ürünleri listeler."""
    all_products = Product.query.filter_by(status='available').all()
    
    output = []
    for product in all_products:
        output.append({
            'id': product.id,
            'title': product.title,
            'description': product.description,
            'category': product.category,
            'price': product.price,
            'image_url': product.image_url, # Kapak resmi
            'status': product.status,
            'owner_id': product.owner_id,
            'listing_type': product.listing_type,
            'created_at': product.created_at
        })
    return jsonify(output), 200

# 2. YENİ ÜRÜN EKLE (RESİMLİ - FormData)
@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    """Yeni ürün ve resimlerini ekler."""
    
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)
    
    # Form verilerini al
    title = request.form.get('title')
    description = request.form.get('description')
    price = request.form.get('price')
    category = request.form.get('category')
    listing_type = request.form.get('listing_type', 'sale')

    if not title or not price:
        return jsonify({'message': 'Başlık ve fiyat zorunludur.'}), 400

    # 1. Veritabanına Kayıt
    new_product = Product(
        title=title,
        description=description,
        price=float(price),
        category=category,
        listing_type=listing_type,
        owner_id=current_user_id,
        status='available'
    )
    db.session.add(new_product)
    db.session.commit()

    # 2. Resim Kaydetme İşlemi (GARANTİ YÖNTEM)
    files = request.files.getlist('images')
    saved_urls = []

    # Yolu manuel olarak kesinleştiriyoruz:
    # Projenin çalıştığı klasör / app / static / uploads
    basedir = os.path.abspath(os.path.dirname(__file__)) # Bu dosyanın olduğu yer (api klasörü)
    # api klasöründen iki yukarı çık (app -> proje kökü) sonra app/static/uploads'a gir
    # Daha basiti: os.getcwd() kullanmak
    upload_folder = os.path.join(os.getcwd(), 'app', 'static', 'uploads')

    # Klasör yoksa OLUŞTUR
    if not os.path.exists(upload_folder):
        print(f"UYARI: Klasör yoktu, oluşturuluyor: {upload_folder}")
        os.makedirs(upload_folder)
    
    print(f"--> RESİMLER ŞURAYA KAYDEDİLECEK: {upload_folder}")

    for file in files:
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4().hex}{ext}"
            
            # Tam dosya yolu
            file_path = os.path.join(upload_folder, unique_filename)
            
            try:
                file.save(file_path) # <--- ASIL KAYIT ANI
                print(f"SUCCESS: Dosya kaydedildi -> {unique_filename}")
                
                # URL oluştur
                full_url = f"http://127.0.0.1:5000/static/uploads/{unique_filename}"
                saved_urls.append(full_url)
                
                # DB'ye ekle
                img_entry = ProductImage(image_url=full_url, product_id=new_product.id)
                db.session.add(img_entry)
            except Exception as e:
                print(f"HATA: Dosya kaydedilemedi! {str(e)}")

    if saved_urls:
        new_product.image_url = saved_urls[0]
    
    db.session.commit()

    return jsonify({
        'message': 'Ürün ve resimler başarıyla eklendi.',
        'product_id': new_product.id
    }), 201

# 3. TEK ÜRÜN DETAYI (RESİMLERLE BİRLİKTE)
@products_bp.route('/<int:product_id>', methods=['GET'])
def get_single_product(product_id):
    """Tek bir ürünün detaylarını ve tüm resimlerini getirir."""
    product = Product.query.get_or_404(product_id)
    owner = User.query.get(product.owner_id)

    # Ürüne ait tüm resim linklerini listeye çevir
    images_list = [img.image_url for img in product.images]

    return jsonify({
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'category': product.category,
        'price': product.price,
        'image_url': product.image_url, # Kapak
        'images': images_list,          # --- YENİ: Tüm Resimler ---
        'status': product.status,
        'created_at': product.created_at,
        'listing_type': product.listing_type, 
        'owner': {
            'id': owner.id,
            'username': owner.username,
            'email': owner.email
        }
    }), 200

# 4. KULLANICININ KENDİ ÜRÜNLERİ
@products_bp.route('/my-products', methods=['GET'])
@jwt_required()
def get_my_products():
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)
    
    my_products = Product.query.filter_by(owner_id=current_user_id).all()
    
    output = []
    for product in my_products:
        output.append({
            'id': product.id,
            'title': product.title,
            'price': product.price,
            'image_url': product.image_url,
            'status': product.status,
            'category': product.category,
            'listing_type': product.listing_type
        })
    
    return jsonify(output), 200

# 5. ÜRÜN GÜNCELLEME
@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)

    product = Product.query.get_or_404(product_id)

    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    # Not: Güncelleme şu anlık sadece metin (JSON) destekliyor.
    # Resim güncellemek için ayrı bir mantık gerekir.
    data = request.get_json()
    
    if data:
        if 'title' in data: product.title = data['title']
        if 'description' in data: product.description = data['description']
        if 'price' in data: product.price = data['price']
        if 'category' in data: product.category = data['category']
        
        db.session.commit()
        return jsonify({'message': 'Ürün güncellendi.'}), 200
    else:
        return jsonify({'message': 'Veri gönderilmedi.'}), 400

# 6. ÜRÜN SİLME
@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)

    product = Product.query.get_or_404(product_id)

    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Ürün silindi.'}), 200
    except Exception as e:
        return jsonify({'message': 'Silme hatası.', 'error': str(e)}), 500