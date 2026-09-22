<template>
    <div id="app">
        <router-view />
        <dialog-host />
    </div>
</template>

<script setup lang="ts">
import DialogHost from '@/components/basic/DialogHost.vue';
</script>
