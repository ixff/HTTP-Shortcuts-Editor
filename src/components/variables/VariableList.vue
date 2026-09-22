<template>
    <div class="variable-list">
        <draggable
            v-model="variablesData"
            item-key="id"
            group="variables"
            handle=".variable__header__drag-handle"
        >
            <template #item="{ element }">
                <variable
                    :variable="element"
                    :variables="variables"
                    class="variable-list__item"
                    @update:variable="onUpdate"
                    @delete="onDelete"
                />
            </template>
            <template #footer>
                <div v-if="variablesData.length === 0" class="empty-state">
                    No variables defined
                </div>
            </template>
        </draggable>

        <styled-button
            class="variable-list__add-button"
            @click="addNewVariable"
        >
            Add New Variable
        </styled-button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import Variable from '@/components/variables/Variable.vue';
import StyledButton from '@/components/basic/StyledButton.vue';
import { createNewVariable, type Variable as VariableModel } from '@/model';

const props = defineProps<{
    variables: VariableModel[];
}>();

const emit = defineEmits<{
    (e: 'update:variables', variables: VariableModel[]): void;
}>();

const variablesData = ref<VariableModel[]>([...props.variables]);

watch(variablesData, (newData) => {
    emit('update:variables', newData);
}, { deep: true });

function onUpdate(variable: VariableModel) {
    variablesData.value = variablesData.value.map(
        (v) => (v.id === variable.id ? variable : v),
    );
}

function onDelete(variable: VariableModel) {
    variablesData.value = variablesData.value.filter((v) => v.id !== variable.id);
}

function addNewVariable() {
    variablesData.value.push(createNewVariable());
}
</script>

<style lang="sass" scoped>
.empty-state
    color: #4a4a4a
    padding: 5px 0

.variable-list
    &__item
        margin: 10px 0 20px

        &:first-child
            margin-top: 0

        &:last-child
            margin-bottom: 0

    &__add-button
        margin-top: 20px
</style>
