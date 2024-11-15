import os
import requests
import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()
elastic_url = f"http://{os.getenv('ELASTIC_HOST')}:9200"
executor = ThreadPoolExecutor(max_workers=1)
elkSession = requests.Session()
elkSession.headers.update({"Content-Type": "application/json"})

def timestampFormat():
    return datetime.datetime.now().isoformat()

"""
Player Authentication Logs
Index Name: player_auth_logs
Data Structure:
{
"timestamp": "2024-11-07T12:00:00Z",
"player_id": "abc123",
"event_type": "login",  // "login", "logout", "register"
"status": "success",    // "success" or "failed"
"username": "userUsername",
"ip_address": "192.168.1.10",
"error_message": null   // or error message if "failed"
}
"""

def log_register_event(username, player_id, ip_address=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": player_id,
                    "event_type": "register",
                    "status": "success",
                    "username": username,
                    "ip_address": ip_address
                }
            )
        except:
            pass
    executor.submit(log)


def log_login_event(username, player_id, ip_address=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": player_id,
                    "event_type": "login",
                    "status": "success",
                    "username": username,
                    "ip_address": ip_address
                }
            )
        except:
            pass
    executor.submit(log)

def log_logout_event(username, player_id, ip_address=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": player_id,
                    "event_type": "logout",
                    "status": "success",
                    "username": username,
                    "ip_address": ip_address
                }
            )
        except:
            pass
    executor.submit(log)

def log_failed_login_event(username=None, player_id=None, ip_address=None, reason=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": player_id,
                    "event_type": "login",
                    "status": "failed",
                    "username": username,
                    "ip_address": ip_address,
                    "error_message": reason if reason else "Invalid username or password"
                }
            )
        except:
            pass
    executor.submit(log)

def log_failed_register_event(ip_address=None, reason=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": None,
                    "event_type": "register",
                    "status": "failed",
                    "username": None,
                    "ip_address": ip_address,
                    "error_message": reason if reason else "Username already exists"
                }
            )
        except Exception as e:
            print(e)
            pass
    executor.submit(log)

def log_authorization_token_used(username=None, player_id=None, ip_address=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": player_id,
                    "event_type": "authorization",
                    "status": "success",
                    "username": username,
                    "ip_address": ip_address
                }
            )
        except:
            pass
    executor.submit(log)

def log_expired_authorization_token_used(time_of_expiration, username=None, player_id=None, ip_address=None):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/player_auth_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "player_id": player_id,
                    "event_type": "authorization",
                    "status": "failed",
                    "username": username,
                    "ip_address": ip_address,
                    "error_message": "Token expired",
                    "time_of_expiration": time_of_expiration
                }
            )
        except:
            pass
    executor.submit(log)

"""
Error Tracking and Exception Logging
Index Name: service_errors
Data Structure:
{
"timestamp": "2024-11-07T12:04:00Z",
"service_name": "game_service",
"error_type": "NullReferenceException",
"error_message": "Cannot read property 'move' of undefined",
"stack_trace": "Full stack trace here...",
"player_id": "abc123",
"session_code": "G12345"
}
"""

def log_service_error(exception: Exception, other=None):
    timestamp = timestampFormat()
    def log():
        try:
            if isinstance(exception, Exception):
                elkSession.post(
                    f"{elastic_url}/service_errors/_doc",
                    json={
                        "timestamp": timestamp,
                        "service_name": "player_service",
                        "error_type": type(exception).__name__,
                        "error_message": str(exception),
                        "stack_trace": exception.__traceback__,
                        "other": other
                    }
                )
        except:
            pass
    executor.submit(log)

"""
Resource Usage Metrics
Index Name: resource_usage_logs
Data Structure:
{
"timestamp": "2024-11-07T12:06:00Z",
"service_name": "player_account_service",
"resource_type": "database_query",   // "cache_hit", "database_query", etc.
"resource_name": "get_player_data",
"latency_ms": 45,
"status": "success",
"error_details": null                // if an error occurs
}
"""

def log_database_query(resource_name, latency_ms):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/resource_usage_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "service_name": "player_service",
                    "resource_type": "database_query",
                    "resource_name": resource_name,
                    "latency_ms": latency_ms,
                    "status": "success",
                }
            )
        except:
            pass
    executor.submit(log)

def log_failed_database_query(resource_name, latency_ms, exception: Exception):
    timestamp = timestampFormat()
    def log():
        try:
            if isinstance(exception, Exception):
                elkSession.post(
                    f"{elastic_url}/resource_usage_logs/_doc",
                    json={
                        "timestamp": timestamp,
                        "service_name": "player_service",
                        "resource_type": "database_query",
                        "resource_name": resource_name,
                        "latency_ms": latency_ms,
                        "status": "failed",
                        "error_details": {
                            "error_type": type(exception).__name__,
                            "error_message": str(exception),
                            "stack_trace": exception.__traceback__
                        }
                    }
                )
        except:
            pass
    executor.submit(log)

def log_cache_hit(latency_ms, resource_name):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/resource_usage_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "service_name": "player_service",
                    "resource_type": "cache_hit",
                    "resource_name": resource_name,
                    "latency_ms": latency_ms,
                    "status": "success",
                }
            )
            pass
        except:
            pass
    executor.submit(log)

def log_cache_miss(latency_ms, resource_name):
    timestamp = timestampFormat()
    def log():
        try:
            elkSession.post(
                f"{elastic_url}/resource_usage_logs/_doc",
                json={
                    "timestamp": timestamp,
                    "service_name": "player_service",
                    "resource_type": "cache_miss",
                    "resource_name": resource_name,
                    "latency_ms": latency_ms,
                    "status": "success",
                }
            )
            pass
        except:
            pass
    executor.submit(log)

def log_failed_cache_operation(latency_ms, exception: Exception):
    timestamp = timestampFormat()
    def log():
        try:
            if isinstance(exception, Exception):
                elkSession.post(
                    f"{elastic_url}/resource_usage_logs/_doc",
                    json={
                        "timestamp": timestamp,
                        "service_name": "player_service",
                        "resource_type": "cache_operation",
                        "latency_ms": latency_ms,
                        "status": "failed",
                        "error_details": {
                            "error_type": type(exception).__name__,
                            "error_message": str(exception),
                            "stack_trace": exception.__traceback__
                        }
                    }
                )
        except:
            pass
    executor.submit(log)