<template>
    <div class="picker-wrapper">
        <slot></slot>
        <variable-picker-button
            class="picker-wrapper__button"
            :variables="variables"
            @variable-picked="onVariablePicked"
        />
    </div>
</template>

<script setup lang="ts">
import VariablePickerButton from '@/components/variables/VariablePickerButton.vue';
import type { Variable } from '@/model';

const props = defineProps<{
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'variable-picked', variable: Variable): void;
    (e: 'insert-text', text: string): void;
}>();

function onVariablePicked(variable: Variable) {
    emit('variable-picked', variable);
    emit('insert-text', `{{{${variable.key}}}}`);
}
</script>

<style lang="sass" scoped>
.picker-wrapper
    display: flex

    &__button
        flex: 0 0 auto
        margin-top: 1em
</style>
