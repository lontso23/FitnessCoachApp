# 🚀 Guía de Despliegue - Netlify + Render + MongoDB Atlas

## Resumen

Esta guía te llevará paso a paso para publicar tu aplicación **Lontso Fitness** en la nube de forma **100% GRATUITA**.

**Arquitectura:**
- 🎨 Frontend React → Netlify
- ⚡ Backend FastAPI → Render
- 🗄️ Base de Datos → MongoDB Atlas

**Tiempo estimado:** 15-20 minutos

---

## 📋 Requisitos Previos

- [ ] Cuenta de GitHub (ya la tienes ✅)
- [ ] Cuenta de Netlify (crear en paso 2)
- [ ] Cuenta de Render (crear en paso 3)
- [ ] Cuenta de MongoDB Atlas (crear en paso 1)

---

## Paso 1️⃣: Configurar MongoDB Atlas (Base de Datos)

### 1.1 Crear cuenta

1. Ve a https://www.mongodb.com/cloud/atlas/register
2. Regístrate con tu email o Google
3. Selecciona **"Free"** (M0 Sandbox)

### 1.2 Crear Cluster

1. Click en **"Build a Database"**
2. Selecciona **"M0 Free"**
3. Región: Elige la más cercana (ej: AWS / N. Virginia o Ireland)
4. Cluster Name: `lontso-fitness`
5. Click **"Create"**

### 1.3 Configurar Acceso

**A) Database Access (Usuarios):**

1. Click en **"Database Access"** (menú izquierdo)
2. Click **"Add New Database User"**
3. Configurar:
   - Username: `lontso_admin`
   - Password: Genera una contraseña segura (guárdala) ⚠️
   - Database User Privileges: **"Read and write to any database"**
4. Click **"Add User"**

**B) Network Access (IPs permitidas):**

1. Click en **"Network Access"** (menú izquierdo)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.4 Obtener Connection String

1. Click en **"Database"** (menú izquierdo)
2. Click en **"Connect"** en tu cluster
3. Click en **"Connect your application"**
4. Copia el connection string, se verá así:
   ```
   mongodb+srv://lontso_admin:<password>@lontso-fitness.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Reemplaza `<password>`** con la contraseña que generaste
6. **Guarda este string** ⚠️ (lo necesitarás en los Pasos 3 y 4)

### 1.5 Inicializar Datos

**Opción A - Usando MongoDB Compass (Recomendado):**

1. Descarga MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Instala y abre MongoDB Compass
3. Conecta usando tu connection string
4. Crea base de datos: `lontso_fitness`
5. En tu computadora local:
   ```bash
   cd backend
   # Edita .env con tu MONGO_URL de Atlas
   nano .env  # o usa tu editor preferido
   ```
   ```env
   MONGO_URL=mongodb+srv://lontso_admin:TU_PASSWORD@lontso-fitness.xxxxx.mongodb.net/
   DB_NAME=lontso_fitness
   ```
   ```bash
   # Ejecutar el script de inicialización
   python seed_db.py
   ```

**Opción B - Insertar manualmente:**

1. En MongoDB Atlas web interface
2. Collections → Insert Document
3. Crear usuario manualmente:
   ```json
   {
     "id": "trainer-001",
     "email": "trainer@lontso.com",
     "name": "Entrenador Demo",
     "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKw2kQ3nMy",
     "created_at": "2024-01-01T00:00:00Z"
   }
   ```

---

## Paso 2️⃣: Desplegar Backend en Render

### 2.1 Crear cuenta

1. Ve a https://render.com/
2. Click **"Get Started"**
3. Regístrate con GitHub
4. Autoriza Render para acceder a tus repos

### 2.2 Crear Web Service

1. En Render Dashboard, click **"New +"** → **"Web Service"**
2. Conecta tu repositorio: `lontso23/FitnessCoachApp`
3. Si no aparece:
   - Click **"Configure account"**
   - Da acceso al repositorio
   - Vuelve y selecciónalo

### 2.3 Configurar Service

**Configuración básica:**

| Campo | Valor |
|-------|-------|
| **Name** | `lontso-fitness-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn server:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT` |

**Plan:**
- Selecciona **"Free"** (plan gratuito)

### 2.4 Variables de Entorno

**IMPORTANTE:** Antes de hacer deploy, agrega estas variables:

Click en **"Advanced"** → **"Add Environment Variable"**:

| Key | Value | Descripción |
|-----|-------|-------------|
| `MONGO_URL` | Tu connection string de MongoDB Atlas | ⚠️ CRÍTICO |
| `DB_NAME` | `lontso_fitness` | Nombre de la BD |
| `JWT_SECRET_KEY` | `tu-clave-secreta-super-larga-y-aleatoria-minimo-32-caracteres` | Para tokens JWT |
| `CORS_ORIGINS` | `*` | Temporalmente, lo cambiaremos luego |
| `PYTHON_VERSION` | `3.11.0` | Versión de Python |

**Generar JWT_SECRET_KEY segura:**
```bash
# En tu terminal local
openssl rand -hex 32
# Copia el resultado y úsalo como JWT_SECRET_KEY
```

### 2.5 Deploy

1. Click **"Create Web Service"**
2. Espera 5-10 minutos mientras se despliega
3. Verás logs en tiempo real
4. Una vez completado (estado "Live"), verás tu URL:
   ```
   https://lontso-fitness-backend.onrender.com
   ```
5. **Guarda esta URL** ⚠️ (la necesitarás para Netlify)

### 2.6 Verificar Backend

1. Visita: `https://lontso-fitness-backend.onrender.com/docs`
2. Deberías ver la documentación Swagger de la API
3. ✅ Si se ve, tu backend está funcionando!

