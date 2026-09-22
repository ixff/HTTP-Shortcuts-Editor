<template>
    <div class="global-settings">
        <text-input
            :model-value="baseData.title ?? ''"
            :label="$t('base.title.label')"
            :placeholder="$t('base.title.placeholder')"
            @update:model-value="(value) => baseData.title = value.length > 0 ? value : null"
        />

        <with-variable-picker
            :variables="variables"
            @variable-picked="
                (variable) => globalScriptInput?.insertVariable(variable)
            "
        >
            <script-input
                ref="globalScriptInput"
                :model-value="baseData.globalCode ?? ''"
                :label="$t('base.globalCode.label')"
                :placeholder="$t('base.globalCode.placeholder')"
                @update:model-value="(value) => baseData.globalCode = value.length > 0 ? value : null"
            />
        </with-variable-picker>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ScriptInput from '@/components/form/ScriptInput.vue';
import TextInput from '@/components/form/TextInput.vue';
import WithVariablePicker from '@/components/variables/WithVariablePicker.vue';
import type { Base, Variable } from '@/model';

const props = defineProps<{
    base: Base;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:base', base: Base): void;
}>();

const baseData = ref<Base>({ ...props.base });
const globalScriptInput = ref<InstanceType<typeof ScriptInput> | null>(null);

watch(baseData, (newData) => {
    emit('update:base', newData);
}, { deep: true });
</script>

<style lang="sass" scoped>
.global-settings
    background: #fafafa
    border: 1px solid #CCCCCC
    padding: 20px

    :deep(.script-input__editor)
        background-color: #FFFFFF
</style>
