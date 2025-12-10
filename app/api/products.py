# /app/api/products.py

from flask import request, jsonify, Blueprint
from app.models import Product, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

# 'products' adında yeni bir Blueprint oluşturuyoruz
products_bp = Blueprint('products', __name__)


@products_bp.route('/', methods=['POST'])
@jwt_required() # Bu satır, bu rotanın token gerektirdiğini belirtir!
def create_product():
    """Yeni bir ürün oluşturur."""
    
    # 1. Giriş yapan kullanıcının kimliğini (ID) al
    current_user_id = int(get_jwt_identity())
    
    data = request.get_json()

    # 2. Gerekli veriler geldi mi?
    if not data or not data.get('title') or not data.get('category'):
        return jsonify({'message': 'Eksik bilgi (title ve category zorunludur).'}), 400

    # 3. Yeni ürünü oluştur ve sahibini (owner_id) giriş yapan kullanıcı olarak ata
    new_product = Product(
        title=data['title'],
        description=data.get('description'),
        category=data['category'],
        image_url=data.get('image_url'),
        price=data.get('price', 0.0), # Fiyatı da alalım
        owner_id=current_user_id
    )
    
    db.session.add(new_product)
    db.session.commit()
    
    return jsonify({
        'message': 'Ürün başarıyla eklendi.',
        'product': {
            'id': new_product.id,
            'title': new_product.title,
            'owner_id': new_product.owner_id
        }
    }), 201


@products_bp.route('/', methods=['GET'])
# @jwt_required()  <-- BU KİLİDİ KALDIRDIK (Vitrin herkese açık olsun)
def get_products():
    """Sisteme kayıtlı TÜM ürünleri listeler (Vitrin modu)."""
    
    # Not: Artık get_jwt_identity() kullanmıyoruz çünkü giriş yapmayanlar da görebilmeli.

    # 1. Veritabanındaki tüm ürünleri çek
    all_products = Product.query.all()

    # 2. Ürünleri JSON formatına dönüştür
    output = []
    for product in all_products:
        product_data = {
            'id': product.id,
            'title': product.title,
            'description': product.description,
            'category': product.category,
            'price': product.price,       # Frontend'de fiyatı gösteriyoruz
            'image_url': product.image_url, # Frontend'de resmi gösteriyoruz
            'status': product.status,
            'owner_id': product.owner_id,
            'created_at': product.created_at
        }
        output.append(product_data)

    # Frontend direkt liste bekliyor (response.data), o yüzden listeyi direkt döndürüyoruz
    return jsonify(output), 200


@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """
    Belirli bir ürünü günceller.
    Sadece ürünün sahibi bu ürünü güncelleyebilir.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # 1. Ürünü bul
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404

    # 2. Güvenlik: Kullanıcı bu ürünün sahibi mi?
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Sadece kendi ürünlerinizi güncelleyebilirsiniz.'}), 403

    # 3. Güncelle
    if 'title' in data:
        product.title = data['title']
    if 'description' in data:
        product.description = data['description']
    if 'category' in data:
        product.category = data['category']
    if 'image_url' in data:
        product.image_url = data['image_url']
    if 'price' in data:
        product.price = data['price']
    
    db.session.commit()

    return jsonify({
        'message': 'Ürün başarıyla güncellendi.',
        'product': {
            'id': product.id,
            'title': product.title
        }
    }), 200


@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """
    Belirli bir ürünü siler.
    Sadece ürünün sahibi bu ürünü silebilir.
    """
    current_user_id = int(get_jwt_identity())

    # 1. Ürünü bul
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404

    # 2. Güvenlik: Kullanıcı bu ürünün sahibi mi?
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Sadece kendi ürünlerinizi silebilirsiniz.'}), 403

    # 3. İŞ MANTIĞI KONTROLÜ
    if hasattr(product, 'listing') and product.listing and product.listing.is_active:
        return jsonify({
            'message': 'Bu ürün şu anda aktif bir ilanda. Silmek için önce ilanı kaldırın.'
        }), 409

    # 4. Güvenle Sil
    try:
        db.session.delete(product)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Silme hatası.',
            'error': str(e)
        }), 500

    return jsonify({'message': 'Ürün başarıyla silindi.'}), 200

@products_bp.route('/my-products', methods=['GET'])
@jwt_required()
def get_my_products():
    """Giriş yapmış kullanıcının kendi ürünlerini listeler."""
    current_user_id = int(get_jwt_identity())
    
    # Sadece benim ürünlerimi getir
    my_products = Product.query.filter_by(owner_id=current_user_id).all()
    
    output = []
    for product in my_products:
        output.append({
            'id': product.id,
            'title': product.title,
            'price': product.price,
            'image_url': product.image_url,
            'status': product.status,
            'category': product.category
        })
    
    return jsonify(output), 200

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_single_product(product_id):
    """Tek bir ürünün detaylarını getirir."""
    product = Product.query.get_or_404(product_id)

    # Ürünün sahibini de bulalım ki detay sayfasında gösterelim
    owner = User.query.get(product.owner_id)

    return jsonify({
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'category': product.category,
        'price': product.price,
        'image_url': product.image_url,
        'status': product.status,
        'created_at': product.created_at,
        'owner': {
            'username': owner.username,
            'email': owner.email
        }
    }), 200