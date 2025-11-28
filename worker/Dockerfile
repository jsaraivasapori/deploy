# --- Estágio 1: Build ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Baixa dependências
COPY go.mod go.sum ./
RUN go mod download

# Copia código e compila
COPY . .
RUN go build -o worker-binary main.go

# --- Estágio 2: Runtime (Imagem final leve) ---
FROM alpine:latest

WORKDIR /root/

# Copia apenas o binário compilado do estágio anterior
COPY --from=builder /app/worker-binary .
# Copia o .env se necessário, mas idealmente usa-se variaveis de ambiente do docker-compose

# Comando de execução
CMD ["./worker-binary"]