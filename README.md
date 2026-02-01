# Pimpoyo Data Explorer

**Panel de Investigación & Análisis Cognitivo**

Esta aplicación es una herramienta de visualización y análisis de datos diseñada para procesar archivos de respaldo (backups SQL) de la plataforma Pimpoyo. Permite a investigadores y docentes analizar el desempeño cognitivo de los estudiantes, visualizar métricas de progreso y explorar historiales de interacción y chat.

## 🚀 Características Principales

- **Importación de Datos**: Carga y parseo directo de archivos `.sql` (PostgreSQL) en el navegador. Privacidad total: los datos no salen de tu dispositivo.
- **Dashboard Interactivo**: Vista general con métricas clave como número de estudiantes, precisión media e interacciones totales.
- **Analítica Detallada**:
  - Comparativas de rendimiento entre clases.
  - Gráficos de distribución de notas.
  - Análisis de evolución Pre-Test vs Post-Test.
- **Vista de Clases**: Agrupación de estudiantes por curso escolar.
- **Perfil de Estudiante**:
  - Historial completo de sesiones de chat (diálogos con el agente).
  - Resultados detallados de tests con detección de errores.
  - Métricas individuales de XP y precisión.
- **Modo Oscuro/Claro**: Interfaz adaptable.

## 🛠️ Tecnologías

- **Vue 3**: Framework progresivo de JavaScript.
- **Vite**: Entorno de desarrollo ultrarrápido.
- **Tailwind CSS**: Framework de utilidad para el diseño.
- **Chart.js / vue-chartjs**: Visualización de datos.
- **Lucide Vue**: Iconografía moderna.
- **Lodash**: Utilidades de manipulación de datos.

## 📦 Instalación

Para configurar el proyecto en tu entorno local, asegúrate de tener [Node.js](https://nodejs.org/) instalado.

1. Clona el repositorio (o descarga el código fuente):
   ```bash
   git clone <url-del-repositorio>
   cd PimpoyoDataWeb
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## ▶️ Cómo Correrlo en Local

Para iniciar el servidor de desarrollo y ver la aplicación en tu navegador:

```bash
npm run dev
```

La aplicación estará disponible típicamente en `http://localhost:5173`.

## 🏗️ Construcción para Producción

Para generar los archivos estáticos optimizados para producción:

```bash
npm run build
```

Los archivos generados se encontrarán en la carpeta `dist/`.

## 📝 Notas de Uso

1. Al abrir la aplicación, verás una pantalla de bienvenida.
2. Haz clic en **"Importar Backup SQL"**.
3. Selecciona un archivo `.sql` válido generado por la plataforma Pimpoyo (dump de PostgreSQL).
4. Espera unos segundos mientras la aplicación procesa los datos localmente.
5. ¡Explora los datos!
