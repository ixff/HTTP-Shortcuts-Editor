import {
    Base,
    createNewCategory,
    createNewShortcut,
    createNewVariable,
    ExecutionType,
    ParameterType,
    RequestBodyType,
} from '@/model';
import ValidationError from '@/store/errors/ValidationError';
import { normalize, validate } from '@/store';

function makeBase(): Base {
    const category = createNewCategory();
    category.name = 'Category';
    category.shortcuts = [createNewShortcut(ExecutionType.APP)];
    category.shortcuts[0].name = 'Shortcut';
    return {
        categories: [category],
        version: 43,
        variables: [],
        title: null,
        globalCode: null,
    };
}

describe('validate', () => {
    it('accepts a valid base', () => {
        expect(() => validate(makeBase())).not.toThrow();
    });

    it('rejects when all categories are hidden', () => {
        const data = makeBase();
        data.categories[0].hidden = true;
        expect(() => validate(data)).toThrow(ValidationError);
        expect(() => validate(data)).toThrow("There must be at least one category which isn't hidden.");
    });

    it('rejects unnamed categories', () => {
        const data = makeBase();
        data.categories[0].name = '';
        expect(() => validate(data)).toThrow('don\'t have a name');
    });

    it('rejects unnamed shortcuts', () => {
        const data = makeBase();
        data.categories[0].shortcuts[0].name = '';
        expect(() => validate(data)).toThrow('One or more shortcuts don\'t have a name');
    });

    it('rejects unnamed variables', () => {
        const data = makeBase();
        data.variables = [createNewVariable()];
        expect(() => validate(data)).toThrow('One or more variables don\'t have a name');
    });

    it('rejects duplicate variable keys', () => {
        const data = makeBase();
        const a = createNewVariable();
        a.key = 'same';
        const b = createNewVariable();
        b.key = 'same';
        data.variables = [a, b];
        expect(() => validate(data)).toThrow('have the same name');
    });

    it('rejects unnamed headers', () => {
        const data = makeBase();
        data.categories[0].shortcuts[0].headers = [{ id: 'h', key: '', value: 'v' }];
        expect(() => validate(data)).toThrow('One or more headers');
    });

    it('rejects unnamed parameters', () => {
        const data = makeBase();
        data.categories[0].shortcuts[0].parameters = [{
            id: 'p', key: '', value: 'v', type: ParameterType.STRING, fileName: '',
        }];
        expect(() => validate(data)).toThrow('One or more request parameters don\'t have a name');
    });

    it('rejects file parameters under x-www-form-urlencoded', () => {
        const data = makeBase();
        const shortcut = data.categories[0].shortcuts[0];
        shortcut.requestBodyType = RequestBodyType.X_WWW_FORM_URLENCODE;
        shortcut.parameters = [{
            id: 'p', key: 'k', value: '', type: ParameterType.FILE, fileName: '',
        }];
        expect(() => validate(data)).toThrow('are invalid');
    });

    it('allows file parameters under form-data', () => {
        const data = makeBase();
        const shortcut = data.categories[0].shortcuts[0];
        shortcut.requestBodyType = RequestBodyType.FORM_DATA;
        shortcut.parameters = [{
            id: 'p', key: 'k', value: '', type: ParameterType.FILE, fileName: '',
        }];
        expect(() => validate(data)).not.toThrow();
    });
});

describe('normalize', () => {
    it('converts empty proxy host and port to null', () => {
        const data = makeBase();
        const shortcut = data.categories[0].shortcuts[0];
        shortcut.proxyHost = '' as any;
        shortcut.proxyPort = 0 as any;

        const result = normalize(data);
        expect(result.categories[0].shortcuts[0].proxyHost).toBeNull();
        expect(result.categories[0].shortcuts[0].proxyPort).toBeNull();
    });

    it('preserves non-empty proxy settings and unknown fields', () => {
        const data = makeBase();
        const shortcut = data.categories[0].shortcuts[0];
        shortcut.proxyHost = 'proxy.example.com';
        shortcut.proxyPort = 8080;
        (shortcut as any).someNewFieldFromApp = 'keep-me';

        const result = normalize(data);
        expect(result.categories[0].shortcuts[0].proxyHost).toBe('proxy.example.com');
        expect(result.categories[0].shortcuts[0].proxyPort).toBe(8080);
        expect((result.categories[0].shortcuts[0] as any).someNewFieldFromApp).toBe('keep-me');
    });
});
