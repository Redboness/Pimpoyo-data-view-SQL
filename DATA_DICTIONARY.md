# Diccionario de Datos: Esquema Pimpoyo

Contenido de las tablas del nuevo esquema `pimpoyo`.

## 1. users
*Identidad del estudiante.*

| Columna | Contenido |
| :--- | :--- |
| **id** | Identificador único del usuario. |
| **nickname** | Nombre de usuario (apodo). |
| **hashed_password** | Contraseña cifrada. |
| **avatar_url** | Ruta de la imagen de perfil. |
| **edad** | Edad del estudiante. |
| **genero** | Género declarado. |
| **curso_escolar** | Grado escolar (ej. "3º ESO"). |
| **xp_actual** | Puntos de experiencia acumulados (Nivel). |
| **created_at** | Fecha de registro. |

## 2. sessions
*Resultados de una partida.*

| Columna | Contenido |
| :--- | :--- |
| **id** | Identificador de la sesión. |
| **user_id** | Referencia al usuario que jugó. |
| **interacciones_totales** | Cantidad total de noticias analizadas. |
| **aciertos_totales** | Número de identificaciones correctas. |
| **precision_global** | Porcentaje de acierto (0-100%). |
| **tasa_falsos_positivos**| % de veces que marcó una noticia Verdadera como Falsa. |
| **tasa_falsos_negativos**| % de veces que marcó una noticia Falsa como Verdadera. |
| **duracion_seg** | Tiempo total de uso en segundos. |

## 3. interactions
*Detalle de cada noticia analizada.*

| Columna | Contenido |
| :--- | :--- |
| **id** | Identificador único de la interacción. |
| **noticia_id** | Referencia numérica a la noticia. |
| **respuesta_usuario** | Qué contestó ("Verdadero", "Falso", "No sé"). |
| **es_correcto** | Si acertó o falló. |
| **tiempo_respuesta_ms** | Tiempo que tardó en decidir. |
| **tipo_error** | Tipo de fallo ("FALSO_POSITIVO", "FALSO_NEGATIVO"). |
| **indicadores_seleccionados**| Lista de pistas (JSON) que marcó el usuario. |
| **key_elements** | Elementos clave (JSON) de la noticia original. |

## 4. news
*Catálogo único de noticias.*

| Columna | Contenido |
| :--- | :--- |
| **id** | Identificador interno. |
| **external_id** | Código original del dataset. Ej: "fake_001". |
| **tema** | Categoría (Salud, Política, etc.). |
| **dificultad** | Nivel ("Bajo", "Medio", "Alto"). |
| **fuente** | Nombre del medio o fuente. |
| **metadata** | Datos extra (JSON) como el titular o el enlace. |

## 5. chat_sessions_news
*Conversación guiada sobre una noticia.*

| Columna | Contenido |
| :--- | :--- |
| **id** | ID de la sesión de chat. |
| **evaluacion_inicial_usuario** | Qué pensaba antes de hablar con el bot. |
| **explicacion_inicial_usuario** | Por qué pensaba eso (texto). |
| **mejora_comprension_evaluacion**| Si el chat le ayudó ("SI"/"NO"). |
| **noticia_verdad_real** | La verdad objetiva de la noticia ("TRUE"/"FALSE"). |

## 6. chat_messages
*Mensajes individuales del chat.*

| Columna | Contenido |
| :--- | :--- |
| **chat_session_id** | ID de la sesión de chat a la que pertenece. |
| **emisor** | Quién envío el mensaje ("usuario", "chatbot"). |
| **contenido** | Texto del mensaje. |
| **orden** | Posición en la conversación. |

## 7. stats_user_details
*Estadísticas desglosadas por tema/criterio.*

| Columna | Contenido |
| :--- | :--- |
| **tipo_criterio** | Qué se mide (ej. "TEMA_NOTICIA", "DIFICULTAD"). |
| **valor_criterio** | El valor específico (ej. "Política", "Dificil"). |
| **tasa_acierto** | % de acierto específico en este criterio. |

## 8. glossary_terms
*Glosario personal del estudiante.*

| Columna | Contenido |
| :--- | :--- |
| **term** | Palabra guardada. |
| **definition** | Definición de la palabra. |

## 9. indicators
*Catálogo de indicadores de desinformación.*

| Columna | Contenido |
| :--- | :--- |
| **name** | Nombre del indicador (ej. "Fuente Anónima"). |

## 10. pretest_results / posttest_results
*Respuestas a los cuestionarios.*

| Columna | Contenido |
| :--- | :--- |
| **[sección]_[pregunta]** | Respuesta específica en formato JSON o Texto. |
| **puntos_[sección]** | Puntuación numérica obtenida en esa área. |
