# app/api/swap.py

from flask import request, jsonify, Blueprint
from app.models import Product, SwapOffer,OfferStatus
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

swap_bp = Blueprint('swap', __name__)

@swap_bp.route('/offer', methods=['POST'])
@jwt_required()
def make_swap_offer():
    """
    Bir ürüne (eski adıyla ilana), kendi ürünlerinden biriyle teklif yapar.
    """
    
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Değişiklik 1: Artık 'listing_id' yerine 'target_product_id' bekliyoruz
    target_product_id = data.get('target_product_id') 
    offered_product_id = data.get('offered_product_id') 
    message = data.get('message', '') 

    if not target_product_id or not offered_product_id:
        return jsonify({'message': 'target_product_id ve offered_product_id zorunludur.'}), 400

    # --- 1. Hedef Ürünü Doğrula (Listing yerine Product) ---
    target_product = Product.query.get(target_product_id)

    if not target_product:
        return jsonify({'message': 'Teklif yapılmak istenen ürün bulunamadı.'}), 404
    
    # is_active kontrolü Product üzerinden yapılıyor
    if not target_product.is_active:
        return jsonify({'message': 'Bu ürün artık aktif değil.'}), 410 
    
    # Ürünün türü 'swap' (takas) olmalı (Product modelinde bu alan varsa)
    # Eğer ListingType'ı da kaldırdıysanız burayı 'category' veya başka bir alanla kontrol etmelisiniz.
    # Varsayım: Product modelinde 'listing_type' sütunu var.
    if hasattr(target_product, 'listing_type') and target_product.listing_type != ListingType.SWAP:
        return jsonify({'message': 'Teklifler sadece takaslık ürünlere yapılabilir.'}), 400

    # --- 2. Teklif Edilen Ürünü Doğrula ---
    offered_product = Product.query.get(offered_product_id)

    if not offered_product:
        return jsonify({'message': 'Teklif ettiğiniz ürün bulunamadı.'}), 404
    
    # Ürün, teklifi yapan kullanıcıya ait olmalı
    if offered_product.owner_id != current_user_id:
        return jsonify({'message': 'Sadece kendi ürünlerinizle takas teklifi yapabilirsiniz.'}), 403

    # --- 3. Kendi Ürününe Teklif Yapmayı Engelle ---
    # Listing.lister_id yerine Product.owner_id kullanıyoruz
    if target_product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüze takas teklifi yapamazsınız.'}), 400

    # --- 4. Teklifi Oluştur ve Kaydet ---
    # Not: Models.py'da SwapOffer içindeki 'target_listing_id' ismini 
    # 'target_product_id' olarak değiştirdiğinizi varsayıyorum.
    new_offer = SwapOffer(
        target_product_id=target_product_id, # Değişti
        offerer_id=current_user_id,
        offered_product_id=offered_product_id,
        message=message,
        status=OfferStatus.PENDING 
    )

    db.session.add(new_offer)
    db.session.commit()

    return jsonify({
        'message': 'Takas teklifi başarıyla gönderildi.',
        'offer_id': new_offer.id,
        'status': new_offer.status.value
    }), 201


@swap_bp.route('/offers/received/<int:product_id>', methods=['GET'])
@jwt_required()
def get_offers_for_my_product(product_id):
    """
    Kullanıcının, belirli bir ürününe gelen tüm takas tekliflerini listeler.
    URL'de artık listing_id değil product_id var.
    """
    current_user_id = int(get_jwt_identity())
    
    # 1. Ürünü bul
    product = Product.query.get(product_id)

    if not product:
        return jsonify({'message': 'Ürün bulunamadı.'}), 404

    # 2. Güvenlik: Giriş yapan kullanıcı, bu ürünün sahibi mi?
    if product.owner_id != current_user_id:
        return jsonify({'message': 'Sadece kendi ürünlerinize gelen teklifleri görebilirsiniz.'}), 403

    # 3. Ürüne ait teklifleri bul
    # Models.py'da Product içine 'swap_offers_received' backref'i eklemelisiniz.
    # Eğer yoksa hata verir. Alternatif sorgu aşağıdadır:
    offers = SwapOffer.query.filter_by(target_product_id=product.id).all()
    
    output = []
    for offer in offers:
        offerer = offer.offerer 
        offered_product = offer.offered_product

        offer_data = {
            'offer_id': offer.id,
            'status': offer.status.value,
            'message': offer.message,
            'created_at': offer.created_at,
            'offerer_username': offerer.username,
            'offered_product': {
                'product_id': offered_product.id,
                'title': offered_product.title,
                'description': offered_product.description,
                'category': offered_product.category
            }
        }
        output.append(offer_data)

    return jsonify({'offers': output}), 200


@swap_bp.route('/offers/respond/<int:offer_id>', methods=['POST'])
@jwt_required()
def respond_to_offer(offer_id):
    """
    Bir takas teklifini kabul eder veya reddeder.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get('action') 

    if not action or action not in ['accept', 'reject']:
        return jsonify({'message': '"action" alanı "accept" veya "reject" olmalıdır.'}), 400

    # 1. Teklifi bul
    offer = SwapOffer.query.get(offer_id)
    if not offer:
        return jsonify({'message': 'Teklif bulunamadı.'}), 404

    # 2. Güvenlik: Teklif yapılan ürünün sahibi mi?
    # offer.target_listing yerine offer.target_product kullanıyoruz
    target_product = offer.target_product 

    if target_product.owner_id != current_user_id:
        return jsonify({'message': 'Sadece kendi ürününüze gelen teklifleri yanıtlayabilirsiniz.'}), 403

    # 3. Zaten yanıtlanmış mı?
    if offer.status != OfferStatus.PENDING:
        return jsonify({'message': f'Bu teklif zaten yanıtlanmış (Durum: {offer.status.value}).'}), 400

    # 4. İşlemi gerçekleştir
    if action == 'accept':
        offer.status = OfferStatus.ACCEPTED
        
        # Teklif kabul edildiğinde, ilgili ürünü pasife çekiyoruz.
        target_product.is_active = False
        
        db.session.commit()
        return jsonify({'message': 'Teklif kabul edildi. Ürün yayından kaldırıldı.', 'status': 'accepted'}), 200

    elif action == 'reject':
        offer.status = OfferStatus.REJECTED
        db.session.commit()
        return jsonify({'message': 'Teklif reddedildi.', 'status': 'rejected'}), 200   

@swap_bp.route('/offers/sent', methods=['GET'])
@jwt_required()
def get_my_sent_offers():
    """
    Giriş yapmış kullanıcının yaptığı (gönderdiği) tüm takas teklifleri.
    """
    current_user_id = int(get_jwt_identity())
    
    sent_offers = SwapOffer.query.filter_by(
        offerer_id=current_user_id
    ).order_by(SwapOffer.created_at.desc()).all()

    output = []
    for offer in sent_offers:
        # offer.target_listing yerine offer.target_product
        target_product = offer.target_product
        
        offer_data = {
            'offer_id': offer.id,
            'status': offer.status.value,
            'date_offered': offer.created_at,
            'my_offered_product': { 
                'title': offer.offered_product.title
            },
            'target_product': { # listing yerine target_product
                'product_id': target_product.id,
                'title': target_product.title,
                'owner_username': target_product.owner.username # lister yerine owner
            }
        }
        output.append(offer_data)

    return jsonify({'sent_offers': output}), 200