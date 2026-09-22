import { createI18n } from 'vue-i18n';
import EnglishTranslation from '@/i18n/translations/en';

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        en: EnglishTranslation,
    },
});

export default i18n;
