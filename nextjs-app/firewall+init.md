# Solo estos puertos al mundo exterior

ufw allow 3000/tcp # Tu app
ufw allow 9001/tcp # MinIO console (opcional)

cd /ruta/de/tu/app
docker-compose up -d

# Crear el bucket

docker-compose exec minio /bin/sh -c "mc alias set minio http://localhost:9000 minioadmin minioadmin && mc mb minio/vizapp"
