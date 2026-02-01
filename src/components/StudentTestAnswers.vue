<script setup>
import { computed } from 'vue';
import { FileText, CheckCircle2, XCircle } from 'lucide-vue-next';

const props = defineProps({
  testType: {
    type: String,
    required: true // 'pre' or 'post'
  },
  data: {
    type: Object,
    default: null
  }
});

const formattedQuestions = computed(() => {
  if (!props.data) return [];
  
  const entries = Object.entries(props.data).filter(([key]) => 
    key !== 'session_id' && 
    key !== 'puntuacion_total' && 
    !key.endsWith('_puntos')
  );

  return entries.map(([key, value]) => {
     let label = key.replace(/s\d+_p\d+_/, '').replace(/_/g, ' ');
     return {
       key,
       label: label.charAt(0).toUpperCase() + label.slice(1),
       value: value,
       isArray: Array.isArray(value)
     };
  });
});

const score = computed(() => props.data?.puntuacion_total || 0);

</script>

<template>
  <div class="glass-card p-0 overflow-hidden border border-[var(--border-color)]">
    <div :class="['p-4 border-b border-[var(--border-color)] flex justify-between items-center', 
      testType === 'pre' ? 'bg-rose-500/10' : 'bg-emerald-500/10']">
      <h3 :class="['font-black uppercase tracking-wider text-sm flex items-center gap-2', 
        testType === 'pre' ? 'text-rose-500' : 'text-emerald-500']">
        <FileText :size="16" />
        {{ testType === 'pre' ? 'Pre-Test' : 'Post-Test' }}
      </h3>
      <span class="font-black text-lg">{{ score }} pts</span>
    </div>

    <div v-if="!data" class="p-8 text-center text-slate-400 italic text-sm">
      No hay datos registrados para este test.
    </div>

    <div v-else class="divide-y divide-[var(--border-color)] max-h-[500px] overflow-y-auto custom-scrollbar">
      <div v-for="q in formattedQuestions" :key="q.key" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
        <div class="text-[10px] font-bold text-slate-500 uppercase mb-1">{{ q.label }}</div>
        
        <div v-if="q.value === null || q.value === undefined" class="text-slate-400 italic text-sm">
           Sin respuesta
        </div>

        <div v-else-if="q.isArray" class="space-y-1">
           <div v-for="(item, idx) in q.value" :key="idx" class="text-sm flex items-start gap-2">
             <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
             <span class="text-[var(--text-main)]">{{ item }}</span>
           </div>
        </div>

        <div v-else class="text-sm font-medium text-[var(--text-main)]">
           {{ q.value }}
        </div>
      </div>
    </div>
  </div>
</template>
