import os
from flask import Blueprint, request, jsonify
from app.models import Product, ProductImage, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
# Utils fonksiyonlarını import ediyoruz
from app.utils import save_file, delete_file_from_url 

products_bp = Blueprint('products', __name__)

# --- 1. ÜRÜNLERİ LİSTELE ---
@products_bp.route('/', methods=['GET'])
def get_products():
    search_query = request.args.get('search', '')
    category_filter = request.args.get('category', '') 

    # Sadece 'available' olanları getir
    q = Product.query.filter_by(status='available')

    if category_filter:
        q = q.filter(Product.category == category_filter)

    if search_query:
        search_filter = or_(
            Product.title.ilike(f'%{search_query}%'),
            Product.description.ilike(f'%{search_query}%'),
        )
        q = q.filter(search_filter)

    all_products = q.order_by(Product.created_at.desc()).all()
    
    output = []
    for product in all_products:
        output.append({
            'id': product.id,
            'title': product.title,
            'description': product.description,
            'category': product.category,
            'price': product.price,
            'image_url': product.image_url,
            'status': product.status,
            'owner_id': product.owner_id,
            'listing_type': product.listing_type,
            'created_at': product.created_at
        })
    return jsonify(output), 200

# --- 2. ÜRÜN OLUŞTUR ---
@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    # ID dönüşümünü tek satırda hallet
    current_user_id = int(get_jwt_identity())
    
    title = request.form.get('title')
    description = request.form.get('description')
    price = request.form.get('price')
    category = request.form.get('category')
    listing_type = request.form.get('listing_type', 'sale')

    if not title or not price:
        return jsonify({'message': 'Başlık ve fiyat zorunludur.'}), 400

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

    # Resim Yükleme (Utils ile)
    files = request.files.getlist('images')
    saved_urls = []

    if files:
        for file in files:
            # save_file fonksiyonu dosyayı kaydeder ve bize URL döner
            file_url = save_file(file, folder_name='products') 
            
            if file_url:
                saved_urls.append(file_url)
                # Resim tablosuna ekle
                img_entry = ProductImage(image_url=file_url, product_id=new_product.id)
                db.session.add(img_entry)

    # İlk resmi kapak fotosu yap
    if saved_urls:
        new_product.image_url = saved_urls[0]
        db.session.commit()

    return jsonify({
        'message': 'Ürün başarıyla oluşturuldu.',
        'product_id': new_product.id
    }), 201

# --- 3. TEK ÜRÜN DETAYI ---
@products_bp.route('/<int:product_id>', methods=['GET'])
def get_single_product(product_id):
    product = Product.query.get_or_404(product_id)
    owner = User.query.get(product.owner_id)
    images_list = [img.image_url for img in product.images]

    return jsonify({
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'category': product.category,
        'price': product.price,
        'image_url': product.image_url,
        'images': images_list,
        'status': product.status,
        'created_at': product.created_at,
        'listing_type': product.listing_type, 
        'owner': {
            'id': owner.id,
            'username': owner.username,
            'email': owner.email,
            'profile_image': owner.profile_image
        }
    }), 200

# --- 4. BENİM ÜRÜNLERİM ---
@products_bp.route('/my-products', methods=['GET'])
@jwt_required()
def get_my_products():
    current_user_id = int(get_jwt_identity())
    
    # En yeniden eskiye sıralı getir
    my_products = Product.query.filter_by(owner_id=current_user_id)\
                        .order_by(Product.created_at.desc()).all()
    
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

# --- 5. ÜRÜN GÜNCELLE ---
@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    current_user_id = int(get_jwt_identity())

    product = Product.query.get_or_404(product_id)
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    data = request.get_json()
    if data:
        if 'title' in data: product.title = data['title']
        if 'description' in data: product.description = data['description']
        if 'price' in data: product.price = data['price']
        if 'category' in data: product.category = data['category']
        # Status (satıldı vb.) güncelleme imkanı da ekledim
        if 'status' in data: product.status = data['status']
        
        db.session.commit()
        return jsonify({'message': 'Ürün güncellendi.'}), 200
    else:
        return jsonify({'message': 'Veri gönderilmedi.'}), 400

# --- 6. ÜRÜN SİL (DÜZELTİLDİ) ---
@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user_id = int(get_jwt_identity())

    product = Product.query.get_or_404(product_id)
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    try:
        # A) Resim dosyalarını fiziksel olarak sil (shutil yerine utils kullanıyoruz)
        if product.images:
            for img in product.images:
                delete_file_from_url(img.image_url)
        
        # B) Veritabanından sil
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Ürün ve dosyaları silindi.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Silme hatası.', 'error': str(e)}), 500