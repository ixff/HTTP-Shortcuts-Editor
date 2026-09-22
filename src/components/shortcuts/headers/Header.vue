<template>
    <div class="header">
        <div class="header__header" @click="toggle">
            <icon class="header__header__drag-handle" name="drag-handle" />
            <div class="header__header__title">
                {{ headerTitle }}
            </div>
            <icon
                class="header__header__delete-button"
                name="delete"
                title="Delete Header"
                @click.stop="onDeleteClicked"
            />
            <chevron
                :expanded="expanded"
                class="header__header__chevron"
            />
        </div>
        <div v-if="expanded" class="header__form">
            <with-variable-picker
                :variables="variables"
                @insert-text="(text) => keyInput?.insertAtCursor(text)"
            >
                <text-input
                    ref="keyInput"
                    v-model="headerData.key"
                    label="Name"
                    placeholder="Enter the name for this header"
                />
            </with-variable-picker>
            <with-variable-picker
                :variables="variables"
                @insert-text="(text) => valueInput?.insertAtCursor(text)"
            >
                <text-input
                    ref="valueInput"
                    v-model="headerData.value"
                    label="Value"
                    placeholder="Enter the value for this header"
                />
            </with-variable-picker>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Chevron from '@/components/basic/Chevron.vue';
import Icon from '@/components/basic/Icon.vue';
import TextInput from '@/components/form/TextInput.vue';
import WithVariablePicker from '@/components/variables/WithVariablePicker.vue';
import { useDialog } from '@/composables/dialog';
import type { Header, Variable } from '@/model';

const props = defineProps<{
    header: Header;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:header', header: Header): void;
    (e: 'delete', header: Header): void;
}>();

const expanded = ref(false);
const headerData = ref<Header>({ ...props.header });
const keyInput = ref<InstanceType<typeof TextInput> | null>(null);
const valueInput = ref<InstanceType<typeof TextInput> | null>(null);
const dialog = useDialog();

watch(headerData, (newData) => {
    emit('update:header', newData);
}, { deep: true });

const headerTitle = computed(() => (headerData.value.key.length > 0
    ? `${headerData.value.key}: ${headerData.value.value}`
    : '-'));

function toggle() {
    expanded.value = !expanded.value;
}

async function onDeleteClicked() {
    try {
        await dialog.confirm('Delete this header?', { okText: 'Delete' });
        emit('delete', headerData.value);
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.header
    background: #ffffff
    border: 1px solid #CCCCCC

    &__header
        display: flex
        cursor: pointer
        align-items: center

        &__drag-handle
            width: 24px
            height: 24px
            flex: 0 0 auto
            cursor: move
            padding: 10px
            opacity: 0.25
            transition: opacity ease-in-out 300ms

        &:hover &__drag-handle
            opacity: 1

        &__title
            font-size: 1.2em
            padding: 15px 0
            flex: 1 1 auto

        &__chevron, &__delete-button
            flex: 0 0 auto
            width: 18px
            height: 18px
            padding: 10px
            opacity: 0.25
            transition: opacity ease-in-out 300ms

        &:hover &__chevron, &:hover &__delete-button
            opacity: 1

    &__form
        padding: 0 20px
</style>
