FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# --- CORREÇÃO AQUI ---
# Isso diz ao Python: "A raiz de todos os imports é a pasta /app"
ENV PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Comando para rodar
CMD ["python", "src/main.py"]