**Si ves error 404 o 500:**
- Ve a "Logs" en Render Dashboard
- Busca errores específicos
- Verifica que todas las variables de entorno estén correctas

---

## Paso 3️⃣: Desplegar Frontend en Netlify

### 3.1 Crear cuenta

1. Ve a https://www.netlify.com/
2. Click **"Sign up"**
3. Regístrate con GitHub
4. Autoriza Netlify

### 3.2 Crear Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"**
3. Autoriza Netlify (si aún no lo has hecho)
4. Selecciona tu repositorio: `lontso23/FitnessCoachApp`

### 3.3 Configurar Build

Netlify detectará automáticamente la configuración del `netlify.toml`, pero verifica:

| Campo | Valor |
|-------|-------|
| **Base directory** | (dejar vacío) |
| **Build command** | `cd frontend && yarn install && yarn build` |
| **Publish directory** | `frontend/build` |

### 3.4 Variables de Entorno

**ANTES de hacer deploy**, agrega la variable de entorno:

1. En la página de configuración, busca **"Environment variables"**
2. Click **"Add a variable"**
3. Agrega:

| Key | Value | Descripción |
|-----|-------|-------------|
| `REACT_APP_BACKEND_URL` | Tu URL de Render (ej: `https://lontso-fitness-backend.onrender.com`) | ⚠️ SIN / al final |

### 3.5 Deploy

1. Click **"Deploy site"**
2. Espera 3-5 minutos
3. Verás logs de compilación
4. Tu sitio estará disponible en:
   ```
   https://random-name-12345.netlify.app
   ```

### 3.6 Personalizar Dominio (Opcional)

1. Click en **"Site settings"** → **"Domain management"**
2. Click **"Options"** → **"Edit site name"**
3. Cambia a algo como: `lontso-fitness`
4. Tu nueva URL será: `https://lontso-fitness.netlify.app`

---

## Paso 4️⃣: Conectar Todo (Configuración CORS)

### 4.1 Actualizar CORS en Backend

Ahora que conoces tu URL de Netlify, actualiza CORS en Render:

1. Ve a Render Dashboard
2. Click en tu backend service: `lontso-fitness-backend`
3. Click **"Environment"** (menú izquierdo)
4. Edita `CORS_ORIGINS` y reemplaza `*` con tu URL de Netlify:
   ```
   https://lontso-fitness.netlify.app
   ```
