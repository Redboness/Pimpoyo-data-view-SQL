<script setup>
import { ref, computed } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement } from 'chart.js';
import { Filter, Users, Brain, Award, TrendingUp } from 'lucide-vue-next';
import _ from 'lodash';

// ChartJS registration is handled globally in main.js, but explicit imports help with composition

const props = defineProps({
  dbData: {
    type: Object,
    required: true
  }
});

// Filters
const selectedClasses = ref([]);
const selectedGender = ref('all');
const ageRange = ref({ min: 0, max: 100 });

// Extract unique values for filters
const availableClasses = computed(() => {
  return _.uniq(props.dbData.users.map(u => u.curso_escolar)).filter(Boolean).sort();
});

const availableGenders = computed(() => {
  return _.uniq(props.dbData.users.map(u => u.genero)).filter(Boolean).sort();
});

const minMaxAge = computed(() => {
  const ages = props.dbData.users.map(u => u.edad).filter(a => a > 0);
  return { min: _.min(ages) || 6, max: _.max(ages) || 18 };
});

// Initialize filters once data is loaded
const initFilters = () => {
  if (selectedClasses.value.length === 0) selectedClasses.value = availableClasses.value;
  ageRange.value = { ...minMaxAge.value };
};
// Trigger init if needed, or rely on user interaction. 
// Better to default to "All" implicitly if empty, or pre-fill.
// Let's pre-fill filter on mount/watch if empty
if (availableClasses.value.length > 0 && selectedClasses.value.length === 0) {
    selectedClasses.value = []; // Empty means "All" in our logic below usually, but let's be explicit
}

// Filter Logic
const filteredUsers = computed(() => {
  return props.dbData.users.filter(user => {
    const classMatch = selectedClasses.value.length === 0 || selectedClasses.value.includes(user.curso_escolar);
    
    // Debugging specific class issues
    if (user.curso_escolar.includes('1ºB') && selectedClasses.value.length > 0) {
        // console.log(`User ${user.nickname} (${user.curso_escolar}) Match: ${classMatch}`);
    }

    const genderMatch = selectedGender.value === 'all' || user.genero === selectedGender.value;
    const ageMatch = user.edad >= ageRange.value.min && user.edad <= ageRange.value.max;
    return classMatch && genderMatch && ageMatch;
  });
});

const filteredUserIds = computed(() => new Set(filteredUsers.value.map(u => u.id)));

const filteredSessions = computed(() => {
  return props.dbData.sessions.filter(s => filteredUserIds.value.has(s.user_id) && s.precision_global > 0);
});

const filteredPreTests = computed(() => {
  // Find pretests belonging to filtered sessions/users
  // Pretests link to sessions, sessions link to users
  return props.dbData.pretest_results.filter(pt => {
      // We need to resolve session -> user
      const session = props.dbData.sessions.find(s => s.id === pt.session_id);
      return session && filteredUserIds.value.has(session.user_id) && pt.puntuacion_total > 0;
  });
});

const filteredPostTests = computed(() => {
   return props.dbData.posttest_results.filter(pt => {
      const session = props.dbData.sessions.find(s => s.id === pt.session_id);
      return session && filteredUserIds.value.has(session.user_id) && pt.puntuacion_total > 0;
  });
});

// Stats Cards
const stats = computed(() => {
  const users = filteredUsers.value;
  const sessions = filteredSessions.value;
  
  const avgPrecision = sessions.length ? (_.meanBy(sessions, 'precision_global') || 0) : 0;
  const avgPre = filteredPreTests.value.length ? (_.meanBy(filteredPreTests.value, 'puntuacion_total') || 0) : 0;
  
  // Only calculate post avg if we actually have post tests
  const avgPost = filteredPostTests.value.length ? (_.meanBy(filteredPostTests.value, 'puntuacion_total') || 0) : null;
  
  // Improvement only valid if we have both pre and post data representation
  const improvement = (avgPre > 0 && avgPost !== null) ? (avgPost - avgPre) : null;
  
  return {
    userCount: users.length,
    avgPrecision,
    avgPre,
    avgPost: avgPost || 0, // Fallback for chart
    improvement
  };
});

