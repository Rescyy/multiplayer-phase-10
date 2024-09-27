from datetime import timedelta
from flask_socketio import SocketIO, emit, send
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt, get_jwt_identity
from flask import Flask, request, jsonify
from game_service import GameService
from subscribe import service_discovery_subscription
from consts import THIS_SERVICE_PORT

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret_key'
app.config['JWT_SECRET_KEY'] = 'jwt_secret_key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
socketio = SocketIO(app)
service = GameService()
jwt = JWTManager(app)

def handle_service_result(result, message_builder):
    if result[1] // 100 == 2:
        return jsonify(message_builder(result[0])), result[1]
    else:
        return jsonify(result[0]), result[1]

@app.route('/ping', methods=['GET'])
def ping():
    return "pong"

# { "code": <code> }
@app.route('/gamesession', methods=['GET'])
def getGamesession():
    result = service.getGamesession(request.remote_addr)
    return handle_service_result(result, message_builder=lambda x: {"code": x})

@app.route('/gamesession/guest/<code>', methods=['GET'])
def connectGuestGamesession(code):

    result, username = service.requestGameSession(code, request.remote_addr)
    
    access_token = create_access_token(identity={
        "username": username,
        "code": code
    })

    return handle_service_result(result, message_builder=lambda x: {"message": x, "token": access_token, "username": username})

@app.route('/gamesession/authorized/<code>', methods=['GET'])
def connectAuthorizedGamesession(code):
    
    authorization = request.headers.get('Authorization')

    result, username = service.requestAuthorizedGameSession(code, request.remote_addr, authorization)
    
    access_token = create_access_token(identity={
        "username": username,
        "code": code
    })

    return handle_service_result(result, message_builder=lambda x: {"message": x, "token": access_token, "username": username})

@socketio.on('message', namespace='/gamesession-ws')
@jwt_required()
def handle_message(msg):
    identity = get_jwt_identity()
    username = identity.get('username')
    code = identity.get('code')
    msg = f"{code}: {username}: {msg}"
    send(msg, broadcast=True)

@socketio.on('disconnect', namespace='/gamesession-ws')
@jwt_required()
def handle_disconnect():
    identity = get_jwt_identity()
    username = identity.get('username')
    code = identity.get('code')
    msg = f'{username} disconnected from room {code}'
    send(msg, broadcast=True)

@socketio.on('connect', namespace='/gamesession-ws')
@jwt_required()
def handle_disconnect():
    identity = get_jwt_identity()
    username = identity.get('username')
    code = identity.get('code')
    msg = f'{username} connected from room {code}'
    send(msg, broadcast=True)

if __name__ == "__main__":
    service_discovery_subscription()
    socketio.run(app, host="0.0.0.0", port=THIS_SERVICE_PORT)
