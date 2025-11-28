# --- Estágio 1: Build ---
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copia dependências
COPY go.mod go.sum ./
RUN go mod download

# Copia o código
COPY . .

# Compila o binário estático
# CGO_ENABLED=0 é vital para rodar no Alpine
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# --- Estágio 2: Rodar ---
FROM alpine:latest

WORKDIR /app

# Copia o executável especificamente para /app/main
COPY --from=builder /app/main /app/main
COPY --from=builder /app/.env /app/.env

# Dá permissão de execução (garantia extra)
RUN chmod +x /app/main

# Comandos de execução usando CAMINHO ABSOLUTO
# Isso evita o erro "file not found"
CMD ["/app/main"]