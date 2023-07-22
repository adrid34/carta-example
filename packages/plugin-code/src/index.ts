import { highlight, type CartaExtension, highlightAutodetect } from 'carta-md';
import { markedHighlight } from 'marked-highlight';

interface CodeExtensionOptions {
	/**
	 * Default language when none is provided.
	 */
	defaultLanguage?: string;
	/**
	 * Whether to autodetect a language when none is provided.
	 * Overwritten by `defaultLanguage`.
	 */
	autoDetect?: string;
	/**
	 * Line numbering.
	 * @defaults false.
	 */
	lineNumbering?: boolean;
}

/**
 * Carta code highlighting plugin. Themes available on [GitHub](https://github.com/speed-highlight/core/tree/main/dist/themes).
 */
export const code = (options?: CodeExtensionOptions): CartaExtension => {
	return {
		markedExtensions: [
			markedHighlight({
				langPrefix: 'shj-lang-',
				async: true,
				async highlight(code, lang) {
					lang ||= options?.defaultLanguage ?? '';
					let highlighted: string | null = null;
					if (lang) {
						highlighted = await highlight(code, lang, !(options?.lineNumbering ?? false));
					}
					if (highlighted) return highlighted;

					if (options?.autoDetect ?? true) {
						return await highlightAutodetect(code, !(options?.lineNumbering ?? false));
					}

					return (await highlight(code, 'plain', !(options?.lineNumbering ?? false))) as string;
				}
			})
		]
	};
};
