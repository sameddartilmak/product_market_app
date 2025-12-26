import json
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

# --- MEVCUT KOD (Şehir Getirme - Değişmedi) ---
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

# --- GÜNCELLENEN KOD (Akıllı Silme) ---
def delete_file_from_url(image_url):
    """
    Verilen resim URL'sinden tam dosya yolunu bulur ve siler.
    Ayrıca klasör (ID klasörü) boş kalırsa onu da temizler.
    """
    try:
        if not image_url: return False

        # Örn URL: /static/uploads/products/16/resim.jpg
        # Başındaki '/' işaretini kaldırıyoruz ki os.path.join düzgün çalışsın
        relative_path = image_url.lstrip('/')
        
        # Projenin ana dizini ile URL yolunu birleştiriyoruz
        # Sonuç: C:/Projeler/App/static/uploads/products/16/resim.jpg
        file_path = os.path.join(current_app.root_path, relative_path)
        
        # 1. Dosyayı Sil
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Dosya silindi: {file_path}")
            
            # 2. Klasör Temizliği (Önemli Yeni Özellik)
            # Dosyanın içinde bulunduğu klasörü bul (örn: .../products/16)
            directory = os.path.dirname(file_path)
            
            # Eğer klasör boşsa ve 'uploads' ana klasörü değilse, klasörü de sil
            # (Ürün silinince geriye boş 16 klasörü kalmasın)
            if not os.listdir(directory) and 'uploads' not in os.path.basename(directory):
                try:
                    os.rmdir(directory)
                    print(f"Boş klasör temizlendi: {directory}")
                except OSError:
                    pass # Sistem dosyası vs varsa silme, sorun yok

            return True
        else:
            print(f"Dosya bulunamadı: {file_path}")
            return False

    except Exception as e:
        print(f"Dosya silinirken hata oluştu: {e}")
        return False

# --- GÜNCELLENEN KOD (Dosya Kaydetme) ---
def save_file(file, folder_name='others', specific_id=None):
    """
    Dosyayı kaydeder.
    specific_id: Eğer verilirse 'products/16' gibi alt klasör oluşturur.
    """
    if not file or not file.filename:
        return None

    # Güvenli dosya ismi ve benzersiz ID
    original_filename = secure_filename(file.filename)
    ext = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"

    # Temel yükleme yolu
    base_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    
    # Hedef klasörü belirle
    if specific_id:
        # Örn: static/uploads/products/16
        target_folder = os.path.join(base_folder, folder_name, str(specific_id))
        # URL için: /static/uploads/products/16/dosya.jpg
        relative_url = f"/static/uploads/{folder_name}/{specific_id}/{unique_filename}"
    else:
        # Örn: static/uploads/others
        target_folder = os.path.join(base_folder, folder_name)
        # URL için: /static/uploads/others/dosya.jpg
        relative_url = f"/static/uploads/{folder_name}/{unique_filename}"

    # Klasör yoksa oluştur (iç içe klasörleri de yapar)
    if not os.path.exists(target_folder):
        os.makedirs(target_folder)

    # Dosyayı kaydet
    file_path = os.path.join(target_folder, unique_filename)
    file.save(file_path)
    
    return relative_url