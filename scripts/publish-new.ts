import { Auto } from '@auto-it/core'
import fetch from 'cross-fetch'
import minimist from 'minimist'
import { assert } from 'node:console'
import { SemVer, parse } from 'semver'
import { exec } from './lib/exec'
import { REPO_ROOT } from './lib/file'
import { nicelog } from './lib/nicelog'
import { getLatestVersion, publish, setAllVersions } from './lib/publishing'
import { getAllWorkspacePackages } from './lib/workspace'

type ReleaseType =
	| {
			bump: 'major' | 'minor'
	  }
	| {
			bump: 'override'
			version: SemVer
	  }

function getReleaseType(): ReleaseType {
	const arg = minimist(process.argv.slice(2))['bump']
	if (!arg) {
		throw new Error('Must provide a --bump argument')
	}
	if (arg === 'major' || arg === 'minor') {
		return { bump: arg }
	}
	const parsed = parse(arg)
	if (parsed) {
		return { bump: 'override', version: parsed }
	}
	throw new Error('Invalid bump argument ' + JSON.stringify(arg))
}

function getNextVersion(releaseType: ReleaseType): string {
	if (releaseType.bump === 'override') {
		return releaseType.version.format()
	}

	const latestVersion = parse(getLatestVersion())!

	nicelog('latestVersion', latestVersion)

	const [prereleaseTag, prereleaseNumber] = latestVersion.prerelease
	if (prereleaseTag && typeof prereleaseNumber !== 'number') {
		throw new Error(`Invalid prerelease format in version ${latestVersion}, expected e.g. -alpha.1`)
	}

	// if we're in prerelease mode, don't bump the version, only the prerelease number
	const nextVersion = prereleaseTag
		? `${latestVersion.major}.${latestVersion.minor}.${latestVersion.patch}-${prereleaseTag}.${
				Number(prereleaseNumber) + 1
			}`
		: latestVersion.inc(releaseType.bump).format()

	return nextVersion
}

async function main() {
	const huppyToken = process.env.HUPPY_TOKEN
	assert(huppyToken && typeof huppyToken === 'string', 'HUPPY_ACCESS_KEY env var must be set')

	// check we're on the main branch on HEAD
	const currentBranch = (await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).toString().trim()
	if (currentBranch !== 'main') {
		throw new Error('Must be on main branch to publish')
	}

	const releaseType = getReleaseType()
	const nextVersion = getNextVersion(releaseType)

	console.log('Releasing version', nextVersion)

	setAllVersions(nextVersion)

	// stage the changes
	const packageJsonFilesToAdd = []
	for (const workspace of await getAllWorkspacePackages()) {
		if (workspace.relativePath.startsWith('packages/')) {
			packageJsonFilesToAdd.push(`${workspace.relativePath}/package.json`)
		}
	}
	await exec('git', [
		'add',
		'lerna.json',
		...packageJsonFilesToAdd,
		REPO_ROOT + '/packages/*/src/**/version.ts',
	])

	const auto = new Auto({
		plugins: ['npm'],
		baseBranch: 'main',
		owner: 'tldraw',
		repo: 'tldraw',
		verbose: true,
		disableTsNode: true,
	})

	await auto.loadConfig()

	// this creates a new commit
	await auto.changelog({
		useVersion: nextVersion,
		title: `v${nextVersion}`,
	})

	// Gonna test this in a quick and dirty 'dry-run' mode
	return

	// create and push a new tag
	await exec('git', ['tag', '-f', `v${nextVersion}`])
	await exec('git', ['push', '--follow-tags'])

	// create a release on github
	await auto.runRelease({ useVersion: nextVersion })

	// finally, publish the packages [IF THIS STEP FAILS, RUN THE `publish-manual.ts` script locally]
	await publish()

	nicelog('Notifying huppy of release...')
	const huppyResponse = await fetch('https://tldraw-repo-sync.fly.dev/api/on-release', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ apiKey: huppyToken, tagToRelease: `v${nextVersion}`, canary: false }),
	})
	nicelog(
		`huppy: [${huppyResponse.status} ${huppyResponse.statusText}] ${await huppyResponse.text()}`
	)
}

main()
