// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Build-time version info injected by vite.config.ts
	const __BUILD_DATE__: string;
	const __COMMIT_HASH__: string;
	const __COMMIT_DATE__: string;
}

export {};
