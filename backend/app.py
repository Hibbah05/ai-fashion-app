import os
import random
import requests
import base64
import json
import uuid
import urllib.parse
import re
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"]
    }
})

app.config["JWT_SECRET_KEY"] = "super-secret-minimalist-key-1829"
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ─── COMPREHENSIVE OUTFIT DATABASE ──────────────────────────────────────────
OUTFIT_DATABASE = {
    "lunch": [
        {
            "type": "recommendation",
            "reply": "Perfect for a Karachi lunch outing. A chic shirt dress paired with a woven belt and slide sandals creates an effortlessly elegant daytime look. Here are the curated pieces for your ideal lunch look:",
            "items": [
                {"name": "Shirt Dress", "prompt": "white shirt dress with belt fashion product photography white background", "action": "View"},
                {"name": "Woven Belt", "prompt": "tan woven leather belt with gold buckle fashion product photography white background", "action": "Add to Archive"},
                {"name": "Slide Sandals", "prompt": "tan leather slide sandals with gold hardware fashion product photography white background", "action": "Add to Archive"},
            ]
        }
    ],
    "brunch": [
        {
            "type": "recommendation",
            "reply": "Perfect for a Karachi brunch. Pair a breezy kaftan with wide-leg trousers and embellished sandals for an effortlessly chic daytime look that keeps you cool and stylish. Here are the curated pieces for your ideal brunch look:",
            "items": [
                {"name": "Embroidered Kaftan", "prompt": "ivory embroidered cotton kaftan with floral embroidery fashion product photography white background", "action": "View"},
                {"name": "Wide Leg Trousers", "prompt": "cream wide leg linen trousers with elastic waist fashion product photography white background", "action": "Add to Archive"},
                {"name": "Embellished Sandals", "prompt": "gold embellished flat sandals with crystal details fashion product photography white background", "action": "Add to Archive"},
            ]
        }
    ],
    "beach": [
        {
            "type": "recommendation",
            "reply": "For Karachi's beautiful coastline, embrace effortless beach style. A flowing resort dress, straw tote, and slide sandals create the perfect seaside look. Here are the curated pieces for your ideal beach look:",
            "items": [
                {"name": "Resort Maxi Dress", "prompt": "white bohemian resort maxi dress with embroidery beach fashion product photography", "action": "View"},
                {"name": "Straw Tote Bag", "prompt": "natural woven straw beach tote bag with leather trim fashion product photography", "action": "Add to Archive"},
                {"name": "Slide Sandals", "prompt": "tan leather slide sandals with comfort footbed fashion product photography", "action": "Add to Archive"},
            ]
        }
    ],
    "date_night": [
        {
            "type": "recommendation",
            "reply": "Make your Karachi date night unforgettable with this alluring ensemble. A silk slip dress paired with strappy heels and a clutch creates the perfect romantic evening look. Here are the curated pieces for your ideal date night look:",
            "items": [
                {"name": "Silk Slip Dress", "prompt": "champagne silk slip dress with cowl neck date night fashion product photography", "action": "View"},
                {"name": "Strappy Heels", "prompt": "gold strappy stiletto heels with ankle strap date night fashion product photography", "action": "Add to Archive"},
                {"name": "Evening Clutch", "prompt": "gold beaded evening clutch with chain strap date night fashion product photography", "action": "Add to Archive"},
            ]
        }
    ],
    "formal": [
        {
            "type": "recommendation",
            "reply": "Command the boardroom with this polished professional look. A silk shell top, tailored trousers, and classic pumps create the perfect office ensemble for Karachi's corporate environment. Here are the curated pieces for your ideal formal look:",
            "items": [
                {"name": "Silk Shell Top", "prompt": "ivory silk shell top with cowl neck office fashion product photography", "action": "View"},
                {"name": "Tailored Trousers", "prompt": "charcoal tailored wide leg trousers with crease office fashion product photography", "action": "Add to Archive"},
                {"name": "Classic Pumps", "prompt": "nude leather pointed pumps with block heel office fashion product photography", "action": "Add to Archive"},
            ]
        }
    ],
    "casual": [
        {
            "type": "recommendation",
            "reply": "Embrace effortless everyday style with this comfortable casual look. A cotton t-shirt, distressed jeans, and clean sneakers create the perfect laid-back vibe for Karachi. Here are the curated pieces for your ideal casual look:",
            "items": [
                {"name": "Organic Cotton Tee", "prompt": "white organic cotton t-shirt with crew neck casual fashion product photography", "action": "View"},
                {"name": "Distressed Jeans", "prompt": "light wash distressed skinny jeans with rips casual fashion product photography", "action": "Add to Archive"},
                {"name": "Minimalist Sneakers", "prompt": "white leather minimalist sneakers with lace up casual fashion product photography", "action": "Add to Archive"},
            ]
        }
    ],
    "wedding": [
        {
            "type": "recommendation",
            "reply": "Celebrate in style with this elegant wedding guest look. A beautifully embroidered kurta paired with churidar and mojari creates the perfect festive ensemble for Karachi weddings. Here are the curated pieces for your ideal wedding look:",
            "items": [
                {"name": "Embroidered Kurta", "prompt": "ivory embroidered cotton kurta with zari work wedding fashion product photography", "action": "View"},
                {"name": "Churidar Pajama", "prompt": "cream silk churidar pajama with elastic waist wedding fashion product photography", "action": "Add to Archive"},
                {"name": "Embroidered Mojari", "prompt": "gold embroidered mojari shoes with curved toe wedding fashion product photography", "action": "Add to Archive"},
            ]
        }
    ],
    "gym": [
        {
            "type": "recommendation",
            "reply": "Crush your Karachi workout in style. A seamless sports bra, high-waist leggings, and performance training shoes create the perfect active look for your fitness routine. Here are the curated pieces for your ideal gym look:",
            "items": [
                {"name": "Sports Bra", "prompt": "black seamless sports bra with racerback gym fashion product photography", "action": "View"},
                {"name": "High-Waist Leggings", "prompt": "black high waist gym leggings with compression gym fashion product photography", "action": "Add to Archive"},
                {"name": "Training Shoes", "prompt": "white mesh training shoes with cushioned sole gym fashion product photography", "action": "Add to Archive"},
            ]
        }
    ]
}

