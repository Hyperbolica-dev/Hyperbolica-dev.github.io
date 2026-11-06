import claude from './icons/claude.svg?raw';
import gpt from './icons/openai.svg?raw';
import gemini from './icons/gemini.svg?raw';
import grok from './icons/grok.svg?raw';
import deepseek from './icons/deepseek.svg?raw';
import qwen from './icons/qwen.svg?raw';
import kimi from './icons/kimi.svg?raw';
import mistral from './icons/mistral.svg?raw';

// Community-maintained brand marks; pinned upstream provenance and license in icons/LICENSE.
const marks: Record<string, string> = { claude, gpt, gemini, grok, deepseek, qwen, kimi, mistral };

export function modelIconUrl(id: string, color = '#171b28'): string | null {
	const svg = marks[id];
	return svg
		? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replaceAll('currentColor', color))}`
		: null;
}

export function modelIcon(id: string): HTMLElement {
	const wrap = document.createElement('span');
	wrap.className = 'lmti-model-icon';
	wrap.setAttribute('aria-hidden', 'true');
	const url = modelIconUrl(id);
	if (url) {
		const image = document.createElement('img');
		image.src = url;
		image.alt = '';
		image.width = 64;
		image.height = 64;
		wrap.append(image);
	}
	return wrap;
}
