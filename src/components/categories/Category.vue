<template>
    <div class="category">
        <div class="category__header" @click="toggle">
            <icon class="category__header__drag-handle" name="drag-handle" />
            <div class="category__header__title">
                {{ categoryTitle }}
                <span
                    v-if="categoryData.hidden"
                    class="category__header__title__suffix"
                >{{ $t('categories.hidden.nameSuffix') }}</span>
            </div>
            <icon
                v-if="allowDeletion"
                class="category__header__delete-button"
                name="delete"
                :title="$t('categories.delete.buttonLabel')"
                @click.stop="onDeleteClicked"
            />
            <chevron
                :expanded="expanded"
                class="category__header__chevron"
            />
        </div>
        <div v-if="expanded" class="category__form">
            <text-input
                v-model="categoryData.name"
                :label="$t('categories.name.label')"
                :placeholder="$t('categories.name.placeholder')"
            />
            <checkbox-input
                v-model="categoryData.hidden"
                :label="$t('categories.hidden.checkboxLabel')"
            />
            <select-input
                v-model="categoryData.layoutType"
                :label="$t('categories.layoutType.label')"
                :options="[
                    { value: 'linear_list', label: $t('categories.layoutType.options.list') },
                    { value: 'dense_grid', label: $t('categories.layoutType.options.denseGrid') },
                    { value: 'medium_grid', label: $t('categories.layoutType.options.mediumGrid') },
                    { value: 'wide_grid', label: $t('categories.layoutType.options.wideGrid') },
                ]"
            />
            <labelled :label="$t('categories.shortcuts.label')">
                <shortcut-list
                    :shortcuts="categoryData.shortcuts"
                    :variables="variables"
                    @update:shortcuts="onUpdateShortcuts"
                />
            </labelled>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CheckboxInput from '@/components/form/CheckboxInput.vue';
import Chevron from '@/components/basic/Chevron.vue';
import Labelled from '@/components/form/Labelled.vue';
import Icon from '@/components/basic/Icon.vue';
import SelectInput from '@/components/form/SelectInput.vue';
import ShortcutList from '@/components/shortcuts/ShortcutList.vue';
import TextInput from '@/components/form/TextInput.vue';
import { useDialog } from '@/composables/dialog';
import { useI18n } from 'vue-i18n';
import type { Category, Shortcut, Variable } from '@/model';

const props = defineProps<{
    category: Category;
    allowDeletion?: boolean;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:category', category: Category): void;
    (e: 'delete', category: Category): void;
}>();

const { t } = useI18n();
const expanded = ref(false);
const categoryData = ref<Category>({ ...props.category });
const dialog = useDialog();

watch(categoryData, (newData) => {
    emit('update:category', newData);
}, { deep: true });

const categoryTitle = computed(() => (categoryData.value.name.length > 0
    ? categoryData.value.name
    : '-'));

function onUpdateShortcuts(shortcuts: Shortcut[]) {
    categoryData.value = {
        ...categoryData.value,
        shortcuts,
    };
}

function toggle() {
    expanded.value = !expanded.value;
}

async function onDeleteClicked() {
    try {
        await dialog.confirm(t('categories.delete.prompt'), {
            okText: t('common.dialogButtons.delete'),
        });
        emit('delete', categoryData.value);
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.category
    background: #fafafa
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
            font-size: 2em
            padding: 15px 0
            flex: 1 1 auto

            &__suffix
                color: #CCCCCC

        &__chevron, &__delete-button
            flex: 0 0 auto
            width: 24px
            height: 24px
            padding: 10px
            opacity: 0.25
            transition: opacity ease-in-out 300ms

        &:hover &__chevron, &:hover &__delete-button
            opacity: 1

    &__form
        padding: 0 20px

</style>
