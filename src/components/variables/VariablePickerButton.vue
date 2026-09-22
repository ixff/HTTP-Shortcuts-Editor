<template>
    <icon
        class="variable-picker-button"
        name="variables"
        title="Insert Variable"
        @click="openPicker"
    />
</template>

<script setup lang="ts">
import Icon from '@/components/basic/Icon.vue';
import { useDialog } from '@/composables/dialog';
import type { Variable } from '@/model';

const props = defineProps<{
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'variable-picked', variable: Variable): void;
}>();

const dialog = useDialog();

async function openPicker() {
    try {
        const choice = await dialog.select<Variable>({
            title: 'Insert Variable',
            options: props.variables.filter((v) => v.key.length > 0),
            getOptionLabel: (option: Variable) => option.key,
            emptyText: `You don't have any variables yet. Scroll to the bottom of the page to find the
            button to create variables.`,
        });
        emit('variable-picked', choice);
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.variable-picker-button
    width: 24px
    height: 24px
    padding: 10px
    opacity: 0.25
    transition: opacity ease-in-out 300ms
    cursor: pointer

    &:hover
        opacity: 1
</style>
