ARG RUNTIME_IMAGE=quay.io/hummingbird/nginx:latest-builder
ARG CLASSIFICATION=UNCLASSIFIED
ARG CLASSIFICATION_LABEL=CUI

FROM ${RUNTIME_IMAGE}
ARG CLASSIFICATION
ARG CLASSIFICATION_LABEL

LABEL org.opencontainers.image.title="DoD Classification Banner Injection" \
      classification="${CLASSIFICATION}"

USER root

COPY --chmod=+x nginx/docker-entrypoint.sh /docker-entrypoint.sh
COPY --chmod=+x nginx/docker-entrypoint.d/ /docker-entrypoint.d/

# Add Classification Banner Support
COPY banners/ /usr/share/nginx/html/banner/
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/banner.conf.template /etc/nginx/templates/

RUN dnf install -y --setopt=install_weak_deps=False \
    awk \
    sed \
    find \
    envsubst && \
    dnf clean all && \
    rm -rf /var/cache/dnf && \
    rm -rf /etc/nginx/conf.d/default.conf && \
    cp /etc/nginx/mime.types.default /etc/nginx/mime.types && \
    chown -R nginx:nginx /etc/nginx/ && \
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

ENV PROXY_HOST="127.0.0.1"
ENV PROXY_PORT="8080"
ENV LISTEN_PORT="9999"
ENV APP_INDEX="^/(?:index.html)?$"
ENV INJECTION_TARGET="</head>"
ENV INJECTION='<script src="/banner/banner.js"></script><link rel="stylesheet" href="/banner/banner.css">'

RUN printf '%s\n%s\n' \
    "${CLASSIFICATION}" \
    "${CLASSIFICATION_LABEL}" \
    > /usr/share/nginx/html/banner/banner-classification

USER nginx
EXPOSE 9999
STOPSIGNAL SIGQUIT
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# Usage:
# grafana:
#     # Backend application
#     PROXY_PORT: 3000
#     # Application index to inject into
#     APP_INDEX: "^/(?:login)?$"
#     INJECTION_TARGET: "</head>"
#     INJECTION: '<script src="/banner/banner.js"></script><link rel="stylesheet" href="/banner/banner.css"><link rel="stylesheet" href="/banner/grafana-banner.css">'
# dbgate:
#     PROXY_PORT: 3000
#     # Application index to inject into
#     APP_INDEX: "^/(?:login.html)?$"
#     # What gets injected into the application's HTML
#     INJECTION_TARGET: "</head>"
#     INJECTION: '<script src="banner/banner.js"></script><script src="banner/dbgate.js"></script><link rel="stylesheet" href="banner/banner.css">'
