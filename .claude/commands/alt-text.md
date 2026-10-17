Run `pnpm alt-text:check` and capture the output.

If all images have alt text, report that and stop.

If there are missing images, read each image file and generate appropriate alt text for it. Alt text should be descriptive, under 125 characters, and suitable for screen readers.

Once you have alt text for all missing images, write them to `src/image-alt-texts.json` — add each entry as `"posts/<slug>/<filename>": "<alt text>"` and keep the file sorted alphabetically by key.

Run `pnpm alt-text:check` again at the end to confirm everything passes.
