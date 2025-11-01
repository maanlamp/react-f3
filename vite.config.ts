import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		dts({
			tsconfigPath: "./tsconfig.app.json",
			include: ["lib"],
			rollupTypes: true
		}),
		libInjectCss()
	],
	build: {
		lib: {
			entry: resolve(__dirname, "lib/main.ts"),
			formats: ["es"]
		},
		copyPublicDir: false,
		rollupOptions: {
			external: ["react", "react/jsx-runtime"]
		}
	}
});
