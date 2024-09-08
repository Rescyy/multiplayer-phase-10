# Multiplayer Phase 10 Card Game

## Application Suitability

- Microservices architecture is perfect for multiplayer games which require fast response times and managing of databases. 
- Multiplayer game backends usually consist of the game logic, player and games databases. We can assign a microservice with one or multiple instances to each of the components. 
- Instead of creating a monolithic application that would be hard to maintain, hard to scale, and prone to crashing, microservices allow us to build up on smaller, more digestible code bases. Division of code, allows the whole application to not break from a single crash in one of the services.
- Microservices are scalable, they allow for multiple instances which can sustain multiple client connections.

## Service Boundaries

__1.__ API Gateway - Entry point to the system, handle client connections, redirect to other services if necessary.
__2.__ Game Service - Focuses on game session, player connection maintainance, game logic, verification of player moves, real-time updates for multiplayer environments.
__3.__ Player Account Service - Handle player account authentication, store player data such as games, scores, friends.

![alt text](images/PAD%20architecture.jpg "Title")

Plans for future
- AI Player Service
- Game Session DB, to continue games later
- Chat Support
- Public/Private Game Creation
- Friend system

## Technology Stack

- Api Gateway - JavaScript/NestJS framework.
Suitable for making gateways, an easy choice
- Game Service - Rust.
Chosen for personal preference and challenge, it is a modern language with runtime safety stamped on its forehead. It has its own asynchronous runtime that does not depend on system threads and which is faster.(Might regret later due to the difficulty)
- Game DB - PostgreSQL
- Player Account Service - Python
- Player Account DB - PostgreSQL
- Shared Cache - Redis

## Communication Patterns

- RESTful paradigm
- Communication between services - gRPC
- Communication with client - HTTP

## Data Managemenet

### > API Gateway

#### Get redirect information to a game session

Receive redirect information and credentials to an available game session

- __URL:__ `/gamesession`
- __Method:__ `GET`
- __Success Response:__
    - __Code:__ 200
__Content:__ 
```
{
    "status": "Ok",
    "payload": {
        "URL": "http://localhost:1234/abcdef12341234-A1B2/",
        "code": A1B2,
    }
}
```
- __Error Response:__
    - __Code:__ 503
__Content:__
```
{
    "status": "Err", 
    "payload": {
        "reason": "Server cannot support another game session",
    }
}
```

#### Get redirect information to a game session with a certain code

Receive redirect information and credentials to the game session associated with a code

- __URL:__ `/gamesession/{code}`
- __Method:__ `GET`
- __URL Params:__ `code = <string>`
- __Success Response:__
    - __Code:__ 200
    - __Content:__ 
```
{
    "status": "OK",
    "payload": {
        "URL": "http://localhost:1234/abcdef12341234-<code>/"
    }
}
```
- __Error Response:__
    - __Code:__ 503
__Content:__
```
{
    "status": "Err", 
    "payload": {
        "reason": "Game session has maximum amount of players",
    }
}
```

#### Get player information

Get information about the player/players, account information.

- __URL:__ `/player/{id}`
- __Method:__ `GET`
- __URL Params:__ `id = optional <string>`
- __Query Params:__ `sortby='id'|'creation-time'|'games-won'|'games-won-percent'|'games-played'`
- __Success Response:__
    - __Code:__ 200
    - __Content:__ 
```
with id
{
    "status": "OK",
    "payload": {
        "name": "Rescyy",
        "creation-time": "2024-09-08T17:53:32Z",
        "games-played": 69,
        "games-won": 420
    }
}
no id
{
    "status": "OK",
    "payload": {
        "players": [<players>]
    }
}
```
- __Error Response:__
    - __Code:__ 404
__Content:__
```
{
    "status": "Err", 
    "reason": "Invalid Id provided"
}
```

### > Game Service

