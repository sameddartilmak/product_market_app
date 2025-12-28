import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, text
from datetime import datetime, timedelta

from app.models import Product, ProductImage, User, Transaction
from app import db

from app.utils import save_file, delete_file_from_url

products_bp = Blueprint('products', __name__)

# 1. ÜRÜNLERİ LİSTELE
@products_bp.route('/', methods=['GET'])
def get_products():
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

# 2. ÜRÜN OLUŞTUR
@products_bp.route('/add', methods=['POST'])
@jwt_required()
def create_product():
    try:
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

        files = request.files.getlist('images')
        saved_urls = []

        if files:
            for file in files:
                if not file or not file.filename: continue

                file_url = save_file(file, folder_name='products', specific_id=new_product.id)
                
                if file_url:
                    saved_urls.append(file_url)
                    img_entry = ProductImage(image_url=file_url, product_id=new_product.id)
                    db.session.add(img_entry)
            
            db.session.commit()

        if saved_urls:
            new_product.image_url = saved_urls[0]
            db.session.commit()

        return jsonify({
            'message': 'Ürün ve resimler başarıyla kaydedildi.',
            'product_id': new_product.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"HATA OLUŞTU: {e}")
        return jsonify({'message': 'Ürün oluşturulurken hata.', 'error': str(e)}), 500

# 3. TEK ÜRÜN DETAYI
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

# 4. BENİM ÜRÜNLERİM
@products_bp.route('/my-products', methods=['GET'])
@jwt_required()
def get_my_products():
    current_user_id = int(get_jwt_identity())
    
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

# 5. ÜRÜN GÜNCELLE 
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
        if 'status' in data: product.status = data['status']
        
        db.session.commit()
        return jsonify({'message': 'Ürün güncellendi.'}), 200
    else:
        return jsonify({'message': 'Veri gönderilmedi.'}), 400

#  6. ÜRÜN SİL
@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user_id = int(get_jwt_identity())

    product = Product.query.get_or_404(product_id)

    if product.owner_id != current_user_id:
        return jsonify({'message': 'Bu ürünü silme yetkiniz yok.'}), 403

    try:
        images_to_delete = ProductImage.query.filter_by(product_id=product_id).all()
        image_urls = [img.image_url for img in images_to_delete]

        Transaction.query.filter_by(product_id=product_id).delete(synchronize_session=False)
        
        if hasattr(Transaction, 'swap_product_id'):
            Transaction.query.filter(Transaction.swap_product_id == product_id).delete(synchronize_session=False)

        try:
            db.session.execute(text("DELETE FROM swap_offers WHERE offered_product_id = :pid"), {'pid': product_id})
            db.session.execute(text("DELETE FROM swap_offers WHERE target_product_id = :pid"), {'pid': product_id})
        except Exception as sql_err:
            print(f"Swap tablosu temizlenirken uyarı: {sql_err}")

        ProductImage.query.filter_by(product_id=product_id).delete(synchronize_session=False)
        db.session.delete(product)
        
        db.session.commit()

        for url in image_urls:
            try:
                delete_file_from_url(url)
            except:
                pass
            
        return jsonify({'message': 'Ürün ve tüm verileri başarıyla silindi.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"SİLME HATASI: {e}")
        return jsonify({'message': 'Silme işlemi başarısız.', 'error': str(e)}), 500
    
#  7. TAKVİM DOLULUK BİLGİSİ
@products_bp.route('/<int:product_id>/availability', methods=['GET'])
def get_product_availability(product_id):
    try:
        rentals = Transaction.query.filter_by(product_id=product_id, status='APPROVED').all()
        
        booked_dates = []
        
        for rental in rentals:
            if not rental.start_date or not rental.end_date:
                continue

            current_date = rental.start_date
            while current_date <= rental.end_date:
                booked_dates.append(current_date.strftime('%Y-%m-%d'))
                current_date += timedelta(days=1)
        
        return jsonify(booked_dates), 200

    except Exception as e:
        print(f"HATA DETAYI: {e}") 
        return jsonify({'error': str(e)}), 500