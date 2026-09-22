<template>
    <labelled :label="label" class="script-input">
        <div ref="editorHost" class="script-input__editor" />
    </labelled>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { placeholder as placeholderExtension } from '@codemirror/view';
import Labelled from '@/components/form/Labelled.vue';
import type { Variable } from '@/model';

const props = withDefaults(defineProps<{
    label?: string | null;
    modelValue?: string | null;
    placeholder?: string;
}>(), {
    label: null,
    modelValue: '',
    placeholder: '',
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const editorHost = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

onMounted(() => {
    view = new EditorView({
        doc: props.modelValue ?? '',
        parent: editorHost.value ?? undefined,
        extensions: [
            basicSetup,
            javascript(),
            placeholderExtension(props.placeholder),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    emit('update:modelValue', update.state.doc.toString());
                }
            }),
        ],
    });
});

watch(() => props.modelValue, (value) => {
    const current = view?.state.doc.toString();
    if (view && (value ?? '') !== (current ?? '')) {
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: value ?? '',
            },
        });
    }
});

onBeforeUnmount(() => {
    view?.destroy();
    view = null;
});

/**
 * Inserts a variable reference at the current cursor position.
 * (The original appended it to the end; inserting at the cursor
 * was a known TODO there.)
 */
function insertVariable(variable: Pick<Variable, 'key'>) {
    if (!view) {
        return;
    }
    const text = `getVariable('${variable.key}')`;
    const { from } = view.state.selection.main;
    view.dispatch({
        changes: {
            from,
            to: view.state.selection.main.to,
            insert: text,
        },
        selection: { anchor: from + text.length },
    });
    view.focus();
}

defineExpose({
    insertVariable,
});
</script>

<style lang="sass" scoped>
.script-input__editor
    height: 250px
    background: #fafafa
    color: #2d2d2d
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace
    font-size: 14px
    line-height: 1.5
    overflow: hidden

    :deep(.cm-editor)
        height: 100%
        background: transparent

    :deep(.cm-editor.cm-focused)
        outline: none

    :deep(.cm-scroller)
        font-family: inherit
        font-size: inherit
        line-height: inherit
        padding: 5px
</style>
