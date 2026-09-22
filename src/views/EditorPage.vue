<template>
    <page v-if="data" class="editor">
        <template #header>
            <div
                :class="[
                    'editor__header__save',
                    {
                        'editor__header__save--visible': hasUnsavedChanges,
                        'editor__header__save--disabled': isSaving,
                    }
                ]"
                @click="onSave"
            >Save Changes</div>
            <span :class="[
                'editor__header__saving',
                {'editor__header__saving--visible': isSaving}
            ]">Saving...</span>
        </template>
        <template #main>
            <div class="editor__main_section-title">Categories</div>
            <category-list
                :categories="data.categories"
                :variables="data.variables"
                @update:categories="onUpdateCategories"
            />

            <div class="editor__main_section-title">Variables</div>
            <variable-list
                :variables="data.variables"
                @update:variables="onUpdateVariables"
            />

            <div class="editor__main_section-title">Global Settings</div>
                <global-settings-form
                    :base="data"
                    :variables="data.variables"
                    @update:base="onUpdateBase"
                />
        </template>
    </page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CategoryList from '@/components/categories/CategoryList.vue';
import GlobalSettingsForm from '@/components/global/GlobalSettingsForm.vue';
import VariableList from '@/components/variables/VariableList.vue';
import Page from '@/views/Page.vue';
import { useDialog } from '@/composables/dialog';
import ValidationError from '@/store/errors/ValidationError';
import { useStore } from '@/store';
import type { Base } from '@/model';

const store = useStore();
const router = useRouter();
const dialog = useDialog();
const { data, hasUnsavedChanges, isSaving, isLoaded } = storeToRefs(store);

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!hasUnsavedChanges.value) {
        return undefined;
    }
    const message = 'You have unsaved changes. '
        + 'Are you sure you want to leave and discard them?';
    event.returnValue = message;
    return message;
}

onMounted(async () => {
    if (isLoaded.value) {
        window.addEventListener('beforeunload', onBeforeUnload);
    } else {
        await router.replace('/');
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload);
});

function onUpdateCategories(categories: Base['categories']) {
    store.setData({
        ...data.value as Base,
        categories,
    });
}

function onUpdateVariables(variables: Base['variables']) {
    store.setData({
        ...data.value as Base,
        variables,
    });
}

function onUpdateBase(base: Base) {
    store.setData({
        ...data.value as Base,
        title: base.title,
        globalCode: base.globalCode,
    });
}

async function onSave() {
    if (!hasUnsavedChanges.value || isSaving.value) {
        return;
    }
    try {
        await store.saveData();
    } catch (e) {
        if (e instanceof ValidationError) {
            await dialog.alert(e.message);
        } else {
            await dialog.alert('An error occurred while trying to save your changes. Please try again.');
        }
    }
}
</script>

<style lang="sass" scoped>
.editor
    &__header
        &__save
            padding: 5px 16px
            border-radius: 3px
            background: #ffffff
            color: #0277bd
            margin: 10px
            opacity: 0
            transition: opacity ease-in-out 0.2s

            &--visible
                cursor: pointer
                opacity: 1

            &--disabled
                cursor: default
                color: #666666
                background: #FAFAFA

        &__saving
            color: #FFFFFF
            margin: 10px
            opacity: 0
            transition: opacity ease-in-out 0.2s

            &--visible
                opacity: 1

    &__main_section-title
        margin-top: 1.5em
        margin-bottom: 0.5em
        font-size: 1.8em
        font-weight: bold

        &:first-child
            margin-top: 0
</style>
