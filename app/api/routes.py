# app/api/routes.py
from flask import Blueprint, jsonify

# Blueprint tanımlıyoruz (ismini 'api' koyduk)
api_bp = Blueprint('api', __name__)

@api_bp.route('/merhaba', methods=['GET'])
def merhaba():
    return jsonify({"mesaj": "API başarıyla oluşturuldu!"})