FROM nginx:1.26.0-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY ./api_gateway.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
