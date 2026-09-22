<template>
    <labelled :label="label" v-slot="{ id }" class="label">
        <input
            :id="id"
            ref="input"
            class="input__value"
            :checked="modelValue"
            v-bind="$attrs"
            value="1"
            type="checkbox"
            @change="onChange"
        >
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

withDefaults(defineProps<{
    label?: string | null;
    modelValue?: boolean;
}>(), {
    label: null,
    modelValue: false,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const input = ref<HTMLInputElement | null>(null);

function onChange(event: Event) {
    emit('update:modelValue', (event.target as HTMLInputElement).checked);
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
    border: none
    outline: none
    background-color: transparent
    padding: 4px 0
    float: left

    &:focus, &:active
        border-bottom-color: #0277bd

    &::placeholder
        color: #666666

.label:deep(.input__label)
    display: inline-block
    margin-left: 6px
</style>
