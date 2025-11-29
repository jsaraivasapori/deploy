# 🌤️ Backend - Monitoramento Climático & Gestão

API robusta construída com **NestJS**, seguindo arquitetura modular e padrões de projeto sólidos para suportar uma aplicação de monitoramento climático com IA.

## 🛠️ Stack Tecnológica

- **Framework:** NestJS (Node.js)
- **Database:** MongoDB (via Mongoose)
- **Autenticação:** Passport.js + JWT (JSON Web Tokens)
- **IA Generativa:** Google Gemini 1.5 Flash (via `@google/generative-ai`)
- **Cache:** Cache Manager (In-Memory)
- **Documentação:** Swagger (OpenAPI)
- **Validação:** Class-validator & Class-transformer

## 🏗️ Arquitetura e Padrões

O projeto segue uma arquitetura modular com **Repository Pattern** para desacoplamento do banco de dados.

### Estrutura de Pastas (Exemplo Modular)

```
src/
├── auth/           # Autenticação e Guards
├── users/          # Gestão de Usuários
│   ├── repositories/ # Camada de acesso a dados (IUsersRepository)
│   ├── dto/
│   └── ...
├── weather/        # Núcleo de Clima
│   ├── repositories/ # Camada de acesso a dados (IWeatherRepository)
│   ├── entities/
│   └── ...
└── star-wars/      # Integração externa (SWAPI)

```

### Destaques da Implementação

1.  **Repository Pattern:**
    - Os _Services_ não dependem diretamente do Mongoose (`Model<T>`).
    - Dependem de interfaces (`IUsersRepository`, `IWeatherRepository`).
    - Facilita testes e troca futura de banco de dados (ex: MongoDB -> PostgreSQL).

2.  **Estratégia de Cache (Cache-Aside):**
    - **Leitura Rápida:** Rotas `GET` (listagens, insights) são cacheadas na memória (TTL configurável).
    - **Invalidação Inteligente:** Sempre que um dado é criado (`POST`), atualizado (`PATCH`) ou deletado (`DELETE`), o cache do módulo é invalidado (`.clear()`) para garantir consistência imediata.

3.  **Inteligência Artificial (Gemini):**
    - Analisa os últimos 10 registros climáticos.
    - Gera insights de texto, alertas e **previsões numéricas** para a próxima hora.
    - Retorna JSON estruturado garantido via prompt engineering.

## 🚀 Módulos Principais

### 1. Auth Module

- Login seguro com comparação de hash (bcrypt).
- Emissão de Token JWT com Payloads customizados (`sub`, `role`).

### 2. Users Module (CRUD)

- Criação de usuários (Admin/User).
- Listagem e Edição.
- **Regra de Negócio:** Impede duplicação de e-mail e garante hash de senha antes de salvar.

### 3. Weather Module

- **Ingestão:** Recebe dados de coletores externos (Go/Python).
- **Análise:** Endpoint `/insights` consome a API do Gemini.
- **Exportação:** Gera relatórios `.csv` e `.xlsx` sob demanda usando Streams.

### 4. Star Wars Module

- Proxy para a SWAPI (Star Wars API).
- Encapsula a lógica de fetch externa para evitar CORS no frontend.

## 📦 Como Rodar

1.  Configure o `.env`:

    ```
    # Porta da API (Interna do container)
    PORT=3000

    # Conexão com o MongoDB
    MONGO_URI=mongodb://mongo:27017/gdash

    # Conexão com RabbitMQ

    RABBITMQ_URI=amqp://user:password@rabbitmq:5672

    # Segredos e Chaves
    JWT_SECRET=SegredoSuperSecretoDoGdash123
    GEMINI_API_KEY=AIzaSyC2I9TNbGsSXdW-0GCSyFBAn6hQ371a3-g #ou gere a sua. se for exporta e preciso gerar outra

    # Admin Padrão
    DEFAULT_ADMIN_EMAIL=admin@gdash.com
    DEFAULT_ADMIN_PASSWORD=admin1234

    ```
