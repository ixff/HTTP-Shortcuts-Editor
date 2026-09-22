import {
    Base,
    Category,
    CategoryLayoutType,
    createNewCategory,
    createNewVariable,
    ExecutionType,
    ParameterType,
    RequestBodyType,
    Shortcut,
    Variable,
    VariableType,
} from '@/model';
import {
    replaceVariableKeysWithPlaceholders,
    replaceVariablePlaceholdersWithKeys,
} from '@/store/variables';

const UUID_VARIABLE_ID = 'a1b2c3d4-4123-4abc-8def-1234567890ab';
const NUMERIC_VARIABLE_ID = '42';

function makeVariable(id: string, key: string): Variable {
    return {
        ...createNewVariable(),
        id,
        key,
        value: '',
    };
}

function makeShortcut(overrides: Partial<Shortcut> = {}): Shortcut {
    return {
        id: 's1',
        name: 'My Shortcut',
        description: '',
        iconName: null,
        executionType: ExecutionType.APP,
        method: 'GET' as any,
        url: '',
        authentication: 'none' as any,
        username: '',
        password: '',
        authToken: '',
        contentType: '',
        bodyContent: '',
        requestBodyType: RequestBodyType.CUSTOM_TEXT,
        responseHandling: {
            id: 'rh1',
            uiType: 'toast' as any,
            successOutput: 'response' as any,
            failureOutput: 'detailed' as any,
            successMessage: '',
            includeMetaInfo: false,
        },
        codeOnPrepare: '',
        codeOnSuccess: '',
        codeOnFailure: '',
        launcherShortcut: false,
        quickSettingsTileShortcut: false,
        retryPolicy: 'none' as any,
        followRedirects: true,
        acceptCookies: true,
        acceptAllCertificates: false,
        proxyHost: null,
        proxyPort: null,
        parameters: [],
        headers: [],
        wifiSsid: '',
        delay: 0,
        timeout: 10000,
        ...overrides,
    };
}

function makeBase(shortcuts: Shortcut[], variables: Variable[]): Base {
    const category: Category = {
        ...createNewCategory(),
        id: 'c1',
        name: 'Category',
        shortcuts,
    };
    return {
        categories: [category],
        version: 43,
        variables,
        title: null,
        globalCode: null,
    };
}

