import _ from 'lodash';

/**
 * Pimpoyo SQL Parser
 * Designed to handle PostgreSQL dump files with INSERT and COPY statements.
 */
export class SqlParser {
    constructor() {
        this.data = {
            users: [],
            sessions: [],
            interactions: [],
            news: [],
            chat_messages: [],
            indicators: [],
            chat_messages: [],
            indicators: [],
            stats_user_details: [],
            pretest_results: [],
            posttest_results: []
        };
    }

    async parse(sqlContent) {
        const lines = sqlContent.split('\n');
        let currentTable = null;
        let isCopying = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('--') || line.startsWith('SET') || line.startsWith('SELECT')) continue;

            // Handle COPY statements
            if (line.startsWith('COPY pimpoyo.')) {
                const match = line.match(/COPY pimpoyo\.(\w+)/);
                if (match) {
                    currentTable = match[1];
                    isCopying = true;
                    continue;
                }
            }

            if (isCopying) {
                if (line === '\\.') {
                    isCopying = false;
                    currentTable = null;
                    continue;
                }
                this.processCopyLine(currentTable, line);
                continue;
            }

            // Handle INSERT statements (if any, though the dump seems to use COPY mostly)
            if (line.startsWith('INSERT INTO pimpoyo.')) {
                this.processInsertLine(line);
            }
        }

        this.postProcess();
        return this.data;
    }

    processCopyLine(table, line) {
        const values = line.split('\t');
        if (!this.data[table]) this.data[table] = [];

        const row = {};
        const columns = this.getTableColumns(table);

        columns.forEach((col, index) => {
            let val = values[index];
            if (val === '\\N') val = null;
            row[col] = this.coerceType(col, val);
        });

        this.data[table].push(row);
    }

    getTableColumns(table) {
        const schemas = {
            users: ['id', 'nickname', 'hashed_password', 'avatar_url', 'edad', 'genero', 'curso_escolar', 'consentimiento_obtenido', 'xp_actual', 'created_at'],
            sessions: ['id', 'user_id', 'inicio_ts', 'fin_ts', 'duracion_seg', 'interacciones_totales', 'aciertos_totales', 'fallos_totales', 'precision_global', 'puntuacion_final', 'tasa_falsos_negativos', 'tasa_falsos_positivos'],
            interactions: ['id', 'session_id', 'noticia_id', 'respuesta_usuario', 'es_correcto', 'tiempo_respuesta_ms', 'puntos_otorgados', 'tipo_error', 'feedback', 'secuencia', 'tipo_interaccion', 'criterios_evaluacion', 'key_elements', 'justification_hints', 'likely_misconceptions', 'indicadores_detectados', 'created_at'],
            news: ['id', 'external_id', 'fuente', 'tema', 'dificultad', 'metadata'],
            chat_messages: ['id', 'chat_session_id', 'emisor', 'contenido', 'timestamp_mensaje', 'orden'],
            chat_sessions_news: ['id', 'session_id', 'noticia_external_id', 'fecha_inicio', 'fecha_fin', 'evaluacion_inicial_usuario', 'explicacion_inicial_usuario', 'noticia_verdad_real', 'evaluacion_inicial_correcta', 'mejora_comprension_evaluacion', 'mejora_comprension_justificacion', 'created_at'],
            indicators: ['id', 'name'],
            stats_user_details: ['id', 'session_id', 'tipo_criterio', 'valor_criterio', 'numero_intentos', 'numero_aciertos', 'tasa_acierto', 'updated_at'],
            pretest_results: ['session_id', 's1_p1_horas_internet', 's1_p2_plataformas', 's1_p3_habilidad_tech', 's1_p4_charla_peligros', 's2_p5_habilidad_vf', 's2_p6_dificultad_vf', 's2_p7_estrategias', 's2_p8_fuentes_confianza', 's2_p9_sospecha_falsa', 's2_p10_probabilidad_verdad', 's3_p11_vf_apagon', 's3_p11_expl_apagon', 's1_perfil_puntos', 's2_estrategias_puntos', 's3_practica_puntos', 'puntuacion_total'],
            posttest_results: ['session_id', 's1_p1_habilidad_vf', 's1_p2_dificultad_vf', 's1_p3_estrategias', 's1_p4_fuentes', 's1_p5_sospecha_falsa', 's1_p6_probabilidad_verdad', 's2_p7_aprendizaje_abierta', 's2_p8_cambio_forma_ver', 's2_p9_aprendizaje_escala', 's3_p10_vf_sangre_artificial', 's3_p11_vf_apagon', 's3_p11_expl_apagon', 's4_p12_facilidad_uso', 's4_p13_utilidad_pistas', 's4_p14_que_gusto', 's4_p15_que_no_gusto', 's4_p16_personaje_pimpoyo', 's4_p17_utilidad_futura', 's4_p18_frecuencia_aplicacion', 's1_estrategias_puntos', 's2_aprendizaje_puntos', 's3_practica_puntos', 's4_ux_puntos', 'puntuacion_total']
        };
        return schemas[table] || [];
    }

    coerceType(col, val) {
        if (val === null) return null;

        if (['id', 'user_id', 'session_id', 'noticia_id', 'chat_session_id', 'duracion_seg', 'interacciones_totales', 'aciertos_totales', 'fallos_totales', 'puntos_otorgados', 'secuencia', 'numero_intentos', 'numero_aciertos', 'edad', 'xp_actual', 'tiempo_respuesta_ms',
            's1_perfil_puntos', 's2_estrategias_puntos', 's3_practica_puntos', 'puntuacion_total', 's1_estrategias_puntos', 's2_aprendizaje_puntos', 's4_ux_puntos'].includes(col)) {
            return parseInt(val, 10);
        }

        if (['precision_global', 'puntuacion_final', 'tasa_falsos_negativos', 'tasa_falsos_positivos', 'tasa_acierto'].includes(col)) {
            return parseFloat(val);
        }

        if (['es_correcto', 'consentimiento_obtenido', 'evaluacion_inicial_correcta'].includes(col)) {
            return val === 't' || val === 'true';
        }

        if (['criterios_evaluacion', 'key_elements', 'justification_hints', 'likely_misconceptions', 'indicadores_detectados', 'metadata',
            's1_p2_plataformas', 's2_p7_estrategias', 's2_p8_fuentes_confianza', 's2_p9_sospecha_falsa',
            's1_p3_estrategias', 's1_p4_fuentes', 's1_p5_sospecha_falsa',
            's2_p10_probabilidad_verdad', 's1_p6_probabilidad_verdad'].includes(col)) {
            try { return JSON.parse(val); } catch (e) { return val; }
        }

        if (['curso_escolar'].includes(col) && typeof val === 'string') {
            // Tenta arreglar codificaciones extrañas comunes
            return val.replace('Âº', 'º').trim();
        }

        return val;
    }

    postProcess() {
        // Relationships can be resolved here if needed for optimization
        this.data.users = _.sortBy(this.data.users, 'id');
        this.data.sessions = _.sortBy(this.data.sessions, 'id');
    }
}
