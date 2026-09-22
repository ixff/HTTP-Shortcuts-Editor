<template>
    <div class="parameter">
        <div class="parameter__header" @click="toggle">
            <icon class="parameter__header__drag-handle" name="drag-handle" />
            <div class="parameter__header__title">
                {{ parameterTitle }}
            </div>
            <icon
                class="parameter__header__delete-button"
                name="delete"
                title="Delete Parameter"
                @click.stop="onDeleteClicked"
            />
            <chevron
                :expanded="expanded"
                class="parameter__header__chevron"
            />
        </div>
        <div v-if="expanded" class="parameter__form">
            <with-variable-picker
                :variables="variables"
                @insert-text="(text) => keyInput?.insertAtCursor(text)"
            >
                <text-input
                    ref="keyInput"
                    v-model="parameterData.key"
                    label="Name"
                    placeholder="Enter the name for this parameter"
                />
            </with-variable-picker>
            <with-variable-picker
                v-if="parameterData.type === ParameterType.STRING"
                :variables="variables"
                @insert-text="(text) => valueInput?.insertAtCursor(text)"
            >
                <text-input
                    ref="valueInput"
                    v-model="parameterData.value"
                    label="Value"
                    placeholder="Enter the value for this parameter"
                />
            </with-variable-picker>
            <text-input
                v-if="parameterData.type === ParameterType.FILE"
                v-model="parameterData.fileName"
                label="File Name (optional)"
                placeholder="Enter the file name for this parameter"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Chevron from '@/components/basic/Chevron.vue';
import Icon from '@/components/basic/Icon.vue';
import TextInput from '@/components/form/TextInput.vue';
import WithVariablePicker from '@/components/variables/WithVariablePicker.vue';
import { ParameterType, type Parameter, type Variable } from '@/model';
import { useDialog } from '@/composables/dialog';

const props = defineProps<{
    parameter: Parameter;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:parameter', parameter: Parameter): void;
    (e: 'delete', parameter: Parameter): void;
}>();

const expanded = ref(false);
const parameterData = ref<Parameter>({ ...props.parameter });
const keyInput = ref<InstanceType<typeof TextInput> | null>(null);
const valueInput = ref<InstanceType<typeof TextInput> | null>(null);
const dialog = useDialog();

watch(parameterData, (newData) => {
    emit('update:parameter', newData);
}, { deep: true });

const parameterTitle = computed(() => (parameterData.value.key.length > 0
    ? `${parameterData.value.key}: ${parameterValue.value}`
    : '-'));

const parameterValue = computed(() => {
    switch (parameterData.value.type) {
    case ParameterType.FILE:
        return '(File)';
    case ParameterType.FILES:
        return '(Files)';
    default:
        return parameterData.value.value;
    }
});

function toggle() {
    expanded.value = !expanded.value;
}

async function onDeleteClicked() {
    try {
        await dialog.confirm('Delete this parameter?', { okText: 'Delete' });
        emit('delete', parameterData.value);
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.parameter
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
