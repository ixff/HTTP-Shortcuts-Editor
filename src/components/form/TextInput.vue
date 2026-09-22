<template>
    <labelled :label="label" v-slot="{ id }">
        <textarea
            v-if="multiline"
            :id="id"
            ref="input"
            class="input__value multiline"
            :value="modelValue"
            v-bind="$attrs"
            :placeholder="placeholder"
            @input="onInput"
        />
        <input
            v-else
            :id="id"
            ref="input"
            class="input__value"
            :value="modelValue"
            v-bind="$attrs"
            :placeholder="placeholder"
            @input="onInput"
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
    modelValue?: string | null;
    placeholder?: string;
    multiline?: boolean;
}>(), {
    label: null,
    modelValue: '',
    placeholder: '',
    multiline: false,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const input = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

function onInput(event: Event) {
    emit('update:modelValue', (event.target as HTMLInputElement).value);
}

function focus() {
    input.value?.focus();
}

/**
 * Inserts the given text at the current cursor position,
 * replacing any selected text.
 */
function insertAtCursor(text: string) {
    const element = input.value;
    if (!element) {
        return;
    }
    const { selectionStart, selectionEnd } = element;
    if (selectionStart !== null && selectionStart !== undefined) {
        const end = selectionEnd ?? selectionStart;
        element.value = element.value.substring(0, selectionStart)
            + text
            + element.value.substring(end, element.value.length);
        element.selectionStart = selectionStart + text.length;
        element.selectionEnd = selectionStart + text.length;
    } else {
        element.value += text;
    }
    emit('update:modelValue', element.value);
    element.focus();
}

defineExpose({
    focus,
    insertAtCursor,
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

    &.multiline
        resize: vertical
        height: 150px
        overflow-y: auto

    &:focus, &:active
        border-bottom-color: #0277bd

    &::placeholder
        color: #666666
</style>
