import { Marked, type MarkedExtension } from 'marked';
import type { CartaHistoryOptions } from './history';
import { CartaInput } from './input';
import {
	defaultKeyboardShortcuts,
	type DefaultShortcutId,
	type KeyboardShortcut
} from './shortcuts';
import { defaultIcons, type CartaIcon, type DefaultIconId } from './icons';
import { defaultPrefixes, type DefaultPrefixId, type Prefix } from './prefixes';
import type { SvelteComponentTyped } from 'svelte';
import { CartaRenderer } from './renderer';
import {
	loadCustomLanguage,
	highlight,
	highlightAutodetect,
	type HighlightFunctions
} from './highlight.js';
import type { ShjLanguageDefinition } from '@speed-highlight/core/index';
import { mangle } from 'marked-mangle';
import { gfmHeadingId, type GfmHeadingIdOptions } from 'marked-gfm-heading-id';

// Node does not implement CustomEvent until v19, so we
// "declare" it ourself for backward compatibility.
class CustomEvent<T> extends Event {
	detail: T;
	constructor(message: string, data: EventInit & { detail: T }) {
		super(message, data);
		this.detail = data.detail;
	}
}

/**
 * Carta-specific event with extra payload.
 */
export type CartaEvent = CustomEvent<{ carta: Carta }>;
const cartaEvents = ['carta-render', 'carta-render-ssr'] as const;
type CartaEventType = (typeof cartaEvents)[number];

