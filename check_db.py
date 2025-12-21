# check_db.py
from app import create_app, db
from app.models import Transaction, User, Product

app = create_app()

with app.app_context():
    print("-" * 30)
    print("TÜM İŞLEMLER (TRANSACTIONS)")
    print("-" * 30)
    
    trans = Transaction.query.all()
    
    if not trans:
        print("❌ Veritabanında hiç işlem (Transaction) yok!")
    else:
        for t in trans:
            seller = User.query.get(t.seller_id)
            buyer = User.query.get(t.buyer_id)
            print(f"ID: {t.id} | Ürün ID: {t.product_id} | Tip: {t.transaction_type}")
            print(f"   -> Satıcı (Talebi Görecek Kişi): {seller.username} (ID: {t.seller_id})")
            print(f"   -> Alıcı (Talebi Yapan Kişi): {buyer.username} (ID: {t.buyer_id})")
            print(f"   -> Durum: {t.status}")
            print("-" * 15)