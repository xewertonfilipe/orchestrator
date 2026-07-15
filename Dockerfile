FROM node:22.22.3-alpine3.24 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG BUILD_PROFILE=production
RUN if [ "$BUILD_PROFILE" = "container-local" ]; then npm run build:container; else npm run build; fi

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]