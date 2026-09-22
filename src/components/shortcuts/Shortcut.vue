<template>
    <div class="shortcut">
        <!-- TODO: trigger shortcuts -->

        <div class="shortcut__header" @click="toggle">
            <icon class="shortcut__header__drag-handle" name="drag-handle" />
            <div class="shortcut__header__title">
                {{ shortcutTitle }}
                <span
                    v-if="shortcutTitleSuffix"
                    class="shortcut__header__title__suffix"
                >{{ shortcutTitleSuffix }}</span>
            </div>
            <icon
                class="shortcut__header__copy-button"
                name="copy"
                title="Duplicate Shortcut"
                @click.stop="onCopyClicked"
            />
            <icon
                class="shortcut__header__delete-button"
                name="delete"
                title="Delete Shortcut"
                @click.stop="onDeleteClicked"
            />
            <chevron
                :expanded="expanded"
                class="shortcut__header__chevron"
            />
        </div>
        <div v-if="expanded" class="shortcut__form">
            <text-input
                v-model="shortcutData.name"
                label="Shortcut Name"
                placeholder="Enter a name for this shortcut"
            />
            <text-input
                v-model="shortcutData.description"
                label="Description"
                placeholder="Enter a description for this shortcut"
            />

            <form-section
                v-if="isRegularShortcut || isBrowserShortcut"
                title="Basic Request Settings"
            >
                <select-input
                    v-if="isRegularShortcut"
                    v-model="shortcutData.method"
                    label="Method"
                    :options="[
                        { value: HttpMethod.GET, label: 'GET' },
                        { value: HttpMethod.POST, label: 'POST' },
                        { value: HttpMethod.PUT, label: 'PUT' },
                        { value: HttpMethod.DELETE, label: 'DELETE' },
                        { value: HttpMethod.PATCH, label: 'PATCH' },
                        { value: HttpMethod.HEAD, label: 'HEAD' },
                        { value: HttpMethod.OPTIONS, label: 'OPTIONS' },
                        { value: HttpMethod.TRACE, label: 'TRACE' },
                    ]"
                />
                <with-variable-picker
                    v-if="usesUrl"
                    :variables="variables"
                    @insert-text="(text) => urlInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="urlInput"
                        v-model="shortcutData.url"
                        label="URL"
                        placeholder="Enter a URL for this shortcut"
                    />
                </with-variable-picker>
            </form-section>

            <form-section v-if="isRegularShortcut" title="Request Headers">
                <header-list
                    :headers="shortcutData.headers"
                    :variables="variables"
                    @update:headers="onUpdateHeaders"
                />
            </form-section>

            <form-section v-if="usesRequestBody" title="Request Body / Parameters">
                <select-input
                    v-model="shortcutData.requestBodyType"
                    label="Request Body Type"
                    :options="[
                        {
                            value: RequestBodyType.FORM_DATA,
                            label: 'Parameters (form-data)',
                        },
                        {
                            value: RequestBodyType.X_WWW_FORM_URLENCODE,
                            label: 'Parameters (x-www-form-urlencoded)',
                        },
                        {
                            value: RequestBodyType.CUSTOM_TEXT,
                            label: 'Custom Text',
                        },
                        {
                            value: RequestBodyType.FILE,
                            label: 'File (Picker)',
                        },
                    ]"
                />
                <text-input
                    v-if="usesCustomTextRequestBody"
                    v-model="shortcutData.contentType"
                    label="Content-Type"
                    placeholder="Enter the type of your request body, e.g., application/json"
                />
                <with-variable-picker
                    v-if="usesCustomTextRequestBody"
                    :variables="variables"
                    @insert-text="(text) => bodyInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="bodyInput"
                        v-model="shortcutData.bodyContent"
                        label="Request Body"
                        placeholder="Enter the request body, e.g., a JSON object"
                        :multiline="true"
                    />
                </with-variable-picker>
                <parameter-list
                    v-if="usesParameters"
                    :parameters="shortcutData.parameters"
                    :variables="variables"
                    :supports-files="shortcutData.requestBodyType === RequestBodyType.FORM_DATA"
                    @update:parameters="onUpdateParameters"
                />
            </form-section>

            <form-section v-if="isRegularShortcut" title="Authentication">
                <select-input
                    v-model="shortcutData.authentication"
                    label="Authentication Method"
                    :options="[
                        { value: AuthenticationMethod.NONE, label: 'No Authentication' },
                        { value: AuthenticationMethod.BASIC, label: 'Basic Authentication' },
                        { value: AuthenticationMethod.DIGEST, label: 'Digest Authentication' },
                        { value: AuthenticationMethod.BEARER, label: 'Bearer Authentication' },
                    ]"
                />
                <with-variable-picker
                    v-if="usesUsernameAndPassword"
                    :variables="variables"
                    @insert-text="(text) => usernameInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="usernameInput"
                        v-model="shortcutData.username"
                        label="Username"
                        placeholder="Enter a username"
                    />
                </with-variable-picker>
                <with-variable-picker
                    v-if="usesUsernameAndPassword"
                    :variables="variables"
                    @insert-text="(text) => passwordInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="passwordInput"
                        v-model="shortcutData.password"
                        label="Password"
                        placeholder="Enter a password"
                    />
                </with-variable-picker>
                <with-variable-picker
                    v-if="usesAuthToken"
                    :variables="variables"
                    @insert-text="(text) => tokenInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="tokenInput"
                        v-model="shortcutData.authToken"
                        label="Token"
                        placeholder="Enter a token"
                    />
                </with-variable-picker>
            </form-section>

            <form-section
                v-if="isRegularShortcut && shortcutData.responseHandling"
                title="Response Handling"
            >
                <select-input
                    v-model="shortcutData.responseHandling.successOutput"
                    label="On Success"
                    :options="[
                        {
                            value: ResponseHandlingSuccessOutputType.RESPONSE,
                            label: 'Show the response',
                            },
                        {
                            value: ResponseHandlingSuccessOutputType.MESSAGE,
                            label: 'Show a message',
                            },
                        {
                            value: ResponseHandlingSuccessOutputType.NONE,
                            label: 'Show nothing (run silently)',
                        },
                    ]"
                />

                <with-variable-picker
                    v-if="usesSuccessMessage"
                    :variables="variables"
                    @insert-text="(text) => successMessageInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="successMessageInput"
                        v-model="shortcutData.responseHandling.successMessage"
                        label="Message"
                        placeholder="Shortcut executed."
                    />
                </with-variable-picker>

                <select-input
                    v-model="shortcutData.responseHandling.failureOutput"
                    label="On Failure"
                    :options="[
                        {
                            value: ResponseHandlingFailureOutputType.DETAILED,
                            label: 'Show a detailed error message',
                            },
                        {
                            value: ResponseHandlingFailureOutputType.SIMPLE,
                            label: 'Show a simple error message',
                            },
                        {
                            value: ResponseHandlingFailureOutputType.NONE,
                            label: 'Show nothing (run silently)',
                        },
                    ]"
                />

                <select-input
                    v-if="usesDisplayType"
                    v-model="shortcutData.responseHandling.uiType"
                    label="Display Type"
                    :options="[
                        { value: ResponseHandlingType.TOAST, label: 'Toast Popup' },
                        { value: ResponseHandlingType.DIALOG, label: 'Dialog' },
                        { value: ResponseHandlingType.WINDOW, label: 'Window' },
                    ]"
                />
            </form-section>

            <form-section v-if="usesScripting" title="Scripting">
                <template #header>
                    See the <a href="https://http-shortcuts.rmy.ch/scripting" target="_blank">Scripting documentation</a> for more information.
                </template>
                <template>
                    <with-variable-picker
                        :variables="variables"
                        @variable-picked="
                            (variable) => scriptPrepareInput?.insertVariable(variable)
                        "
                    >
                        <script-input
                            ref="scriptPrepareInput"
                            v-model="shortcutData.codeOnPrepare"
                            label="Run before Execution"
                            :placeholder="
                                isScriptingShortcut
                                ? 'Add JavaScript code here'
                                : 'Add JavaScript code here to run before the shortcut is ' +
                                 'executed, e.g., to prepare some variables.'
                            "
                        />
                    </with-variable-picker>
                    <with-variable-picker
                        v-if="usesScriptingOnSuccess"
                        :variables="variables"
                        @variable-picked="
                            (variable) => scriptSuccessInput?.insertVariable(variable)
                        "
                    >
                        <script-input
                            ref="scriptSuccessInput"
                            v-model="shortcutData.codeOnSuccess"
                            label="Run after Execution"
                            :placeholder="'Add JavaScript code here to run after the shortcut is ' +
                                'executed, e.g., to process the response.'"
                        />
                    </with-variable-picker>
                    <with-variable-picker
                        v-if="usesScriptingOnFailure"
                        :variables="variables"
                        @variable-picked="
                            (variable) => scriptFailureInput?.insertVariable(variable)
                        "
                    >
                        <script-input
                            ref="scriptFailureInput"
                            v-model="shortcutData.codeOnFailure"
                            label="Run on Failure"
                            placeholder="Add JavaScript code here to run in case the request fails."
                        />
                    </with-variable-picker>
                </template>
                <!-- TODO: Code Snippet Picker -->
            </form-section>

            <form-section title="Misc Settings">
                <checkbox-input
                    v-model="shortcutData.launcherShortcut"
                    label="Show as app shortcut on launcher"
                />
                <checkbox-input
                    v-model="shortcutData.quickSettingsTileShortcut"
                    label="Allow triggering via Quick Settings Tile"
                />
                <text-input
                    :model-value="`${shortcutData.delay}`"
                    label="Delay (in milliseconds)"
                    type="number"
                    min="0"
                    max="600000"
                    @update:model-value="(value) => {
                        shortcutData.delay = parseInt(value);
                    }"
                />
            </form-section>

            <form-section v-if="isRegularShortcut" title="Advanced Technical Settings">
                <checkbox-input
                    :model-value="isWaitForInternet"
                    @update:model-value="
                        (value) => shortcutData.retryPolicy = value
                            ? RetryPolicy.WAIT_FOR_INTERNET
                            : RetryPolicy.NONE
                    "
                    label="Wait for connection when offline"
                />
                <checkbox-input
                    v-model="shortcutData.followRedirects"
                    label="Follow redirects"
                />
                <checkbox-input
                    v-model="shortcutData.acceptCookies"
                    label="Store cookies"
                />
                <checkbox-input
                    v-model="shortcutData.acceptAllCertificates"
                    label="Accept any certificate (I know what I'm doing)"
                />
                <text-input
                    v-model="shortcutData.wifiSsid"
                    :label="$t('shortcuts.advancedSettings.wifiSsid.label')"
                    :placeholder="$t('shortcuts.advancedSettings.wifiSsid.placeholder')"
                />
                <text-input
                    :model-value="`${shortcutData.timeout}`"
                    label="Timeout (in milliseconds)"
                    type="number"
                    min="500"
                    max="600000"
                    @update:model-value="(value) => {
                        shortcutData.timeout = parseInt(value);
                    }"
                />
                <with-variable-picker
                    :variables="variables"
                    @insert-text="(text) => proxyInput?.insertAtCursor(text)"
                >
                    <text-input
                        ref="proxyInput"
                        :model-value="shortcutData.proxyHost || ''"
                        label="Proxy Hostname / IP Address"
                        placeholder="Enter the hostname or IP address of an HTTP proxy"
                        @update:model-value="(value) => {
                            shortcutData.proxyHost = value.length > 0 ? value : null;
                        }"
                    />
                </with-variable-picker>
                <text-input
                    :model-value="shortcutData.proxyPort ? `${shortcutData.proxyPort}` : ''"
                    label="Proxy Port"
                    placeholder="Enter the port of the HTTP proxy"
                    type="number"
                    min="1"
                    max="65353"
                    @update:model-value="(value) => {
                        shortcutData.proxyPort = value.length > 0 ? parseInt(value) : null;
                    }"
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
import HeaderList from '@/components/shortcuts/headers/HeaderList.vue';
import Icon from '@/components/basic/Icon.vue';
import ParameterList from '@/components/shortcuts/parameters/ParameterList.vue';
import ScriptInput from '@/components/form/ScriptInput.vue';
import SelectInput from '@/components/form/SelectInput.vue';
import TextInput from '@/components/form/TextInput.vue';
import WithVariablePicker from '@/components/variables/WithVariablePicker.vue';
import { useDialog } from '@/composables/dialog';
import {
    AuthenticationMethod,
    ExecutionType,
    HttpMethod,
    RequestBodyType,
    ResponseHandlingType,
    ResponseHandlingFailureOutputType,
    ResponseHandlingSuccessOutputType,
    RetryPolicy,
    type Header,
    type Parameter,
    type Shortcut,
    type Variable,
} from '@/model';

