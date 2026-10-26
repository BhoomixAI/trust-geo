# TRUST-GEO: one container serving the React app and the Python API.

# 1. Build the React frontend
FROM node:22-slim AS web
WORKDIR /web
COPY FRONTEND/package.json FRONTEND/package-lock.json ./
RUN npm ci
COPY FRONTEND/ ./
RUN npm run build

# 2. Python backend that also serves the built frontend
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
COPY data ./data
COPY --from=web /web/dist ./FRONTEND/dist

# Render (and most hosts) provide PORT; default to 8000 for local `docker run`.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "python -m backend.server --host 0.0.0.0 --port ${PORT}"]
