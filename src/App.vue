<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { SqlParser } from './utils/SqlParser';
import { Upload, PieChart, Users, BookOpen, MessageSquare, LayoutDashboard, Brain, Award, ChevronRight, Sun, Moon, Info, BarChart3, LineChart } from 'lucide-vue-next';
import PrePostStats from './components/PrePostStats.vue';
import StudentTestAnswers from './components/StudentTestAnswers.vue';
import AnalyticsView from './components/AnalyticsView.vue';
import { Bar } from 'vue-chartjs';
import _ from 'lodash';

const dbData = ref(null);
const isParsing = ref(false);
const activeTab = ref('dashboard');
const selectedClass = ref(null);
const selectedUser = ref(null);
const isDark = ref(localStorage.getItem('theme') === 'dark');

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

watchEffect(() => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

const parser = new SqlParser();

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isParsing.value = true;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = e.target.result;
    dbData.value = await parser.parse(text);
    isParsing.value = false;
  };
  reader.readAsText(file);
};

// Computed stats
const stats = computed(() => {
  if (!dbData.value) return {};
  const validSessions = dbData.value.sessions.filter(s => s.precision_global > 0);
  return {
    totalStudents: dbData.value.users.length,
    totalSessions: dbData.value.sessions.length,
    totalInteractions: dbData.value.interactions.length,
    globalAccuracy: _.meanBy(validSessions, 'precision_global') || 0
  };
});

const classes = computed(() => {
  if (!dbData.value) return [];
  const uniqClasses = _.uniq(dbData.value.users.map(u => u.curso_escolar)).filter(Boolean);
  return uniqClasses.map(cls => {
    const classUsers = dbData.value.users.filter(u => u.curso_escolar === cls);
    const classSessions = dbData.value.sessions.filter(s => classUsers.some(u => u.id === s.user_id));
    const validClassSessions = classSessions.filter(s => s.precision_global > 0);
    return {
      name: cls,
      studentCount: classUsers.length,
      avgAccuracy: (_.meanBy(validClassSessions, 'precision_global') || 0)
    };
  });
});

const chartData = computed(() => {
  if (!dbData.value) return null;
  return {
    labels: classes.value.map(c => c.name),
    datasets: [
      {
        label: 'Precisión Media (%)',
        backgroundColor: '#6366f1',
        data: classes.value.map(c => c.avgAccuracy)
      }
    ]
  };
});

const filteredStudents = computed(() => {
  if (!dbData.value) return [];
  let students = dbData.value.users;
  if (selectedClass.value) {
    students = students.filter(u => u.curso_escolar === selectedClass.value);
  }
  return _.orderBy(students, ['xp_actual'], ['desc']);
});

const userDetails = computed(() => {
  if (!selectedUser.value || !dbData.value) return null;
  const user = dbData.value.users.find(u => u.id === selectedUser.value);
  const sessions = dbData.value.sessions.filter(s => s.user_id === selectedUser.value);
  const interactions = dbData.value.interactions.filter(i => sessions.some(s => s.id === i.session_id));
  
  // Chat messages are related to sessions via chat_sessions_news
  const chatSessionsNews = dbData.value.chat_sessions_news || [];
  const userChatSessions = chatSessionsNews.filter(cs => sessions.some(s => s.id === cs.session_id));
  
  const conversations = userChatSessions.map(cs => {
    const sessionMessages = _.sortBy(
      dbData.value.chat_messages.filter(m => m.chat_session_id === cs.id),
      'orden'
    );
    return {
      id: cs.id,
      noticiaId: cs.noticia_external_id,
      messages: sessionMessages
    };
  }).filter(conv => conv.messages.length > 0);
  
  const pretest = dbData.value.pretest_results.find(p => sessions.some(s => s.id === p.session_id));
  const posttest = dbData.value.posttest_results.find(p => sessions.some(s => s.id === p.session_id));
  
  return { ...user, sessions, interactions, conversations, pretest, posttest };
});

