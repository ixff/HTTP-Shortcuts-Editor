<template>
    <page>
        <template #main>
            <init-form
                :initial-device-id="deviceId"
                :is-loading="isLoading"
                :error="error"
                class="login-form"
                @submit="onSubmit"
                @change="clearError"
            />

            <notice class="notice">
                <p>
                    To use the <b>HTTP&nbsp;Shortcuts&nbsp;Editor</b>, make sure you have the latest
                    version of the <b>HTTP&nbsp;Shortcuts</b> app installed. Open the app, go to
                    <b>Import&nbsp;&amp;&nbsp;Export&nbsp;&gt;&nbsp;Edit&nbsp;on&nbsp;Computer</b>
                    and follow the instructions inside the app.
                </p>
                <p>
                    <b>Please note</b> that this editor is in an early development stage and
                    currently only supports a small subset of the features of the app.
                </p>
            </notice>

            <notice class="notice">
                <p>
                    This web app is also open source. You can host your own.
                    Find it on <a href="https://github.com/Waboodoo/HTTP-Shortcuts-Editor" target="_blank" rel="noreferrer noopener">Github</a>.
                </p>
            </notice>
        </template>
    </page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InitForm from '@/components/InitForm.vue';
import Notice from '@/components/basic/Notice.vue';
import Page from '@/views/Page.vue';
import ApiError from '@/store/errors/ApiError';
import ValidationError from '@/store/errors/ValidationError';
import { useStore } from '@/store';

const store = useStore();
const router = useRouter();
const { isLoading, deviceId } = storeToRefs(store);

const error = ref('');

async function onSubmit({ deviceId: id, password }: { deviceId: string; password: string }) {
    store.setCredentials(id, password);
    try {
        await store.loadData();
        await router.push('/edit');
    } catch (e) {
        if (e instanceof ValidationError) {
            error.value = e.message;
        } else if (e instanceof ApiError) {
            error.value = 'Incorrect device ID or password, or shortcuts were not pushed from app';
        } else {
            error.value = 'Failed to open editor. Please try again';
            console.log(e);
        }
    }
}

function clearError() {
    error.value = '';
}
</script>

<style lang="sass" scoped>
.login-form, .notice
    width: 100%
    max-width: 400px
    margin: 20px auto

.login-form
    margin-top: 0
</style>
