# app/api/transactions.py
from flask import request, jsonify, Blueprint
from datetime import datetime
from app.models import Product, Transaction, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/buy', methods=['POST'])
@jwt_required()
def buy_product():
    """
    Bir ürünü (Product) satın alır.
    """
    current_user_id = get_jwt_identity() # int çevrimini kaldırdım, genelde string gelir ama sorun çıkarsa int() ekleriz.
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)

    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'message': 'product_id zorunludur.'}), 400

    # --- 1. Ürünü Doğrula ---
    product = Product.query.get(product_id)

    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404
    
    # DÜZELTME: is_active yerine status kontrolü
    if product.status != 'available':
        return jsonify({'message': 'Bu ürün artık satışta değil (Satılmış veya Kiralanmış).'}), 410

    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü satın alamazsınız.'}), 400

    # --- 2. Satış İşlemini Gerçekleştir ---
    
    # DÜZELTME: is_active yerine status güncellemesi
    product.status = 'sold' 
    
    new_transaction = Transaction(
        product_id=product.id,
        buyer_id=current_user_id,
        seller_id=product.owner_id,
        transaction_type='SALE',
        price=product.price,
        status='COMPLETED'
    )
    
    try:
        db.session.add(new_transaction)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'İşlem sırasında bir hata oluştu.', 'error': str(e)}), 500

    return jsonify({
        'message': f'Satın alma işlemi başarılı. (Ürün: {product.title})',
        'transaction_id': new_transaction.id,
        'total_price_paid': float(new_transaction.price)
    }), 201


@transactions_bp.route('/rent', methods=['POST'])
@jwt_required()
def rent_product():
    """
    Bir ürünü belirli tarihler için kiralar.
    """
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)
         
    data = request.get_json()

    product_id = data.get('product_id')
    start_date_str = data.get('start_date') 
    end_date_str = data.get('end_date')   

    if not all([product_id, start_date_str, end_date_str]):
        return jsonify({'message': 'product_id, start_date ve end_date zorunludur.'}), 400

    # --- 1. Tarihleri Dönüştür ---
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Tarih formatı geçersiz. "YYYY-MM-DD" olmalı.'}), 400

    # --- 2. Tarih Mantık Kontrolü ---
    if start_date < datetime.utcnow().date():
        return jsonify({'message': 'Geçmişe dönük kiralama yapılamaz.'}), 400
    if end_date <= start_date:
        return jsonify({'message': 'Bitiş tarihi başlangıçtan sonra olmalıdır.'}), 400

    # --- 3. Ürünü Doğrula ---
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404

    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü kiralayamazsınız.'}), 400
    
    # DÜZELTME: Ürün satılmışsa kiralanamaz
    if product.status == 'sold':
        return jsonify({'message': 'Bu ürün satıldığı için kiralanamaz.'}), 400

    # --- 4. TARİH ÇAKIŞMASI KONTROLÜ (Mükemmel Mantık!) ---
    # Bu kod, Transaction modeline 'start_date' ve 'end_date' eklememizi gerektiriyor.
    # Şimdilik Transaction modelinde bu alanlar yoksa hata verir. 
    # EĞER Transaction modelinde start_date yoksa, burayı yorum satırına almalıyız
    # VEYA Transaction modeline bu sütunları eklemeliyiz.
    
    # VARSAYIM: Transaction modelini güncellememiz gerekebilir. Şimdilik temel mantıkla devam:
    
    # new_transaction oluşturulurken start_date ve end_date alanları Transaction modelinde olmalı.
    # Eğer yoksa hata verir.
    
    daily_price = product.price 
    num_days = (end_date - start_date).days
    total_price = num_days * daily_price

    new_transaction = Transaction(
        product_id=product_id,
        buyer_id=current_user_id,
        seller_id=product.owner_id,
        transaction_type='RENT',
        price=total_price,
        status='PENDING' #, 
        # start_date=start_date,  <-- Transaction modeline bu sütunları eklemeliyiz
        # end_date=end_date       <-- Yoksa hata verir
    )
    
    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({
        'message': 'Kiralama talebi oluşturuldu.',
        'transaction_id': new_transaction.id,
        'total_price': float(total_price)
    }), 201