# --- Estágio 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Instala tudo para conseguir fazer o build
RUN npm install 
COPY . .
# Gera a pasta /dist
RUN npm run build 

# --- Estágio 2: Dependências de Produção (Passo extra para limpar) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Instala APENAS o necessário para rodar (omite devDependencies)
RUN npm install --only=production

# --- Estágio 3: Production ---
FROM node:20-alpine
WORKDIR /app

# Copia as dependências limpas do estágio 2
COPY --from=deps /app/node_modules ./node_modules
# Copia o build do estágio 1
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

# Dica: O Nest geralmente gera um arquivo main.js. 
# O comando explícito costuma ser dist/main.js
CMD ["node", "dist/main.js"]