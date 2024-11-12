-- Active: 1731369052978@@127.0.0.1@5433@game-service-db
CREATE TABLE IF NOT EXISTS gameLogs (
    id int NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    gameSessionId UUID NOT NULL REFERENCES gameSessions,
    log_time timestamp NOT NULL,
    playerName VARCHAR(255) NOT NULL,
    playerId int,
    type VARCHAR(255) NOT NULL,
    message TEXT
);