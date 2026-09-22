<template>
    <div class="category-list">
        <draggable
            v-model="categoriesData"
            item-key="id"
            group="categories"
            handle=".category__header__drag-handle"
        >
            <template #item="{ element }">
                <category
                    :category="element"
                    :variables="variables"
                    :allow-deletion="categoriesData.length > 1"
                    class="category-list__item"
                    @update:category="onUpdate"
                    @delete="onDelete"
                />
            </template>
        </draggable>

        <styled-button
            class="category-list__add-button"
            @click="addNewCategory"
        >
            {{ $t('categories.add.buttonLabel') }}
        </styled-button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import Category from '@/components/categories/Category.vue';
import StyledButton from '@/components/basic/StyledButton.vue';
import { createNewCategory, type Category as CategoryModel, type Variable } from '@/model';

const props = defineProps<{
    categories: CategoryModel[];
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:categories', categories: CategoryModel[]): void;
}>();

const categoriesData = ref<CategoryModel[]>([...props.categories]);

watch(categoriesData, (newData) => {
    emit('update:categories', newData);
}, { deep: true });

function onUpdate(category: CategoryModel) {
    categoriesData.value = categoriesData.value.map(
        (c) => (c.id === category.id ? category : c),
    );
}

function onDelete(category: CategoryModel) {
    categoriesData.value = categoriesData.value.filter((c) => c.id !== category.id);
}

function addNewCategory() {
    categoriesData.value.push(createNewCategory());
}
</script>

<style lang="sass" scoped>
.category-list
    &__item
        margin: 10px 0 20px

        &:first-child
            margin-top: 0

        &:last-child
            margin-bottom: 0

    &__add-button
        margin: 20px 0
</style>
