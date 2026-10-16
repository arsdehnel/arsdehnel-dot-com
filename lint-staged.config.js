export default {
	'*': ['biome check --write --no-errors-on-unmatched --files-ignore-unknown=true'],
	'package.json': ['prettier --write'],
	'*.{css,less}': ['prettier --write'],
	'worker-configuration.d.ts': [],
};