const selectUser = (userId) => {
  selectedUser.value = userId;
  activeTab.value = 'student';
};
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
    <header class="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-black title-gradient mb-1">PIMPOYO DATA EXPLORER</h1>
        <p class="text-slate-400 font-medium">Panel de Investigación & Análisis Cognitivo</p>
      </div>
      
      <div class="flex items-center gap-4">
        <button @click="toggleTheme" class="p-2.5 rounded-xl bg-[var(--bg-nav)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-[var(--border-color)]">
          <Sun v-if="isDark" :size="20" />
          <Moon v-else :size="20" />
        </button>
        <label v-if="!dbData" class="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <Upload :size="18" />
          Importar Backup SQL
          <input type="file" @change="handleFileUpload" class="hidden" accept=".sql" />
        </label>
        <button v-else @click="dbData = null" class="text-slate-500 hover:text-[var(--text-main)] text-sm transition font-semibold">Cargar otro archivo</button>
      </div>
    </header>

    <div v-if="isParsing" class="flex flex-col items-center justify-center h-96 glass-card">
      <div class="relative w-16 h-16 mb-6">
        <div class="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p class="text-lg font-bold">Analizando Base de Datos PostgreSQL...</p>
      <p class="text-slate-500 text-sm mt-2">Esto puede tardar unos segundos dependiendo del tamaño</p>
    </div>

    <main v-else-if="dbData">
      <nav class="flex gap-1 p-1 bg-[var(--bg-nav)] rounded-xl mb-8 w-fit border border-[var(--border-color)]">
        <button v-for="tab in ['dashboard', 'analytics', 'classes', 'students', 'tests']" :key="tab"
          @click="activeTab = tab" 
          :class="['flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all', 
          activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800']"
        >
          <component :is="tab === 'dashboard' ? LayoutDashboard : tab === 'analytics' ? LineChart : tab === 'classes' ? BookOpen : tab === 'students' ? Users : BarChart3" :size="16" />
          {{ tab === 'dashboard' ? 'Métricas' : tab === 'analytics' ? 'Analítica' : tab === 'classes' ? 'Clases' : tab === 'students' ? 'Alumnos' : 'Tests' }}
        </button>
      </nav>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'" class="space-y-6">
        <AnalyticsView :dbData="dbData" />
      </div>

      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="glass-card p-6 border-l-4 border-indigo-500">
            <div class="flex items-center gap-3 text-indigo-500 dark:text-indigo-400 mb-2">
              <Users :size="20" /> <span class="text-xs font-black uppercase tracking-wider">Estudiantes</span>
            </div>
            <p class="text-4xl font-black text-[var(--text-main)]">{{ stats.totalStudents }}</p>
          </div>
          <div class="glass-card p-6 border-l-4 border-emerald-500">
            <div class="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
              <Award :size="20" /> <span class="text-xs font-black uppercase tracking-wider">Precisión Media</span>
            </div>
            <p class="text-4xl font-black text-[var(--text-main)]">{{ stats.globalAccuracy.toFixed(1) }}%</p>
          </div>
          <div class="glass-card p-6 border-l-4 border-amber-500">
            <div class="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-2">
              <Brain :size="20" /> <span class="text-xs font-black uppercase tracking-wider">Interacciones</span>
            </div>
            <p class="text-4xl font-black text-[var(--text-main)]">{{ stats.totalInteractions }}</p>
          </div>
          <div class="glass-card p-6 border-l-4 border-rose-500">
            <div class="flex items-center gap-3 text-rose-500 dark:text-rose-400 mb-2">
              <BookOpen :size="20" /> <span class="text-xs font-black uppercase tracking-wider">Cursos Activos</span>
            </div>
            <p class="text-4xl font-black text-[var(--text-main)]">{{ classes.length }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="glass-card p-6">
            <h3 class="text-xl font-black mb-6 flex items-center gap-2"><PieChart :size="20" class="text-indigo-400" /> Rendimiento por Clase</h3>
            <div class="h-64">
              <Bar :data="chartData" :options="{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: { 
                  y: { 
                    min: 0, 
                    max: 100, 
                    grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' }
                  }
                } 
              }" />
            </div>
          </div>
          <div class="glass-card p-6">
            <h3 class="text-xl font-black mb-6 flex items-center gap-2"><Award :size="20" class="text-emerald-400" /> Top Estudiantes (XP)</h3>
            <div class="space-y-4">
            <div v-for="(user, i) in _.take(filteredStudents, 5)" :key="user.id" class="flex items-center justify-between p-3 bg-[var(--bg-nav)] rounded-xl border border-[var(--border-color)]">
                <div class="flex items-center gap-4">
                  <span class="w-6 text-slate-500 font-bold">#{{ i+1 }}</span>
                  <span class="font-bold">{{ user.nickname }}</span>
                </div>
                <span class="text-indigo-500 dark:text-indigo-400 font-black">{{ user.xp_actual }} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Classes Tab -->
      <div v-if="activeTab === 'classes'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="cls in classes" :key="cls.name" 
          @click="selectedClass = cls.name; activeTab = 'students'"
          class="glass-card p-8 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer group border-t-4 border-indigo-500/30 hover:border-indigo-500"
        >
          <div class="flex justify-between items-start mb-6">
            <h3 class="text-2xl font-black group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition text-[var(--text-main)]">{{ cls.name }}</h3>
            <ChevronRight :size="20" class="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white transition" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase">Alumnos</p>
              <p class="text-2xl font-black text-[var(--text-main)]">{{ cls.studentCount }}</p>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase">Prec Media</p>
              <div v-if="cls.avgAccuracy > 0" class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {{ cls.avgAccuracy.toFixed(1) }}%
              </div>
              <div v-else class="flex items-center gap-1.5 mt-1 group/info relative">
                <span class="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">Solo tests</span>
                <Info :size="14" class="text-slate-400 cursor-help" />
                <!-- Tooltip -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800/95 backdrop-blur-md text-white text-[11px] rounded-lg shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all duration-200 pointer-events-none z-[100] text-center leading-relaxed border border-slate-700/50 scale-95 group-hover/info:scale-100">
                    Esta clase solo ha realizado las evaluaciones (test inicial/final) sin utilizar las dinámicas de juego de Pimpoyo.
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800/95"></div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Tab -->
      <div v-if="activeTab === 'students' || activeTab === 'student'" class="space-y-6">
        <div class="flex justify-between items-end">
           <div class="flex gap-4">
              <button v-if="activeTab === 'student'" @click="activeTab = 'students'" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
                Volver al listado
              </button>
           </div>
           <div v-if="activeTab === 'students'" class="flex items-center gap-4">
              <span class="text-xs font-bold text-slate-500 uppercase">Filtrar por Clase</span>
              <select v-model="selectedClass" class="bg-[var(--bg-card)] text-[var(--text-main)] px-4 py-2 rounded-lg border border-[var(--border-color)] font-bold focus:ring-2 focus:ring-primary outline-none">
                <option :value="null">Todas las clases</option>
                <option v-for="cls in classes" :value="cls.name">{{ cls.name }}</option>
              </select>
           </div>
        </div>

        <div v-if="activeTab === 'students'" class="glass-card overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-[var(--bg-nav)] text-slate-500 text-xs font-black uppercase tracking-widest border-b border-[var(--border-color)]">
              <tr>
                <th class="p-6">Estudiante</th>
                <th class="p-6">Clase</th>
                <th class="p-6 text-center">Edad</th>
                <th class="p-6 text-center">Puntos XP</th>
                <th class="p-6"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr v-for="user in filteredStudents" :key="user.id" class="hover:bg-slate-800/30 transition">
                <td class="p-6">
                  <div class="font-black text-lg">{{ user.nickname }}</div>
                  <div class="text-xs text-slate-500">{{ user.id }}</div>
                </td>
                <td class="p-6">
                  <span class="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-black">{{ user.curso_escolar }}</span>
                </td>
                <td class="p-6 text-center font-bold text-slate-300">{{ user.edad }}</td>
                <td class="p-6 text-center">
                  <div class="font-black text-primary">{{ user.xp_actual }}</div>
                </td>
                <td class="p-6 text-right">
                  <button @click="selectUser(user.id)" class="bg-[var(--bg-nav)] hover:bg-primary hover:text-white text-[var(--text-main)] p-2.5 rounded-xl transition shadow-sm border border-[var(--border-color)]">
                    <ChevronRight :size="20" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Detail Student Sub-tab -->
        <div v-if="activeTab === 'student' && userDetails" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1 space-y-6">
            <div class="glass-card p-8 border-t-4 border-primary">
              <h2 class="text-3xl font-black mb-6">{{ userDetails.nickname }}</h2>
              <div class="space-y-4">
                <div class="flex justify-between border-b border-[var(--border-color)] pb-3">
                  <span class="text-slate-500 font-bold uppercase text-xs">Curso</span>
                  <span class="font-black">{{ userDetails.curso_escolar }}</span>
                </div>
                <div class="flex justify-between border-b border-[var(--border-color)] pb-3">
                  <span class="text-slate-500 font-bold uppercase text-xs">Edad</span>
                  <span class="font-black">{{ userDetails.edad }}</span>
                </div>
                <div class="flex justify-between border-b border-[var(--border-color)] pb-3">
                  <span class="text-slate-500 font-bold uppercase text-xs">XP Totales</span>
                  <span class="font-black text-indigo-500 dark:text-indigo-400">{{ userDetails.xp_actual }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-bold uppercase text-xs">Aciertos/Total</span>
                  <span class="font-black">{{ userDetails.sessions.reduce((a,b) => a+b.aciertos_totales, 0) }}/{{ userDetails.sessions.reduce((a,b) => a+b.interacciones_totales, 0) }}</span>
                </div>
              </div>

            <div class="glass-card p-6 border-t-4 border-emerald-500">
               <h3 class="font-black mb-4 flex items-center gap-2"><BarChart3 :size="18" class="text-emerald-400" /> Resultados Tests</h3>
               <div class="space-y-3">
                 <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-500 uppercase">Pre-Test</span>
                    <span v-if="userDetails.pretest" class="font-black text-rose-500">{{ userDetails.pretest.puntuacion_total }} pts</span>
                    <span v-else class="text-xs text-slate-400 italic">No realizado</span>
                 </div>
                 <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-500 uppercase">Post-Test</span>
                    <span v-if="userDetails.posttest" class="font-black text-emerald-500">{{ userDetails.posttest.puntuacion_total }} pts</span>
                    <span v-else class="text-xs text-slate-400 italic">No realizado</span>
                 </div>
                 <div v-if="userDetails.pretest && userDetails.posttest" class="pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-500 uppercase">Mejora</span>
                    <span class="font-black text-indigo-500 text-lg">{{ (userDetails.posttest.puntuacion_total - userDetails.pretest.puntuacion_total) > 0 ? '+' : '' }}{{ (userDetails.posttest.puntuacion_total - userDetails.pretest.puntuacion_total).toFixed(1) }}</span>
                 </div>
               </div>
            </div>
            </div>
            
            <div class="glass-card p-6">
              <h3 class="font-black mb-6 flex items-center gap-2"><MessageSquare :size="18" class="text-indigo-400" /> Sesiones de Chat</h3>
              <div class="h-[500px] overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                <div v-for="conv in userDetails.conversations" :key="conv.id" class="space-y-4">
                  <div class="flex items-center gap-2 px-2">
                    <div class="h-px flex-1 bg-[var(--border-color)]"></div>
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Noticia #{{ conv.noticiaId }}</span>
                    <div class="h-px flex-1 bg-[var(--border-color)]"></div>
                  </div>
                  <div v-for="msg in conv.messages" :key="msg.id" :class="['p-4 rounded-2xl text-sm leading-relaxed shadow-md transition-all hover:scale-[1.01]', 
                    msg.emisor === 'usuario' ? 'bg-indigo-600 ml-8 text-white rounded-br-none' : 'bg-[var(--bg-nav)] mr-8 text-[var(--text-main)] rounded-bl-none border border-[var(--border-color)]']"
                  >
                    {{ msg.contenido }}
                  </div>
                </div>
                <div v-if="!userDetails.conversations.length" class="text-slate-500 text-center py-20 italic border-2 border-dashed border-[var(--border-color)] rounded-2xl">
                  No hay diálogos registrados para este alumno
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 space-y-6">
            <!-- New Test Answers Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StudentTestAnswers testType="pre" :data="userDetails.pretest" />
                <StudentTestAnswers testType="post" :data="userDetails.posttest" />
            </div>

            <div class="glass-card overflow-hidden">
               <div class="p-6 bg-[var(--bg-nav)] border-b border-[var(--border-color)]">
                  <h3 class="text-xl font-black flex items-center gap-2"><Brain :size="20" class="text-emerald-400" /> Registro Cognitivo</h3>
               </div>
               <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-[var(--bg-nav)] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-[var(--border-color)]">
                    <tr>
                      <th class="p-6">Respuesta del Alumno</th>
                      <th class="p-6 text-center">Correcto</th>
                      <th class="p-6 text-center">Puntos</th>
                      <th class="p-6">Tipo de Error Detectado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[var(--border-color)]">
                    <tr v-for="inter in userDetails.interactions" :key="inter.id" class="hover:bg-slate-500/5 transition">
                      <td class="p-6 pb-2">
                        <div class="font-medium text-[var(--text-main)] mb-1 max-w-sm truncate">{{ inter.respuesta_usuario }}</div>
                        <div class="text-[10px] text-slate-500 uppercase font-bold">{{ inter.tipo_interaccion }}</div>
                      </td>
                      <td class="p-6 text-center">
                        <span :class="['px-3 py-1 rounded-full text-[10px] font-black', inter.es_correcto ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400']">
                          {{ inter.es_correcto ? 'SÍ' : 'NO' }}
                        </span>
                      </td>
                      <td class="p-6 text-center font-black text-indigo-400">+{{ inter.puntos_otorgados }}</td>
                      <td class="p-6 text-xs font-bold text-slate-400">{{ inter.tipo_error || '---' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tests Tab -->
      <div v-if="activeTab === 'tests'" class="space-y-6">
        <PrePostStats :pretestData="dbData.pretest_results" :posttestData="dbData.posttest_results" />
      </div>
    </main>

    <div v-else class="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-3xl mx-auto glass-card p-12 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
      <div class="w-24 h-24 bg-indigo-600/20 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-2xl">
        <LayoutDashboard :size="48" class="text-indigo-500" />
      </div>
      <h2 class="text-4xl md:text-5xl font-black mb-6 tracking-tight text-[var(--text-main)]">Análisis de Datos <span class="title-gradient">Pimpoyo</span></h2>
      <p class="text-slate-500 dark:text-slate-400 text-lg mb-10 leading-relaxed font-medium">Esta herramienta permite a investigadores analizar el desempeño cognitivo de los estudiantes procesando directamente los archivos de respaldo del sistema. <strong>Privacidad total:</strong> el archivo SQL nunca sale de tu ordenador.</p>
      
      <label class="btn-primary flex items-center gap-3 px-8 py-4 text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-600/40">
        <Upload :size="24" />
        Comenzar Análisis
        <input type="file" @change="handleFileUpload" class="hidden" accept=".sql" />
      </label>
    </div>

    <footer class="mt-20 text-center text-slate-500 dark:text-slate-600 text-xs font-bold uppercase tracking-widest pb-10">
      &copy; 2026 Pimpoyo Research Environment &bull; Analítica Avanzada
    </footer>
  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
