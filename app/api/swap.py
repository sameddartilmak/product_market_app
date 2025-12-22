from flask import request, jsonify, Blueprint
from app.models import Product, SwapOffer, OfferStatus
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

swap_bp = Blueprint('swap', __name__)

# --- YARDIMCI FONKSİYON: Status Değerini Güvenli Al ---
def get_status_str(status):
    """
    Status bazen Enum objesi, bazen String olarak gelir.
    Bu fonksiyon her iki durumu da yönetir ve düz string döndürür.
    """
    if hasattr(status, 'value'):
        return status.value
    return str(status)

# --- 1. TAKAS TEKLİFİ YAP ---
@swap_bp.route('/offer', methods=['POST'])
@jwt_required()
def make_swap_offer():
    """
    Bir ürüne, kendi ürünlerinden biriyle teklif yapar.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    target_product_id = data.get('target_product_id') 
    offered_product_id = data.get('offered_product_id') 
    message = data.get('message', '') 

    if not target_product_id or not offered_product_id:
        return jsonify({'message': 'target_product_id ve offered_product_id zorunludur.'}), 400

    # A) Hedef Ürünü Doğrula
    target_product = Product.query.get(target_product_id)
    if not target_product:
        return jsonify({'message': 'Teklif yapılmak istenen ürün bulunamadı.'}), 404
    
    if target_product.status != 'available':
        return jsonify({'message': 'Bu ürün artık müsait değil.'}), 400
    
    if target_product.listing_type == 'sale':
        return jsonify({'message': 'Bu ürün takasa açık değil, sadece satılık.'}), 400

    # B) Teklif Edilen (Benim) Ürünü Doğrula
    offered_product = Product.query.get(offered_product_id)
    if not offered_product:
        return jsonify({'message': 'Teklif ettiğiniz ürün bulunamadı.'}), 404
    
    if offered_product.owner_id != current_user_id:
        return jsonify({'message': 'Sadece kendi ürünlerinizle takas teklifi yapabilirsiniz.'}), 403
    
    if offered_product.status != 'available':
        return jsonify({'message': 'Teklif ettiğiniz ürün müsait değil (Satılmış veya başka işlemde).'}), 400

    # C) Kendine teklif atma engeli
    if target_product.owner_id == current_user_id:
        return jsonify({'message': 'Kendi ürününüze takas teklifi yapamazsınız.'}), 400

    # D) Teklifi Kaydet
    new_offer = SwapOffer(
        target_product_id=target_product_id,
        offerer_id=current_user_id,
        offered_product_id=offered_product_id,
        message=message,
        status=OfferStatus.PENDING 
    )

    db.session.add(new_offer)
    db.session.commit()

    # --- DÜZELTME BURADA YAPILDI ---
    return jsonify({
        'message': 'Takas teklifi başarıyla gönderildi.',
        'offer_id': new_offer.id,
        'status': get_status_str(new_offer.status) # Güvenli fonksiyon kullanıldı
    }), 201


# --- 2. ÜRÜNÜME GELEN TEKLİFLER ---
@swap_bp.route('/offers/received/<int:product_id>', methods=['GET'])
@jwt_required()
def get_offers_for_my_product(product_id):
    current_user_id = int(get_jwt_identity())
    
    product = Product.query.get_or_404(product_id)

    if product.owner_id != current_user_id:
        return jsonify({'message': 'Yetkisiz işlem.'}), 403

    # Bu ürüne gelen tüm teklifler
    offers = SwapOffer.query.filter_by(target_product_id=product.id).order_by(SwapOffer.created_at.desc()).all()
    
    output = []
    for offer in offers:
        offered_prod = offer.offered_product

        offer_data = {
            'offer_id': offer.id,
            'status': get_status_str(offer.status), # Düzeltildi
            'message': offer.message,
            'created_at': offer.created_at,
            'offerer_username': offer.offerer.username,
            'offered_product': {
                'product_id': offered_prod.id,
                'title': offered_prod.title,
                'image_url': offered_prod.image_url, 
                'category': offered_prod.category
            }
        }
        output.append(offer_data)

    return jsonify({'offers': output}), 200


# --- 3. TEKLİFE YANIT VER (KABUL/RET) ---
@swap_bp.route('/offers/respond/<int:offer_id>', methods=['POST'])
@jwt_required()
def respond_to_offer(offer_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get('action') 

    if not action or action not in ['accept', 'reject']:
        return jsonify({'message': 'Geçersiz işlem.'}), 400

    offer = SwapOffer.query.get_or_404(offer_id)
    target_product = offer.target_product 

    # Güvenlik
    if target_product.owner_id != current_user_id:
        return jsonify({'message': 'Bu teklifi yanıtlama yetkiniz yok.'}), 403

    # Status kontrolü (String veya Enum olabilir, güvenli kontrol yapıyoruz)
    current_status = get_status_str(offer.status)
    if current_status != 'pending':
        return jsonify({'message': 'Bu teklif zaten yanıtlanmış.'}), 400

    if action == 'accept':
        offer.status = OfferStatus.ACCEPTED
        
        # Takas kabul edilince HER İKİ ürün de "Satıldı/Takaslandı" olur.
        target_product.status = 'swapped' 
        offer.offered_product.status = 'swapped'
        
        db.session.commit()
        return jsonify({'message': 'Takas kabul edildi! İki ürün de yayından kaldırıldı.', 'status': 'accepted'}), 200

    elif action == 'reject':
        offer.status = OfferStatus.REJECTED
        db.session.commit()
        return jsonify({'message': 'Teklif reddedildi.', 'status': 'rejected'}), 200   


# --- 4. GÖNDERDİĞİM TEKLİFLER ---
@swap_bp.route('/offers/sent', methods=['GET'])
@jwt_required()
def get_my_sent_offers():
    current_user_id = int(get_jwt_identity())
    
    sent_offers = SwapOffer.query.filter_by(offerer_id=current_user_id)\
                                 .order_by(SwapOffer.created_at.desc()).all()

    output = []
    for offer in sent_offers:
        target_prod = offer.target_product
        
        offer_data = {
            'offer_id': offer.id,
            'status': get_status_str(offer.status), # Düzeltildi
            'date_offered': offer.created_at,
            'my_offered_product': { 
                'title': offer.offered_product.title,
                'image_url': offer.offered_product.image_url
            },
            'target_product': { 
                'product_id': target_prod.id,
                'title': target_prod.title,
                'image_url': target_prod.image_url,
                'owner_username': target_prod.owner.username
            }
        }
        output.append(offer_data)

    return jsonify({'sent_offers': output}), 200