export type CartaListener<K extends CartaEventType | keyof HTMLElementEventMap> = [
	type: K,
	listener: (
		this: HTMLTextAreaElement,
		ev: K extends CartaEventType
			? CartaEvent
			: K extends keyof HTMLElementEventMap
			? HTMLElementEventMap[K]
			: Event
	) => unknown,
	options?: boolean | AddEventListenerOptions
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CartaListeners = CartaListener<any>[];

type MaybeArray<T> = T | Array<T>;

export interface CartaExtensionComponent<T extends object> {
	/**
	 * Svelte components that exports `carta: Carta` and all the other properties specified in `props`.
	 */
	component: typeof SvelteComponentTyped<T & { carta: Carta }>;
	/**
	 * Properties that will be handed to the component.
	 */
	props: T;
	/**
	 * Where this component will be placed.
	 */
	parent: MaybeArray<'editor' | 'input' | 'renderer' | 'preview'>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CartaExtensionComponents = Array<CartaExtensionComponent<any>>;

/**
 * Carta editor options.
 */
export interface CartaOptions {
	/**
	 * Editor/viewer extensions.
	 */
	extensions?: CartaExtension[];
	/**
	 * Renderer debouncing timeout, in ms.
	 * @defaults 300ms
	 */
	rendererDebounce?: number;
	/**
	 * Remove default shortcuts by ids.
	 */
	disableShortcuts?: DefaultShortcutId[] | true;
	/**
	 * Remove default icons by ids.
	 */
	disableIcons?: DefaultIconId[] | true;
	/**
	 * Remove default prefixes by ids.
	 */
	disablePrefixes?: DefaultPrefixId[] | true;
	/**
	 * History (Undo/Redo) options.
	 */
	historyOptions?: Partial<CartaHistoryOptions>;
	/**
	 * HTML sanitizer.
	 */
	sanitizer?: (html: string) => string;
	/**
	 * marked-mangle.
	 * @default true
	 */
	mangle?: false;
	/**
	 * marked-gfm-heading-ids options.
	 * Use `false` to disable it.
	 */
	gfmHeadingId?: GfmHeadingIdOptions | false;
}

/**
 * Carta editor extensions.
 */
export interface CartaExtension {
	/**
	 * Marked extensions, more on that [here](https://marked.js.org/using_advanced).
	 */
	markedExtensions?: MarkedExtension[];
	/**
	 * Additional keyboard shortcuts.
	 */
	shortcuts?: KeyboardShortcut[];
	/**
	 * Additional icons.
	 */
	icons?: CartaIcon[];
	/**
	 * Additional prefixes.
	 */
	prefixes?: Prefix[];
	/**
	 * Textarea event listeners.
	 */
	listeners?: CartaListeners;
	/**
	 * Additional components, that will be put after the editor.
	 * All components are given a `carta: Carta` prop.
	 * The editor has a `relative` position, so you can position
	 * elements absolutely.
	 */
	components?: CartaExtensionComponents;
	/**
	 * Custom markdown highlight rules. See [Speed-Highlight Wiki](https://github.com/speed-highlight/core/wiki/Create-or-suggest-new-languages).
	 */
	highlightRules?: ShjLanguageDefinition;
	/**
	 * Use this callback to execute code when one Carta instance loads the extension.
	 * @param data General Carta related data.
	 */
	onLoad?: (data: { carta: Carta; highlight: HighlightFunctions }) => void;
	/**
	 * This function can be used to access a reference to the `Carta` class immediately after initialization.
	 * @deprecated Use `onLoad` instead.
	 */
	cartaRef?: (carta: Carta) => void;
	/**
	 * This function can be used to access a reference to all highlight functions immediately after initialization.
	 * @deprecated Use `onLoad` instead.
	 */
	shjRef?: (functions: HighlightFunctions) => void;
}

export class Carta {
	public readonly keyboardShortcuts: KeyboardShortcut[];
	public readonly icons: CartaIcon[];
	public readonly prefixes: Prefix[];
	public readonly highlightRules: ShjLanguageDefinition;
	public readonly textareaListeners: CartaListeners;
	public readonly cartaListeners: CartaListeners;
	public readonly components: CartaExtensionComponents;
	public readonly dispatcher = new EventTarget();
	public readonly markedAsync = new Marked();
	public readonly markedSync = new Marked();

	private _input: CartaInput | undefined;
	private _renderer: CartaRenderer | undefined;
	public get input() {
		return this._input;
	}
	public get renderer() {
		return this._renderer;
	}

	public constructor(public readonly options?: CartaOptions) {
		this.keyboardShortcuts = [];
		this.icons = [];
		this.prefixes = [];
		this.textareaListeners = [];
		this.cartaListeners = [];
		this.components = [];
		this.highlightRules = [];

		const listeners = [];

		for (const ext of options?.extensions ?? []) {
			this.keyboardShortcuts.push(...(ext.shortcuts ?? []));
			this.icons.push(...(ext.icons ?? []));
			this.prefixes.push(...(ext.prefixes ?? []));
			this.components.push(...(ext.components ?? []));
			this.highlightRules.push(...(ext.highlightRules ?? []));

			listeners.push(...(ext.listeners ?? []));
		}

		// Split different listeners
		this.textareaListeners = listeners.filter((it) => !cartaEvents.includes(it[0]));
		this.cartaListeners = listeners.filter((it) => cartaEvents.includes(it[0]));

		// Setup carta listeners
		this.cartaListeners.forEach((it) => {
			this.dispatcher.addEventListener(...it);
		});

		// Load default keyboard shortcuts
		this.keyboardShortcuts.push(
			...defaultKeyboardShortcuts.filter((shortcut) =>
				options?.disableShortcuts === true
					? false
					: !options?.disableShortcuts?.includes(shortcut.id)
			)
		);

		// Load default icons
		this.icons.push(
			...defaultIcons.filter((icon) =>
				options?.disableIcons === true ? false : !options?.disableIcons?.includes(icon.id)
			)
		);

		// Load default prefixes
		this.prefixes.push(
			...defaultPrefixes.filter((prefix) =>
				options?.disablePrefixes === true ? false : !options?.disablePrefixes?.includes(prefix.id)
			)
		);

		// Load default marked extensions
		if (options?.mangle !== false) {
			this.useMarkedExtension(mangle());
		} else {
			this.useMarkedExtension({ mangle: false });
		}

		if (options?.gfmHeadingId !== false) {
			this.useMarkedExtension(gfmHeadingId(options?.gfmHeadingId));
		} else {
			this.useMarkedExtension({ headerIds: false });
		}

		// Load marked extensions
		const markedExtensions = this.options?.extensions
			?.flatMap((ext) => ext.markedExtensions)
			.filter((ext) => ext != null) as MarkedExtension[] | undefined;
		if (markedExtensions)
			markedExtensions.forEach((ext) => {
				this.useMarkedExtension(ext);
			});

		// Load highlight custom language
		import('./shj.js')
			.then((module) => {
				// inject custom rules
				module.default.unshift(...this.highlightRules);
				return loadCustomLanguage('cartamd', module);
			})
			// trigger re-render
			.then(() => this.input?.update());

		for (const ext of this.options?.extensions ?? []) {
			ext.cartaRef && ext.cartaRef(this);
			ext.shjRef &&
				ext.shjRef({
					highlight,
					highlightAutodetect,
					loadCustomLanguage
				});
			ext.onLoad &&
				ext.onLoad({
					carta: this,
					highlight: {
						highlight,
						highlightAutodetect,
						loadCustomLanguage
					}
				});
		}
	}

	private useMarkedExtension(exts: MarkedExtension) {
		this.markedAsync.use(exts);
		if (!exts.async) this.markedSync.use(exts);
	}

	/**
	 * Render markdown to html asynchronously.
	 * @param markdown Markdown input.
	 * @returns Rendered html.
	 */
	public async render(markdown: string): Promise<string> {
		const dirty = await this.markedAsync.parse(markdown, { async: true });
		if (!dirty) return '';
		this.dispatcher.dispatchEvent(
			new CustomEvent<{ carta: Carta }>('carta-render', { detail: { carta: this } })
		);
		return (this.options?.sanitizer && this.options?.sanitizer(dirty)) ?? dirty;
	}

	/**
	 * Render markdown, excluding syntax highlighting (SSR).
	 * @param markdown Markdown input.
	 * @returns Rendered html.
	 */
	public renderSSR(markdown: string): string {
		const dirty = this.markedSync.parse(markdown, { async: false });
		if (typeof dirty != 'string') return '';
		this.dispatcher.dispatchEvent(
			new CustomEvent<{ carta: Carta }>('carta-render-ssr', { detail: { carta: this } })
		);
		if (this.options?.sanitizer) return this.options.sanitizer(dirty);
		return dirty;
	}

	/**
	 * **Internal**: set the input element.
	 * @param textarea The input textarea element.
	 * @param callback Update callback.
	 */
	public $setInput(textarea: HTMLTextAreaElement, container: HTMLDivElement, callback: () => void) {
		this._input = new CartaInput(textarea, container, {
			shortcuts: this.keyboardShortcuts,
			prefixes: this.prefixes,
			listeners: this.textareaListeners,
			callback: callback,
			historyOpts: this.options?.historyOptions
		});
	}

	/**
	 * **Internal**: set the renderer element.
	 * @param container Div container of the rendered element.
	 */
	public $setRenderer(container: HTMLDivElement) {
		this._renderer = new CartaRenderer(container);
	}
}
