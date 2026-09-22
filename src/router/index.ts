import { createRouter, createWebHashHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import EditorPage from '@/views/EditorPage.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage,
    },
    {
        path: '/edit',
        name: 'Editor',
        component: EditorPage,
    },
];

const router = createRouter({
    // Hash history under the `/editor` sub-path; remove the base argument
    // here if you want to host the web app at the domain root instead.
    history: createWebHashHistory('/editor'),
    routes,
});

export default router;
