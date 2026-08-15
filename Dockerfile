ARG RUNTIME_IMAGE=quay.io/hummingbird/nginx:latest-builder


FROM ${RUNTIME_IMAGE}

LABEL org.opencontainers.image.title="DoD Classification Banner Injection"

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
    chown nginx:nginx /usr/share/nginx/html/banner/banner-classification


ENV BACKEND_HOST="127.0.0.1"
ENV BACKEND_PORT="8080"
ENV LISTEN_PORT="9999"
ENV INJECT_PATH_REGEX="^/(?:index.html)?$"
ENV INJECT_BEFORE="</head>"
ENV CLASSIFICATION="UNAVAILABLE"
ENV CLASSIFICATION_LABEL=""

USER nginx
EXPOSE 9999
STOPSIGNAL SIGQUIT
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
