# Compiling

## Export Godot Project
Export the HTML build to the `build` directory.

## Build Twine Project

`cd` into `twine`.

`npm ci`.

To build a distributed HTML file, run `npm run build`. To test, run `npm run start`.

# Debugging

You'll need to run the Godot editor with the `--debug-server` flag:
```bash
godot -e --debug-server ws://127.0.0.1:6007
```

You will also need to set the `Debug->Keep Debug Server Open` option to true.

Then run `npm run start` in the `twine` folder. (TODO: Make this a debug only flag). Re-export the project every time you want to see a change (TODO: Make this a quick keystroke), then go back to the server and reload the page to rebuild.

If successful, you should see the remote scene. Note that breakpoints will not be respected per https://github.com/godotengine/godot/issues/97533.