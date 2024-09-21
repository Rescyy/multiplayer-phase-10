FROM rust:latest

WORKDIR /usr/src/game-service

COPY . .

RUN cargo build
EXPOSE 3030
CMD ["./target/debug/multiplayer-phase-10-game-service"]