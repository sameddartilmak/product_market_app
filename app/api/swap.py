from flask import request, jsonify, Blueprint
from app.models import Product, SwapOffer, OfferStatus
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin

swap_bp = Blueprint('swap', __name__)

def get_status_str(status):
    if hasattr(status, 'value'): return status.value
    return str(status)

# 1. TAKAS TEKLİFİ YAP 
@swap_bp.route('/offer', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def make_swap_offer():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    target_product_id = data.get('target_product_id') 
    offered_product_id = data.get('offered_product_id') 
    message = data.get('message', '') 

    if not target_product_id or not offered_product_id:
        return jsonify({'message': 'Eksik veri.'}), 400

    target_product = Product.query.get(target_product_id)
    if not target_product: return jsonify({'message': 'Hedef ürün bulunamadı.'}), 404
    if target_product.owner_id == current_user_id: return jsonify({'message': 'Kendi ürününüze teklif veremezsiniz.'}), 400

    offered_product = Product.query.get(offered_product_id)
    if not offered_product: return jsonify({'message': 'Teklif edilen ürün bulunamadı.'}), 404
    if offered_product.owner_id != current_user_id: return jsonify({'message': 'Sadece kendi ürününüzü teklif edebilirsiniz.'}), 403

    existing = SwapOffer.query.filter_by(
        target_product_id=target_product_id,
        offered_product_id=offered_product_id,
        status='PENDING'
    ).first()
    if existing:
        return jsonify({'message': 'Bu takas teklifi zaten beklemede.'}), 400

    new_offer = SwapOffer(
        target_product_id=target_product_id,
        offerer_id=current_user_id,
        offered_product_id=offered_product_id,
        message=message,
        status='PENDING'
    )

    db.session.add(new_offer)
    db.session.commit()

    return jsonify({
        'message': 'Takas teklifi başarıyla gönderildi.',
        'offer_id': new_offer.id,
        'status': get_status_str(new_offer.status)
    }), 201