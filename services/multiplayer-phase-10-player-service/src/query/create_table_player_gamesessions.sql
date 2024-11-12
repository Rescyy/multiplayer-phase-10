CREATE TABLE IF NOT EXISTS playerGameSessions (
    playerId int REFERENCES players,
    gameSessionId UUID NOT NULL
);