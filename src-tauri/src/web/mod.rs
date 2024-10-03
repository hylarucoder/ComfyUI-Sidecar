use axum::body::Body;
use axum::http::Request;
use axum::routing::{get, post};
use serde::Deserialize;
use tower_http::services::{ServeDir, ServeFile};
use hyper::Uri;
use std::path;
use axum::{
    http::{StatusCode},
    response::Response,
    Json,
    Router,
};
use axum::extract::{Path, State};
use axum::handler::HandlerWithoutStateExt;
use axum::response::IntoResponse;
use hyper_util::client::legacy::connect::HttpConnector;
use hyper_util::rt::TokioExecutor;
use tower::ServiceExt;

#[derive(Deserialize)]
struct AppSession {
    event_type: String,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

type Client = hyper_util::client::legacy::Client<HttpConnector, Body>;


const STATIC_RESOURCE_PATH: &str = "/Users/lucasay/Projects/project-aigc/ComfyUI/web";
const STATIC_EXTENSIONS: [&str; 8] = [".js", ".css", ".jpg", ".png", ".gif", ".svg", ".map", ".json"];

async fn proxy_home(State(client): State<Client>, Path(path): Path<String>, mut req: Request<Body>) -> Result<Response<Body>, StatusCode> {
    let uri = req.uri().clone();
    let path_query = uri.path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(&path);

    let uri = format!("http://127.0.0.1:8188{}", path_query);
    *req.uri_mut() = Uri::try_from(uri.clone()).unwrap();
    println!("uri: {}", uri);

    Ok(client
        .request(req)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
        .into_response())
}

async fn proxy_handler(State(client): State<Client>, Path(path): Path<String>, mut req: Request<Body>) -> Result<Response, StatusCode> {
    let uri = req.uri().clone();
    let path_query = uri.path_and_query()
        .map(|v| v.as_str());

    if !path.starts_with("/api") {
        for ext in &STATIC_EXTENSIONS {
            if path.ends_with(ext) {
                let static_file_path = path::Path::new(STATIC_RESOURCE_PATH).join(&path[1..]);
                if static_file_path.exists() {
                    return ServeFile::new(static_file_path)
                        .oneshot(req)
                        .await
                        .map(|response| response.into_response())
                        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR);
                }
            }
        }
    }

    let uri = format!("http://127.0.0.1:8188");
    *req.uri_mut() = Uri::try_from(uri.clone()).unwrap();
    println!("uri: {}", uri.clone());

    Ok(client
        .request(req)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
        .into_response())
}


pub fn get_routes() -> Router {
    let client: Client =
        hyper_util::client::legacy::Client::<(), ()>::builder(TokioExecutor::new())
            .build(HttpConnector::new());
    let router = Router::new()
        .nest_service("/", ServeFile::new(format!("{}/index.html", STATIC_RESOURCE_PATH)))
        .nest_service(
            "/assets", ServeDir::new(format!("{}/assets", STATIC_RESOURCE_PATH)),
        )
        .nest_service(
            "/scripts", ServeDir::new(format!("{}/scripts", STATIC_RESOURCE_PATH)),
        )
        .route("/api", get(proxy_handler).post(proxy_handler.clone()))
        .with_state(client);
    return router;
}

