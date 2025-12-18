import os
import uuid
import shutil
from flask import Blueprint, request, jsonify, current_app
from app.models import Product, ProductImage, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
def get_products():
    print("--> YENİ GET_PRODUCTS FONKSİYONU ÇALIŞTI (q ile)") 

    search_query = request.args.get('search', '')
    category_filter = request.args.get('category', '') 

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

@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)
    
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

    files = request.files.getlist('images')
    saved_urls = []

    base_upload_folder = current_app.config['UPLOAD_FOLDER']
    product_folder = os.path.join(base_upload_folder, str(new_product.id))

    if not os.path.exists(product_folder):
        os.makedirs(product_folder)

    for file in files:
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(product_folder, unique_filename)
            file.save(file_path)
            
            full_url = f"http://127.0.0.1:5000/static/uploads/{new_product.id}/{unique_filename}"
            saved_urls.append(full_url)
            
            img_entry = ProductImage(image_url=full_url, product_id=new_product.id)
            db.session.add(img_entry)

    if saved_urls:
        new_product.image_url = saved_urls[0]
    
    db.session.commit()

    return jsonify({
        'message': 'Ürün başarıyla oluşturuldu.',
        'product_id': new_product.id
    }), 201

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
            'email': owner.email
        }
    }), 200

@products_bp.route('/my-products', methods=['GET'])
@jwt_required()
def get_my_products():
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str): current_user_id = int(current_user_id)
    
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

@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str): current_user_id = int(current_user_id)

    product = Product.query.get_or_404(product_id)
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

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

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str): current_user_id = int(current_user_id)

    product = Product.query.get_or_404(product_id)
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    try:
        folder_path = os.path.join(current_app.config['UPLOAD_FOLDER'], str(product.id))
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)

        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Ürün ve dosyaları silindi.'}), 200
    except Exception as e:
        return jsonify({'message': 'Silme hatası.', 'error': str(e)}), 500