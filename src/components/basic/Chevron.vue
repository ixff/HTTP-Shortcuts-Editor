<template>
    <icon :name="expanded ? 'chevron-down' : 'chevron-right'"/>
</template>

<script setup lang="ts">
import Icon from '@/components/basic/Icon.vue';

defineProps<{
    expanded?: boolean;
}>();
</script>
