<template>
    <div class="icon">
        <div class="icon__icon" :style="style" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    name: string;
}>();

const style = computed(() => ({
    'background-image': `url('assets/icons/${props.name}.svg')`,
}));
</script>

<style lang="sass" scoped>
.icon
    box-sizing: content-box

    &__icon
        width: 100%
        height: 100%
        background-repeat: no-repeat
        background-position: center
</style>
