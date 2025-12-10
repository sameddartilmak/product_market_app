from flask import request, jsonify, Blueprint
from datetime import datetime
# DİKKAT: Listing ve ListingType'ı kaldırdık. Yerine Product geldi.
from app.models import Product, Transaction, TransactionStatus, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/buy', methods=['POST'])
@jwt_required()
def buy_product():
    """
    Bir ürünü (Product) satın alır.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # DEĞİŞİKLİK 1: Artık listing_id yok, product_id var.
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'message': 'product_id zorunludur.'}), 400

    # --- 1. Ürünü Doğrula ---
    product = Product.query.get(product_id)

    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404
    
    # Ürün zaten satılmış mı?
    if not product.is_active:
        return jsonify({'message': 'Bu ürün artık satışta değil.'}), 410

    # DEĞİŞİKLİK 2: lister_id yerine owner_id kullanıyoruz.
    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü satın alamazsınız.'}), 400

    # --- 2. Satış İşlemini Gerçekleştir ---
    
    # Ürünü 'satıldı' olarak işaretleyip pasife çekiyoruz
    product.is_active = False
    
    # DEĞİŞİKLİK 3: Yeni Transaction modeline uygun kayıt
    new_transaction = Transaction(
        product_id=product.id,
        buyer_id=current_user_id,         # Alıcı
        seller_id=product.owner_id,       # Satıcı (Artık direkt kaydediyoruz)
        transaction_type='SALE',          # ListingType yerine String kullandık
        price=product.price,              # Fiyatı üründen alıyoruz
        status='COMPLETED'                # Satış anında tamamlanır
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
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # listing_id -> product_id
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
    
    # Buraya bir kontrol eklenebilir: Ürün kiralanabilir bir ürün mü?
    # Şimdilik varsayılan olarak her ürün kiralanabilir kabul ediyoruz veya
    # product modelinde 'category' kontrolü yapabilirsin.

    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü kiralayamazsınız.'}), 400

    # --- 4. TARİH ÇAKIŞMASI KONTROLÜ ---
    # Transaction tablosunu product_id'ye göre sorguluyoruz
    overlapping_rentals = Transaction.query.filter(
        Transaction.product_id == product_id,
        Transaction.transaction_type == 'RENT',
        Transaction.status != 'CANCELLED',
        Transaction.start_date < end_date,
        Transaction.end_date > start_date
    ).first()

    if overlapping_rentals:
        return jsonify({
            'message': 'Seçtiğiniz tarihlerde bu ürün zaten dolu.',
            'conflicting_start': overlapping_rentals.start_date.isoformat(),
            'conflicting_end': overlapping_rentals.end_date.isoformat()
        }), 409

    # --- 5. Kiralama Kaydı ---
    # Fiyat hesabı (Product modelinde rental_price varsa kullan, yoksa normal price)
    # Varsayım: Product modeline 'rental_price' ekledin veya 'price'ı günlük fiyat kabul ediyoruz.
    daily_price = product.price # Veya product.rental_price
    num_days = (end_date - start_date).days
    total_price = num_days * daily_price

    new_transaction = Transaction(
        product_id=product_id,
        buyer_id=current_user_id,
        seller_id=product.owner_id,
        transaction_type='RENT',
        price=total_price,
        status='PENDING', # Onay bekliyor
        start_date=start_date,
        end_date=end_date
    )
    
    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({
        'message': 'Kiralama talebi oluşturuldu.',
        'transaction_id': new_transaction.id,
        'total_price': float(total_price)
    }), 201


@transactions_bp.route('/my_purchases', methods=['GET'])
@jwt_required()
def get_my_purchases():
    """
    Benim satın aldığım ürünler.
    """
    current_user_id = int(get_jwt_identity())
    
    # buyer_or_renter_id yerine buyer_id
    purchases = Transaction.query.filter_by(
        buyer_id=current_user_id,
        transaction_type='SALE',
        status='COMPLETED'
    ).order_by(Transaction.created_at.desc()).all()

    output = []
    for purchase in purchases:
        # listing.product yerine purchase.product (direkt ilişki)
        product = purchase.product
        
        purchase_data = {
            'transaction_id': purchase.id,
            'date': purchase.created_at,
            'price': float(purchase.price),
            'product_title': product.title,
            'seller_username': purchase.seller.username # İlişki üzerinden erişim
        }
        output.append(purchase_data)

    return jsonify({'purchases': output}), 200


@transactions_bp.route('/received', methods=['GET'])
@jwt_required()
def get_received_transactions():
    """
    Bana gelen satışlar/kiralamalar (Satıcı Paneli).
    """
    current_user_id = int(get_jwt_identity())
    
    # ESKİ YÖNTEM: Önce ilanları bul, sonra transactionları bul (Zordu)
    # YENİ YÖNTEM: Doğrudan 'seller_id' sütununa bakıyoruz. Çok basit!
    
    received = Transaction.query.filter_by(
        seller_id=current_user_id
    ).order_by(Transaction.created_at.desc()).all()

    output = []
    for trans in received:
        output.append({
            'transaction_id': trans.id,
            'type': trans.transaction_type,
            'status': trans.status, # String ise direkt al, Enum ise .value
            'product': trans.product.title,
            'buyer': trans.buyer.username,
            'price': float(trans.price),
            'date': trans.created_at
        })

    return jsonify({'received_transactions': output}), 200

@transactions_bp.route('/rent/respond/<int:transaction_id>', methods=['POST'])
@jwt_required()
def respond_to_rent(transaction_id):
    """
    Kiralama talebine yanıt ver (Kabul/Red).
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get('action')

    trans = Transaction.query.get(transaction_id)
    if not trans:
        return jsonify({'message': 'Talep bulunamadı.'}), 404

    # Güvenlik: Satıcı ben miyim?
    if trans.seller_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    if action == 'accept':
        trans.status = 'COMPLETED'
        db.session.commit()
        return jsonify({'message': 'Kiralama kabul edildi.'}), 200
    
    elif action == 'reject':
        trans.status = 'CANCELLED'
        db.session.commit()
        return jsonify({'message': 'Kiralama reddedildi.'}), 200
    
    return jsonify({'message': 'Geçersiz işlem.'}), 400