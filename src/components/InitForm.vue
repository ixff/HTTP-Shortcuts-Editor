<template>
    <form class="init-form" @submit.prevent="onSubmit">
        <label for="device-id-input">
            Device ID
        </label>
        <input
            id="device-id-input"
            v-model="deviceId"
            :disabled="isLoading"
            autocomplete="username"
            @input="onInput"
        >
        <label for="password-input">
            Password
        </label>
        <input
            id="password-input"
            v-model="password"
            :disabled="isLoading"
            type="password"
            autocomplete="current-password"
            @input="onInput"
        >
        <button
            type="submit"
            :disabled="!canSubmit"
        >Start Editing</button>

        <span v-if="hasError" class="init-form__error">{{ error }}</span>
    </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
    initialDeviceId?: string;
    isLoading?: boolean;
    error?: string;
}>(), {
    initialDeviceId: '',
    isLoading: false,
    error: '',
});

const emit = defineEmits<{
    (e: 'submit', credentials: { deviceId: string; password: string }): void;
    (e: 'change'): void;
}>();

const deviceId = ref(props.initialDeviceId);
const password = ref('');

const hasError = computed(() => props.error.length > 0);
const canSubmit = computed(
    () => !props.isLoading && deviceId.value.length > 0 && password.value.length > 0,
);

function onInput() {
    emit('change');
}

function onSubmit() {
    emit('submit', {
        deviceId: deviceId.value,
        password: password.value,
    });
}
</script>

<style lang="sass" scoped>
.init-form
    background: #fafafa
    border: 1px solid #CCCCCC
    padding: 20px

    input
        display: block
        width: 100%
        margin-bottom: 10px
        padding: 3px

        &[disabled]
            background: #FFFFFF

    label
        display: block
        margin-bottom: 5px

    button
        padding: 5px 10px

    &__error
        margin-top: 10px
        display: block
        font-size: 14px
        color: #f03030
</style>