# ─── DEFAULT FALLBACK ─────────────────────────────────────────────────────────
DEFAULT_FALLBACK = {
    "type": "recommendation",
    "reply": "Here are some curated pieces for your style. Each piece is selected to complement your look perfectly. Here are the curated pieces for your ideal look:",
    "items": [
        {"name": "Linen Shirt", "prompt": "white linen relaxed collar shirt fashion product photography", "action": "View"},
        {"name": "Tailored Trousers", "prompt": "beige wide leg tailored trousers fashion product photography", "action": "Add to Archive"},
        {"name": "Leather Loafer", "prompt": "minimalist tan leather loafer fashion product photography", "action": "Add to Archive"},
    ]
}

# ─── DETECT OUTFIT TYPE ──────────────────────────────────────────────────────
def detect_outfit_type(message: str) -> str:
    if not message:
        return "casual"
    message_lower = message.lower()
    if any(word in message_lower for word in ['lunch', 'luncheon']):
        return "lunch"
    elif any(word in message_lower for word in ['brunch', 'breakfast']):
        return "brunch"
    elif any(word in message_lower for word in ['beach', 'sea', 'shore', 'coast', 'sand', 'wave']):
        return "beach"
    elif any(word in message_lower for word in ['date', 'night out', 'dinner', 'romantic', 'evening']):
        return "date_night"
    elif any(word in message_lower for word in ['office', 'work', 'business', 'formal', 'meeting']):
        return "formal"
    elif any(word in message_lower for word in ['wedding', 'mehndi', 'shaadi', 'celebration']):
        return "wedding"
    elif any(word in message_lower for word in ['gym', 'workout', 'exercise', 'fitness']):
        return "gym"
    else:
        return "casual"

# ─── GENERATE IMAGE URL ──────────────────────────────────────────────────────
# Fixed: use proper URL-encoding (urllib.parse.quote) instead of only
# replacing spaces, and use a fully random seed per image instead of
# clustered/sequential seeds. Clustered seeds close together sometimes hit
# the same underlying render slot on pollinations.ai and time out or fail
# for 2 of 3 images requested in quick succession.
def generate_image_url(prompt: str, index: int) -> str:
    encoded_prompt = urllib.parse.quote(prompt)
    seed = random.randint(1, 999999)
    return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=500&height=500&nologo=true&seed={seed}"

# ─── BUILD RECOMMENDATIONS ──────────────────────────────────────────────────
def build_recommendations(items: list) -> list:
    recommendations = []
    for idx, item in enumerate(items):
        name = item.get('name', f'Item {idx + 1}')
        prompt = item.get('prompt', 'fashion product photography')
        action = item.get('action', 'Add to Archive')

        image_url = generate_image_url(prompt, idx)

        recommendations.append({
            'id': f"rec_{idx}_{random.randint(1000, 9999)}",
            'imageUrl': image_url,
            'label': name,
            'actionText': action,
        })
    return recommendations

# ─── GET OUTFIT ──────────────────────────────────────────────────────────────
def get_outfit(message: str) -> dict:
    outfit_type = detect_outfit_type(message)
    outfits = OUTFIT_DATABASE.get(outfit_type, [DEFAULT_FALLBACK])
    selected_outfit = random.choice(outfits)
    return {
        "type": selected_outfit["type"],
        "reply": selected_outfit["reply"],
        "items": selected_outfit["items"]
    }


# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.route('/register', methods=['POST', 'OPTIONS'])
@cross_origin()
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    token = create_access_token(identity=username)
    return jsonify({'token': token, 'username': username}), 200


# ==========================================
# MAIN CHAT ENDPOINT
# ==========================================

