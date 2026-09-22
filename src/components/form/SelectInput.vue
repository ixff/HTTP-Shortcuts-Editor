<template>
    <labelled :label="label" v-slot="{ id }">
        <select
            :id="id"
            ref="input"
            class="input__value"
            :value="modelValue"
            v-bind="$attrs"
            @change="onChange"
        >
            <option
                v-for="option in options"
                :key="option.value"
                :value="option.value"
            >{{ option.label }}</option>
        </select>
    </labelled>
</template>

<script lang="ts">
export default {
    inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import Labelled from '@/components/form/Labelled.vue';

export interface SelectOption {
    value: string;
    label: string;
}

withDefaults(defineProps<{
    label?: string | null;
    modelValue?: string | null;
    options: SelectOption[];
}>(), {
    label: null,
    modelValue: null,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const input = ref<HTMLSelectElement | null>(null);

function onChange(event: Event) {
    emit('update:modelValue', (event.target as HTMLSelectElement).value);
}

function focus() {
    input.value?.focus();
}

defineExpose({
    focus,
});
</script>

<style lang="sass" scoped>
.input__value
    width: 100%
    border: none
    outline: none
    overflow: hidden
    background-color: transparent
    color: #0F0F0F
    padding: 4px 0
    font-size: 16px
    line-height: 20px
    border-bottom: 1px solid #E0E0E0

    &:focus, &:active
        border-bottom-color: #0277bd

    &::placeholder
        color: #666666
</style>
