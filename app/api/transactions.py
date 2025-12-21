from flask import Blueprint, jsonify, request
from datetime import datetime
from app.models import Product, Transaction, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin

transactions_bp = Blueprint('transactions', __name__)

# --- 1. SATIN ALMA İŞLEMİ ---
@transactions_bp.route('/buy', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def buy_product():
    """
    Bir ürünü satın alır.
    Status 'sold' yapılır.
    """
    current_user_id = int(get_jwt_identity())
    
    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'message': 'product_id zorunludur.'}), 400

    # A) Ürünü Doğrula
    product = Product.query.get(product_id)

    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404
    
    # B) Status Kontrolü
    if product.status != 'available':
        return jsonify({'message': 'Bu ürün artık satışta değil (Satılmış veya Kiralanmış).'}), 400

    # C) İlan Tipi Kontrolü
    if product.listing_type == 'rent':
        return jsonify({'message': 'Bu ürün sadece kiralıktır, satın alınamaz.'}), 400

    # D) Kendine Satış Engeli
    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü satın alamazsınız.'}), 400

    # E) İşlemi Gerçekleştir
    try:
        # Ürünü 'satıldı' olarak işaretle
        product.status = 'sold' 
        
        new_transaction = Transaction(
            product_id=product.id,
            buyer_id=current_user_id,
            seller_id=product.owner_id,
            transaction_type='SALE',
            price=product.price,
            status='COMPLETED' # Satın alma direkt tamamlandı
        )
        
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({
            'message': f'Satın alma işlemi başarılı. (Ürün: {product.title})',
            'transaction_id': new_transaction.id,
            'total_price_paid': float(new_transaction.price)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'İşlem sırasında hata oluştu.', 'error': str(e)}), 500


# --- 2. KİRALAMA İŞLEMİ ---
@transactions_bp.route('/rent', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def rent_product():
    """
    Bir ürünü belirli tarihler için kiralar.
    """
    current_user_id = int(get_jwt_identity())
          
    data = request.get_json()

    product_id = data.get('product_id')
    start_date_str = data.get('start_date') 
    end_date_str = data.get('end_date')   

    if not all([product_id, start_date_str, end_date_str]):
        return jsonify({'message': 'Eksik bilgi: product_id, start_date ve end_date zorunludur.'}), 400

    # A) Tarih Formatı ve Mantığı
    try:
        # Frontend'den '2025-12-21T15:00:00.000Z' gelirse sadece tarihi al
        s_date_clean = str(start_date_str).split('T')[0]
        e_date_clean = str(end_date_str).split('T')[0]

        # DateTime objesine çevir (DB uyumu için)
        start_date = datetime.strptime(s_date_clean, '%Y-%m-%d')
        end_date = datetime.strptime(e_date_clean, '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Tarih formatı geçersiz. "YYYY-MM-DD" olmalı.'}), 400

    if start_date.date() < datetime.utcnow().date():
        return jsonify({'message': 'Geçmişe dönük kiralama yapılamaz.'}), 400
    if end_date <= start_date:
        return jsonify({'message': 'Bitiş tarihi başlangıçtan sonra olmalıdır.'}), 400

    # B) Ürün Doğrulama
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404

    # C) Status ve Tip Kontrolü
    if product.status != 'available':
        return jsonify({'message': 'Bu ürün şu an müsait değil.'}), 400
    
    if product.listing_type == 'sale':
        return jsonify({'message': 'Bu ürün sadece satılıktır, kiralanamaz.'}), 400

    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü kiralayamazsınız.'}), 400
    
    # D) Fiyat Hesaplama
    daily_price = product.price 
    num_days = (end_date - start_date).days
    
    if num_days == 0: num_days = 1 
    
    total_price = num_days * daily_price
    
    # E) İşlemi Kaydet
    try:
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
            'message': 'Kiralama talebi oluşturuldu. Satıcı onayı bekleniyor.',
            'transaction_id': new_transaction.id,
            'total_price': float(total_price),
            'days': num_days
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Kiralama başarısız.', 'error': str(e)}), 500


# --- 3. (YENİ) GELEN TALEPLERİ LİSTELEME ---
# Frontend'de "Gelen Talepler" sayfasında bu endpointi çağırmalısın.
@transactions_bp.route('/incoming', methods=['GET'])
@cross_origin()
@jwt_required()
def get_incoming_requests():
    current_user_id = int(get_jwt_identity())
    
    # --- DEBUG BAŞLANGIÇ (Terminale yazdırır) ---
    print(f"\n--- DEBUG: Gelen Talepler İsteği ---")
    print(f"İstek Yapan Kullanıcı ID: {current_user_id}")
    
    transactions = Transaction.query.filter_by(seller_id=current_user_id).order_by(Transaction.id.desc()).all()
    
    print(f"Veritabanından Bulunan Kayıt Sayısı: {len(transactions)}")
    if len(transactions) == 0:
        print("UYARI: Bu kullanıcıya ait satış/kiralama işlemi bulunamadı.")
        print("İPUCU: Doğru satıcı hesabıyla giriş yaptığından emin ol.")
    # --- DEBUG BİTİŞ ---

    results = []
    for t in transactions:
        product = Product.query.get(t.product_id)
        buyer = User.query.get(t.buyer_id)
        
        results.append({
            'id': t.id,
            'product_title': product.title if product else 'Silinmiş Ürün',
            'product_image': product.image_file if product else None, # Frontend'de resim göstermek için bunu eklemeni öneririm
            'buyer_name': buyer.username if buyer else 'Bilinmeyen Kullanıcı',
            'buyer_username': buyer.username if buyer else 'Bilinmeyen', # Frontend bazen bu ismi arıyor olabilir
            'transaction_type': t.transaction_type, 
            'status': t.status, 
            'price': float(t.price),
            'start_date': t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
            'end_date': t.end_date.strftime('%Y-%m-%d') if t.end_date else None,
            'created_at': t.created_at.strftime('%Y-%m-%d %H:%M') if hasattr(t, 'created_at') else None
        })

    return jsonify(results), 200


# --- 4. (YENİ) TALEP ONAYLA / REDDET ---
# Satıcı "Onayla" veya "Reddet" butonuna basınca burası çalışacak.
@transactions_bp.route('/<int:transaction_id>/respond', methods=['POST'])
@cross_origin()
@jwt_required()
def respond_to_request(transaction_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get('action') # 'approve' veya 'reject'

    transaction = Transaction.query.get_or_404(transaction_id)

    # Güvenlik: Sadece satıcı onaylayabilir
    if transaction.seller_id != current_user_id:
        return jsonify({'message': 'Bu işlem için yetkiniz yok.'}), 403

    if action == 'approve':
        transaction.status = 'APPROVED'
        # Eğer kiralama onaylanırsa, o tarihlerde ürünü 'rented' çekebilirsin veya
        # sadece transaction status üzerinden yönetebilirsin.
        # Basitlik için sadece status güncelliyoruz:
        
    elif action == 'reject':
        transaction.status = 'REJECTED'
    else:
        return jsonify({'message': 'Geçersiz işlem.'}), 400

    db.session.commit()
    return jsonify({'message': f'Talep {action} edildi.', 'new_status': transaction.status}), 200