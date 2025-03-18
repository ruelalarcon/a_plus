import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from "path";

export default defineConfig({
	plugins: [svelte()],
	root: 'frontend',
	server: {
		proxy: {
			'/api': 'http://localhost:3000'
		}
	},
	build: {
		outDir: '../dist',
		emptyOutDir: true
	},
	resolve: {
		alias: {
			$lib: path.resolve("./frontend/")
		}
	}
});