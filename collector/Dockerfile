# Imagem base leve do Python
FROM python:3.10-slim

# Define diretório de trabalho
WORKDIR /app

# --- MELHORIA AQUI ---
# Garante que os logs (prints) apareçam imediatamente no console do Docker
ENV PYTHONUNBUFFERED=1

# Copia dependências e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte
COPY . .

# Comando de execução
CMD ["python", "-m", "src.main"]