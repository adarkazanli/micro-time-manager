import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { execFileSync } from 'child_process';

// Get git commit info at build time using execFileSync (safe - no shell injection)
// Falls back to Vercel's environment variables when git is not available
function getGitInfo() {
	// Try Vercel's environment variables first (available during Vercel builds)
	const vercelCommit = process.env.VERCEL_GIT_COMMIT_SHA;
	if (vercelCommit) {
		return {
			commitHash: vercelCommit.substring(0, 7),
			commitDate: new Date().toISOString()
		};
	}

	// Fall back to git commands for local builds
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
