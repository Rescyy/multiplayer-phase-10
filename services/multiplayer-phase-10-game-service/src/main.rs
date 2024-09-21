use std::path::Path;

use actix::{Actor, ActorContext, StreamHandler};
use actix_web::{get, route, web, App, Error, HttpRequest, HttpResponse, HttpServer, Responder, Result};
use actix_web::http::header;
use actix_web::middleware::Logger;
use actix_files::{Files, NamedFile};
use actix_web_actors::ws;

#[route("/hello/{name}", method="GET", method="HEAD")]
async fn hello(params: web::Path<String>, req: HttpRequest) -> Result<String> {
    let name = params.into_inner();

    match req.headers().get(header::USER_AGENT) {
        Some(agent) => Ok(format!("Hello {} from {}!", name, agent.to_str().unwrap())),
        None => Ok(format!("Hello {}!", name))
    }
}

struct WsEcho;

impl Actor for WsEcho {
    type Context = ws::WebsocketContext<Self>;
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsEcho {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        log::info!("WsEcho got message {:?}", msg);
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Text(text)) => ctx.text(text),
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            },
            _ => ctx.stop(),
        }
    }
}

#[get("/ws-echo")]
async fn ws_echo(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::start(WsEcho {}, &req, stream)
}

struct WsRev;

impl Actor for WsRev {
    type Context = ws::WebsocketContext<Self>;
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsRev {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        log::info!("WsRev got message {:?}", msg);
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Text(text)) => {
                let rev = text.chars().rev().collect::<String>();
                ctx.text(rev);
            },
            Ok(ws::Message::Binary(bin)) => {
                let mut rev = bin.to_vec();
                rev.reverse();
                ctx.binary(rev);
            }
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            },
            _ => ctx.stop(),
        }
    }
}

#[get("/ws-rev")]
async fn ws_rev(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::start(WsRev {}, &req, stream)
}

// App is a template soup, too hard as a proper function
macro_rules! get_app {
    () => {
        App::new()
            .service(hello)
            .service(ws_echo)
            .service(ws_rev)
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    HttpServer::new(|| {
            get_app!()
            .wrap(Logger::default())
    })
        .bind(("0.0.0.0", 3030))?
        .run()
        .await
}
