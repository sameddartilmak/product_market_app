# app/models.py
from datetime import datetime
import enum
from app import db, bcrypt

# --- ENUM SINIFLARI ---
class ListingType(str, enum.Enum):
    SALE = 'sale'
    RENT = 'rent'
    SWAP = 'swap'

class OfferStatus(str, enum.Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    COMPLETED = 'completed'

# --- MODELLER ---

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='customer')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler
    products = db.relationship('Product', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, default=0.0)
    listing_type = db.Column(db.String(20), default=ListingType.SALE.value)
    status = db.Column(db.String(20), default='available') 
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    images = db.relationship('ProductImage', backref='product', lazy=True, cascade="all, delete-orphan")

class SwapOffer(db.Model):
    __tablename__ = 'swap_offers'

    id = db.Column(db.Integer, primary_key=True)
    
    # Teklifi yapan kişi (Alici)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # İstenen Ürün (Hedef - Karşı tarafın ürünü)
    target_product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Karşılığında Verilen Ürün (Teklif Edilen - Benim ürünüm)
    offering_product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Durum: pending, accepted, rejected
    status = db.Column(db.String(20), default=OfferStatus.PENDING.value)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler
    buyer = db.relationship('User', foreign_keys=[buyer_id])
    target_product = db.relationship('Product', foreign_keys=[target_product_id])
    offering_product = db.relationship('Product', foreign_keys=[offering_product_id])

class ProductImage(db.Model):
    __tablename__ = 'product_images'

    id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String(255), nullable=False) # Resmin yolu
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

        
class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product = db.relationship('Product', backref='transactions')

    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='purchases')

    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    seller = db.relationship('User', foreign_keys=[seller_id], backref='sales')

    transaction_type = db.Column(db.String(20), nullable=False) # 'SALE', 'RENT'
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='COMPLETED')
    
    start_date = db.Column(db.Date, nullable=True) 
    end_date = db.Column(db.Date, nullable=True)  

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')
    product = db.relationship('Product', backref='messages')