@app.route('/chat', methods=['POST', 'OPTIONS'])
@cross_origin()
def handle_chat():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type', 'Authorization, Accept')
        return response

    try:
        data = request.json or {}
        user_message = data.get('message', '').strip()
        image_base64 = data.get('image', '')

        print(f"[Chat] Message: {user_message}")
        print(f"[Chat] Has image: {bool(image_base64)}")

        if not user_message and not image_base64:
            return jsonify({'error': 'No input provided'}), 400

        # Get outfit based on message
        outfit = get_outfit(user_message)
        recommendations = build_recommendations(outfit['items'])

        print(f"[Chat] Outfit type: {outfit['type']}")
        for i, item in enumerate(outfit['items']):
            print(f"  {i+1}. {item.get('name')}")

        response_data = {
            'type': outfit['type'],
            'reply': outfit['reply'],
            'items': outfit['items'],
            'recommendations': recommendations,
            'hasRecs': True,
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"[Chat] Error: {e}")
        import traceback
        traceback.print_exc()

        recommendations = build_recommendations(DEFAULT_FALLBACK['items'])

        return jsonify({
            'type': DEFAULT_FALLBACK['type'],
            'reply': "I'm here to help with your style. Try asking for: lunch, brunch, beach, date night, formal, casual, wedding, or gym outfits.",
            'items': DEFAULT_FALLBACK['items'],
            'recommendations': recommendations,
            'hasRecs': True,
        }), 200


@app.route('/weather', methods=['GET', 'OPTIONS'])
@cross_origin()
def handle_home_weather():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        return jsonify({
            'temp': '32°C',
            'summary': 'High humidity profile. Prioritizing open-weave organic cotton.',
            'title': 'Airy Minimalist',
            'top': 'Semi-sheer linen drop-shoulder shirt',
            'base': 'Lightweight cotton tailored chinos',
            'acc': 'Woven breathable leather loafers',
        }), 200
    except Exception as e:
        print(f"[Weather] Error: {e}")
        return jsonify({'error': 'Weather service unavailable'}), 500


# ==========================================
# WARDROBE ENDPOINTS
# ==========================================
# Simple file-based storage: metadata in wardrobe_data.json,
# actual photos saved as .jpg files in wardrobe_images/.
# Good enough for a single-user prototype; swap for a real DB table
# later if you add multi-user accounts.

WARDROBE_DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wardrobe_data.json')
WARDROBE_IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wardrobe_images')
os.makedirs(WARDROBE_IMAGES_DIR, exist_ok=True)


def _load_wardrobe():
    if not os.path.exists(WARDROBE_DATA_FILE):
        return []
    try:
        with open(WARDROBE_DATA_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _save_wardrobe(items):
    with open(WARDROBE_DATA_FILE, 'w') as f:
        json.dump(items, f, indent=2)


@app.route('/wardrobe/add', methods=['POST', 'OPTIONS'])
@cross_origin()
def wardrobe_add():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        category = data.get('category', '').strip()
        image_base64 = data.get('image', '')

        if not name:
            return jsonify({'error': 'Name is required'}), 400
        if not image_base64:
            return jsonify({'error': 'Image is required'}), 400

        # Strip a data URL prefix if the client sent one (e.g. "data:image/jpeg;base64,...")
        if ',' in image_base64 and image_base64.strip().startswith('data:'):
            image_base64 = image_base64.split(',', 1)[1]

        item_id = str(uuid.uuid4())
        filename = f"{item_id}.jpg"
        filepath = os.path.join(WARDROBE_IMAGES_DIR, filename)

        image_bytes = base64.b64decode(image_base64)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)

        item = {
            'id': item_id,
            'name': name,
            'category': category or 'Uncategorized',
            'filename': filename,
            'createdAt': datetime.utcnow().isoformat(),
        }

        items = _load_wardrobe()
        items.insert(0, item)  # newest first
        _save_wardrobe(items)

        item['imageUrl'] = f"{request.host_url.rstrip('/')}/wardrobe_images/{filename}"
        print(f"[Wardrobe] Added: {name} ({category or 'Uncategorized'})")
        return jsonify(item), 201

    except Exception as e:
        print(f"[Wardrobe] Add error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to save item'}), 500


@app.route('/wardrobe/list', methods=['GET', 'OPTIONS'])
@cross_origin()
def wardrobe_list():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        items = _load_wardrobe()
        for item in items:
            item['imageUrl'] = f"{request.host_url.rstrip('/')}/wardrobe_images/{item['filename']}"
        return jsonify({'items': items}), 200
    except Exception as e:
        print(f"[Wardrobe] List error: {e}")
        return jsonify({'error': 'Failed to load wardrobe'}), 500


@app.route('/wardrobe/<item_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def wardrobe_delete(item_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        items = _load_wardrobe()
        target = next((i for i in items if i['id'] == item_id), None)
        if not target:
            return jsonify({'error': 'Item not found'}), 404

        filepath = os.path.join(WARDROBE_IMAGES_DIR, target['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)

        items = [i for i in items if i['id'] != item_id]
        _save_wardrobe(items)
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        print(f"[Wardrobe] Delete error: {e}")
        return jsonify({'error': 'Failed to delete item'}), 500


@app.route('/wardrobe_images/<filename>', methods=['GET'])
def serve_wardrobe_image(filename):
    from flask import send_from_directory
    return send_from_directory(WARDROBE_IMAGES_DIR, filename)


@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Maison API is running!', 'status': 'online'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)