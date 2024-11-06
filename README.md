# Multiplayer Phase 10 Card Game

## How to build and deploy

`git clone https://github.com/Rescyy/multiplayer-phase-10.git`

`cd multiplayer-phase-10`

`docker-compose build && docker-compose up`

## Application Suitability

- Microservices architecture is perfect for multiplayer games which require fast response times and managing of databases. 
- Multiplayer game backends usually consist of the game logic, player and games databases. We can assign a microservice with one or multiple instances to each of the components.
- Instead of creating a monolithic application that would be hard to maintain, hard to scale, and prone to crashing, microservices allow us to build up on smaller, more digestible code bases. Division of code, allows the whole application to not break from a single crash in one of the services.
- Microservices are scalable, they allow for multiple instances which can sustain multiple client connections.

## Service Boundaries

__1.__ API Gateway - Entry point to the system, handle client connections, redirect to other services if necessary.

__2.__ Game Service - Focuses on game session, player connection maintainance, game logic, verification of player moves, real-time updates for multiplayer environments.

__3.__ Player Account Service - Handle player account authentication, store player data such as games, scores, friends.

![alt text](assets/PAD%20architecture2.png "Title")

Plans for future (Not going to implement for this laboratory work)
- AI Player Service
- Game Session DB, to continue games later
- Chat Support
- Public/Private Game Session Distinctions
- Friend System
- View Player Status
- Implement refresh token
- Encrypt player information
- HTTPS, WSS

## Technology Stack

- Api Gateway - NestJS framework
- Service Discovery - NestJS framework
- Game Service - Python
- Game DB - PostgreSQL
- Player Account Service - Python
- Player Account DB - PostgreSQL
- Shared Cache - Redis
- Deployment - Docker Compose
- ELK Stack
- Data Warehouse - PostgreSQL
- ETL - Python

## Communication Patterns

- Communication with client and between services - Websocket, HTTP
- Communication with Redis - RESP3
- Communication with Service Discovery - gRPC

## Data Managemenet

#### Task Timeout
All requests will be timed, after at least 5 seconds, the request will be cancelled.

#### Status Ping Endpoint

- __API:__ `GET /ping`
- __Response 200 OK__

The ping will be retried 5 times. If it fails six times one after the other, the service will be removed from the registry. In the future might look into ways of dropping it and restarting a new one instead.

Services can only be accessed by other services. The only accessible service to the client is the API Gateway. The status endpoint of the API gateway can be accessed by the client. The services will be periodically pinged by the Service Discovery to ensure the health status of the services.

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
        ```
        {
            "id": "userId"
        }
        ```
- __Caching:__ `True`
- __Response 401 Unauthorized__

#### Get player information

Get information about the player/players, account information.

- __API:__ `GET /players/{id}`
- __URL Params:__ `optional id = <string>`
- __Query Params:__ 
```
optional sortby = default 'id' | 'creation-time' | 'games-won' | 'games-won-ratio' | 'games-played'
optional offset = default 0 | <int>
optional size = default MAX | <int>
```
- __Caching:__ `True`
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

- __API:__ `GET /gamesession`
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
```
- __URL Params:__ `code = <string>`
- __Response 200 OK__
```
{
    "access-token": <acces-token>,
    "username": <username>
}
```
- __Response 400 Bad Request__
- __Response 401 Unauthorized__

##### as a Guest Player

- __API:__ `GET /gamesession/guest/{code}`
- __URL Params:__ `code = <string>`
- __Headers:__ 
- __URL Params:__ `code = <string>`
- __Payload:__ `{"guest-username": "guestUsername"}`
- __Response 200 OK:__
```
{
    "token": <token>,
    "username": <username>
}
```
- __Response 400 Bad Request__


### Game Service - Websocket/Socket.IO

- __API:__ `/gamesession-ws`
- __Headers:__
```
Authorization: Bearer <token>
```
- __Websocket Events__ `connect` `disconnect` `message`

### Service Discovery

#### Register Service

A service will register to the service discovery. It will then store the address and port the service came from.

- __API:__ `POST /services`
- __Raw Data:__ 
```
{
    "service-type": <service-type>,
    "port": <port>,
    "healthcheck-params": {
        "period": 5,
    }
}
```

```<service-type> = "gateway" | "player-service" | "game-service"```
```optional healthcheck-params```
```optional period - default 5``` 
- __Response 200 OK__
```
{
    "id": <uuid>,
    "url": "localhost:1234",
}
```
- __Response 400 Bad Request__ - for invalid service types

#### Fetch Services

- __API:__ `GET /services/{service-type}`
- __URL Params:__ optional service-type
- __Response 200 OK__
```
{
    <ServiceType>: [
        <ServiceInstance>
        ...
    ],
    ...
}
```
`<ServiceType>:` 
`0 GATEWAY` `1 GAME-SERVICE` `2 PLAYER-SERVICE`
- __Response 400 Bad Request__

### 2PC/Long-Running Saga Transaction

#### Close Running Game Session and Save it to Database

- __API__: `DELETE /gamesession/<code>`
- __URL Params:__ code
- __Headers:__
```
Authorization: Bearer <token>
```
- __Response 200 OK__
- __Response 400 Bad Request__
- __Response 401 Unathorized__
- __Response 404 Not Found__
