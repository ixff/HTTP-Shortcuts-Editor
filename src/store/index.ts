import { defineStore } from 'pinia';
import {
    Base,
    ParameterType,
    RequestBodyType,
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

export function normalize(data: Base): Base {
    return {
        ...data,
        categories: data.categories.map((category) => ({
            ...category,
            shortcuts: category.shortcuts.map((shortcut) => ({
                ...shortcut,
                proxyHost: shortcut.proxyHost || null,
                proxyPort: shortcut.proxyPort || null,
            })),
        })),
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
