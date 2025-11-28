# 1. Base image (mesma versão do back para consistência)
FROM node:20-alpine


# 2. Diretório de trabalho
WORKDIR /app

# 3. Instala dependências
COPY package*.json ./
RUN npm install

# 4. Copia o código fonte
COPY . .

# 5. Expõe a porta padrão do Vite
EXPOSE 5173

# 6. Roda em modo desenvolvimento
# O parâmetro '--host' é OBRIGATÓRIO para acessar via navegador fora do Docker
CMD ["npm", "run", "dev", "--", "--host"]