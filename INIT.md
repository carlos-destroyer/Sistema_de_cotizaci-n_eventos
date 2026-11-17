# INIT · Puesta en marcha

Guía de instalación desde cero del sistema de cotizaciones de **M&M Eventos**.

---

## 1. Requisitos

| Herramienta | Versión recomendada | Verificación |
| --- | --- | --- |
| Docker Desktop | 4.x o superior | `docker --version` |
| Java JDK | 21 o superior | `java -version` |
| Node.js | 22 o superior | `node --version` |
| npm | 10 o superior | `npm --version` |
| Git | 2.40 o superior | `git --version` |

En Windows, configura `JAVA_HOME` con la ruta del JDK:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

Docker Desktop debe estar iniciado antes de ejecutar cualquier script.

---

## 2. Inicialización automática

### Windows

```powershell
cd C:\ruta\al\proyecto\desarrollo
.\scripts\init.ps1
```

### Linux / macOS / Git Bash

```bash
cd /ruta/al/proyecto/desarrollo
chmod +x scripts/*.sh
./scripts/init.sh dev
```

El script realiza estas acciones:

1. Verifica Docker, Java y Node.
2. Crea `.env` desde `.env.example` si no existe.
3. Levanta PostgreSQL (`mm-eventos-db`) en el puerto **5433**.
4. Espera a que el contenedor esté `healthy`.
5. Instala dependencias del frontend si falta `node_modules`.
6. Arranca el backend en `http://localhost:8081`.
7. Arranca el frontend en `http://localhost:3000`.
8. Guarda logs y PIDs en `.run/`.

Los procesos quedan en segundo plano. Para detenerlos:

```powershell
.\scripts\stop.ps1
```

```bash
./scripts/stop.sh
```

PostgreSQL permanece encendido. Para detenerlo:

```bash
docker compose stop postgres
```

---

## 3. Verificación

Abre en el navegador:

- Frontend: <http://localhost:3000>
- Health: <http://localhost:8081/actuator/health>
- Dashboard API: <http://localhost:8081/api/dashboard>

Comprobación por consola:

```powershell
Invoke-RestMethod http://localhost:8081/actuator/health
Invoke-RestMethod http://localhost:8081/api/cotizaciones?size=100
```

Resultados esperados en una base nueva:

- 6 clientes demo.
- 8 cotizaciones demo.
- 69 ítems de catálogo.
- 4 plantillas.
- 11 categorías.

Checklist funcional:

- [ ] El dashboard muestra KPIs y pipeline.
- [ ] Se puede crear un cliente.
- [ ] Se puede aplicar una plantilla en una cotización nueva.
- [ ] El total, IGV y ticket por invitado se calculan.
- [ ] Se puede cambiar el estado de una cotización.
- [ ] Duplicar genera una versión `-V2`.
- [ ] El PDF descarga correctamente.
- [ ] El Excel de cliente y el interno descargan correctamente.
- [ ] La configuración de empresa se guarda.

---

## 4. Modos de inicialización

### Desarrollo local (default)

```powershell
.\scripts\init.ps1 -Mode dev
```

- PostgreSQL en Docker (5433).
- Backend local con Maven Wrapper (8081).
- Frontend local con Next dev (3000).

### Solo base de datos

```powershell
.\scripts\init.ps1 -Mode db
```

Útil si prefieres arrancar backend y frontend en tus propias terminales.

### Todo en Docker

```powershell
.\scripts\init.ps1 -Mode docker
```

Equivale a:

```powershell
docker compose --profile full up -d --build
```

Servicios:

| Contenedor | Puerto host |
| --- | --- |
| `mm-eventos-db` | 5433 |
| `mm-eventos-api` | 8081 |
| `mm-eventos-web` | 3000 |

Detener todo:

```powershell
docker compose --profile full down
```

> Si trabajas en modo local, no uses el perfil `full`: ocuparía los puertos 8081 y 3000.

---

## 5. Arranque manual

Si no deseas usar los scripts:

```powershell
# 1. Variables de entorno
Copy-Item .env.example .env

# 2. Base de datos
docker compose up -d postgres

# 3. Backend (terminal A)
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
cd backend
.\mvnw.cmd -DskipTests spring-boot:run

# 4. Frontend (terminal B)
cd frontend
npm install
npm run dev
```

En Linux/macOS usa `./mvnw` en lugar de `.\mvnw.cmd`.

---

## 6. Reiniciar la base de datos

**Advertencia:** elimina todos los datos y vuelve a cargar el catálogo y los datos demo.

```powershell
.\scripts\reset-db.ps1
```

También puedes reiniciar durante la inicialización:

