FROM node:26-alpine
WORKDIR /app
# package.json declares "pg" as an OPTIONAL dependency (PostgreSQL mode) and
# jsdom as a devDependency (tests). npm install --omit=dev keeps both out of
# the SQLite-only runtime; the default image stays zero-dependency.
COPY package.json server.js ./
COPY store ./store
COPY public ./public
# Non-root: процессу достаточно прав на /data.
RUN chown -R node:node /app && mkdir -p /data && chown node:node /data
USER node
ENV KANBAN_PORT=3100 KANBAN_DATA=/data
VOLUME /data
EXPOSE 3100
CMD ["node", "server.js"]