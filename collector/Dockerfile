# Imagem base leve do Python
FROM python:3.10-slim

# Define diretório de trabalho
WORKDIR /app

# Copia dependências e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte
COPY . .

# Comando de execução
CMD ["python", "-m", "src.main"]