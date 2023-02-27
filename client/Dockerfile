FROM node:16 as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --production --frozen-lockfile
RUN yarn run build

FROM nginx
COPY --from=build /home/node/app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/
