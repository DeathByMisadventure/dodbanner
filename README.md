# DoD Classification Banner Injection Proxy

A lightweight, zero-application-modification Nginx reverse proxy that automatically injects standard Department of Defense (DoD) classification banners (top and/or bottom) into the HTML of any web application.

Ideal for air-gapped, classified, or CUI environments where every web UI must display the current classification level without requiring changes to the upstream application.

---

## Goal

Many DoD and federal systems require a persistent visual classification banner on every page of every web application. Most commercial or open-source tools (Grafana, MinIO, DbGate, Kafka UI, etc.) do not provide this out of the box.

`dodbanner` solves this by sitting in front of the application as a transparent reverse proxy. It:

- Serves the original application unchanged for all non-HTML requests
- Intercepts the main HTML entry point(s)
- Injects a small amount of JavaScript + CSS that renders the correct classification banner
- Adjusts layout for known applications so the banners do not overlap critical UI elements

The result is a standards-compliant classification banner with almost no operational overhead.

---

## How It Works

1. Nginx listens on a configurable port (default `9999`).
2. All traffic is proxied to the real application (`PROXY_HOST`:`PROXY_PORT`).
3. When a request matches the `APP_INDEX` regular expression (the main HTML page / login page / SPA entry point), Nginx uses `sub_filter` to inject a `<script>` and `<link>` into the HTML (by default right before `</head>`).
4. The injected `banner.js` fetches:
   - Current classification + caveats (`banner-classification`)
   - Color/style definitions (`banner-levels.json`)
   - Display options (`banner-options.json`)
5. Banners are rendered as fixed-position elements at the top and/or bottom of the viewport.
6. Optional application-specific CSS/JS (Grafana, DbGate, MinIO, Kafbat, etc.) adjusts padding, headers, and sidebars so content is not obscured.

The proxy is completely transparent to the application. No cookies, no session changes, no backend modifications.

---

## Quick Start

### Build the image

```bash
docker build -f Dockerfile.nginx-banner -t dodbanner:latest .
```

### Run it

```bash
docker run -d \
  --name dodbanner \
  -p 9999:9999 \
  -e PROXY_HOST=my-app \
  -e PROXY_PORT=3000 \
  -e LISTEN_PORT=9999 \
  -e APP_INDEX='^/(?:index.html)?$' \
  dodbanner:latest
```

Point users at `http://your-host:9999` instead of the original application port.

---

## Environment Variable Configuration

All configuration is done via environment variables (substituted into the Nginx template at container start).

| Variable            | Default                          | Description |
|---------------------|----------------------------------|-------------|
| `PROXY_HOST`        | `127.0.0.1`                      | Upstream application hostname or container name |
| `PROXY_PORT`        | `8080`                           | Upstream application port |
| `LISTEN_PORT`       | `9999`                           | Port the banner proxy listens on |
| `APP_INDEX`         | `^/(?:index.html)?$`             | **Regex** that matches the HTML page(s) that should receive the banner injection |
| `INJECTION_TARGET`  | `</head>`                        | String that `sub_filter` looks for |
| `INJECTION`         | `<script src="/banner/banner.js"></script><link rel="stylesheet" href="/banner/banner.css">` | Exact HTML snippet that is injected |

### Build-time arguments (Dockerfile)

| ARG                   | Default        | Description |
|-----------------------|----------------|-------------|
| `RUNTIME_IMAGE`       | `quay.io/hummingbird/nginx:latest-builder` | Base image |
| `CLASSIFICATION`      | `UNCLASSIFIED` | Written into `/usr/share/nginx/html/banner/banner-classification` |
| `CLASSIFICATION_LABEL`| `CUI`          | Optional second line (caveat / dissemination control) |

You can override classification at runtime by mounting a file over `/usr/share/nginx/html/banner/banner-classification`.

---

## Classification & Banner Appearance

### `banner-classification` (plain text)

```text
UNCLASSIFIED
FOUO
```

- First line → classification level (must match a key in `banner-levels.json`)
- Subsequent lines → caveats / dissemination controls (joined with ` // `)

### `banner-levels.json`

Defines colors and display text for each classification:

```json
{
  "levels": {
    "UNCLASSIFIED": {
      "text": "UNCLASSIFIED",
      "backgroundColor": "#007A33",
      "textColor": "#FFFFFF"
    },
    "CUI": {
      "text": "CONTROLLED UNCLASSIFIED INFORMATION",
      "backgroundColor": "#502B85",
      "textColor": "#FFFFFF"
    },
    "CONFIDENTIAL": { ... },
    "SECRET": { ... },
    "TOP SECRET": { ... }
  }
}
```

### `banner-options.json`

Controls layout and styling:

```json
{
  "showTopBanner": true,
  "showBottomBanner": true,
  "bannerHeight": "28px",
  "fontFamily": "Arial, Helvetica, sans-serif",
  "fontSize": "18px",
  "fontWeight": "bold",
  "zIndex": 99999,
  "application": "",
  "appendApplication": false
}
```

