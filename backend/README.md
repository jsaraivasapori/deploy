# 🌤️ Backend - Monitoramento Climático & Gestão

API robusta construída com **NestJS**, seguindo arquitetura modular e padrões de projeto sólidos para suportar uma aplicação de monitoramento climático com IA.

## 🛠️ Stack Tecnológica

- **Framework:** NestJS (Node.js)
- **Database:** MongoDB (via Mongoose)
- **Autenticação:** Passport.js + JWT (JSON Web Tokens)
- **IA Generativa:** Google Gemini 1.5 Flash (via `@google/generative-ai`)
- **Cache:** Cache Manager (In-Memory)
- **Testes:** Jest (Unitários & Mocks)
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
│   ├── tests/        # Testes unitários do módulo
│   └── ...
├── weather/        # Núcleo de Clima
│   ├── repositories/ # Camada de acesso a dados (IWeatherRepository)
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

## 🧪 Testes e Qualidade

O projeto possui uma suíte de testes unitários robusta utilizando **Jest**. A estratégia foca no isolamento total da lógica de negócio.

### Estratégia de Mocks

Os testes não dependem de banco de dados real nem de APIs externas. Todas as dependências são mockadas:

- **Repositórios:** `mockUsersRepository`, `mockWeatherRepository` simulam o banco.
- **Cache:** `mockCacheManager` verifica se o `.clear()` é chamado corretamente.
- **Config:** `mockConfigService` fornece chaves de API falsas para teste.
- **External APIs:** `global.fetch` é mockado para testar o módulo Star Wars sem internet.

### Cobertura dos Serviços

1.  **`UsersService`:** Valida hash de senha (bcrypt), unicidade de e-mail e regras de criação de admin.
2.  **`WeatherService`:** Testa a transformação de dados, integração simulada com IA e geração de CSV.
3.  **`AuthService`:** Garante que a validação de senha e emissão de JWT estão corretas.
4.  **`StarWarsService`:** Valida o tratamento de erros HTTP e paginação da API externa.

### Comandos de Teste

```
# Rodar todos os testes
npm run test

# Modo "Watch" (Desenvolvimento)
npm run test:watch

# Relatório de Cobertura (Coverage)
npm run test:cov

```

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
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/gdash
    RABBITMQ_URI=amqp://user:password@rabbitmq:5672
    JWT_SECRET=seu_segredo_super_secreto
    GEMINI_API_KEY=sua_chave_do_google_ai_studio
    DEFAULT_ADMIN_EMAIL=admin@gdash.com
    DEFAULT_ADMIN_PASSWORD=admin1234




    ```
