import json
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

# --- MEVCUT KODUN (Şehir Getirme) ---
def get_districts_by_city(city_name):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'ililce.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            cities = json.load(file)
        for city in cities:
            if city['name'].lower() == city_name.lower():
                return city['districts']
    except Exception as e:
        print(f"Hata: {e}")
        return []
    return []

# --- YENİ EKLENEN KOD (Resim Silme) ---
def delete_file_from_url(image_url):
    """
    Verilen resim URL'sinden dosya ismini bulur ve static klasöründen siler.
    """
    try:
        if not image_url: return

        filename = image_url.split('/')[-1]
        
        # Dosya yolunu yapılandır
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
        file_path = os.path.join(upload_folder, filename)
        
        # Dosya varsa sil
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Dosya silindi: {filename}")
            return True
    except Exception as e:
        print(f"Dosya silinirken hata: {e}")
        return False

def save_file(file, folder_name='others'):
    """
    Dosyayı kaydeder ve erişim URL'sini döndürür.
    folder_name: 'profiles', 'products' gibi alt klasör ismi.
    """
    if not file or not file.filename:
        return None

    # Güvenli dosya ismi ve benzersiz ID
    original_filename = secure_filename(file.filename)
    ext = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"

    # Klasör yollarını ayarla
    base_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')
    target_folder = os.path.join(base_folder, folder_name)

    # Klasör yoksa oluştur
    if not os.path.exists(target_folder):
        os.makedirs(target_folder)

    # Dosyayı kaydet
    file_path = os.path.join(target_folder, unique_filename)
    file.save(file_path)
    return f"/static/uploads/{folder_name}/{unique_filename}"    