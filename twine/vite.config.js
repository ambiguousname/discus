import { parseTwee } from "extwee";
import { defineConfig, searchForWorkspaceRoot  } from "vite";
import {readdir, readFile} from 'fs/promises';
import {extname, resolve} from 'path';
import {createHtmlPlugin} from 'vite-plugin-html';
import {viteSingleFile} from 'vite-plugin-singlefile';
import { viteStaticCopy } from "vite-plugin-static-copy";


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
		// Get the HTML file as a JSON, since that's what our custom template is for:
		viteStaticCopy({
			targets: [
				{
					src: "../build/Discus.html",
					dest: ".",
					rename: {
						stripBase: 1,
						name: "Discus.json"
					},
				},
				{
					src: "../build/Discus.wasm",
					dest: ".",
					rename: {
						stripBase: 1
					}
				},
				{
					src: "../build/Discus.pck",
					dest: ".",
					rename: {
						stripBase: 1
					}
				}
			]
		}),
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