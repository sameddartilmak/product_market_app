from flask import Blueprint, jsonify
from app.models import User, Product, Transaction
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from sqlalchemy import func
# YENİ: Yardımcı fonksiyonumuzu import ediyoruz
from app.utils import delete_file_from_url 

admin_bp = Blueprint('admin', __name__)

# --- YARDIMCI FONKSİYON: Admin Kontrolü ---
def check_admin():
    current_user_id = get_jwt_identity()
    if isinstance(current_user_id, str):
         current_user_id = int(current_user_id)
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return False
    return True

# 1. İSTATİSTİKLER
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    if not check_admin(): return jsonify({'message': 'Yetkisiz!'}), 403

    total_users = User.query.count()
    active_products = Product.query.filter_by(status='available').count()
    
    total_volume = db.session.query(func.sum(Transaction.price)).filter(
        Transaction.status == 'COMPLETED'
    ).scalar() or 0
    total_revenue = float(total_volume) * 0.03

    return jsonify({
        'users': total_users,
        'products': active_products,
        'income': round(total_revenue, 2)
    }), 200

# 2. TÜM VERİLERİ GETİR
@admin_bp.route('/all-data', methods=['GET'])
@jwt_required()
def get_all_data():
    if not check_admin(): return jsonify({'message': 'Yetkisiz!'}), 403

    users = User.query.all()
    users_data = [{'id': u.id, 'username': u.username, 'email': u.email, 'role': u.role} for u in users]

    products = Product.query.all()
    products_data = [{'id': p.id, 'title': p.title, 'price': p.price, 'owner': p.owner.username, 'status': p.status} for p in products]

    transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()
    transactions_data = [{'id': t.id, 'product': t.product.title, 'buyer': t.buyer.username, 'seller': t.seller.username, 'price': float(t.price), 'type': t.transaction_type} for t in transactions]

    return jsonify({
        'users': users_data,
        'products': products_data,
        'transactions': transactions_data
    }), 200

# 3. KULLANICI SİL
@admin_bp.route('/delete-user/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    if not check_admin(): return jsonify({'message': 'Yetkisiz!'}), 403
    
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'message': 'Admin silinemez!'}), 400
        
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Kullanıcı silindi.'}), 200

# 4. ÜRÜN SİL (TEMİZLENDİ)
@admin_bp.route('/delete-product/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    if not check_admin(): return jsonify({'message': 'Yetkisiz!'}), 403
    
    product = Product.query.get_or_404(product_id)
    
    try:
        # --- ADIM 1: Fiziksel Dosyaları Sil (Utils kullanılarak) ---
        if product.images:
            for img in product.images:
                # O karmaşık os.path kodları yerine sadece bunu çağırıyoruz:
                delete_file_from_url(img.image_url)

        # --- ADIM 2: Veritabanından Sil ---
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Ürün ve resim dosyaları silindi.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Silme işlemi başarısız.', 'error': str(e)}), 500

# 5. İŞLEM SİL
@admin_bp.route('/delete-transaction/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    if not check_admin(): return jsonify({'message': 'Yetkisiz!'}), 403
    
    trans = Transaction.query.get_or_404(transaction_id)
    db.session.delete(trans)
    db.session.commit()
    return jsonify({'message': 'İşlem kaydı silindi.'}), 200