const props = defineProps<{
    shortcut: Shortcut;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:shortcut', shortcut: Shortcut): void;
    (e: 'copy', shortcut: Shortcut): void;
    (e: 'delete', shortcut: Shortcut): void;
}>();

const expanded = ref(false);
const shortcutData = ref<Shortcut>({ ...props.shortcut });

const urlInput = ref<InstanceType<typeof TextInput> | null>(null);
const bodyInput = ref<InstanceType<typeof TextInput> | null>(null);
const usernameInput = ref<InstanceType<typeof TextInput> | null>(null);
const passwordInput = ref<InstanceType<typeof TextInput> | null>(null);
const tokenInput = ref<InstanceType<typeof TextInput> | null>(null);
const successMessageInput = ref<InstanceType<typeof TextInput> | null>(null);
const proxyInput = ref<InstanceType<typeof TextInput> | null>(null);
const scriptPrepareInput = ref<InstanceType<typeof ScriptInput> | null>(null);
const scriptSuccessInput = ref<InstanceType<typeof ScriptInput> | null>(null);
const scriptFailureInput = ref<InstanceType<typeof ScriptInput> | null>(null);

const dialog = useDialog();

watch(shortcutData, (newData) => {
    emit('update:shortcut', newData);
}, { deep: true });

const shortcutTitle = computed(() => (shortcutData.value.name.length > 0
    ? shortcutData.value.name
    : '-'));