// Charts
const charts = computed(() => {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  
  // 1. Gender Distribution
  const genderCounts = _.countBy(filteredUsers.value, 'genero');
  const genderData = {
    labels: Object.keys(genderCounts),
    datasets: [{
      data: Object.values(genderCounts),
      backgroundColor: ['#6366f1', '#ec4899', '#8b5cf6', '#10b981'],
      borderWidth: 0
    }]
  };

  // 2. Performance by Age
  // Group sessions by user age
  const performanceByAge = _(filteredSessions.value)
    .map(s => {
        const user = props.dbData.users.find(u => u.id === s.user_id);
        return { age: user?.edad, prec: s.precision_global };
    })
    .filter(d => d.age)
    .groupBy('age')
    .mapValues(group => _.meanBy(group, 'prec'))
    .value();
    
  const ageData = {
    labels: Object.keys(performanceByAge),
    datasets: [{
        label: 'Precisión Global por Edad',
        data: Object.values(performanceByAge),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        tension: 0.4,
        fill: true
    }]
  };

  // 3. Pre vs Post Comparison (Aggregated)
  const improvementData = {
    labels: ['Puntuación Promedio'],
    datasets: [
        { label: 'Pre-Test', data: [stats.value.avgPre], backgroundColor: '#f43f5e', borderRadius: 4 },
        { label: 'Post-Test', data: [stats.value.avgPost], backgroundColor: '#10b981', borderRadius: 4 }
    ]
  };

  // 4. Class Comparison Bar Chart
  // Calculate stats for EACH available class, respecting the OTHER filters (Gender, Age)
  const classStats = availableClasses.value.map(cls => {
      const usersInClass = props.dbData.users.filter(u => 
        u.curso_escolar === cls &&
        (selectedGender.value === 'all' || u.genero === selectedGender.value) &&
        (u.edad >= ageRange.value.min && u.edad <= ageRange.value.max)
      );
      
      const userIds = new Set(usersInClass.map(u => u.id));
      
      const preTests = props.dbData.pretest_results.filter(pt => {
         const session = props.dbData.sessions.find(s => s.id === pt.session_id);
         return session && userIds.has(session.user_id) && pt.puntuacion_total > 0;
      });
      
      const postTests = props.dbData.posttest_results.filter(pt => {
         const session = props.dbData.sessions.find(s => s.id === pt.session_id);
         return session && userIds.has(session.user_id) && pt.puntuacion_total > 0;
      });
      
      return {
          class: cls,
          avgPre: _.meanBy(preTests, 'puntuacion_total') || 0,
          avgPost: postTests.length ? (_.meanBy(postTests, 'puntuacion_total') || 0) : null
      };
  }).filter(c => c.avgPre > 0 || c.avgPost !== null); // Only show classes with data

  const classComparisonData = {
    labels: classStats.map(c => c.class),
    datasets: [
        { label: 'Pre-Test', data: classStats.map(c => c.avgPre), backgroundColor: '#f43f5e', borderRadius: 4 },
        { label: 'Post-Test', data: classStats.map(c => c.avgPost), backgroundColor: '#10b981', borderRadius: 4 }
    ]
  };

  // 5. Effective Score Comparison (The "Post vs Pre-only" chart)
  // Logic: Use Post-test avg if available, otherwise Pre-test avg.
  const effectiveScoreData = {
      labels: classStats.map(c => c.class),
      datasets: [{
          label: 'Puntuación Efectiva',
          data: classStats.map(c => c.avgPost !== null ? c.avgPost : c.avgPre),
          backgroundColor: classStats.map(c => c.avgPost !== null ? '#10b981' : '#f43f5e'), // Green if Post, Rose if Pre
          borderRadius: 4
      }]
  };

  // 6. Grade Level Specific Comparisons (Dynamic)
  // Group classStats by their "Grade" prefix (e.g., "5º", "6º", "1º", "2º")
  const gradeGroups = _.groupBy(classStats, (stat) => {
      const match = stat.class.match(/^(\d+º)/); 
      return match ? match[1] : 'Otros';
  });

  const gradeLevelCharts = Object.entries(gradeGroups).map(([grade, stats]) => {
      // Sort stats by class name A->Z
      const sortedStats = _.sortBy(stats, 'class');
      return {
          id: grade,
          title: `Comparativa ${grade}`,
          data: {
              labels: sortedStats.map(s => s.class),
              datasets: [
                  { 
                    label: 'Pre-Test', 
                    data: sortedStats.map(s => s.avgPre), 
                    backgroundColor: '#f43f5e', 
                    borderRadius: 4 
                  },
                  { 
                    label: 'Post-Test', 
                    data: sortedStats.map(s => s.avgPost), 
                    backgroundColor: '#10b981', 
                    borderRadius: 4 
                  }
              ]
          }
      };
  }).filter(g => g.data.labels.length > 0); // Ensure meaningful charts

  return {
      genderData,
      ageData,
      improvementData,
      classComparisonData,
      effectiveScoreData,
      gradeLevelCharts,
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor } } },
          scales: {
              y: { grid: { color: gridColor }, ticks: { color: textColor } },
              x: { grid: { display: false }, ticks: { color: textColor } }
          }
      },
      doughnutOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: textColor } } }
      }
  };
});

