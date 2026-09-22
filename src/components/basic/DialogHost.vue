<template>
    <div
        v-if="activeDialog"
        class="dialog-backdrop"
        @click="onBackdropClick"
    >
        <div class="dialog" @click.stop>
            <selection-dialog
                v-if="activeDialog.kind === 'select'"
                :title="activeDialog.title"
                :selection-options="activeDialog.options"
                :get-option-label="activeDialog.getOptionLabel"
                :get-option-id="activeDialog.getOptionId"
                @option-selected="onOptionSelected"
            >
                <template #empty>{{ activeDialog.emptyText }}</template>
            </selection-dialog>
            <template v-else>
                <div class="dialog__message">{{ activeDialog.message }}</div>
                <div class="dialog__buttons">
                    <button
                        v-if="activeDialog.kind === 'confirm'"
                        type="button"
                        class="dialog__button dialog__button--cancel"
                        @click="rejectDialog"
                    >{{ activeDialog.cancelText }}</button>
                    <button
                        type="button"
                        class="dialog__button dialog__button--ok"
                        @click="resolveDialog()"
                    >{{ activeDialog.okText }}</button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import SelectionDialog from '@/components/basic/SelectionDialog.vue';
import {
    activeDialog,
    rejectDialog,
    resolveDialog,
} from '@/composables/dialog';

function onOptionSelected(option: unknown) {
    resolveDialog(option);
}

function onBackdropClick(event: MouseEvent) {
    // Clicking the backdrop cancels selection dialogs (like vuejs-dialog's
    // backdropClose option), but not message dialogs.
    if (event.target === event.currentTarget && activeDialog.value?.kind === 'select') {
        rejectDialog();
    }
}
</script>

<style lang="scss">
.dialog-backdrop {
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.dialog {
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;

    &__message {
        padding: 20px;
        font-size: 1.05em;
        color: #0f0f0f;
    }

    &__buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 0 20px 16px;
    }

    &__button {
        padding: 6px 16px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 1em;

        &--ok {
            background: #0277bd;
            color: #ffffff;

            &:hover {
                background: #0288d1;
            }
        }

        &--cancel {
            background: transparent;
            color: #666666;

            &:hover {
                background: #eeeeee;
            }
        }
    }
}
</style>
