# Guía de Instalación y Despliegue - Lontso Fitness

## 📦 Contenido del Paquete

El archivo .zip contiene:

```
lontso-fitness-app/
├── backend/               # Backend FastAPI
├── frontend/              # Frontend React
├── README.md              # Documentación principal
├── INSTALLATION_GUIDE.md  # Esta guía
└── .gitignore
```

## 🖥️ Requisitos del Sistema

### Mínimos
- CPU: 2 cores
- RAM: 4GB
- Disco: 2GB libres
- SO: Linux, macOS, Windows 10+

### Software Necesario
- **Node.js**: v20.x ([Descargar](https://nodejs.org/))
- **Python**: 3.11+ ([Descargar](https://www.python.org/))
- **MongoDB**: 4.5+ ([Descargar](https://www.mongodb.com/try/download/community))
- **Yarn**: `npm install -g yarn`

## 🚀 Instalación Paso a Paso

### Paso 1: Extraer el Archivo

```bash
# Extraer el ZIP
unzip lontso-fitness-app.zip
cd lontso-fitness-app
```

### Paso 2: Instalar MongoDB

#### En Ubuntu/Debian:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### En macOS (con Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### En Windows:
- Descargar desde [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- Ejecutar el instalador
- MongoDB se ejecutará como servicio

Verificar instalación:
```bash
mongosh --eval "db.version()"
```

### Paso 3: Configurar Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
# En Linux/Mac:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Crear archivo .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=lontso_fitness
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=$(openssl rand -hex 32)
EOF
```

### Paso 4: Inicializar Base de Datos

```bash
# Asegúrate de estar en /backend con el venv activado
python seed_db.py
```

**Salida esperada:**
```
✓ Usuario creado: trainer@lontso.com / admin123
✓ 15 alimentos creados

✅ Base de datos inicializada correctamente
📧 Email: trainer@lontso.com
🔑 Contraseña: admin123
```

### Paso 5: Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
yarn install

# Crear archivo .env
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

## ▶️ Ejecutar la Aplicación

### Opción 1: Desarrollo (Recomendado para Pruebas)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # o venv\Scripts\activate en Windows
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

**Acceder a:**
- Aplicación: http://localhost:3000
- API: http://localhost:8001
- API Docs: http://localhost:8001/docs

**Credenciales:**
- Email: `trainer@lontso.com`
- Contraseña: `admin123`

### Opción 2: Producción

#### Backend

```bash
cd backend
source venv/bin/activate

# Instalar gunicorn si no está
pip install gunicorn

# Ejecutar en producción
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

#### Frontend

```bash
cd frontend

# Compilar para producción
yarn build

# El resultado estará en frontend/build/
# Servir con nginx, Apache u otro servidor web
```

**Ejemplo con servidor HTTP simple (solo para pruebas):**
```bash
cd build
python3 -m http.server 3000
```

## 🔧 Configuración Avanzada

### Usar MongoDB Remoto (MongoDB Atlas)

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cluster gratuito
3. Obtener connection string
4. Actualizar `backend/.env`:

```env
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/
DB_NAME=lontso_fitness
```

### Configurar con Nginx (Producción)

**Instalar Nginx:**
```bash
sudo apt-get install nginx  # Ubuntu/Debian
brew install nginx          # macOS
```

**Archivo de configuración** `/etc/nginx/sites-available/lontso-fitness`:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Frontend
    location / {
        root /ruta/a/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Activar configuración:**
```bash
sudo ln -s /etc/nginx/sites-available/lontso-fitness /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configurar como Servicio (systemd)

**Backend** `/etc/systemd/system/lontso-backend.service`:

```ini
[Unit]
Description=Lontso Fitness Backend
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/a/backend
Environment="PATH=/ruta/a/backend/venv/bin"
ExecStart=/ruta/a/backend/venv/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
Restart=always

[Install]
WantedBy=multi-user.target
```

**Activar:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable lontso-backend
sudo systemctl start lontso-backend
sudo systemctl status lontso-backend
```

## 🐛 Solución de Problemas

### Error: "MongoDB connection failed"

**Solución:**
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongodb
# O
mongosh --eval "db.version()"

# Iniciar MongoDB si está detenido
sudo systemctl start mongodb
```

### Error: "Port 8001 already in use"

**Solución:**
```bash
# Encontrar proceso usando el puerto
lsof -ti:8001

# Matar el proceso
kill -9 $(lsof -ti:8001)

# O usar otro puerto
uvicorn server:app --port 8002
```

### Error: "yarn: command not found"

**Solución:**
```bash
npm install -g yarn
```

### Frontend muestra pantalla en blanco

**Soluciones:**
1. Verificar que el backend esté corriendo
2. Verificar `REACT_APP_BACKEND_URL` en `frontend/.env`
3. Limpiar cache y reinstalar:
```bash
cd frontend
rm -rf node_modules
yarn install
yarn start
```

### Error: "Cannot find module 'reportlab'"

**Solución:**
```bash
cd backend
source venv/bin/activate
pip install reportlab pypdf
```

## 📊 Verificación de Instalación

### Checklist de Verificación

- [ ] MongoDB está corriendo
- [ ] Backend responde en http://localhost:8001
- [ ] Backend docs en http://localhost:8001/docs
- [ ] Frontend carga en http://localhost:3000
- [ ] Login funciona con trainer@lontso.com / admin123
- [ ] Dashboard muestra interfaz
- [ ] Se puede crear un cliente
- [ ] Se puede crear un alimento
- [ ] Se puede crear una dieta
- [ ] Se puede exportar PDF

### Script de Verificación

```bash
#!/bin/bash

echo "🔍 Verificando instalación..."

# Verificar MongoDB
if mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo "✅ MongoDB está corriendo"
else
    echo "❌ MongoDB no está corriendo"
fi

# Verificar Backend
if curl -s http://localhost:8001/api/ > /dev/null; then
    echo "✅ Backend está corriendo"
else
    echo "❌ Backend no está corriendo"
fi

# Verificar Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend está corriendo"
else
    echo "❌ Frontend no está corriendo"
fi

echo "
📝 Si todos los checks son ✅, la aplicación está lista para usar"
```

## 🆘 Soporte

### Logs Útiles

**Backend logs:**
```bash
# Si usas uvicorn directamente, los logs aparecen en la terminal

# Si usas systemd:
sudo journalctl -u lontso-backend -f
```

**Frontend logs:**
- Los errores aparecen en la consola del navegador (F12)
- Los logs de compilación aparecen en la terminal donde ejecutaste `yarn start`

### Recursos Adicionales

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de React](https://react.dev/)
- [Documentación de MongoDB](https://docs.mongodb.com/)

---

**¡Instalación completa! 🎉**

Ahora puedes acceder a http://localhost:3000 y comenzar a gestionar las dietas de tus clientes.