---

## Application-Specific Examples

The repository already contains tuned injection snippets and layout helpers for several common tools.

### Grafana

```yaml
environment:
  PROXY_PORT: "3000"
  APP_INDEX: "^/(?:login)?$"
  INJECTION_TARGET: "</head>"
  INJECTION: >
    <script src="/banner/banner.js"></script>
    <link rel="stylesheet" href="/banner/banner.css">
    <link rel="stylesheet" href="/banner/grafana-banner.css">
```

`grafana-banner.css` adds padding and shifts the mega-menu so it sits below the top banner.

### DbGate

```yaml
environment:
  PROXY_PORT: "3000"
  APP_INDEX: "^/(?:login.html)?$"
  INJECTION: >
    <script src="/banner/banner.js"></script>
    <script src="/banner/dbgate-banner.js"></script>
    <link rel="stylesheet" href="/banner/banner.css">
```

`dbgate-banner.js` dynamically adjusts `--dim-header-top` and `--dim-statusbar-height` CSS variables so the UI respects both banners.

### MinIO Console

```yaml
environment:
  PROXY_PORT: "9001"
  APP_INDEX: "^/(?:)$"
  INJECTION: >
    <script src="/banner/banner.js"></script>
    <link rel="stylesheet" href="/banner/banner.css">
    <link rel="stylesheet" href="/banner/minio-banner.css">
```

### Kafbat / Kafka UI

```yaml
environment:
  PROXY_PORT: "8080"
  APP_INDEX: "^/(?!api|actuator|static|assets|.*\\.(js|css|png|jpg|svg|ico|woff2?)$).*$"
  INJECTION: >
        <script src="/banner/banner.js"></script>
        <link rel="stylesheet" href="/banner/banner.css">
        <link rel="stylesheet" href="/banner/kafbat-banner.css">
```

### Pgadmin

```yaml
environment:
  PROXY_PORT: "80"
  APP_INDEX: "^/(?:browser)?/?$"
  INJECTION: >
        <script src="/banner/banner.js"></script>
        <link rel="stylesheet" href="/banner/banner.css">
        <link rel="stylesheet" href="/banner/pgadmin-banner.css">
```

### SonarQube

```yaml
environment:
  PROXY_PORT: "9000"
  APP_INDEX: "^/(?!api|static|css|js|images|favicon|.*\\.(js|css|png|jpg|svg|ico|woff2?)$).*$"
  INJECTION: >
        <script src="/banner/banner.js"></script>
        <link rel="stylesheet" href="/banner/banner.css">
        <link rel="stylesheet" href="/banner/sonarqube-banner.css">
```

---

## Customizing for a New Application

1. Identify the HTML entry point (usually `/`, `/index.html`, `/login`, etc.).
2. Set `APP_INDEX` to a regex that matches only that page (or pages).
3. Decide where to inject (`</head>` is almost always correct).
4. If the application uses fixed headers/sidebars or `100vh` layouts, create a small CSS or JS helper (copy the pattern from the existing `*-banner.css` / `*-banner.js` files).
5. Mount the helper into `/usr/share/nginx/html/banner/` or rebuild the image.

Example for a generic SPA:

```bash
-e APP_INDEX='^/(?:index\.html)?$'
-e INJECTION='<script src="/banner/banner.js"></script><link rel="stylesheet" href="/banner/banner.css">'
```

---

## Architecture Notes

- Uses Nginx `sub_filter` (must disable upstream compression with `Accept-Encoding: ""`).
- Banner assets are served from `/banner/` (static files inside the container).
- Runs as non-root user `nginx`.
- Compatible with Red Hat Hummingbird / UBI-based images and standard Alpine/Debian Nginx images (with minor adjustments).
- The second Dockerfile (`Dockerfile.nginx`) is a hardened, multi-stage “secure Nginx” base that can be used as the foundation for the banner image.

---

## Security Considerations

- Classification is determined solely by the content of `banner-classification`. Treat that file (or the build ARG) as sensitive configuration.
- The proxy does **not** enforce classification; it only displays it. Access control remains the responsibility of the upstream application and network controls.
- All banner assets are public within the container; do not place secrets in them.

---

## Development & Extending

```text
banners/
├── banner.js              # Core banner renderer
├── banner.css             # Shared styles
├── banner-levels.json     # Classification → colors
├── banner-options.json    # Display options
├── banner-classification  # Current level + caveats
├── *-banner.css / .js     # Application-specific layout helpers
nginx/
├── banner.conf.template   # Main server block (env-substituted)
├── nginx.conf
└── docker-entrypoint.d/   # Standard Nginx entrypoint scripts
```

To add a new classification color or change the default height, edit the JSON files and rebuild (or mount them at runtime).

---
