<template>
    <div class="parameter-list">
        <draggable
            v-model="parametersData"
            item-key="id"
            :group="`parameters${supportsFiles ? '--with-files' : ''}`"
            handle=".parameter__header__drag-handle"
        >
            <template #item="{ element }">
                <parameter
                    :parameter="element"
                    :variables="variables"
                    class="parameter-list__item"
                    @update:parameter="onUpdate"
                    @delete="onDelete"
                />
            </template>
            <template #footer>
                <div v-if="parametersData.length === 0" class="empty-state">
                    No parameters defined
                </div>
            </template>
        </draggable>

        <styled-button
            class="parameter-list__add-button"
            @click="addNewParameter"
        >
            Add New Parameter
        </styled-button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import Parameter from '@/components/shortcuts/parameters/Parameter.vue';
import StyledButton from '@/components/basic/StyledButton.vue';
import { createNewParameter, ParameterType, type Parameter as ParameterModel } from '@/model';
import { useDialog } from '@/composables/dialog';

const props = withDefaults(defineProps<{
    parameters: ParameterModel[];
    variables: any[];
    supportsFiles?: boolean;
}>(), {
    supportsFiles: false,
});

const emit = defineEmits<{
    (e: 'update:parameters', parameters: ParameterModel[]): void;
}>();

const parametersData = ref<ParameterModel[]>([...props.parameters]);
const dialog = useDialog();

watch(parametersData, (newData) => {
    emit('update:parameters', newData);
}, { deep: true });

function onUpdate(parameter: ParameterModel) {
    parametersData.value = parametersData.value.map(
        (p) => (p.id === parameter.id ? parameter : p),
    );
}

function onDelete(parameter: ParameterModel) {
    parametersData.value = parametersData.value.filter((p) => p.id !== parameter.id);
}

async function addNewParameter() {
    if (props.supportsFiles) {
        try {
            const choice = await dialog.select<{ type: ParameterType }>({
                title: 'Add New Parameter',
                options: [
                    {
                        type: ParameterType.STRING,
                        label: 'String (default)',
                    },
                    {
                        type: ParameterType.FILE,
                        label: 'Single File',
                    },
                    {
                        type: ParameterType.FILES,
                        label: 'Multiple Files',
                    },
                ],
                getOptionLabel: (option: { type: ParameterType; label: string }) => option.label,
                getOptionId: (option: { type: ParameterType }) => option.type,
            });
            parametersData.value.push(createNewParameter(choice.type));
        } catch (e) {
            // cancelled
        }
    } else {
        parametersData.value.push(createNewParameter(ParameterType.STRING));
    }
}
</script>

<style lang="sass" scoped>
.empty-state
    color: #4a4a4a
    padding: 5px 0

.parameter-list
    &__item
        margin: 10px 0 20px

        &:first-child
            margin-top: 0

        &:last-child
            margin-bottom: 0

    &__add-button
        margin-top: 20px
</style>
