<template>
    <div class="shortcut-list">
        <draggable
            v-model="shortcutsData"
            item-key="id"
            group="shortcuts"
            handle=".shortcut__header__drag-handle"
        >
            <template #item="{ element }">
                <shortcut
                    :shortcut="element"
                    :variables="variables"
                    class="shortcut-list__item"
                    @update:shortcut="onUpdate"
                    @copy="onCopy"
                    @delete="onDelete"
                />
            </template>
            <template #footer>
                <div v-if="shortcutsData.length === 0" class="empty-state">
                    This category contains no shortcuts.
                </div>
            </template>
        </draggable>

        <styled-button
            class="shortcut-list__add-button"
            @click="addNewShortcut"
        >
            Add New Shortcut
        </styled-button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import Shortcut from '@/components/shortcuts/Shortcut.vue';
import StyledButton from '@/components/basic/StyledButton.vue';
import {
    cloneShortcut,
    createNewShortcut,
    ExecutionType,
    type Shortcut as ShortcutModel,
    type Variable,
} from '@/model';
import { useDialog } from '@/composables/dialog';

const props = defineProps<{
    shortcuts: ShortcutModel[];
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:shortcuts', shortcuts: ShortcutModel[]): void;
}>();

const shortcutsData = ref<ShortcutModel[]>([...props.shortcuts]);
const dialog = useDialog();

watch(shortcutsData, (newData) => {
    emit('update:shortcuts', newData);
}, { deep: true });

function onUpdate(shortcut: ShortcutModel) {
    shortcutsData.value = shortcutsData.value.map(
        (s) => (s.id === shortcut.id ? shortcut : s),
    );
}

function onCopy(shortcut: ShortcutModel) {
    const copy = cloneShortcut(shortcut);
    copy.name = `${shortcut.name} (copy)`;
    const index = shortcutsData.value.findIndex((s) => s.id === shortcut.id);
    if (index === -1) {
        return;
    }
    shortcutsData.value.splice(index + 1, 0, copy);
}

function onDelete(shortcut: ShortcutModel) {
    shortcutsData.value = shortcutsData.value.filter((s) => s.id !== shortcut.id);
}

async function addNewShortcut() {
    try {
        const choice = await dialog.select<{ type: ExecutionType }>({
            title: 'Add New Shortcut',
            options: [
                {
                    type: ExecutionType.APP,
                    label: 'Regular HTTP Shortcut',
                },
                {
                    type: ExecutionType.BROWSER,
                    label: 'Browser Shortcut',
                },
                // TODO: Add support for trigger shortcut
                {
                    type: ExecutionType.SCRIPTING,
                    label: 'Scripting Shortcut',
                },
            ],
            getOptionLabel: (option: { type: ExecutionType; label: string }) => option.label,
            getOptionId: (option: { type: ExecutionType }) => option.type,
        });
        shortcutsData.value.push(createNewShortcut(choice.type));
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.empty-state
    color: #4a4a4a
    padding: 5px 0

.shortcut-list
    &__item
        margin: 10px 0 20px

        &:first-child
            margin-top: 0

        &:last-child
            margin-bottom: 0

    &__add-button
        margin-top: 20px
</style>
