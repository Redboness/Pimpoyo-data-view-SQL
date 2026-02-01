<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import _ from 'lodash';

const props = defineProps({
  pretestData: Array,
  posttestData: Array
});

const stats = computed(() => {
  const validPre = props.pretestData.filter(p => p.puntuacion_total > 0);
  const validPost = props.posttestData.filter(p => p.puntuacion_total > 0);

  const hasPostData = validPost.length > 0;

  const avgPre = _.meanBy(validPre, 'puntuacion_total') || 0;
  const avgPost = hasPostData ? (_.meanBy(validPost, 'puntuacion_total') || 0) : null;
  
  // Sections Averages
  const strategiesPre = _.meanBy(validPre, 's2_estrategias_puntos') || 0;
  const strategiesPost = hasPostData ? (_.meanBy(validPost, 's1_estrategias_puntos') || 0) : 0;
  
  const practicePre = _.meanBy(validPre, 's3_practica_puntos') || 0;
  const practicePost = hasPostData ? (_.meanBy(validPost, 's3_practica_puntos') || 0) : 0;

  return {
    avgPre,
    avgPost,
    improvement: avgPost !== null ? (avgPost - avgPre) : null,
    strategiesPre,
    strategiesPost,
    practicePre,
    practicePost,
    hasPostData
  };
});

const chartData = computed(() => {
  return {
    labels: ['Puntuación Total', 'Estrategias', 'Práctica'],
    datasets: [
      {
        label: 'Pre-Test',
        backgroundColor: '#f43f5e', // rose-500
        data: [stats.value.avgPre, stats.value.strategiesPre, stats.value.practicePre],
        borderRadius: 4
      },
      {
        label: 'Post-Test',
        backgroundColor: '#10b981', // emerald-500
        data: [stats.value.avgPost, stats.value.strategiesPost, stats.value.practicePost],
        borderRadius: 4
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'top',
      labels: {
        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
        font: {
          family: 'Inter, sans-serif',
          weight: 'bold'
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      },
      ticks: {
        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'
      }
    }
  }
}));
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
     <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-6 border-l-4 border-rose-500">
           <div class="text-xs font-black uppercase tracking-wider text-rose-500 mb-2">Promedio Pre-Test</div>
           <div class="text-4xl font-black text-[var(--text-main)]">{{ stats.avgPre.toFixed(1) }}</div>
           <div class="text-xs text-slate-500 font-bold mt-1">Puntuación Base</div>
        </div>
        <div class="glass-card p-6 border-l-4 border-emerald-500">
           <div class="text-xs font-black uppercase tracking-wider text-emerald-500 mb-2">Promedio Post-Test</div>
           <div class="text-4xl font-black text-[var(--text-main)]">
             {{ stats.avgPost !== null ? stats.avgPost.toFixed(1) : '--' }}
           </div>
           <div class="text-xs text-slate-500 font-bold mt-1">Puntuación Final</div>
        </div>
        <div class="glass-card p-6 border-l-4 border-indigo-500">
           <div class="text-xs font-black uppercase tracking-wider text-indigo-500 mb-2">Mejora General</div>
           <div class="text-4xl font-black text-indigo-500" v-if="stats.improvement !== null">
             {{ stats.improvement > 0 ? '+' : '' }}{{ stats.improvement.toFixed(1) }}
           </div>
           <div class="text-4xl font-black text-slate-400" v-else>--</div>
           <div class="text-xs text-slate-500 font-bold mt-1">Puntos incrementados</div>
        </div>
     </div>

     <div class="glass-card p-6">
       <div class="flex items-center justify-between mb-6">
         <h3 class="text-xl font-black text-[var(--text-main)]">Comparativa de Rendimiento</h3>
       </div>
       <div class="h-80">
         <Bar :data="chartData" :options="chartOptions" />
       </div>
     </div>
  </div>
</template>
