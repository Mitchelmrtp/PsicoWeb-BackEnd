# PsicoWeb - Backend API

El backend para la plataforma PsicoWeb, desarrollado con Node.js, Express y PostgreSQL, siguiendo los principios de Clean Architecture y SOLID.

## 📋 Características

- Arquitectura limpia con separación de responsabilidades (Controladores, Servicios, Repositorios)
- Autenticación y autorización con JWT
- Gestión de usuarios con roles (pacientes, psicólogos, administradores)
- Sistema de agendamiento de citas y disponibilidad
- Tests psicológicos con preguntas y resultados
- Sistema de notificaciones
- Manejo de calendario y eventos

## 🏗️ Arquitectura

```
src/
├── controllers/     # Controladores para manejar peticiones HTTP
├── services/        # Servicios con lógica de negocio
├── repositories/    # Repositorios para acceso a datos
├── dto/             # Data Transfer Objects
├── models/          # Modelos de Sequelize
├── interfaces/      # Interfaces y contratos
├── utils/           # Utilidades y helpers
├── config/          # Configuración y dependencias
├── routes/          # Definición de rutas
└── middleware/      # Middleware de autenticación y autorización
```

## 🛠️ Tecnologías

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT (JSON Web Tokens)
- Joi (validación)
- Bcrypt (hashing)

## 🚀 Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd PsicoWeb-BackEnd
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   # Servidor
   PORT=3005
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Base de datos
   DB_HOST=localhost
   DB_NAME=tubasededatos
   DB_USER=tuusuario
   DB_PASS=tupassword
   DB_PORT=5432

   # JWT
   JWT_SECRET=tu_jwt_secret_super_seguro
   JWT_EXPIRES_IN=7d
   ```

4. **Ejecutar el servidor en modo desarrollo**
   ```bash
   npm run dev
   ```

## 🌐 Despliegue en Azure App Service

### Prerrequisitos
- Cuenta de Azure
- Azure CLI instalado
- Node.js 14+ instalado

### Pasos para el despliegue

1. **Iniciar sesión en Azure**
   ```bash
   az login
   ```

2. **Crear un grupo de recursos** (si no existe)
   ```bash
   az group create --name PsicoWebResourceGroup --location eastus
   ```

3. **Crear una base de datos PostgreSQL en Azure**
   ```bash
   az postgres server create \
     --name psicoweb-postgres \
     --resource-group PsicoWebResourceGroup \
     --location eastus \
     --admin-user <admin-username> \
     --admin-password <admin-password> \
     --sku-name B_Gen5_1
   ```

4. **Configurar reglas de firewall**
   ```bash
   az postgres server firewall-rule create \
     --name AllowAllIPs \
     --server-name psicoweb-postgres \
     --resource-group PsicoWebResourceGroup \
     --start-ip-address 0.0.0.0 \
     --end-ip-address 255.255.255.255
   ```

5. **Crear base de datos**
   ```bash
   az postgres db create \
     --name psicoweb \
     --server-name psicoweb-postgres \
     --resource-group PsicoWebResourceGroup
   ```

6. **Crear el App Service Plan**
   ```bash
   az appservice plan create \
     --name PsicoWebPlan \
     --resource-group PsicoWebResourceGroup \
     --sku B1 \
     --is-linux
   ```

7. **Crear la Web App**
   ```bash
   az webapp create \
     --name psicoweb-api \
     --resource-group PsicoWebResourceGroup \
     --plan PsicoWebPlan \
     --runtime "NODE:18-lts"
   ```

8. **Configurar las variables de entorno**
   ```bash
   az webapp config appsettings set \
     --name psicoweb-api \
     --resource-group PsicoWebResourceGroup \
     --settings \
       PORT=8080 \
       NODE_ENV=production \
       FRONTEND_URL=<frontend-url> \
       DB_HOST=psicoweb-postgres.postgres.database.azure.com \
       DB_NAME=psicoweb \
       DB_USER=<admin-username>@psicoweb-postgres \
       DB_PASS=<admin-password> \
       DB_PORT=5432 \
       JWT_SECRET=<jwt-secret> \
       JWT_EXPIRES_IN=7d
   ```

9. **Habilitar CORS para el frontend**
   ```bash
   az webapp cors add \
     --name psicoweb-api \
     --resource-group PsicoWebResourceGroup \
     --allowed-origins <frontend-url>
   ```

10. **Desplegar desde un repositorio Git** (o configurar CI/CD con GitHub Actions)
    ```bash
    az webapp deployment source config \
      --name psicoweb-api \
      --resource-group PsicoWebResourceGroup \
      --repo-url <git-repo-url> \
      --branch main \
      --manual-integration
    ```

## 🔨 Configuraciones Adicionales para el Despliegue

1. **Corrección del archivo web.config para Node.js**

Crea un archivo `web.config` en la raíz del proyecto:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="index.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^index.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="index.js" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin" />
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

2. **Actualiza el archivo package.json para Azure**

Añade/asegura que los siguientes scripts están en tu `package.json`:

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

3. **Configurar el puerto en index.js**

Asegúrate que el archivo `index.js` utiliza el puerto proporcionado por Azure:

```javascript
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
```

## 📄 API Endpoints

### 1. Autenticación

- **POST /api/auth/registro**: Registrar un nuevo usuario
- **POST /api/auth/login**: Iniciar sesión
- **GET /api/auth/perfil**: Obtener perfil de usuario autenticado

### 2. Pacientes

- **GET /api/pacientes**: Obtener lista de pacientes
- **GET /api/pacientes/:id**: Obtener un paciente por ID
- **POST /api/pacientes**: Crear un nuevo paciente
- **PUT /api/pacientes/:id**: Actualizar un paciente
- **DELETE /api/pacientes/:id**: Eliminar un paciente

### 3. Psicólogos

- **GET /api/psicologos**: Obtener lista de psicólogos
- **GET /api/psicologos/:id**: Obtener un psicólogo por ID
- **POST /api/psicologos**: Crear un nuevo psicólogo
- **PUT /api/psicologos/:id**: Actualizar un psicólogo
- **DELETE /api/psicologos/:id**: Eliminar un psicólogo

### 4. Disponibilidad

- **GET /api/disponibilidad/:psicologoId**: Obtener disponibilidad de un psicólogo
- **POST /api/disponibilidad**: Crear disponibilidad
- **PUT /api/disponibilidad/:id**: Actualizar disponibilidad
- **DELETE /api/disponibilidad/:id**: Eliminar disponibilidad

### 5. Sesiones

- **GET /api/sesiones**: Obtener todas las sesiones
- **GET /api/sesiones/:id**: Obtener sesión por ID
- **POST /api/sesiones**: Crear nueva sesión
- **PUT /api/sesiones/:id**: Actualizar una sesión
- **DELETE /api/sesiones/:id**: Cancelar una sesión

### 6. Pruebas Psicológicas

- **GET /api/pruebas**: Obtener todas las pruebas
- **GET /api/pruebas/:id**: Obtener prueba por ID
- **POST /api/pruebas**: Crear nueva prueba
- **PUT /api/pruebas/:id**: Actualizar prueba
- **POST /api/pruebas/resultados**: Guardar resultados de prueba

## 📚 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).