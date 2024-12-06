from datetime import timedelta
import flask_socketio as sio
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt, get_jwt_identity
from flask import Flask, request, jsonify
from game_service import GameService
from subscribe import service_discovery_subscription
import os
from dotenv import load_dotenv
import elk
import random

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret_key'
app.config['JWT_SECRET_KEY'] = 'jwt_secret_key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
socketio = sio.SocketIO(app)
service = GameService()
jwt = JWTManager(app)

def handle_service_result(result, message_builder):
    print("Result:", result)
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
    try:
        result = service.getGamesession()
        return handle_service_result(result, message_builder=lambda x: {"code": x})
    except Exception as e:
        elk.log_service_error(e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/gamesession/guest/<code>', methods=['GET'])
def connectGuestGamesession(code):
    try:
        result, username = service.requestGuestGameSession(code)
        
        if username is None:
            return result

        access_token = create_access_token(identity={
            "username": username,
            "code": code
        })

        return handle_service_result(
            result,
            message_builder=lambda x: {
                "message": x, 
                "token": access_token, 
                "username": username
            })
    except Exception as e:
        elk.log_service_error(e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/gamesession/authorized/<code>', methods=['GET'])
def connectAuthorizedGamesession(code):
    try:
        authorization = request.headers.get('Authorization')

        result, playerInfo = service.requestAuthorizedGameSession(code, authorization)

        if playerInfo is None:
            return result

        username, id = playerInfo

        access_token = create_access_token(identity={
            "username": username,
            "playerId": id,
            "code": code,
        })

        return handle_service_result(
            result, 
            message_builder=lambda x: {
                "message": x, 
                "token": access_token, 
                "username": username
            })
    except Exception as e:
        elk.log_service_error(e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/end-of-gamesession/<code>/<uuid>', methods=['PATCH'])
def endOfGameSession(code, uuid):
    try:
        service.endOfGameSession(code, uuid)
        return jsonify("OK"), 200
    except Exception as e:
        elk.log_service_error(e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/end-of-gamesession/<uuid>/rollback', methods=["PATCH"])
def rollbackEndOfGamesession(uuid):
    try:
        service.rollbackEndOfGameSession(uuid)
        return jsonify("OK"), 200
    except Exception as e:
        elk.log_service_error(e)
        return jsonify({"error": "Internal Server Error"}), 500

@socketio.on('message', namespace='/gamesession-ws')
@jwt_required()
def handle_message(msg, *args):
    try:
        identity = get_jwt_identity()
        username = identity.get('username')
        code = identity.get('code')
        msg = f"{code}: {username}: {msg}"

        service.logMessage(code, username, msg)

        sio.emit("message", msg, broadcast=True, to=code)
    except Exception as e:
        elk.log_service_error(e)
        sio.emit("error", "Internal Server Error")

@socketio.on('disconnect', namespace='/gamesession-ws')
@jwt_required()
def handle_disconnect(*args):
    try:
        identity = get_jwt_identity()
        username = identity.get('username')
        code = identity.get('code')
        msg = f'{username} disconnected from room {code}'

        service.disconnectPlayer(code, username)

        sio.leave_room(code)

        sio.emit("message", msg, broadcast=True, to=code)
    except Exception as e:
        elk.log_service_error(e)
        sio.emit("error", "Internal Server Error")

@socketio.on('connect', namespace='/gamesession-ws')
@jwt_required()
def handle_connect(*args):
    try:
        identity = get_jwt_identity()
        username = identity.get('username')
        code = identity.get('code')
        playerId = identity.get('playerId')

        if service.sessionExists(code):
            msg = f'{username} connected from room {code}'
            service.connectPlayer(code, username, playerId)
            sio.join_room(code)
            sio.emit("message", msg, broadcast=True, to=code)
        else:
            sio.emit("error", "Invalid code")
            sio.disconnect()
    except Exception as e:
        elk.log_service_error(e)
        sio.emit("error", "Internal Server Error")

if __name__ == "__main__":
    service_discovery_subscription()
    socketio.run(app, host="0.0.0.0", port=os.getenv("THIS_SERVICE_PORT"), allow_unsafe_werkzeug=True)
