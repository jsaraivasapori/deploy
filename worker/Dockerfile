# --- Estágio 1: Build ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Baixa dependências
COPY go.mod go.sum ./
RUN go mod download

# Copia código
COPY . .

# --- MELHORIA 1: Compilação Estática ---
# CGO_ENABLED=0: Garante que o binário não dependa de bibliotecas C do sistema (evita erro "file not found" no Alpine)
# GOOS=linux: Força o build para Linux (caso você rode o build de um Mac/Windows, por precaução)
RUN CGO_ENABLED=0 GOOS=linux go build -o worker-binary main.go

# --- Estágio 2: Runtime ---
FROM alpine:latest

# --- MELHORIA 2: Certificados SSL ---
# Necessário se o seu Worker fizer chamadas para APIs HTTPS externas
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copia apenas o binário compilado
COPY --from=builder /app/worker-binary .

# Comando de execução
CMD ["./worker-binary"]