5. Click **"Save Changes"**
6. Render redespliegará automáticamente (~2 min)

### 4.2 Verificar Conexión

1. Visita tu sitio en Netlify: `https://lontso-fitness.netlify.app`
2. Intenta hacer login:
   - Email: `trainer@lontso.com`
   - Password: `admin123`
3. ✅ Si funciona, ¡todo está conectado!

**Si ves "Network Error":**
- Verifica que `REACT_APP_BACKEND_URL` en Netlify sea correcta
- Verifica que `CORS_ORIGINS` en Render coincida con tu URL de Netlify
- Ambas deben ser HTTPS (no HTTP)

---

## ✅ Checklist Final

- [ ] MongoDB Atlas configurado y con datos iniciales
- [ ] Backend desplegado en Render y funcionando (`/docs` carga)
- [ ] Frontend desplegado en Netlify
- [ ] CORS configurado correctamente
- [ ] Login funciona
- [ ] Puedes crear clientes
- [ ] Puedes crear alimentos
- [ ] Puedes crear dietas
- [ ] Puedes exportar PDFs
- [ ] Calculadora de macros funciona
- [ ] Vista previa de dietas funciona

---

## 🔧 Solución de Problemas

### Error: "Network Error" en el login

**Causa:** Backend no accesible o CORS mal configurado

