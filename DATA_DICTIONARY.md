# Diccionario de datos: Esquema Pimpoyo

Contenido de las tablas del nuevo esquema "pimpoyo".

## 1. Tabla de users
*Identidad del estudiante.*

| Columna | Contenido |
| :--- | :--- |
| **ID** | Identificador único del usuario. |
| **Nickname** | Nombre de usuario (apodo). |
| **Hashed_password** | Contraseña cifrada. |
| **Avatar_url** | Ruta de la imagen de perfil. |
| **Edad** | Edad del estudiante. |
| **Género** | Género declarado. |
| **Curso_escolar** | Grado escolar (ej. "3º ESO"). |
| **Xp_actual** | Puntos de experiencia acumulados (Nivel) (Los que tienen 0 no han hecho Pimpoyo) |
| **Created_at** | Fecha de registro. |

## 2. Sesiones
*Resultados de la sesión con Pimpoyo.*

| Columna | Contenido |
| :--- | :--- |
| **ID** | Identificador de la sesión. |
| **User_ID** | Referencia del usuario que jugó. |
| **Interacciones_totales** | Cantidad total de noticias analizadas.(Los que tienen 0 no han hecho Pimpoyo) |
| **Aciertos_totales** | Número de noticias correctas. |
| **Fallos_totales** | Número de noticias incorrectas |
| **Precisión_global** | Porcentaje de acierto (0-100%) (Los que no tienen nada no han hecho Pimpoyo) |
| **Puntuación_final** | Puntuación total de todas las noticias que hicieron en Pimpoyo (no es la evaluación final del post-test) |

## 3. Interacciones
*Detalle de cada noticia analizada.*

| Columna | Contenido |
| :--- | :--- |
| **ID** | Identificador único de la interacción. |
| **Noticia_ID** | Referencia numérica de la noticia. |
| **Respuesta_usuario** | Qué contestó ("Verdadero" o "Falso") (está en inglés por el lenguaje de programación). |
| **Puntos_otorgados** | Puntuaciones otorgadas por poner la respuesta bien o mal (pone dos en la que está mal porque a pesar de que esté mal siguen ganando experiencia). |
| **Respuesta_correcta** | Si acertó o falló. |
| **Tipo_error** | Tipo de fallo ("FALSO_POSITIVO" o "FALSO_NEGATIVO"). |
| **indicadores_seleccionados**| Lista de pistas (JSON) que marcó el usuario. |
| **Actividad_evaluada** | Qué actividad de Pimpoyo realizó |
| **Elementos_ clave** | Elementos clave (formato JSON) de la noticia original. |
| **Pistas_Pimpoyo** | Pistas originales de las noticias que tiene Pimpoyo para evaluar al usuario. |
| **Posibles_malentendidos** | Pistas que tiene Pimpoyo para saber en qué puede fallar el usuario.|
| **Indicadores_detectados_noticia** | Indicadores finales para evaluar al usuario en base a la teoría del TFM.|
| **Indicadores_seleccionados_usuario** | Indicadores seleccionados por el usuario (los que no tienen nada no han hecho Pimpoyo)|

## 4. Noticias
*Catálogo de noticias que salieron en las sesiones de Pimpoyo.*

| Columna | Contenido |
| :--- | :--- |
| **ID** | Identificador interno. |
| **External_ID** | Código original del dataset. |
| **Tema** | Categoría (Salud, Política, etc.). |
| **Dificultad** | Nivel ("Bajo", "Medio", "Alto"). |
| **Fuente** | Nombre del medio o fuente. |

## 5. Chat_sessions_news
*Conversación guiada sobre una noticia.*

| Columna | Contenido |
| :--- | :--- |
| **ID** | ID de la sesión de chat. |
| **Evaluacion_inicial_usuario** | Qué pensaba antes de hablar con el bot. |
| **Explicación_inicial_usuario** | Por qué pensaba eso (texto). |
| **Mejora_comprension_evaluacion**| Si el chat le ayudó ("SI"/"NO"/"INCIERTO"). |
| **Comprensión_justificación_chatbot**| Explicación que analiza la respuesta del usuario para dar el feedback correcto. |
| **Evaluación_real_noticia** | La verdad objetiva de la noticia ("TRUE"/"FALSE"). |
| **Respuesta_correcta** | Evalua si el alumno se ha equivaco o no ("VERDADERO=SI"/"FALSO=NO"). |

## 6. Chat_mensajes
*Mensajes individuales del chat.*

| Columna | Contenido |
| :--- | :--- |
| **Chat_session_id** | ID de la sesión de chat a la que pertenece. |
| **Emisor** | Quién envío el mensaje ("usuario", "chatbot"). |

## 7. Estadísticas_user_detalles
*Estadísticas desglosadas por tema/criterio.*

| Columna | Contenido |
| :--- | :--- |
| **Tipo_criterio** | Qué se mide (ej. "TEMA_NOTICIA", "DIFICULTAD"). |
| **Valor_criterio** | El valor específico del criterio (ej. "Política", "Dificil"). |
| **Número_intentos** | Número de veces que se ha encontrado ese criterio y ha fallado (ej. "Política", "Dificil"). |
| **Número_aciertos** | Número de veces que se ha encontrado ese criterio y ha acertado (ej. "Política", "Dificil"). |
| **Tasa_acierto** | % de acierto específico en este criterio.(1 = 100%) |

## 8. Indicadores
*Catálogo de indicadores de desinformación.*

| Columna | Contenido |
| :--- | :--- |
| **name** | Nombre del indicador (ej. "Fuente Anónima"). |

## 9. Pretest_resultados / Posttest_resultados
*Respuestas a los cuestionarios.*

| Columna | Contenido |
| :--- | :--- |
| **[sección]_[pregunta]** | Respuesta específica en formato JSON o Texto. |
| **puntos_[sección]** | Puntuación numérica obtenida en esa área. |
