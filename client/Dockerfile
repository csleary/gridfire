FROM node:16-slim as build
WORKDIR /home/node/app
COPY .env.production package.json yarn.lock tsconfig.json ./
COPY public/ ./public/
COPY src/ ./src/

RUN yarn install --production --frozen-lockfile
RUN yarn run build

FROM nginx
COPY --from=build /home/node/app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/
