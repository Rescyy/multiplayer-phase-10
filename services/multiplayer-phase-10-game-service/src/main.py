from flask import Flask, request, jsonify
from service import GameService
from subscribe import service_discovery_subscription
from consts import THIS_SERVICE_PORT

app = Flask(__name__)

service = GameService()

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

@app.route('/gamesession/guest/<str:code>', methods=['POST'])
def connectGuestGamesession(code):
    guestUsername = request.json.get('guest-username')
    result = service.connectGuestToGame(code, request.remote_addr, guestUsername)
    return handle_service_result(result, message_builder=lambda x: {"code": x})

if __name__ == "__main__":
    service_discovery_subscription()
    app.run(host="0.0.0.0", port=THIS_SERVICE_PORT)