describe('variable placeholder transformations', () => {
    it('replaces uuid-based placeholders with keys on load', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'myVar')];
        const shortcut = makeShortcut({ url: `https://example.com/{{${UUID_VARIABLE_ID}}}` });
        const result = replaceVariablePlaceholdersWithKeys(makeBase([shortcut], variables));

        expect(result.categories[0].shortcuts[0].url).toBe('https://example.com/{{{myVar}}}');
    });

    it('replaces numeric placeholders with keys on load', () => {
        const variables = [makeVariable(NUMERIC_VARIABLE_ID, 'legacyVar')];
        const shortcut = makeShortcut({ url: `https://example.com/{{${NUMERIC_VARIABLE_ID}}}` });
        const result = replaceVariablePlaceholdersWithKeys(makeBase([shortcut], variables));

        expect(result.categories[0].shortcuts[0].url).toBe('https://example.com/{{{legacyVar}}}');
    });

    it('replaces keys with placeholders on save', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'myVar')];
        const shortcut = makeShortcut({ url: 'https://example.com/{{{myVar}}}' });
        const result = replaceVariableKeysWithPlaceholders(makeBase([shortcut], variables));

        expect(result.categories[0].shortcuts[0].url)
            .toBe(`https://example.com/{{${UUID_VARIABLE_ID}}}`);
    });

    it('round-trips placeholders through load and save', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'myVar')];
        const original = makeShortcut({
            url: `https://example.com/{{${UUID_VARIABLE_ID}}}/path`,
            username: `user{{${UUID_VARIABLE_ID}}}`,
        });
        const base = makeBase([original], variables);

        const loaded = replaceVariablePlaceholdersWithKeys(base);
        expect(loaded.categories[0].shortcuts[0].url)
            .toBe('https://example.com/{{{myVar}}}/path');
        expect(loaded.categories[0].shortcuts[0].username).toBe('user{{{myVar}}}');

        const saved = replaceVariableKeysWithPlaceholders(loaded);
        expect(saved.categories[0].shortcuts[0].url).toBe(original.url);
        expect(saved.categories[0].shortcuts[0].username).toBe(original.username);
    });

    it('leaves unknown placeholders untouched', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'myVar')];
        const shortcut = makeShortcut({ url: 'https://example.com/{{{otherVar}}}' });
        const result = replaceVariableKeysWithPlaceholders(makeBase([shortcut], variables));

        expect(result.categories[0].shortcuts[0].url).toBe('https://example.com/{{{otherVar}}}');
    });

    it('transforms script code using the comment sentinel format', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'token')];
        const code = `const t = getVariable(/*[variable]*/"${UUID_VARIABLE_ID}"/*[/variable]*/);`;

        const base = makeBase([makeShortcut({ codeOnPrepare: code })], variables);
        const loaded = replaceVariablePlaceholdersWithKeys(base);
        expect(loaded.categories[0].shortcuts[0].codeOnPrepare)
            .toBe('const t = getVariable("token");');

        const saved = replaceVariableKeysWithPlaceholders(loaded);
        expect(saved.categories[0].shortcuts[0].codeOnPrepare).toBe(code);
    });

    it('transforms setVariable calls in script code', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'counter')];
        const code = `setVariable(/*[variable]*/"${UUID_VARIABLE_ID}"/*[/variable]*/, 5);`;

        const base = makeBase([makeShortcut({ codeOnSuccess: code })], variables);
        const loaded = replaceVariablePlaceholdersWithKeys(base);
        expect(loaded.categories[0].shortcuts[0].codeOnSuccess)
            .toBe('setVariable("counter", 5);');
    });

    it('transforms headers, parameters and success message', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'v')];
        const shortcut = makeShortcut({
            headers: [{ id: 'h1', key: `X-{{${UUID_VARIABLE_ID}}}`, value: `val{{${UUID_VARIABLE_ID}}}` }],
            parameters: [{
                id: 'p1',
                key: `{{${UUID_VARIABLE_ID}}}`,
                value: `{{${UUID_VARIABLE_ID}}}`,
                type: ParameterType.STRING,
                fileName: '',
            }],
            responseHandling: {
                id: 'rh1',
                uiType: 'toast' as any,
                successOutput: 'message' as any,
                failureOutput: 'none' as any,
                successMessage: `Hello {{{v}}}`,
                includeMetaInfo: false,
            },
        });
        const base = makeBase([shortcut], variables);

        const loaded = replaceVariablePlaceholdersWithKeys(base);
        const loadedShortcut = loaded.categories[0].shortcuts[0];
        expect(loadedShortcut.headers[0].key).toBe('X-{{{v}}}');
        expect(loadedShortcut.headers[0].value).toBe('val{{{v}}}');
        expect(loadedShortcut.parameters[0].key).toBe('{{{v}}}');
        expect(loadedShortcut.responseHandling?.successMessage).toBe('Hello {{{v}}}');

        const saved = replaceVariableKeysWithPlaceholders(loaded);
        const savedShortcut = saved.categories[0].shortcuts[0];
        expect(savedShortcut.headers[0].key).toBe(shortcut.headers[0].key);
        expect(savedShortcut.headers[0].value).toBe(shortcut.headers[0].value);
        expect(savedShortcut.parameters[0].key).toBe(shortcut.parameters[0].key);
        expect(savedShortcut.responseHandling?.successMessage)
            .toBe(`Hello {{${UUID_VARIABLE_ID}}}`);
    });

    it('transforms constant variable values but leaves other variable values alone', () => {
        const variables = [
            { ...makeVariable(UUID_VARIABLE_ID, 'constVar'), type: VariableType.CONSTANT, value: `prefix{{${UUID_VARIABLE_ID}}}` },
            { ...makeVariable('b1b2c3d4-4123-4abc-8def-1234567890ab', 'textVar'), type: VariableType.TEXT, value: 'raw-value' },
        ];
        const base = makeBase([makeShortcut()], variables);

        const loaded = replaceVariablePlaceholdersWithKeys(base);
        expect(loaded.variables[0].value).toBe('prefix{{{constVar}}}');
        expect(loaded.variables[1].value).toBe('raw-value');

        const saved = replaceVariableKeysWithPlaceholders(loaded);
        expect(saved.variables[0].value).toBe(`prefix{{${UUID_VARIABLE_ID}}}`);
        expect(saved.variables[1].value).toBe('raw-value');
    });

    it('transforms proxy host but not null proxy host', () => {
        const variables = [makeVariable(UUID_VARIABLE_ID, 'v')];
        const withProxy = makeShortcut({ proxyHost: `proxy-{{${UUID_VARIABLE_ID}}}` });
        const withoutProxy = makeShortcut({ proxyHost: null });

        const loaded = replaceVariablePlaceholdersWithKeys(
            makeBase([withProxy, withoutProxy], variables),
        );
        expect(loaded.categories[0].shortcuts[0].proxyHost).toBe('proxy-{{{v}}}');
        expect(loaded.categories[0].shortcuts[1].proxyHost).toBeNull();

        const saved = replaceVariableKeysWithPlaceholders(loaded);
        expect(saved.categories[0].shortcuts[0].proxyHost)
            .toBe(`proxy-{{${UUID_VARIABLE_ID}}}`);
        expect(saved.categories[0].shortcuts[1].proxyHost).toBeNull();
    });
});
