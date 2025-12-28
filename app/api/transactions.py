from flask import Blueprint, jsonify, request
from datetime import datetime
from app.models import Product, Transaction, User, SwapOffer
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from operator import itemgetter 

transactions_bp = Blueprint('transactions', __name__)

#  1. TAKAS TEKLİFİ OLUŞTURMA 
@transactions_bp.route('/swap-offer', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def create_swap_offer():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        target_product_id = data.get('target_product_id')
        offered_product_id = data.get('offered_product_id')
        message = data.get('message', '')

        if not target_product_id or not offered_product_id:
            return jsonify({'message': 'Eksik veri.'}), 400

        existing_offer = SwapOffer.query.filter_by(
            target_product_id=target_product_id, 
            offered_product_id=offered_product_id,
            status='PENDING'
        ).first()

        if existing_offer:
            return jsonify({'message': 'Bu ürün için zaten bekleyen bir teklifiniz var.'}), 400

        new_offer = SwapOffer(
            offerer_id=current_user_id,
            target_product_id=target_product_id,
            offered_product_id=offered_product_id,
            message=message,
            status='PENDING'
        )

        db.session.add(new_offer)
        db.session.commit()

        return jsonify({'message': 'Takas teklifi başarıyla gönderildi.'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Takas Hatası: {e}")
        return jsonify({'message': 'Sunucu hatası.', 'error': str(e)}), 500


#  2. SATIN ALMA 
@transactions_bp.route('/buy', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def buy_product():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id: return jsonify({'message': 'product_id zorunludur.'}), 400

    product = Product.query.get(product_id)
    if not product: return jsonify({'message': 'Ürün bulunamadı.'}), 404
    if product.status != 'available': return jsonify({'message': 'Bu ürün artık satışta değil.'}), 400
    if product.listing_type == 'rent': return jsonify({'message': 'Bu ürün sadece kiralıktır.'}), 400
    if product.owner_id == current_user_id: return jsonify({'message': 'Kendi ürününüzü alamazsınız.'}), 400

    try:
        product.status = 'sold' 
        new_transaction = Transaction(
            product_id=product.id,
            buyer_id=current_user_id,
            seller_id=product.owner_id,
            transaction_type='SALE',
            price=product.price,
            status='COMPLETED'
        )
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({'message': 'Satın alma başarılı.', 'transaction_id': new_transaction.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Hata oluştu.', 'error': str(e)}), 500


#  3. KİRALAMA 
@transactions_bp.route('/rent', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def rent_product():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    product_id = data.get('product_id')
    start_date_str = data.get('start_date') 
    end_date_str = data.get('end_date')   

    if not all([product_id, start_date_str, end_date_str]):
        return jsonify({'message': 'Eksik bilgi.'}), 400

    try:
        s_date_clean = str(start_date_str).split('T')[0]
        e_date_clean = str(end_date_str).split('T')[0]
        start_date = datetime.strptime(s_date_clean, '%Y-%m-%d')
        end_date = datetime.strptime(e_date_clean, '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Tarih formatı geçersiz.'}), 400

    product = Product.query.get(product_id)
    if not product: return jsonify({'message': 'Ürün bulunamadı.'}), 404
    if product.status != 'available': return jsonify({'message': 'Ürün müsait değil.'}), 400
    
    conflicting_approved = Transaction.query.filter(
        Transaction.product_id == product_id,
        Transaction.status == 'APPROVED',
        Transaction.start_date <= end_date,
        Transaction.end_date >= start_date
    ).first()

    if conflicting_approved:
        return jsonify({'message': 'Bu tarihlerde ürün dolu.'}), 400
    
    num_days = (end_date - start_date).days
    if num_days == 0: num_days = 1
    total_price = num_days * product.price
    
    try:
        new_transaction = Transaction(
            product_id=product_id,
            buyer_id=current_user_id,
            seller_id=product.owner_id,
            transaction_type='RENT',
            price=total_price,
            status='PENDING',
            start_date=start_date,
            end_date=end_date
        )
        db.session.add(new_transaction)
        db.session.commit()
        return jsonify({'message': 'Kiralama talebi oluşturuldu.', 'transaction_id': new_transaction.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Hata oluştu.', 'error': str(e)}), 500


#  4. GELEN TALEPLER
@transactions_bp.route('/incoming', methods=['GET'])
@cross_origin()
@jwt_required()
def get_incoming_requests():
    current_user_id = int(get_jwt_identity())
    results = []

    transactions = Transaction.query.filter_by(seller_id=current_user_id).all()
    for t in transactions:
        product = Product.query.get(t.product_id)
        buyer = User.query.get(t.buyer_id)
        
        results.append({
            'type': 'transaction',
            'id': t.id,
            'product_title': product.title if product else 'Silinmiş Ürün',
            'product_image': product.image_url if product else None,
            'buyer_name': buyer.username if buyer else 'Bilinmeyen',
            'other_party_name': buyer.username if buyer else 'Bilinmeyen',
            'transaction_type': t.transaction_type, 
            'status': t.status, 
            'price': float(t.price),
            'start_date': t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
            'end_date': t.end_date.strftime('%Y-%m-%d') if t.end_date else None,
            'date': t.created_at.strftime('%Y-%m-%d %H:%M'),
            'message': None
        })

    swap_offers = SwapOffer.query.join(Product, SwapOffer.target_product_id == Product.id)\
                  .filter(Product.owner_id == current_user_id).all()
    
    for s in swap_offers:
        target_p = Product.query.get(s.target_product_id)
        offered_p = Product.query.get(s.offered_product_id)
        offerer = User.query.get(s.offerer_id)

        results.append({
            'type': 'swap_offer',
            'id': s.id,
            'product_title': target_p.title if target_p else 'Silinmiş',
            'product_image': target_p.image_url if target_p else None,
            'buyer_name': offerer.username if offerer else 'Bilinmeyen',
            'other_party_name': offerer.username if offerer else 'Bilinmeyen',
            'transaction_type': 'swap',
            'status': s.status,
            'price': 0,
            'start_date': None,
            'end_date': None,
            'swap_product_title': offered_p.title if offered_p else 'Silinmiş',
            'swap_product_image': offered_p.image_url if offered_p else None,
            'date': s.created_at.strftime('%Y-%m-%d %H:%M'),
            'message': s.message 
        })

    results.sort(key=itemgetter('date'), reverse=True)
    return jsonify(results), 200


#  5. GİDEN TALEPLER
@transactions_bp.route('/outgoing', methods=['GET'])
@cross_origin()
@jwt_required()
def get_outgoing_requests():
    current_user_id = int(get_jwt_identity())
    results = []

    transactions = Transaction.query.filter_by(buyer_id=current_user_id).all()
    for t in transactions:
        product = Product.query.get(t.product_id)
        seller = User.query.get(t.seller_id)

        results.append({
            'type': 'transaction',
            'id': t.id,
            'product_title': product.title if product else 'Silinmiş',
            'product_image': product.image_url if product else None,
            'seller_name': seller.username if seller else 'Bilinmeyen',
            'other_party_name': seller.username if seller else 'Bilinmeyen',
            'transaction_type': t.transaction_type, 
            'status': t.status, 
            'price': float(t.price),
            'start_date': t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
            'end_date': t.end_date.strftime('%Y-%m-%d') if t.end_date else None,
            'date': t.created_at.strftime('%Y-%m-%d %H:%M'),
            'message': None
        })

    my_swaps = SwapOffer.query.filter_by(offerer_id=current_user_id).all()
    
    for s in my_swaps:
        target_p = Product.query.get(s.target_product_id)
        offered_p = Product.query.get(s.offered_product_id)
        target_owner = User.query.get(target_p.owner_id) if target_p else None

        results.append({
            'type': 'swap_offer',
            'id': s.id,
            'product_title': target_p.title if target_p else 'Silinmiş',
            'product_image': target_p.image_url if target_p else None,
            'seller_name': target_owner.username if target_owner else 'Bilinmeyen',
            'other_party_name': target_owner.username if target_owner else 'Bilinmeyen',
            'transaction_type': 'swap',
            'status': s.status,
            'price': 0,
            'start_date': None,
            'end_date': None,
            'swap_product_title': offered_p.title if offered_p else 'Silinmiş',
            'swap_product_image': offered_p.image_url if offered_p else None,
            'date': s.created_at.strftime('%Y-%m-%d %H:%M'),
            'message': s.message 
        })

    results.sort(key=itemgetter('date'), reverse=True)
    return jsonify(results), 200


#  6. TALEP ONAYLA / REDDET
@transactions_bp.route('/<int:id>/respond', methods=['POST'])
@cross_origin()
@jwt_required()
def respond_to_request(id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get('action') 

    transaction = Transaction.query.get(id)
    target_record = None
    record_type = None

    if transaction:
        target_record = transaction
        record_type = 'transaction'
    else:
        swap = SwapOffer.query.get(id)
        if swap:
            target_record = swap
            record_type = 'swap'
    

    if not target_record:
        return jsonify({'message': 'Kayıt bulunamadı.'}), 404

    if record_type == 'transaction':
        if target_record.seller_id != current_user_id:
            return jsonify({'message': 'Yetkisiz işlem.'}), 403
    elif record_type == 'swap':
        target_p = Product.query.get(target_record.target_product_id)
        if target_p.owner_id != current_user_id:
            return jsonify({'message': 'Yetkisiz işlem.'}), 403

    if action == 'approve':
        target_record.status = 'APPROVED'
        
        if record_type == 'swap':
            try:
                target_p = Product.query.get(target_record.target_product_id)
                offered_p = Product.query.get(target_record.offered_product_id)
                
                if target_p: target_p.status = 'sold'
                if offered_p: offered_p.status = 'sold'

                new_transaction = Transaction(
                    product_id=target_record.target_product_id,
                    buyer_id=target_record.offerer_id, 
                    seller_id=current_user_id,         
                    transaction_type='SWAP',           
                    status='COMPLETED',                
                    price=0                           
                )
                
                db.session.add(new_transaction)

            except Exception as e:
                db.session.rollback()
                return jsonify({'message': 'Takas onaylanırken hata oluştu.', 'error': str(e)}), 500

    elif action == 'reject':
        target_record.status = 'REJECTED'
    else:
        return jsonify({'message': 'Geçersiz işlem.'}), 400
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Veritabanı hatası.', 'error': str(e)}), 500

    return jsonify({'message': f'Talep {action} edildi.', 'new_status': target_record.status}), 200