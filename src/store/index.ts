import { defineStore } from 'pinia';
import {
    AuthenticationMethod,
    Base,
    CategoryLayoutType,
    ExecutionType,
    HttpMethod,
    ParameterType,
    RequestBodyType,
    ResponseHandling,
    ResponseHandlingFailureOutputType,
    ResponseHandlingSuccessOutputType,
    ResponseHandlingType,
    RetryPolicy,
    Shortcut,
    Variable,
    VariableType,
} from '@/model';
import ValidationError from '@/store/errors/ValidationError';
import ApiError from '@/store/errors/ApiError';
import {
    replaceVariableKeysWithPlaceholders,
    replaceVariablePlaceholdersWithKeys,
} from '@/store/variables';
import i18n from '@/i18n';

const REQUIRED_MIN_VERSION = 43;
const SUPPORTED_MAX_VERSION = 999;
const LOCAL_STORAGE_DEVICE_ID = 'device_id';
const API_PATH = 'api/files/';

const $t = i18n.global.t.bind(i18n.global);

async function makeApiRequest(
    deviceId: string,
    password: string,
    method?: string | null,
    body?: object | null,
) {
    const headers = new Headers();
    headers.set('Authorization', `Basic ${btoa(`${deviceId}:${password}`)}`);
    const response = await fetch(API_PATH, {
        headers,
        method: method || 'get',
        body: body ? JSON.stringify(body) : null,
    });
    if (response.ok) {
        return response.json();
    }
    throw new ApiError();
}

/**
 * The app's exporter omits fields that hold their default value (and any null
 * fields), e.g., there is no `executionType` on regular HTTP shortcuts, no
 * `headers`/`parameters` when empty, no `username` without authentication and
 * no `type` on constant variables. Fill in the editor's defaults for any
 * missing fields so that the placeholder transformation and the UI always see
 * a complete model. Explicit values (including unknown future fields) are
 * preserved via spread.
 */
function normalizeResponseHandling(responseHandling: ResponseHandling | null | undefined): ResponseHandling | null {
    if (!responseHandling) {
        return null;
    }
    return {
        ...responseHandling,
        // Defaults as produced by the app when omitting default values
        id: responseHandling.id ?? '',
        uiType: responseHandling.uiType ?? ResponseHandlingType.WINDOW,
        successOutput: responseHandling.successOutput ?? ResponseHandlingSuccessOutputType.RESPONSE,
        failureOutput: responseHandling.failureOutput ?? ResponseHandlingFailureOutputType.DETAILED,
        successMessage: responseHandling.successMessage ?? '',
        includeMetaInfo: responseHandling.includeMetaInfo ?? false,
    };
}

function normalizeShortcut(shortcut: Shortcut): Shortcut {
    return {
        ...shortcut,
        // Defaults for everything the exporter may omit ...
        executionType: shortcut.executionType ?? ExecutionType.APP,
        description: shortcut.description ?? '',
        method: shortcut.method ?? HttpMethod.GET,
        url: shortcut.url ?? '',
        authentication: shortcut.authentication ?? AuthenticationMethod.NONE,
        username: shortcut.username ?? '',
        password: shortcut.password ?? '',
        authToken: shortcut.authToken ?? '',
        contentType: shortcut.contentType ?? '',
        bodyContent: shortcut.bodyContent ?? '',
        requestBodyType: shortcut.requestBodyType ?? RequestBodyType.CUSTOM_TEXT,
        codeOnPrepare: shortcut.codeOnPrepare ?? '',
        codeOnSuccess: shortcut.codeOnSuccess ?? '',
        codeOnFailure: shortcut.codeOnFailure ?? '',
        launcherShortcut: shortcut.launcherShortcut ?? false,
        quickSettingsTileShortcut: shortcut.quickSettingsTileShortcut ?? false,
        retryPolicy: shortcut.retryPolicy ?? RetryPolicy.NONE,
        followRedirects: shortcut.followRedirects ?? true,
        acceptCookies: shortcut.acceptCookies ?? true,
        acceptAllCertificates: shortcut.acceptAllCertificates ?? false,
        parameters: shortcut.parameters ?? [],
        headers: shortcut.headers ?? [],
        wifiSsid: shortcut.wifiSsid ?? '',
        delay: shortcut.delay ?? 0,
        timeout: shortcut.timeout ?? 10_000,
        // ... but normalize fields where null means "not set"
        proxyHost: shortcut.proxyHost || null,
        proxyPort: shortcut.proxyPort || null,
        responseHandling: normalizeResponseHandling(shortcut.responseHandling),
    };
}

