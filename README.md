# 🚀 Guia de Deploy: Arquitetura Microservices (Go, Python, NestJS, React)

Este guia cobre a implantação da aplicação utilizando **Docker Compose** e **Nginx (Proxy Reverso)** em uma VPS Linux (Ubuntu/Debian).

---

## 1. Estrutura de Pastas Necessária

Certifique-se de que sua VPS tenha esta estrutura exata:

    /seu-projeto
    ├── docker-compose.yml
    ├── nginx/
    │   └── nginx.conf
    ├── backend/       (NestJS + Dockerfile + .env)
    ├── frontend/      (Vite + Dockerfile + .env)
    ├── collector/     (Python + Dockerfile + .env)
    └── worker/        (Go + Dockerfile + .env)

## 2. Configuração do Proxy (Nginx)

Crie o arquivo `nginx/nginx.conf`. Ele redireciona a porta 80 para o Front e Back.

    server {
    listen 80;
    server_name localhost;

    # Frontend (Vite)
    location / {
        proxy_pass http://frontend:5173;
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

## 3. Orquestração (Docker Compose)

Arquivo `docker-compose.yml` configurado para produção (portas fechadas, apenas Nginx exposto).

        version: '3.8'

    services:
      # --- Proxy Reverso (A única porta aberta) ---
      nginx:
        image: nginx:alpine
        container_name: app_proxy
        restart: always
        ports:
          - "80:80"
        volumes:
          - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
        depends_on:
          - frontend
          - backend
        networks:
          - app_network

      # --- Aplicações ---
      backend:
        build: ./backend
        container_name: app_backend
        restart: always
        env_file: ./backend/.env
        depends_on: [mongo, rabbitmq]
        networks: [app_network]

      frontend:
        build: ./frontend
        container_name: app_frontend
        restart: always
        env_file: ./frontend/.env
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

      # --- Infraestrutura ---
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

## 4. Variáveis de Ambiente

Você deve criar os arquivos `.env` manualmente na VPS (`nano pasta/.env`), pois eles não sobem via Git.

📄 `frontend/.env`
Como usamos Nginx, usamos caminho relativo (a API responde no mesmo domínio).

    # Não use localhost nem IP. Use apenas o caminho relativo por causa da implementação do proxyreverso.

VITE_BACKEND_API_URL=/api/v1
VITE_AUTO_REFRESH_INTERVAL=3600000 (1 hora / 3600 segundos)

📄 `backend/.env`
O backend fala com a infra pelos nomes dos containers.

    PORT=3000
    MONGO_URI=mongodb://mongo:27017/gdash
    RABBITMQ_URI=amqp://admin:admin@rabbitmq:5672
    GEMINI_API_KEY=SUA_CHAVE_AQUI
    # Ajuste o CORS para aceitar o IP da VPS ou '*', porém evite essa última opção.

📄 `worker/.env`
O Worker fala direto com o Backend (bypass no Nginx, rede interna).

    RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672/
    QUEUE_NAME=weather_data
    API_URL=http://backend:3000/api/v1/weather/logs

📄 `collector/.env`

    LATITUDE=-16.4341
    LONGITUDE=-43.5154
    COLLECT_INTERVAL= 900 # (15 minutos) mude conforme necessidade
    RABBITMQ_HOST=rabbitmq
    RABBITMQ_PORT=5672
    RABBITMQ_USER=admin
    RABBITMQ_PASS=admin
    QUEUE_NAME=weather_data

## 5. Checklist de Firewall VPS / Cloud

Configure o Firewall da sua nuvem para aceitar tráfego **APENAS** nestas portas:
|TCP | Porta | Finalidade|
|--|--|--|
| TCP | 80 |HTTP (Acesso ao Site/API) |
|TCP|443|HTTPS (Futuro SSL)|
|TCP| 22 |SSH (Seu acesso administrativo)|

🔴 **Bloqueie:** 3000, 5173, 27017, 5672, 15672 (Acesso externo proibido).

## 6. Comandos de Operação

Iniciar / Atualizar tudo:

    Bash
    docker compose up -d --build

Atualizar apenas um serviço (ex: Backend):

    Bash
    docker compose up -d --build backend

Ver Logs (Debug):

    Bash

    # Ver tudo
    docker compose logs -f

    # Ver logs específicos (ex: Nginx e Backend)
    docker compose logs -f nginx backend

Limpeza (Se o disco encher):

    Bash
    docker system prune -f

**Dica Extra:** Se precisar acessar o MongoDB ou RabbitMQ visualmente, não abra as portas na nuvem! Use um **Túnel SSH** na sua máquina local: `ssh -L 27017:localhost:27017 usuario@ip-da-vps`
