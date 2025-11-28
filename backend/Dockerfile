# --- Estágio 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código e faz o build
COPY . .
RUN npm run build

# --- Estágio 2: Production ---
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário para rodar
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expõe a porta
EXPOSE 3000

# Comando de execução
CMD ["node", "dist/main"]