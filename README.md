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

Plans for future (Not going to implement for this laboratory work)
- AI Player Service
- Game Session DB, to continue games later
- Chat Support
- Public/Private Game Creation
- Friend System
- View Player Status
- Implement refresh token
- Encrypt player information
- HTTPS, WSS

## Technology Stack

- Api Gateway - NestJS framework
- Service Discovery - NestJS framework
- Game Service - Rust

    Chosen for personal preference and challenge, it is a modern language with runtime safety stamped on its forehead. It has its own asynchronous runtime package that does not depend on system threads and which is faster.(Might regret later due to the difficulty)
- Game DB - PostgreSQL
- Player Account Service - Python
- Player Account DB - PostgreSQL
- Shared Cache - Redis
- Deployment - Docker

## Communication Patterns

- Communication with client and between services - Websocket, HTTP
- Communication with Redis - TCP
- Communication with Service Discovery - gRPC

## Data Managemenet

#### Task Timeout
All requests will be timed, after at least 5 seconds (to be determined), the request will be cancelled.

#### Status Ping Endpoint

- __API:__ `GET /ping`
- __Response 200 OK__

The ping will be retried 5 times. If it fails five times, the service will be dropped and another one will attempt to start.

Services can only be accessed by other services. The only accessible service to the client is the API Gateway. The status endpoint of the API gateway can be accessed by the client. The services will be periodically pinged by the Service Discovery.

### Player User Service

#### Register Player account

- __API:__ `POST /register`
- __Payload:__ 
        ```
        {
            "username": "userUsername",
            "password": "userPassword",
        }
        ```
- __Response 200 OK__
- __Response 409 Conflict:__ 
        ```
        {
            "reason": "Username already exists"
        }
        ```

#### Login Player

- __API:__ `POST /login`
- __Payload:__
        ```
        {
            "username": "userUsername",
            "password": "userPassword",
        }
        ```
- __Response 200 OK:__ `{ "token": <token> }`
- __Response 401 Unauthorized__

#### Logout Player
- __API:__ `GET /logout`
- __Headers:__ `Authorization: Bearer <token>`
- __Response 200 OK__
- __Response 401 Unauthorized__

#### Authorize/Identify Player
- __API:__ `POST /authorization`
- __Headers:__ `Authorization: Bearer <token>`
- __Response 200 OK__
- __Caching:__ `True`
        ```
        {
            "id": "userId"
        }
        ```
- __Response 401 Unauthorized__

#### Get player information

Get information about the player/players, account information.

- __API:__ `GET /players/{id}`
- __URL Params:__ `optional id = <string>`
- __Query Params:__ 
- __Caching:__ `True`
```
optional sortby = default 'id' | 'creation-time' | 'games-won' | 'games-won-ratio' | 'games-played'
optional offset = default 0 | <int>
optional size = default MAX | <int>
```
- __Response 200 OK__
    - Case: With path parameter `id`
    ```
    Player JSON Object:
    {
        "id": "user-id"
        "name": "userUsername",
        "creation-time": "2024-09-08T17:53:32Z",
        "games-played": 69,
        "games-won": 420
    }

    ```
    - Case: With no path parameter `id`
    ```
    {
        "players": [<Player JSON Object>]
    }
    ```
- __Response 404 Not Found__

### Game Service

#### Get information of an available game session

Receive code to an empty available game session

- __URL:__ `GET /gamesession`
- __Response 200 OK:__
        ```
        {
            "code": <code>
        }
        ```
- __Response 503 Service Unavailable__
    
    Error reasons might be because a maximum limit of game sessions have been reached.

#### Connect to a game session lobby:

##### as an Authorized Player

- __API:__ `GET /gamesession/authorized/{code}`
- __URL Params:__ `code = <string>`
- __Headers:__ 
```
Authorization: Bearer <token>
Upgrade: websocket
Connetion: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```
- __URL Params:__ `code = <string>`
- __Response 101 Switching Protocols__
```
// Headers // 
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
- __Response 401 Unauthorized__
- __Response 400 Bad Request__ - The user did not send Upgrade headers.

##### as a Guest Player

- __API:__ `GET /gamesession/guest/{code}`
- __URL Params:__ `code = <string>`
- __Headers:__ 
```
Upgrade: websocket
Connetion: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```
- __URL Params:__ `code = <string>`
- __Payload:__ `{"guest-username": "guestUsername"}`
- __Response 101 Switching Protocols__
```
// Headers //
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
- __Response 400 Bad Request__ - The user did not send Upgrade headers.

The websocket path will be the same as the one with which the user requested a websocket connection.

### Game Service - Websocket

#### Both Client and Service

- Ok Response: `{ "response": "OK" }`
- Error Response: `{ "response": "ERR" }`

#### To Service

- Send Player State: 
```
{ 
    "player-action": "Set Player State",
    "state": <player-state>,
}
```

```<player-state> = "ready" | "not ready" | "pending"```

All players will be required to send this command to start the game.
- Make move: 
```
{
    "player-action": "Move", 
    "move-type": <move-type>, 
    "args": {<move-type-args>},
}
```

#### From Service

- Send Game State
```
{
    "game-action": "Game State",
    "state": <game-state>,
}
```

```<game-state> = "lobby" | "starting" | "ongoing" | "ending"```

- Send Game Update
```
{
    "game-action": "Game Update",
    "update-type": <update-type>,
    "args": {<update-type-args>},
}
```

```<update-type = "start-phase" | "end-phase" | "player-moved"```

## Task Requirements