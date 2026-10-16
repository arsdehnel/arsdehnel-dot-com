export default {
	plugins: ['prettier-plugin-packagejson'],
	overrides: [
		{
			files: ['*.scss', '*.css'],
			options: {
				printWidth: 130,
				tabWidth: 4,
				useTabs: true,
			},
		},
		{
			files: 'package.json',
			options: {
				tabWidth: 4,
				useTabs: true,
			},
		},
	],
};
