---
section: API
title: Core
---

# `Carta` options

List of options that can be used when creating `Carta`:

```ts
new Carta({
	/* ... */
});
```

### `extensions`

Type: `CartaExtension[]`

List of extensions(plugins) to use.

### `rendererDebounce`

Type: `number`

Rendering debouncing timeout, in milliseconds.
Defaults to 300ms.

### `disableShortcuts`

Type: `DefaultShortcutId[] | true`

Remove shortcuts by id. You can use `true` to disable all of them.

### `disablePrefixes`

Type: `DefaultPrefixId[] | true`

Remove prefixes by id. You can use `true` to disable all of them.

### `historyOptions`

History management options.

#### `historyOptions.minInterval`

Type: `number`

Minimum interval between save states in milliseconds.
Defaults to 300ms.

#### `historyOptions.maxSize`

Type: `number`

Maximum history size in bytes.
Defaults to 1MB.

### `sanitizer`

Type: `(html: string) => void`

HTML sanitizer. See [here](/getting-started#sanitization) for more details.

# `CartaEditor` options

List of options that can be used in the `<CartaEditor>` component.

### `carta`

Type: `Carta`

Carta manager to use for this editor.

### `theme`

Type: `string`

The theme of this editor. The editor and related elements will have the `carta-theme__<theme>` as a class.

### `value`

Type: `string`

Current Markdown input value.

### `mode`

Type: `'tabs' | 'split' | 'auto'`

Editor windows mode. With `auto` it will split when the window size is greater than 768px.

### `scroll`

Type: `'sync' | 'async'`

Scroll synchronization.

### `disableToolbar`

Type: `boolean`

Option to disable the toolbar.

### `placeholder`

Type: `string`

Set the textarea placeholder.

# `CartaViewer` options

List of options that can be used in the `<CartaViewer>` component.

### `carta`

Type: `Carta`

Carta manager to use for this editor.

### `theme`

Type: `string`

The theme of this editor. The viewer and related elements will have the `carta-theme__<theme>` as a class.

### `value`

Type: `string`

Current Markdown input value.