```powershell
.\scripts\init.ps1 -Reset
```

Equivalente manual:

```bash
docker compose down -v
docker compose up -d postgres
```

Al reiniciar el backend, Flyway recrea el esquema y el seeder carga los datos.

---

## 7. Variables de entorno

Archivo: `.env`

```dotenv
POSTGRES_DB=mm_eventos
POSTGRES_USER=mm_eventos
POSTGRES_PASSWORD=mm_eventos_dev
POSTGRES_PORT=5433
BACKEND_PORT=8081
FRONTEND_PORT=3000
SEED_ENABLED=true
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NEXT_PUBLIC_API_URL=http://localhost:8081/api
```

Notas:

- `SEED_ENABLED=false` desactiva la carga de datos demo en bases nuevas.
- `NEXT_PUBLIC_API_URL` se incrusta al compilar el frontend; cámbiala antes de `npm run build` o del build Docker.
- Si cambias `CORS_ALLOWED_ORIGINS`, reinicia el backend.

---

## 8. Base de datos

| Parámetro | Valor |
| --- | --- |
| Host | `localhost` |
| Puerto | `5433` |
| Base | `mm_eventos` |
| Usuario | `mm_eventos` |
| Contraseña | `mm_eventos_dev` |
| Volumen | `mm_eventos_pgdata` |

Acceso con `psql`:

```bash
docker exec -it mm-eventos-db psql -U mm_eventos -d mm_eventos
```

Tablas principales:

- `empresa_config`
- `clientes`
- `categorias_servicio`
- `catalogo_items`
- `plantillas_evento`
- `plantilla_detalles`
- `cotizaciones`
- `cotizacion_detalles`

Flyway aplica las migraciones de `backend/src/main/resources/db/migration` al arrancar.

---

## 9. Git

El repositorio se inicializa dentro de `desarrollo/`. Configura tu identidad local antes del primer commit:

```powershell
git config user.name "Tu Nombre"
git config user.email "tu@correo.com"
```

Archivos que **no** se versionan:

- `.env`
- `frontend/node_modules`
- `frontend/.next`
- `backend/target`
- `.run`
- logs

Para publicar en un remoto:

```powershell
git remote add origin <URL_DEL_REPOSITORIO>
git branch -M main
git push -u origin main
```

---

## 10. Solución de problemas

### El puerto 5433, 8081 o 3000 está ocupado

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen
```

Cambia el puerto en `.env` y reinicia. Si cambias `BACKEND_PORT`, actualiza también `NEXT_PUBLIC_API_URL`.

### Docker no inicia

- Abre Docker Desktop y espera a que el motor esté corriendo.
- Verifica con `docker info`.
- En Windows, confirma que la virtualización está habilitada.

### PostgreSQL no llega a `healthy`

```bash
docker compose logs postgres
docker compose down
docker compose up -d postgres
```

### El backend no compila por Lombok

El proyecto fija Lombok `1.18.46` y lo registra en `annotationProcessorPaths`. Si usas un JDK muy nuevo, verifica que `JAVA_HOME` apunte a un JDK 21+ compatible.

### El frontend muestra errores de red o CORS

1. Confirma que el backend responde en `http://localhost:8081/actuator/health`.
2. Revisa que `CORS_ALLOWED_ORIGINS` incluya `http://localhost:3000`.
3. Revisa `NEXT_PUBLIC_API_URL` y vuelve a compilar el frontend si la cambiaste.

### El dashboard aparece vacío

La base está vacía o el seeder está desactivado. Ejecuta `reset-db` y reinicia el backend con `SEED_ENABLED=true`.

### Next.js no arranca en desarrollo

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Ver logs locales

```powershell
Get-Content .run\backend.err.log -Tail 50
Get-Content .run\backend.log -Tail 50
Get-Content .run\frontend.log -Tail 50
```

---

## 11. Build de producción

### Frontend

```bash
cd frontend
npm ci
npm run build
npm start
```

### Backend

```powershell
cd backend
.\mvnw.cmd -DskipTests package
java -jar target\mm-eventos-api-1.0.0.jar
```

### Docker

```bash
docker compose --profile full up -d --build
```

---

## 12. Orden recomendado para una instalación nueva

1. Instalar Docker, Java 21, Node 22 y Git.
2. Abrir Docker Desktop.
3. Clonar o copiar el repositorio.
4. Ejecutar `scripts/init.ps1` (Windows) o `scripts/init.sh dev`.
5. Abrir `http://localhost:3000`.
6. Revisar Configuración y ajustar los datos de la empresa.
7. Validar el flujo completo con una cotización de prueba.
8. Configurar el remoto de Git y hacer el primer push.
