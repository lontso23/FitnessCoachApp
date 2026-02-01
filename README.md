# Lontso Fitness - Aplicación de Gestión de Dietas

Aplicación web para entrenadores personales que permite gestionar clientes y crear dietas personalizadas con exportación a PDF.

## 🚀 Características

- **Autenticación**: Login seguro para entrenadores (JWT)
- **Gestión de Clientes**: CRUD completo con cálculo automático de TMB y calorías de mantenimiento (Fórmula Harris-Benedict)
- **Base de Datos de Alimentos**: Gestión de alimentos con valores nutricionales por 100g (kcal, proteínas, carbohidratos, grasas)
- **Constructor de Dietas**: Interfaz tipo spreadsheet para crear dietas con 6 comidas
- **Cálculo Automático**: Suma automática de macros por comida y totales diarios
- **Exportación PDF**: Genera PDFs profesionales de las dietas creadas
- **Diseño Profesional**: Interfaz dark minimalista estilo fitness

## 📋 Requisitos Previos

- **Node.js**: v20.x o superior
- **Python**: 3.11 o superior
- **MongoDB**: 4.5 o superior
- **Yarn**: 1.22 o superior (para el frontend)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
cd lontso-fitness-app
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

**Archivo backend/.env:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=lontso_fitness
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=tu-clave-secreta-muy-segura-cambiala-en-produccion
```

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu URL del backend
```

**Archivo frontend/.env:**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 4. Inicializar Base de Datos

```bash
cd ../backend
python seed_db.py
```

Esto creará:
- Usuario demo: `trainer@lontso.com` / `admin123`
- 15 alimentos de ejemplo

## 🚀 Ejecución

### Modo Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

### Modo Producción

**Backend:**
```bash
cd backend
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

**Frontend:**
```bash
cd frontend
yarn build
# Servir la carpeta build/ con un servidor web (nginx, Apache, etc.)
```

## 👥 Usuarios de Prueba

Después de ejecutar `seed_db.py`:

- **Email**: trainer@lontso.com
- **Contraseña**: admin123

## 📁 Estructura del Proyecto

```
lontso-fitness-app/
├── backend/
│   ├── server.py              # API FastAPI principal
│   ├── seed_db.py             # Script de inicialización de BD
│   ├── requirements.txt       # Dependencias Python
│   └── .env                   # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React reutilizables
│   │   ├── contexts/          # Context API (Auth)
│   │   ├── pages/             # Páginas principales
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── ClientForm.js
│   │   │   ├── ClientDetail.js
│   │   │   ├── Foods.js
│   │   │   └── DietBuilder.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
└── README.md
```

## 🔑 API Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/{id}` - Obtener cliente
- `PUT /api/clients/{id}` - Actualizar cliente
- `DELETE /api/clients/{id}` - Eliminar cliente

### Alimentos
- `GET /api/foods` - Listar alimentos
- `POST /api/foods` - Crear alimento
- `PUT /api/foods/{id}` - Actualizar alimento
- `DELETE /api/foods/{id}` - Eliminar alimento

### Dietas
- `GET /api/diets` - Listar dietas
- `POST /api/diets` - Crear dieta
- `GET /api/diets/{id}` - Obtener dieta
- `DELETE /api/diets/{id}` - Eliminar dieta
- `GET /api/diets/{id}/export` - Exportar dieta a PDF

## 🎨 Tecnologías Utilizadas

### Backend
- FastAPI (Python)
- Motor (MongoDB async driver)
- PyJWT (Autenticación)
- Bcrypt (Hash de contraseñas)
- ReportLab (Generación de PDFs)
- Pydantic (Validación de datos)

### Frontend
- React 19
- React Router v7
- Tailwind CSS
- Shadcn/UI Components
- Axios (HTTP client)
- Sonner (Notificaciones)
- Lucide React (Iconos)

### Base de Datos
- MongoDB

## 📝 Funcionalidades Detalladas

### Calculadora de Calorías
Utiliza la fórmula Harris-Benedict para calcular:
- **TMB (Tasa Metabólica Basal)**:
  - Hombres: 66.5 + (13.75 × peso) + (5.003 × altura) - (6.75 × edad)
  - Mujeres: 655.1 + (9.563 × peso) + (1.850 × altura) - (4.676 × edad)
- **Calorías de Mantenimiento**: TMB × Factor de actividad
- **Factores de actividad**:
  - Sedentaria: 1.2
  - Ligera: 1.375
  - Moderada: 1.55
  - Alta: 1.725
  - Muy Alta: 1.9

### Constructor de Dietas
- Interfaz tipo tabla/spreadsheet
- 6 comidas predefinidas (personalizables)
- Selección de alimentos desde base de datos
- Cantidades en gramos
- Cálculo automático de:
  - Calorías por alimento
  - Macros por alimento (proteínas, carbohidratos, grasas)
  - Totales por comida
  - Totales diarios

### Exportación PDF
- Formato profesional
- Tabla con alimentos y cantidades
- Totales de macronutrientes
- Nombre del cliente
- Listo para imprimir

## 🔒 Seguridad

- Contraseñas hasheadas con Bcrypt
- Autenticación JWT con tokens de 7 días
- Validación de datos con Pydantic
- CORS configurado
- Variables de entorno para datos sensibles

## 🚀 Despliegue

### Recomendaciones de Producción

1. **Cambiar JWT_SECRET_KEY** en el archivo .env del backend
2. **Usar MongoDB Atlas** o servidor MongoDB dedicado
3. **Configurar HTTPS** con certificados SSL
4. **Usar gunicorn** para el backend con múltiples workers
5. **Servir frontend** desde CDN o servidor web optimizado (nginx)
6. **Configurar CORS** con dominios específicos (no usar '*')
7. **Implementar rate limiting** en los endpoints
8. **Configurar backups** automáticos de MongoDB

### Variables de Entorno de Producción

**Backend:**
```env
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/
DB_NAME=lontso_fitness_prod
CORS_ORIGINS=https://tudominio.com
JWT_SECRET_KEY=clave-super-secreta-y-larga-generada-aleatoriamente
```

**Frontend:**
```env
REACT_APP_BACKEND_URL=https://api.tudominio.com
```

## 📄 Licencia

Este proyecto fue creado para uso personal de entrenadores personales.

## 🤝 Soporte

Para reportar problemas o sugerencias:
1. Revisar la documentación
2. Verificar los logs en `/var/log/supervisor/` (si usa supervisor)
3. Contactar al desarrollador

## 📚 Recursos Adicionales

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [ReportLab Documentation](https://www.reportlab.com/docs/reportlab-userguide.pdf)

---

**Desarrollado para entrenadores personales que buscan optimizar la gestión de dietas de sus clientes** 💪🥗