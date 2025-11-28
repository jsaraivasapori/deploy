# --- Estágio 1: Build do React ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código e builda (Gera a pasta dist)
COPY . .
# Argumento de build para a URL da API (pode ser sobrescrito)
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Estágio 2: Servidor Nginx ---
FROM nginx:alpine

# Remove configurações padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa configuração
COPY nginx.conf /etc/nginx/conf.d

# Copia os arquivos estáticos gerados pelo React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]