import { parseTwee } from "extwee";
import { defineConfig, searchForWorkspaceRoot  } from "vite";
import {readdir, readFile} from 'fs/promises';
import {extname, resolve} from 'path';
import {createHtmlPlugin} from 'vite-plugin-html';
import {viteSingleFile} from 'vite-plugin-singlefile';


// Modified from https://github.com/klembot/chapbook
async function storyData() {
	let source = '';
	for (const filename of await readdir(resolve(__dirname, 'src/twee'))) {
		if (extname(filename) !== '.twee') {
			continue;
		}

		source += (await readFile(resolve(__dirname, 'src/twee', filename), 'utf8')) + '\n';
	}

	const story = parseTwee(source);
	story.name = "Discus";
	story.start = "Start";

	return story.toTwine2HTML();
}

export default defineConfig(async () => ({
	build: {
		emptyOutDir: true,
		outDir: "./dist"
	},
	plugins: [
		createHtmlPlugin({
			entry: "./src/ts/game.mts",
			inject: {
				data: {
					storyData: await storyData()
				},
			},
			minify: true
		}),
		viteSingleFile()
	],
  	server: {
    	open: true
  	}
}));