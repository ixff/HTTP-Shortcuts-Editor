import { shallowRef, type ShallowRef } from 'vue';

export interface SelectDialogRequest {
    kind: 'select';
    title: string;
    options: unknown[];
    getOptionLabel: (option: any) => string;
    getOptionId?: (option: any) => string | number;
    emptyText?: string;
}

export interface MessageDialogRequest {
    kind: 'confirm' | 'alert';
    message: string;
    okText: string;
    cancelText?: string;
}

export type DialogRequest = SelectDialogRequest | MessageDialogRequest;

export const activeDialog: ShallowRef<DialogRequest | null> = shallowRef(null);

type Resolver = (value: any) => void;
type Rejecter = (reason: Error) => void;

let resolver: Resolver | null = null;
let rejecter: Rejecter | null = null;

function open(request: DialogRequest): Promise<any> {
    return new Promise((resolve, reject) => {
        resolver = resolve;
        rejecter = reject;
        activeDialog.value = request;
    });
}

/**
 * Closes the currently active dialog, resolving its promise.
 * Used for confirmations (with the given result) and selections.
 */
export function resolveDialog(value: any = true) {
    const resolve = resolver;
    close();
    resolve?.(value);
}

/**
 * Closes the currently active dialog, rejecting its promise.
 * Mirrors the behavior of vuejs-dialog, where cancelling throws.
 */
export function rejectDialog() {
    const reject = rejecter;
    close();
    reject?.(new Error('Dialog was cancelled'));
}

function close() {
    activeDialog.value = null;
    resolver = null;
    rejecter = null;
}

/**
 * Replacement for the vuejs-dialog `$dialog` API, backed by a single
 * globally hosted dialog component (see DialogHost.vue).
 */
export function useDialog() {
    return {
        alert(message: string, options: { okText?: string } = {}): Promise<void> {
            return open({
                kind: 'alert',
                message,
                okText: options.okText ?? 'OK',
            });
        },
        confirm(
            message: string,
            options: { okText?: string; cancelText?: string } = {},
        ): Promise<boolean> {
            return open({
                kind: 'confirm',
                message,
                okText: options.okText ?? 'OK',
                cancelText: options.cancelText ?? 'Cancel',
            });
        },
        select<T>(config: Omit<SelectDialogRequest, 'kind'>): Promise<T> {
            return open({
                kind: 'select',
                ...config,
            });
        },
    };
}