// Helper for resetting filters
const resetFilters = () => {
    selectedClasses.value = [];
    selectedGender.value = 'all';
    ageRange.value = { ...minMaxAge.value };
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Filters Bar -->
    <div class="glass-card p-6 border-b border-[var(--border-color)]">
       <div class="flex flex-col md:flex-row gap-6 items-end">
          
          <div class="flex-1 space-y-2 w-full">
            <label class="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                <Filter :size="14" /> Filtrar por Clase
            </label>
            <div class="flex flex-wrap gap-2">
                <button 
                  @click="selectedClasses = []"
                  :class="['px-3 py-1.5 rounded-lg text-xs font-bold border transition', 
                  selectedClasses.length === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[var(--bg-nav)] text-slate-500 border-[var(--border-color)] hover:border-indigo-400']">
                  Todas
                </button>
                <button v-for="cls in availableClasses" :key="cls"
                   @click="selectedClasses.includes(cls) ? selectedClasses = selectedClasses.filter(c => c !== cls) : selectedClasses.push(cls)"
                   :class="['px-3 py-1.5 rounded-lg text-xs font-bold border transition',
                   selectedClasses.includes(cls) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[var(--bg-nav)] text-slate-500 border-[var(--border-color)] hover:border-indigo-400']"
                >
                   {{ cls }}
                </button>
            </div>
          </div>

          <div class="md:w-48 space-y-2 w-full">
             <label class="text-xs font-black text-slate-500 uppercase">Género</label>
             <select v-model="selectedGender" class="w-full bg-[var(--bg-nav)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="all">Todos</option>
                <option v-for="g in availableGenders" :key="g" :value="g">{{ g }}</option>
             </select>
          </div>

          <div class="md:w-64 space-y-2 w-full">
             <div class="flex justify-between">
                <label class="text-xs font-black text-slate-500 uppercase">Edad ({{ ageRange.min }} - {{ ageRange.max }})</label>
                <button @click="ageRange = { ...minMaxAge }" class="text-[10px] text-indigo-500 hover:text-indigo-400 font-bold">Reset</button>
             </div>
             <div class="flex items-center gap-4 px-2">
                <input type="number" :min="6" :max="18" v-model.number="ageRange.min" class="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center">
                <span class="text-slate-400 font-bold">-</span>
                <input type="number" :min="6" :max="18" v-model.number="ageRange.max" class="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center">
             </div>
          </div>
       </div>
    </div>

    <!-- Summary Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="glass-card p-6 flex flex-col justify-between">
            <span class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Muestra Filtrada</span>
            <div class="flex items-baseline gap-2">
                <span class="text-4xl font-black text-[var(--text-main)]">{{ stats.userCount }}</span>
                <span class="text-sm font-bold text-slate-400">usuarios</span>
            </div>
        </div>
        
        <div class="glass-card p-6 flex flex-col justify-between border-l-4 border-indigo-500">
            <span class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Precisión Media</span>
             <span class="text-4xl font-black text-[var(--text-main)]">{{ stats.avgPrecision.toFixed(1) }}%</span>
             <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-indigo-500" :style="{ width: stats.avgPrecision + '%' }"></div>
             </div>
        </div>

        <div class="glass-card p-6 flex flex-col justify-between border-l-4 border-emerald-500">
            <span class="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Mejoría Tests</span>
             <span class="text-4xl font-black text-[var(--text-main)]" v-if="stats.improvement !== null">
                {{ stats.improvement > 0 ? '+' : '' }}{{ stats.improvement.toFixed(1) }}
             </span>
             <span class="text-4xl font-black text-slate-400" v-else>--</span>
             <span class="text-xs font-bold text-slate-400">Puntos de diferencia</span>
        </div>

        <div class="glass-card p-6 flex flex-col justify-between border-l-4 border-amber-500">
             <span class="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Edad Promedio</span>
             <span class="text-4xl font-black text-[var(--text-main)]">{{ (stats.userCount > 0 ? (_.meanBy(filteredUsers, 'edad') || 0).toFixed(1) : 0) }}</span>
             <span class="text-xs font-bold text-slate-400">Años</span>
        </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       
       <!-- Chart 1: Distribution -->
       <div class="glass-card p-6 flex flex-col">
          <h3 class="font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
             <Users :size="18" class="text-indigo-400" /> Distribución por Género
          </h3>
          <div class="flex-1 min-h-[250px] relative">
             <Doughnut :data="charts.genderData" :options="charts.doughnutOptions" />
             <div v-if="filteredUsers.length === 0" class="absolute inset-0 flex items-center justify-center text-slate-400 font-medium bg-[var(--bg-card)]/80 backdrop-blur-sm">No data</div>
          </div>
       </div>

       <!-- Chart 2: Age Performance -->
       <div class="glass-card p-6 flex flex-col lg:col-span-2">
          <h3 class="font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
             <TrendingUp :size="18" class="text-amber-500" /> Precisión por Edad
          </h3>
          <div class="flex-1 min-h-[250px] relative">
             <Line :data="charts.ageData" :options="charts.options" />
             <div v-if="filteredUsers.length === 0" class="absolute inset-0 flex items-center justify-center text-slate-400 font-medium bg-[var(--bg-card)]/80 backdrop-blur-sm">No data</div>
          </div>
       </div>

       <div class="glass-card p-6 flex flex-col lg:col-span-3">
          <h3 class="font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
             <Award :size="18" class="text-emerald-500" /> Impacto Educativo (Pre vs Post)
          </h3>
          <div class="flex-1 min-h-[300px] relative">
             <Bar :data="charts.improvementData" :options="charts.options" />
          </div>
       </div>

       <!-- Chart 4: Class Comparison -->
       <div class="glass-card p-6 flex flex-col lg:col-span-3">
          <h3 class="font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
             <Filter :size="18" class="text-indigo-500" /> Comparativa por Clase
          </h3>
          <div class="flex-1 min-h-[300px] relative">
             <Bar :data="charts.classComparisonData" :options="charts.options" />
          </div>
       </div>

       <!-- Chart 5: Effective Score Comparison -->
       <div class="glass-card p-6 flex flex-col lg:col-span-3">
          <h3 class="font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
             <TrendingUp :size="18" class="text-indigo-500" /> Rendimiento: Post-Test (Exp) vs Pre-Test (Control)
          </h3>
           <p class="text-xs text-slate-400 mb-4 font-bold">
              Compara el resultado final de las clases. Si hay Post-test (Verde), se usa ese valor. Si no (Rojo), se usa el Pre-test.
           </p>
          <div class="flex-1 min-h-[300px] relative">
             <Bar :data="charts.effectiveScoreData" :options="charts.options" />
          </div>

       </div>

       <!-- Dynamic Grade Level Charts -->
       <div v-for="chart in charts.gradeLevelCharts" :key="chart.id" class="glass-card p-6 flex flex-col lg:col-span-3">
          <h3 class="font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
             <Brain :size="18" class="text-indigo-400" /> {{ chart.title }}
          </h3>
          <div class="flex-1 min-h-[300px] relative">
             <Bar :data="chart.data" :options="charts.options" />
          </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: specific slider styling if needed, but standard tailwind accent works well in modern browsers */
</style>
