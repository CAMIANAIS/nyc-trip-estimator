# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:8000
ARG VITE_USE_MOCK=true
ENV VITE_API_URL=$VITE_API_URL VITE_USE_MOCK=$VITE_USE_MOCK
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Static client output (adjust if your build target outputs to a different folder)
COPY --from=build /app/dist/client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
