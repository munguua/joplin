const fs = require('fs-extra');
const path = require('path');

const rootDir = path.dirname(__dirname);

async function updatePackageVersion(packageFilePath, majorMinorVersion) {
	const contentText = await fs.readFile(packageFilePath, 'utf8');
	const content = JSON.parse(contentText);

	if (content.version.indexOf(majorMinorVersion) === 0) return;

	content.version = `${majorMinorVersion}.0`;
	await fs.writeFile(packageFilePath, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
}

async function updateGradleVersion(filePath, majorMinorVersion) {
	const contentText = await fs.readFile(filePath, 'utf8');

	const newContent = contentText.replace(/(versionName\s+")(\d+?\.\d+?)(\.\d+")/, function(match, prefix, version, suffix) {
		if (version === majorMinorVersion) return prefix + version + suffix;
		return `${prefix + majorMinorVersion}.0"`;
	});

	if (newContent === contentText) return;

	await fs.writeFile(filePath, newContent, 'utf8');
}

async function updateCodeProjVersion(filePath, majorMinorVersion) {
	const contentText = await fs.readFile(filePath, 'utf8');

	// MARKETING_VERSION = 10.1.0;
	const newContent = contentText.replace(/(MARKETING_VERSION = )(\d+\.\d+)(\.\d+;)/g, function(match, prefix, version, suffix) {
		if (version === majorMinorVersion) return prefix + version + suffix;
		return `${prefix + majorMinorVersion}.0;`;
	});

	if (newContent === contentText) return;

	await fs.writeFile(filePath, newContent, 'utf8');
}

async function updateClipperManifestVersion(manifestPath, majorMinorVersion) {
	const manifestText = await fs.readFile(manifestPath, 'utf8');
	const manifest = JSON.parse(manifestText);
	const versionText = manifest.version;

	if (versionText.indexOf(majorMinorVersion) === 0) return;

	manifest.version = `${majorMinorVersion}.0`;
	await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4));
}

// Need this hack to transform 1.x.x into 10.x.x due to some mistake
// on one of the release and the App Store won't allow decreasing
// the major version number.
function iosVersionHack(majorMinorVersion) {
	const p = majorMinorVersion.split('.');
	p[0] = `${p[0]}0`;
	return p.join('.');
}

async function main() {
	const argv = require('yargs').parserConfiguration({
		'parse-numbers': false,
	}).argv;

	if (!argv._ || !argv._.length) throw new Error('Please specify the major.minor version, eg. 1.2');

	const majorMinorVersion = argv._[0];

	await updatePackageVersion(`${rootDir}/ElectronClient/package.json`, majorMinorVersion);
	await updatePackageVersion(`${rootDir}/CliClient/package.json`, majorMinorVersion);
	await updateGradleVersion(`${rootDir}/ReactNativeClient/android/app/build.gradle`, majorMinorVersion);
	await updateCodeProjVersion(`${rootDir}/ReactNativeClient/ios/Joplin.xcodeproj/project.pbxproj`, iosVersionHack(majorMinorVersion));
	await updateClipperManifestVersion(`${rootDir}/Clipper/manifest.json`, majorMinorVersion);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
