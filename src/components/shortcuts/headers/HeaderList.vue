<template>
    <div class="header-list">
        <draggable
            v-model="headersData"
            item-key="id"
            group="headers"
            handle=".header__header__drag-handle"
        >
            <template #item="{ element }">
                <shortcut-header
                    :header="element"
                    :variables="variables"
                    class="header-list__item"
                    @update:header="onUpdate"
                    @delete="onDelete"
                />
            </template>
            <template #footer>
                <div v-if="headersData.length === 0" class="empty-state">
                    No headers defined
                </div>
            </template>
        </draggable>

        <styled-button
            class="header-list__add-button"
            @click="addNewHeader"
        >
            Add New Header
        </styled-button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import ShortcutHeader from '@/components/shortcuts/headers/Header.vue';
import StyledButton from '@/components/basic/StyledButton.vue';
import { createNewHeader, type Header } from '@/model';

const props = defineProps<{
    headers: Header[];
    variables: any[];
}>();

const emit = defineEmits<{
    (e: 'update:headers', headers: Header[]): void;
}>();

const headersData = ref<Header[]>([...props.headers]);

watch(headersData, (newData) => {
    emit('update:headers', newData);
}, { deep: true });

function onUpdate(header: Header) {
    headersData.value = headersData.value.map(
        (h) => (h.id === header.id ? header : h),
    );
}

function onDelete(header: Header) {
    headersData.value = headersData.value.filter((h) => h.id !== header.id);
}

function addNewHeader() {
    headersData.value.push(createNewHeader());
}
</script>

<style lang="sass" scoped>
.empty-state
    color: #4a4a4a
    padding: 5px 0

.header-list
    &__item
        margin: 10px 0 20px

        &:first-child
            margin-top: 0

        &:last-child
            margin-bottom: 0

    &__add-button
        margin-top: 20px
</style>
