use std::{
    env, fs,
    io::{Read, Write},
    net::TcpListener,
    path::{Path, PathBuf},
    process::{Command, exit},
};

fn run(program: &str, args: &[&str]) {
    let status = Command::new(program)
        .args(args)
        .status()
        .unwrap_or_else(|e| panic!("{program}: {e}"));
    if !status.success() {
        exit(status.code().unwrap_or(1));
    }
}
fn copy_dir(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            copy_dir(&path, &dst.join(entry.file_name()))?;
        } else {
            fs::copy(path, dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}
fn build() {
    run(
        "cargo",
        &[
            "build",
            "--release",
            "--target",
            "wasm32-unknown-unknown",
            "--package",
            "timecon",
            "--locked",
        ],
    );
    let dist = Path::new("dist");
    fs::create_dir_all(dist).unwrap();
    copy_dir(Path::new("public"), dist).unwrap();
    run(
        "wasm-bindgen",
        &[
            "--target",
            "web",
            "--no-typescript",
            "--out-dir",
            "dist/pkg",
            "target/wasm32-unknown-unknown/release/timecon.wasm",
        ],
    );
    let wasm = fs::read("dist/pkg/timecon_bg.wasm").unwrap();
    let mut hash = wasm.iter().fold(0xcbf29ce484222325u64, |h, b| {
        (h ^ u64::from(*b)).wrapping_mul(0x100000001b3)
    });
    fn hash_assets(dir: &Path, hash: &mut u64) {
        let mut entries: Vec<_> = fs::read_dir(dir)
            .unwrap()
            .map(|e| e.unwrap().path())
            .collect();
        entries.sort();
        for entry in entries {
            if entry.is_dir() {
                hash_assets(&entry, hash);
            } else {
                for byte in fs::read(entry).unwrap() {
                    *hash = (*hash ^ u64::from(byte)).wrapping_mul(0x100000001b3);
                }
            }
        }
    }
    hash_assets(Path::new("public"), &mut hash);
    let version = format!("v34-{hash:016x}");
    // The only authored JS is an ABI bootloader: both UI and service-worker logic run in Rust.
    fs::write("dist/boot.js", format!("import init from './pkg/timecon.js';\ninit().catch(error => {{ document.getElementById('main').textContent = 'Timecon failed to start: ' + error; console.error(error); }});\n// {version}\n")).unwrap();
    let mut assets = vec!["./".to_string()];
    fn collect(dir: &Path, root: &Path, assets: &mut Vec<String>) {
        for e in fs::read_dir(dir).unwrap() {
            let p = e.unwrap().path();
            if p.is_dir() {
                collect(&p, root, assets);
            } else {
                let name = p
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/");
                if !["sw.js", "asset-manifest.json", "CNAME"].contains(&name.as_str()) {
                    assets.push(name);
                }
            }
        }
    }
    collect(dist, dist, &mut assets);
    assets.sort();
    fs::write(
        "dist/asset-manifest.json",
        serde_json::to_string(&serde_json::json!({"version":version,"assets":assets})).unwrap(),
    )
    .unwrap();
    // Synchronous classic-worker import registers event handlers before install/fetch dispatch.
    run(
        "wasm-bindgen",
        &[
            "--target",
            "no-modules",
            "--no-typescript",
            "--out-dir",
            "target/worker-bindings",
            "target/wasm32-unknown-unknown/release/timecon.wasm",
        ],
    );
    let glue = fs::read_to_string("target/worker-bindings/timecon.js").unwrap();
    let worker_wasm = fs::read("target/worker-bindings/timecon_bg.wasm").unwrap();
    let bytes = worker_wasm
        .iter()
        .map(|b| b.to_string())
        .collect::<Vec<_>>()
        .join(",");
    let manifest =
        serde_json::to_string(&fs::read_to_string("dist/asset-manifest.json").unwrap()).unwrap();
    fs::write("dist/sw.js",format!("// Generated Rust/Wasm worker bootstrap. {version}\n{glue}\nself.TIMECON_ASSETS = {manifest};\nwasm_bindgen.initSync({{ module: new Uint8Array([{bytes}]) }});\n")).unwrap();
    fs::write("dist/.nojekyll", "").unwrap();
    println!("Built dist/ ({version}); cargo xtask serve to preview");
}
fn serve(port: &str) {
    let listener = TcpListener::bind(format!("127.0.0.1:{port}")).expect("bind preview port");
    println!("Timecon preview: http://127.0.0.1:{port}");
    for stream in listener.incoming() {
        let Ok(mut stream) = stream else { continue };
        let mut buf = [0u8; 8192];
        let Ok(n) = stream.read(&mut buf) else {
            continue;
        };
        let line = String::from_utf8_lossy(&buf[..n]);
        let uri = line
            .split_whitespace()
            .nth(1)
            .unwrap_or("/")
            .split('?')
            .next()
            .unwrap_or("/");
        if uri.contains("..") || uri.contains('\\') {
            continue;
        }
        let file = PathBuf::from("dist").join(if uri == "/" {
            "index.html"
        } else {
            uri.trim_start_matches('/')
        });
        let mime = match file.extension().and_then(|v| v.to_str()).unwrap_or("") {
            "html" => "text/html; charset=utf-8",
            "js" => "application/javascript",
            "wasm" => "application/wasm",
            "css" => "text/css",
            "json" | "webmanifest" => "application/json",
            "svg" => "image/svg+xml",
            "png" => "image/png",
            "jpg" => "image/jpeg",
            "woff2" => "font/woff2",
            _ => "application/octet-stream",
        };
        let (status, body) = match fs::read(file) {
            Ok(v) => ("200 OK", v),
            Err(_) => ("404 Not Found", b"Not found".to_vec()),
        };
        let header = format!(
            "HTTP/1.1 {status}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n",
            body.len()
        );
        let _ = stream.write_all(header.as_bytes());
        let _ = stream.write_all(&body);
    }
}
fn main() {
    env::set_current_dir(Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap()).unwrap();
    let args: Vec<_> = env::args().collect();
    match args.get(1).map(String::as_str) {
        Some("build") => build(),
        Some("serve") => serve(args.get(2).map(String::as_str).unwrap_or("8080")),
        _ => println!("cargo xtask build | cargo xtask serve [port]"),
    }
}
