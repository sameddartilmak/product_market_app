from flask import request, jsonify, Blueprint
from datetime import datetime
from app.models import Product, Transaction, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

transactions_bp = Blueprint('transactions', __name__)

# --- 1. SATIN ALMA İŞLEMİ ---
@transactions_bp.route('/buy', methods=['POST'])
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

    # C) İlan Tipi Kontrolü (Sadece 'rent' olan bir şey satın alınamaz)
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
            status='COMPLETED' # Satın alma direkt tamamlandı sayıyoruz (Ödeme sistemi yoksa)
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
@transactions_bp.route('/rent', methods=['POST'])
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
        return jsonify({'message': 'product_id, start_date ve end_date zorunludur.'}), 400

    # A) Tarih Formatı ve Mantığı
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Tarih formatı geçersiz. "YYYY-MM-DD" olmalı.'}), 400

    if start_date < datetime.utcnow().date():
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
    
    # Sadece 'sale' olan bir ürün kiralanmaya çalışılırsa:
    if product.listing_type == 'sale':
        return jsonify({'message': 'Bu ürün sadece satılıktır, kiralanamaz.'}), 400

    if product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüzü kiralayamazsınız.'}), 400
    
    # D) Fiyat Hesaplama
    daily_price = product.price 
    num_days = (end_date - start_date).days
    
    # Gün sayısı 0 ise (aynı gün iade) en az 1 günlük ücret alalım mı?
    if num_days == 0: num_days = 1 
    
    total_price = num_days * daily_price
    
    # E) İşlemi Kaydet
    try:
        # NOT: Kiralama isteği genelde 'PENDING' başlar, ürün sahibi onaylayınca 'APPROVED' olur.
        # Bu yüzden product.status'u hemen 'rented' yapmıyoruz.
        
        new_transaction = Transaction(
            product_id=product_id,
            buyer_id=current_user_id,
            seller_id=product.owner_id,
            transaction_type='RENT',
            price=total_price,
            status='PENDING',
            
            # DİKKAT: models.py içinde Transaction tablosunda bu sütunların olması şart!
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
        # Eğer models.py'da start_date yoksa burada hata alırsın
        return jsonify({'message': 'Kiralama işlemi başarısız.', 'error': str(e)}), 500