**Solución:**
1. Verifica que el backend esté corriendo en Render (estado "Live")
2. Verifica `REACT_APP_BACKEND_URL` en Netlify Environment Variables
3. Verifica `CORS_ORIGINS` en Render Environment Variables
4. Ambos deben coincidir exactamente (incluir https://)
5. Sin / al final en `REACT_APP_BACKEND_URL`

### Error: "Failed to connect to MongoDB"

**Causa:** Connection string incorrecto o IP no permitida

**Solución:**
1. Verifica el `MONGO_URL` en Render Environment
2. Asegúrate de que la contraseña no tenga caracteres especiales sin codificar
3. Si tiene caracteres especiales, codifícalos:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
4. Verifica que "0.0.0.0/0" esté en Network Access de MongoDB Atlas

### Backend en Render dice "Service Unavailable"

**Causa:** Error en el start command o dependencias faltantes

**Solución:**
1. Ve a "Logs" en Render Dashboard
2. Busca errores específicos
3. Verifica que `gunicorn` esté en `requirements.txt`
4. Verifica que el start command sea correcto
5. Si ves error de módulos, añádelos a `requirements.txt`

### Frontend muestra pantalla blanca

**Causa:** Error de compilación o variable de entorno incorrecta

**Solución:**
1. Ve a "Deploys" → último deploy en Netlify
2. Click en "Deploy log"
3. Revisa los logs de build completos
4. Verifica que `REACT_APP_BACKEND_URL` esté correcta
5. Debe incluir `https://` al inicio
6. No debe tener `/` al final

### El backend se "duerme"

**Causa:** Plan gratuito de Render duerme después de 15 min de inactividad

**Solución temporal:**
- El backend tarda ~30 segundos en despertar en el primer request

**Solución permanente (opcional):**
- Usar UptimeRobot (https://uptimerobot.com/) gratuito
- Configurar para hacer ping cada 5 minutos a tu backend
- Mantiene el backend despierto 24/7

### Error: "Module not found" al compilar

**Causa:** Dependencia faltante

**Solución:**
1. En tu proyecto local:
   ```bash
   cd frontend
   yarn add [nombre-del-modulo]
   ```
2. Commit y push:
   ```bash
   git add package.json yarn.lock
   git commit -m "Add missing dependency"
   git push
   ```
3. Netlify redespliegará automáticamente

---

## 🎉 ¡Listo!

Tu aplicación ahora está:
- ✅ Desplegada en la nube
- ✅ Accesible desde cualquier lugar
- ✅ Con base de datos en MongoDB Atlas
- ✅ Completamente funcional

**URLs Finales:**
- 🌐 Frontend: `https://lontso-fitness.netlify.app`
- ⚡ Backend: `https://lontso-fitness-backend.onrender.com`
- 📚 API Docs: `https://lontso-fitness-backend.onrender.com/docs`

---

## 👥 Compartir con Otros Entrenadores

Para que otros entrenadores usen tu aplicación:

### Opción A - Crear usuario manualmente en MongoDB

1. Abre MongoDB Compass
2. Conecta a tu cluster
3. Ve a base de datos `lontso_fitness` → colección `users`
4. Click "Add Data" → "Insert Document"
5. Usa este template:
   ```json
   {
     "id": "trainer-002",
     "email": "nuevo@trainer.com",
     "name": "Nombre del Trainer",
     "password": "[hash bcrypt de la contraseña]",
     "created_at": "2024-01-01T00:00:00Z"
   }
   ```

### Para generar hash de contraseña:

**Opción 1 - Python:**
```python
import bcrypt
password = "password123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))
```

**Opción 2 - Online:**
- Ve a: https://bcrypt-generator.com/
- Ingresa la contraseña
- Rounds: 12
- Copia el hash generado

### Compartir acceso:

1. Envía al nuevo trainer:
   - URL de la app: `https://lontso-fitness.netlify.app`
   - Su email
   - Su contraseña (la sin hash)
2. El trainer puede cambiar su contraseña después desde la app

---

## 💰 Costos

**Todo es GRATIS:**
- ✅ Netlify: 100 GB bandwidth/mes, builds ilimitados
- ✅ Render: 750 horas/mes (suficiente para 24/7)
- ✅ MongoDB Atlas: 512 MB storage, conexiones ilimitadas

**⚠️ Limitaciones del plan gratuito:**
- **Render:** El backend puede "dormirse" después de 15 min de inactividad (tarda ~30 seg en despertar)
- **MongoDB Atlas:** Máximo 512 MB de datos (~5,000-10,000 clientes con dietas)
- **Netlify:** 100 GB bandwidth/mes (suficiente para ~10,000-50,000 visitas)

**💡 Tip:** Para apps con mucho tráfico, considera upgradear a:
- Render: $7/mes (sin sleep, mejor rendimiento)
- MongoDB Atlas: $9/mes (2 GB storage)
- Total: ~$16/mes para app profesional sin limitaciones

---

## 🔄 Actualizar la Aplicación

**Para hacer cambios:**

1. Modifica el código localmente
2. Prueba localmente
3. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```
4. **Auto-deploy:**
   - Netlify redespliegará automáticamente el frontend (~3 min)
   - Render redespliegará automáticamente el backend (~5 min)
5. Espera y verifica cambios en producción

**Verificar deployment:**
- Netlify: "Deploys" → Ver estado
- Render: Dashboard → Ver logs

---

## 📱 Bonus: Configurar Dominio Personalizado

### Si tienes tu propio dominio (ej: tudominio.com):

**En Netlify:**
1. Site settings → Domain management
2. Add custom domain
3. Sigue instrucciones para configurar DNS

**Actualizar CORS:**
1. En Render, cambia `CORS_ORIGINS` a tu dominio:
   ```
   https://tudominio.com
   ```

---

## 🆘 Soporte

¿Problemas? Verifica:

1. **Logs de Netlify**: Deploys → Deploy log
2. **Logs de Render**: Dashboard → Logs tab
3. **Logs de MongoDB**: Monitoring tab
4. **Console del navegador**: F12 → Console (errores de frontend)

**Errores comunes y soluciones están en la sección de Solución de Problemas arriba** ⬆️

---

## 📚 Recursos Adicionales

- [Documentación de Netlify](https://docs.netlify.com/)
- [Documentación de Render](https://render.com/docs)
- [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)

---

**¡Felicitaciones! 🎉 Tu aplicación Lontso Fitness está en producción y lista para usar con tus clientes.**

Si tienes problemas, revisa la sección de "Solución de Problemas" o verifica los logs de cada servicio.