function normalizeVariable(variable: Variable): Variable {
    return {
        ...variable,
        type: variable.type ?? VariableType.CONSTANT,
        value: variable.value ?? '',
        options: variable.options ?? [],
        rememberValue: variable.rememberValue ?? false,
        urlEncode: variable.urlEncode ?? false,
        jsonEncode: variable.jsonEncode ?? false,
        data: variable.data ?? null,
        title: variable.title ?? '',
        // Older data uses a bit flag, newer app versions export `isShareText` instead
        flags: variable.flags ?? ((variable as any).isShareText ? 1 : 0),
    };
}

export function normalize(data: Base): Base {
    return {
        ...data,
        title: data.title ?? null,
        globalCode: data.globalCode ?? null,
        categories: (data.categories ?? []).map((category) => ({
            ...category,
            name: category.name ?? '',
            hidden: category.hidden ?? false,
            layoutType: category.layoutType ?? CategoryLayoutType.LINEAR_LIST,
            shortcuts: (category.shortcuts ?? []).map(normalizeShortcut),
        })),
        variables: (data.variables ?? []).map(normalizeVariable),
    };
}

export function validate(data: Base) {
    if (data.categories.every((category) => category.hidden)) {
        throw new ValidationError($t('validation.allCategoriesHidden'));
    }
    if (data.categories.some((category) => category.name.length === 0)) {
        throw new ValidationError($t('validation.unnamedCategories'));
    }
    if (data.variables.some((variable) => variable.key.length === 0)) {
        throw new ValidationError($t('validation.unnamedVariables'));
    }
    const variableKeys = data.variables.map((variable) => variable.key);
    if (variableKeys.length !== new Set(variableKeys).size) {
        throw new ValidationError($t('validation.duplicateVariables'));
    }
    if (data.categories.some(
        (category) => category.shortcuts.some(
            (shortcut) => shortcut.name.length === 0,
        ),
    )) {
        throw new ValidationError($t('validation.unnamedShortcuts'));
    }
    if (data.categories.some(
        (category) => category.shortcuts.some(
            (shortcut) => shortcut.headers.some(
                (header) => header.key.length === 0,
            ),
        ),
    )) {
        throw new ValidationError($t('validation.unnamedHeaders'));
    }
    if (data.categories.some(
        (category) => category.shortcuts.some(
            (shortcut) => shortcut.parameters.some(
                (parameter) => parameter.key.length === 0,
            ),
        ),
    )) {
        throw new ValidationError($t('validation.unnamedParameters'));
    }
    if (data.categories.some(
        (category) => category.shortcuts.some(
            (shortcut) => shortcut.requestBodyType === RequestBodyType.X_WWW_FORM_URLENCODE
                && shortcut.parameters.some(
                    (parameter) => parameter.type !== ParameterType.STRING,
                ),
        ),
    )) {
        throw new ValidationError($t('validation.invalidParameters'));
    }
}

export const useStore = defineStore('main', {
    state: () => ({
        deviceId: localStorage.getItem(LOCAL_STORAGE_DEVICE_ID) ?? '',
        password: '',
        data: null as Base | null,
        isLoading: false,
        isSaving: false,
        hasUnsavedChanges: false,
    }),
    getters: {
        isLoaded(state): boolean {
            return !state.isLoading && !!state.data;
        },
    },
    actions: {
        setCredentials(deviceId: string, password: string) {
            this.deviceId = deviceId;
            localStorage.setItem(LOCAL_STORAGE_DEVICE_ID, deviceId);
            this.password = password;
        },
        async loadData() {
            try {
                this.isLoading = true;
                const data = await makeApiRequest(
                    this.deviceId,
                    this.password,
                );

                if (data.version < REQUIRED_MIN_VERSION || data.version > SUPPORTED_MAX_VERSION) {
                    throw new ValidationError($t('validation.incompatibleVersion'));
                }

                this.data = replaceVariablePlaceholdersWithKeys(normalize(data));
                this.hasUnsavedChanges = false;
            } finally {
                this.isLoading = false;
            }
        },
        setData(data: Base) {
            this.data = data;
            this.hasUnsavedChanges = true;
        },
        async saveData() {
            this.isSaving = true;
            try {
                const base = this.data as Base;
                validate(base);
                await makeApiRequest(
                    this.deviceId,
                    this.password,
                    'post',
                    replaceVariableKeysWithPlaceholders(base),
                );
                this.hasUnsavedChanges = false;
            } finally {
                this.isSaving = false;
            }
        },
    },
});
