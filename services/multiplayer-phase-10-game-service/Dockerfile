FROM rust:latest

WORKDIR /usr/src/game-service

COPY . .

RUN cargo build
CMD ["./target/debug/multiplayer-phase-10-game-service"]