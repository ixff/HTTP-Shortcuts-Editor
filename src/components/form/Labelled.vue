<template>
    <div class="input__container">
        <label v-if="label" :for="id" class="input__label">
            {{ label }}
        </label>
        <slot :id="id" />
    </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid';
import { ref } from 'vue';

withDefaults(defineProps<{
    label?: string | null;
}>(), {
    label: null,
});

const id = ref<string>(uuidv4());
</script>

<style lang="sass" scoped>
.input__container
    padding: 0
    margin: 5px 0 20px
    width: 100%
    cursor: text

.input__label
    display: block
    color: #000000
    margin-bottom: 4px
    font-weight: 500
</style>
