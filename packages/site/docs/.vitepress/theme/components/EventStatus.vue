<script setup lang="ts">
import { IconGift } from '@tabler/icons-vue'
import { data } from '../../gift.data.ts'
import { STATUS } from '../status.ts'

const status = STATUS[data.state]
</script>

<template>
  <p class="event-status">
    <span class="badge" :class="status.tone">{{ status.label }}</span>
    <span v-if="data.submissionCount" class="count">
      已有 <strong>{{ data.submissionCount }}</strong> 份投稿
    </span>
    <span v-if="data.exchanged" class="count"><IconGift :size="16" /> 禮物已交換</span>
  </p>
</template>

<style scoped>
.event-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 20px 0 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid currentColor;
}

.badge::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.badge.open {
  color: var(--vp-c-brand-1);
}

.badge.open::before {
  animation: pulse 1.6s ease-in-out infinite;
}

.badge.soon {
  color: var(--gift-gold);
}

.badge.closed {
  color: var(--vp-c-text-3);
}

.count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.count strong {
  color: var(--vp-c-text-1);
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge.open::before {
    animation: none;
  }
}
</style>
