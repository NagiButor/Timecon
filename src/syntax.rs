pub fn escape(src: &str) -> String {
    src.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
pub fn detect(src: &str) -> &'static str {
    let s = src.trim();
    let lower = s.to_lowercase();
    if s.is_empty() {
        ""
    } else if s.starts_with("<?php") {
        "php"
    } else if lower.starts_with("<!doctype") || lower.contains("</") {
        "html"
    } else if serde_json::from_str::<serde_json::Value>(s).is_ok() && s.starts_with(['{', '[']) {
        "json"
    } else if [
        "select ", "insert ", "update ", "create ", "delete ", "alter ", "drop ",
    ]
    .iter()
    .any(|k| lower.starts_with(k))
    {
        "sql"
    } else if s.contains("fn ") || s.contains("let mut ") || s.contains("use std::") {
        "rust"
    } else if s.starts_with("#!")
        || ["git ", "npm ", "sudo ", "cd ", "curl ", "docker "]
            .iter()
            .any(|k| s.starts_with(k))
    {
        "bash"
    } else if s.contains("def ") || s.contains("elif ") || s.contains("self.") {
        "python"
    } else if s.contains("interface ") || s.contains(": string") || s.contains(": number") {
        "ts"
    } else if s.contains("#include") || s.contains("System.out") || s.contains("using namespace") {
        "clike"
    } else if s.contains('{') && s.contains(':') && s.contains(';') && !s.contains("const ") {
        "css"
    } else {
        "js"
    }
}
pub fn highlight(src: &str, lang: &str) -> String {
    let lang = match lang {
        "c" | "cpp" | "c++" | "java" | "csharp" | "go" => "clike",
        "rs" => "rust",
        "javascript" => "js",
        "typescript" => "ts",
        "py" => "python",
        "sh" => "bash",
        v => v,
    };
    if ![
        "js", "ts", "python", "sql", "bash", "clike", "css", "html", "json", "php", "rust",
    ]
    .contains(&lang)
    {
        return escape(src);
    }
    let keywords = "const let mut var function fn return if else elif for while do loop break continue new class struct enum impl trait pub use mod crate self Self super this typeof instanceof in of try catch finally throw async await yield import export from default delete void switch case static get set interface type extends implements readonly namespace declare abstract as satisfies def lambda pass global nonlocal assert with raise except del is not and or int long short char float double bool boolean string public private protected final package using include define typedef unsigned signed select insert update create alter drop table where join left right inner outer on group by order having limit offset values into distinct count sum avg min max union all when then end primary key foreign references index unique check constraint echo print require foreach important media supports keyframes";
    let line = match lang {
        "python" | "bash" => "#",
        "sql" => "--",
        "json" | "html" | "css" => "",
        _ => "//",
    };
    let block = match lang {
        "html" => Some(("<!--", "-->")),
        "python" | "bash" | "json" => None,
        _ => Some(("/*", "*/")),
    };
    let mut out = String::new();
    let mut i = 0;
    while i < src.len() {
        let rest = &src[i..];
        let c = rest.chars().next().unwrap();
        let (end, class) = if !line.is_empty() && rest.starts_with(line) {
            (i + rest.find('\n').unwrap_or(rest.len()), "com")
        } else if let Some((open, close)) = block.filter(|(open, _)| rest.starts_with(open)) {
            (
                i + rest[open.len()..]
                    .find(close)
                    .map(|n| n + open.len() + close.len())
                    .unwrap_or(rest.len()),
                "com",
            )
        } else if c == '"' || (lang != "json" && (c == '\'' || c == '`')) {
            let mut end = i + c.len_utf8();
            let mut escaped = false;
            for (n, next) in src[end..].char_indices() {
                end = i + c.len_utf8() + n + next.len_utf8();
                if escaped {
                    escaped = false;
                    continue;
                }
                if next == '\\' {
                    escaped = true;
                } else if next == c {
                    break;
                }
            }
            let class = if lang == "json" && src[end..].trim_start().starts_with(':') {
                "key"
            } else {
                "str"
            };
            (end, class)
        } else if c.is_ascii_digit() {
            (
                i + rest
                    .char_indices()
                    .take_while(|(_, ch)| ch.is_ascii_hexdigit() || ".xXoObB_".contains(*ch))
                    .map(|(n, ch)| n + ch.len_utf8())
                    .last()
                    .unwrap_or(1),
                "num",
            )
        } else if c.is_alphabetic() || c == '_' || c == '$' {
            let len = rest
                .char_indices()
                .take_while(|(_, ch)| ch.is_alphanumeric() || "_$-".contains(*ch))
                .map(|(n, ch)| n + ch.len_utf8())
                .last()
                .unwrap_or(c.len_utf8());
            let word = &rest[..len];
            let lower = word.to_lowercase();
            let class = if [
                "true",
                "false",
                "null",
                "none",
                "undefined",
                "nan",
                "infinity",
            ]
            .contains(&lower.as_str())
            {
                "boo"
            } else if keywords
                .split_whitespace()
                .any(|k| if lang == "sql" { k == lower } else { k == word })
            {
                "kw"
            } else if rest[len..].trim_start().starts_with('(') {
                "fn"
            } else {
                ""
            };
            (i + len, class)
        } else if lang == "html" && c == '<' {
            (
                i + rest.find('>').map(|n| n + 1).unwrap_or(rest.len()),
                "tag",
            )
        } else {
            (i + c.len_utf8(), "")
        };
        let text = escape(&src[i..end]);
        if class.is_empty() {
            out.push_str(&text);
        } else {
            out.push_str(&format!("<span class=\"tok-{class}\">{text}</span>"));
        }
        i = end;
    }
    out
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn escapes_injected_markup() {
        assert!(!highlight("<script>alert('x')</script>", "js").contains("<script>"));
    }
    #[test]
    fn supports_unicode_and_rust() {
        assert!(highlight("let mut имя = \"текст\";", "rust").contains("tok-kw"));
        assert_eq!(detect("fn main() {}"), "rust");
    }
    #[test]
    fn detects_json() {
        assert_eq!(detect(r#"{"a":true}"#), "json");
    }
}