const shortcutTitleSuffix = computed(() => {
    switch (props.shortcut.executionType) {
    case ExecutionType.BROWSER:
        return '(Browser Shortcut)';
    case ExecutionType.TRIGGER:
        return '(Multi-Shortcut)';
    case ExecutionType.SCRIPTING:
        return '(Scripting Shortcut)';
    default:
        return null;
    }
});

const isRegularShortcut = computed(
    () => shortcutData.value.executionType === ExecutionType.APP,
);
const isBrowserShortcut = computed(
    () => shortcutData.value.executionType === ExecutionType.BROWSER,
);
const isScriptingShortcut = computed(
    () => shortcutData.value.executionType === ExecutionType.SCRIPTING,
);
const usesUrl = computed(() => isRegularShortcut.value || isBrowserShortcut.value);
const usesUsernameAndPassword = computed(() => isRegularShortcut.value
    && (
        shortcutData.value.authentication === AuthenticationMethod.BASIC
            || shortcutData.value.authentication === AuthenticationMethod.DIGEST
    ));
const usesAuthToken = computed(() => isRegularShortcut.value
    && shortcutData.value.authentication === AuthenticationMethod.BEARER);
const usesRequestBody = computed(() => {
    if (!isRegularShortcut.value) {
        return false;
    }
    const { method } = shortcutData.value;
    return method === HttpMethod.POST
        || method === HttpMethod.PUT
        || method === HttpMethod.DELETE
        || method === HttpMethod.PATCH
        || method === HttpMethod.OPTIONS;
});
const usesCustomTextRequestBody = computed(() => {
    if (!isRegularShortcut.value) {
        return false;
    }
    return shortcutData.value.requestBodyType === RequestBodyType.CUSTOM_TEXT;
});
const usesParameters = computed(() => {
    if (!isRegularShortcut.value) {
        return false;
    }
    return shortcutData.value.requestBodyType === RequestBodyType.FORM_DATA
        || shortcutData.value.requestBodyType === RequestBodyType.X_WWW_FORM_URLENCODE;
});
const usesDisplayType = computed(() => {
    if (!isRegularShortcut.value || !shortcutData.value.responseHandling) {
        return false;
    }
    const { responseHandling } = shortcutData.value;
    return (
        responseHandling.successOutput !== ResponseHandlingSuccessOutputType.NONE
        || responseHandling.failureOutput !== ResponseHandlingFailureOutputType.NONE
    );
});
const usesSuccessMessage = computed(() => {
    if (!isRegularShortcut.value || !shortcutData.value.responseHandling) {
        return false;
    }
    return shortcutData.value.responseHandling.successOutput
        === ResponseHandlingSuccessOutputType.MESSAGE;
});
const usesScripting = computed(
    () => shortcutData.value.executionType !== ExecutionType.TRIGGER,
);
const usesScriptingOnSuccess = computed(() => isRegularShortcut.value);
const usesScriptingOnFailure = computed(() => isRegularShortcut.value);
const isWaitForInternet = computed(() => isRegularShortcut.value
    && shortcutData.value.retryPolicy === RetryPolicy.WAIT_FOR_INTERNET);

function onUpdateHeaders(headers: Header[]) {
    emit('update:shortcut', {
        ...shortcutData.value,
        headers,
    });
}

function onUpdateParameters(parameters: Parameter[]) {
    emit('update:shortcut', {
        ...shortcutData.value,
        parameters,
    });
}

function toggle() {
    expanded.value = !expanded.value;
}

function onCopyClicked() {
    emit('copy', shortcutData.value);
}

async function onDeleteClicked() {
    try {
        await dialog.confirm('Delete this shortcut?', { okText: 'Delete' });
        emit('delete', shortcutData.value);
    } catch (e) {
        // cancelled
    }
}
</script>

<style lang="sass" scoped>
.shortcut
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
            font-size: 1.4em
            padding: 15px 0
            flex: 1 1 auto

            &__suffix
               color: #CCCCCC

        &__chevron, &__copy-button, &__delete-button
            flex: 0 0 auto
            width: 18px
            height: 18px
            padding: 10px
            opacity: 0.25
            transition: opacity ease-in-out 300ms

        &:hover &__chevron, &:hover &__copy-button, &:hover &__delete-button
            opacity: 1

    &__form
        padding: 0 20px
</style>
