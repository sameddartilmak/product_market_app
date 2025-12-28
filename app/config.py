import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or '123321'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://postgres:123321@localhost:5432/urun_kiralama_db'
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False