import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { execFileSync } from 'child_process';

// Get git commit info at build time using execFileSync (safe - no shell injection)
function getGitInfo() {
	try {
		const commitHash = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
		const commitDate = execFileSync('git', ['log', '-1', '--format=%ci']).toString().trim();
		return { commitHash, commitDate };
	} catch {
		return { commitHash: 'unknown', commitDate: new Date().toISOString() };
	}
}

const gitInfo = getGitInfo();
const buildDate = new Date().toISOString();

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	define: {
		__BUILD_DATE__: JSON.stringify(buildDate),
		__COMMIT_HASH__: JSON.stringify(gitInfo.commitHash),
		__COMMIT_DATE__: JSON.stringify(gitInfo.commitDate)
	}
});
