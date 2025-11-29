# 🚀 Guia de Deploy: Arquitetura Microservices (Go, Python, NestJS, React)

Este guia cobre a implantação da aplicação utilizando **Docker Compose** e **Nginx (Proxy Reverso)** em uma VPS Linux (Ubuntu/Debian).

---

## 0. Instalação do Docker (VPS Nova) Se a sua VPS acabou de ser criada, rode estes comandos para instalar o Docker Engine e o Plugin do Compose atualizados.

    # 1. Atualize os pacotes do sistema sudo apt update && sudo apt upgrade -y
    # 2. Instale o Docker usando o script oficial de conveniência curl -fsSL [https://get.docker.com](https://get.docker.com) -o get-docker.sh sudo sh get-docker.sh
    # 3. Adicione seu usuário ao grupo do Docker (Para não precisar usar 'sudo' sempre) sudo usermod -aG docker $USER
    # 4. Ative as alterações de grupo (Ou deslogue e logue novamente) newgrp docker
    # 5. Teste se instalou corretamente docker compose version # Deve retornar algo como: Docker Compose version v2.x.x

## 1. Estrutura de Pastas Necessária

Certifique-se de que sua VPS tenha esta estrutura exata:

     /seu-projeto
    ├── docker-compose.yml
    ├── nginx/
    │   └── nginx.conf          (Proxy Principal)
    ├── backend/
    │   ├── Dockerfile
    │   └── .env
    ├── frontend/
    │   ├── Dockerfile          (Multi-Stage: Node -> Nginx)
    │   ├── nginx-custom.conf   (Config interna do SPA)
    │   └── .env
    ├── collector/ ...
    └── worker/ ...

## 2. Configuração do Frontend

Para performance, não usamos o Vite Dev Server na VPS. Usamos um **Nginx interno** para servir os arquivos estáticos compilados.

    # Estágio 1: Build (Compilação)
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    # Estágio 2: Servidor Leve (Produção)
    FROM nginx:alpine
    RUN rm /etc/nginx/conf.d/default.conf
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]

📄 `frontend/nginx-custom.conf` (Crie este arquivo!)
Necessário para o React (SPA) não dar erro 404 ao atualizar a página.

    server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

}

## 3. Configuração do Proxy Principal

O Proxy é quem recebe as requisições da internet. Arquivo: `nginx/nginx.conf`

        server {
    listen 80;
    server_name localhost;

    # Frontend (Agora aponta para a porta 80 interna)
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend (API)
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

}

## 4. Orquestração (docker-compose.yml)

Versão final blindada. Apenas o Proxy tem porta aberta.

     version: '3.8'

    services:
      # --- Proxy Reverso (Porta de Entrada) ---
      nginx:
        image: nginx:alpine
        container_name: app_proxy
        restart: always
        ports:
          - "80:80" # ÚNICA porta aberta para o mundo
        volumes:
          - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
        depends_on:
          - frontend
          - backend
        networks:
          - app_network

      # --- Aplicações ---

      frontend:
        build: ./frontend
        container_name: app_frontend
        restart: always
        # SEM PORTAS EXPOSTAS (O Proxy acessa internamente)
        env_file: ./frontend/.env
        networks: [app_network]

      backend:
        build: ./backend
        container_name: app_backend
        restart: always
        env_file: ./backend/.env
        depends_on: [mongo, rabbitmq]
        networks: [app_network]

      collector:
        build: ./collector
        container_name: app_collector
        restart: always
        env_file: ./collector/.env
        depends_on: [rabbitmq]
        networks: [app_network]

      worker:
        build: ./worker
        container_name: app_worker
        restart: always
        env_file: ./worker/.env
        depends_on: [rabbitmq, backend]
        networks: [app_network]

      # --- Infraestrutura (Banco e Fila) ---

      mongo:
        image: mongo:latest
        container_name: app_mongo
        restart: always
        volumes: [mongo_data:/data/db]
        networks: [app_network]

      rabbitmq:
        image: rabbitmq:3-management
        container_name: app_rabbitmq
        restart: always
        environment:
          - RABBITMQ_DEFAULT_USER=admin
          - RABBITMQ_DEFAULT_PASS=admin
        networks: [app_network]

    volumes:
      mongo_data:

    networks:
      app_network:
        driver: bridge

## 5. Variáveis de Ambiente

Crie os arquivos manualmente na VPS (`nano pasta/.env`).

**📄 `frontend/.env`**

     #Caminho relativo (o Proxy resolve)
     VITE_BACKEND_API_URL=/api/v1
     VITE_AUTO_REFRESH_INTERVAL=3600000 # 1 horas | ajuse conforme a necessidade em ms.

**📄 `backend/.env`**

    PORT=3000
    MONGO_URI=mongodb://mongo:27017/gdash
    RABBITMQ_URI=amqp://admin:admin@rabbitmq:5672
    GEMINI_API_KEY=SUA_CHAVE_AQUI
    # DICA: Se usar Nginx, pode aceitar qualquer origem ou o IP da VPS
    # CORS_ORIGIN=* ```

**📄 worker/.env**

    RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672/
    QUEUE_NAME=weather_data API_URL=http://backend:3000/api/v1/weather/logs

**📄 `collector/.env`**

    LATITUDE=-16.4341
    LONGITUDE=-43.5154
    COLLECT_INTERVAL= 900 # 15 minutos | ajuste conforme necessidade em segundos.
    RABBITMQ_HOST=rabbitmq
    RABBITMQ_PORT=5672
    RABBITMQ_USER=admin
    RABBITMQ_PASS=admin
    QUEUE_NAME=weather_data

## 6. Operação e Firewall

### Firewall (Cloud)

Libere **APENAS**:

- TCP 80 (HTTP)
- TCP 443 (HTTPS)
- TCP 22 (SSH)

**Comandos Úteis**

    # Subir tudo (reconstruindo imagens)
    docker compose up -d --build

    # Ver logs
    docker compose logs -f

    # Limpar espaço em disco
    docker system prune -f

## 7. Acessando a Aplicação

Basta acessar `http://SEU_IP_DA_VPS` (sem porta).

## 8. Dica Extra

Se precisar acessar o MongoDB ou RabbitMQ visualmente, não abra as portas na nuvem! Use um **Túnel SSH** na sua máquina local: `ssh -L 27017:localhost:27017 usuario@ip-da-vps`
