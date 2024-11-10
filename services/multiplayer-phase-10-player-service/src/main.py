from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt, get_jwt_identity
from flask import request, jsonify
from datetime import timedelta
from subscribe import service_discovery_subscription
import os
from dotenv import load_dotenv
from service import PlayerService
from cache import globalCache
import elk

load_dotenv()
ACCESS_EXPIRES = timedelta(hours=1)
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'foartesupersecret'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = ACCESS_EXPIRES
# app.logger.setLevel(logging.WARNING)
jwt = JWTManager(app)
service = PlayerService()

def handle_service_result(result, message_builder):
    try:
        if result[1] // 100 == 2:
            return jsonify(message_builder(result[0])), result[1]
        else:
            return jsonify(result[0]), result[1]
    except Exception as e:
        elk.log_service_error(e, other=result)
        return jsonify(), 500



@app.route('/ping', methods=['GET'])
def hello_world():
    return 'pong'

@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username')
    password = request.json.get('password')

    # Register player
    result = service.register_player(username, password)

    return handle_service_result(result, message_builder=lambda x: {'message': 'Player registered'})

@app.route('/login', methods=['POST'])
def login():

    username = request.json.get('username')
    password = request.json.get('password')

    # Generate JWT token
    result = service.login_player(username, password)
    acces_token = create_access_token(identity=username)

    return handle_service_result(result, message_builder=lambda x: {'id': x, 'token': acces_token})

@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload: dict):
    jti = jwt_payload["jti"]
    token_in_redis = globalCache.get(jti)
    return token_in_redis is not None

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    username = get_jwt_identity()
    id = service.get_id_by_name(username)
    elk.log_expired_authorization_token_used(jwt_payload["exp"], username, id)

@app.route('/authorization', methods=['GET'])
@jwt_required()
def authorization():
    username = get_jwt_identity()
    result = service.get_id_by_name(username)

    elk.log_authorization_token_used(username, result)

    return handle_service_result(result, message_builder=lambda x: {'id': x})

@app.route('/logout', methods=['DELETE'])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    globalCache.set(jti, "", ex=ACCESS_EXPIRES)

    username = get_jwt_identity()
    result = service.get_id_by_name(username)

    elk.log_logout_event(username, result)
    return jsonify({'message': 'Logged out'}), 200


@app.route('/players', methods=['GET'])
def get_players():

    result = service.get_all_players()

    return handle_service_result(result, message_builder=lambda x: {'players': x})

@app.route('/players/<int:id>', methods=['GET'])
def get_player_by_id(id: int):

    result = service.get_player_by_id(id)

    return handle_service_result(result, message_builder=lambda x: {'player': x})

# Hidden from clients
@app.route('/players/<int:id>', methods=['PUT'])
def update_player_game(id):
    won = request.json.get('won')

    result = service.update_player_game(id, won)

    return handle_service_result(result, message_builder=lambda x: {'message': 'Player updated'})

if __name__ == "__main__":
    service_discovery_subscription()
    app.run(host="0.0.0.0", port=os.getenv("THIS_SERVICE_PORT"))