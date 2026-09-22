<template>
    <div class="variable">
        <div class="variable__header" @click="toggle">
            <icon class="variable__header__drag-handle" name="drag-handle" />
            <div class="variable__header__title">
                {{ variableTitle }}
                <span
                    class="variable__header__title__suffix"
                >({{ variableType }})</span>
            </div>
            <icon
                class="variable__header__delete-button"
                name="delete"
                title="Delete Variable"
                @click.stop="onDeleteClicked"
            />
            <chevron
                :expanded="expanded"
                class="variable__header__chevron"
            />
        </div>
        <div v-if="expanded" class="variable__form">
            <text-input
                v-model="variableData.key"
                label="Name"
                placeholder="Enter the name for this variable"
                maxlength="30"
            />
            <with-variable-picker
                v-if="variableData.type === VariableType.CONSTANT"
                :variables="variables"
                @insert-text="(text) => valueInput?.insertAtCursor(text)"
            >
                <text-input
                    ref="valueInput"
                    :model-value="variableData.value ?? ''"
                    label="Value"
                    maxlength="30000"
                    placeholder="Enter the value for this variable"
                    :multiline="true"
                    @update:model-value="(value) => variableData.value = value"
                />
            </with-variable-picker>

            <form-section title="Advanced Settings">
                <checkbox-input
                    v-model="variableData.urlEncode"
                    label="URL encode"
                />
                <checkbox-input
                    v-model="variableData.jsonEncode"
                    label="JSON encode"
                />
                <checkbox-input
                    :model-value="variableData.flags % 2 === 1"
                    @update:model-value="(value) => {
                        variableData.flags = (variableData.flags & (~1)) + (value ? 1 : 0);
                    }"
                    label="Allow 'Share…'"
                />
            </form-section>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CheckboxInput from '@/components/form/CheckboxInput.vue';
import Chevron from '@/components/basic/Chevron.vue';
import FormSection from '@/components/form/FormSection.vue';
import Icon from '@/components/basic/Icon.vue';
import TextInput from '@/components/form/TextInput.vue';
import WithVariablePicker from '@/components/variables/WithVariablePicker.vue';
import { useDialog } from '@/composables/dialog';
import { VariableType, type Variable } from '@/model';

const props = defineProps<{
    variable: Variable;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:variable', variable: Variable): void;
    (e: 'delete', variable: Variable): void;
}>();

const expanded = ref(false);
const variableData = ref<Variable>({ ...props.variable });
const valueInput = ref<InstanceType<typeof TextInput> | null>(null);
const dialog = useDialog();

watch(variableData, (newData) => {
    newData.key = newData.key.replace(/[^A-Za-z0-9_]/g, '');
    emit('update:variable', newData);
}, { deep: true });

const variableTitle = computed(() => (variableData.value.key.length > 0
    ? variableData.value.key
    : '-'));

const variableType = computed(() => {
    switch (variableData.value.type) {
    case VariableType.TEXT:
        return 'Text Input';
    case VariableType.NUMBER:
        return 'Number Input';
    case VariableType.PASSWORD:
        return 'Password Input';
    case VariableType.SELECT:
        return 'Multiple Choice Selection';
    case VariableType.TOGGLE:
        return 'Toggle';
    case VariableType.COLOR:
        return 'Color Input';
    case VariableType.DATE:
        return 'Date Input';
    case VariableType.TIME:
        return 'Time Input';
    case VariableType.SLIDER:
        return 'Number Slider';
    default:
        return 'Static Variable';
    }
});

function toggle() {
    expanded.value = !expanded.value;
}

async function onDeleteClicked() {
    try {
        await dialog.confirm('Delete this variable?', { okText: 'Delete' });
        emit('delete', variableData.value);
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.variable
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

            &__suffix
                color: #CCCCCC

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
