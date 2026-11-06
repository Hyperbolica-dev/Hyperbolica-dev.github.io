import questionData from './data/questions.json';
import chineseQuestionData from './data/questions.zh-CN.json';
import modelData from './data/models.json';
import type { Answers, Bank, Model, Position, ScoreResult } from './types';
import { CONFIG } from './config';
import { quizStrings, text, type QuizStrings } from './strings';
import { dimensionLabels as chineseDimensions } from './strings.zh-CN';
import { scoreAnswers } from './scoring';
import { shuffleOptions, shuffleQuestions } from './shuffle';
import { generateAgentPrompt } from './agent';
import { decodeReply, encodeResult } from './code';
import { modelIcon } from './model-icons';
import { createResultImage, downloadResultImage } from './image-sharing';
import {
	finishHumanTiming,
	humanDurationMs,
	restoreHumanTiming,
	type HumanTiming,
} from './session';

const models = modelData as Model[];
type Think = keyof QuizStrings['thinkingLevels'];
type Who = keyof QuizStrings['families'];
type Session = {
	seed: number;
	answers: Answers;
	notes: Record<string, string>;
	index: number;
	mode: 'human' | 'agent';
	timing?: HumanTiming;
	nickname: string;
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content?: string) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (content !== undefined) node.textContent = content;
	return node;
}
function button(label: string, action: () => void, primary = false) {
	const node = el('button', primary ? 'lmti-button lmti-primary' : 'lmti-button', label);
	node.type = 'button';
	node.addEventListener('click', action);
	return node;
}
function clean(value: string, limit: number) {
	return Array.from(value.replace(/\p{Cc}/gu, ''))
		.slice(0, limit)
		.join('');
}
function cleanNickname(value: string) {
	return Array.from(value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim())
		.slice(0, 32)
		.join('');
}
function randomSeed() {
	return crypto.getRandomValues(new Uint32Array(1))[0];
}
function validPosition(q: Bank['questions'][number], value: unknown): value is Position {
	return value === 0 || q.options.some(({ pos }) => pos === value);
}
function loadSession(bank: Bank, storageKey: string): Session | null {
	try {
		const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
		if (
			!saved ||
			saved.mode !== 'human' ||
			!Number.isInteger(saved.seed) ||
			!Number.isInteger(saved.index) ||
			saved.index < 0 ||
			saved.index > bank.questions.length ||
			!saved.answers ||
			typeof saved.answers !== 'object'
		)
			return null;
		const answers: Answers = {};
		const notes: Record<string, string> = {};
		for (const q of bank.questions) {
			if (validPosition(q, saved.answers[q.id])) answers[q.id] = saved.answers[q.id];
			if (typeof saved.notes?.[q.id] === 'string') notes[q.id] = clean(saved.notes[q.id], 300);
		}
		if (
			saved.index === bank.questions.length &&
			Object.keys(answers).length !== bank.questions.length
		)
			return null;
		return {
			seed: saved.seed >>> 0,
			answers,
			notes,
			index: saved.index,
			mode: 'human',
			timing: restoreHumanTiming(saved.timing, saved.index === bank.questions.length),
			nickname: typeof saved.nickname === 'string' ? cleanNickname(saved.nickname) : '',
		};
	} catch {
		return null;
	}
}

export function mountQuiz(app: HTMLElement) {
	const language = app.dataset.lmtiLanguage === 'zh-CN' ? 'zh-CN' : 'en';
	const s = quizStrings(language);
	const sourceBank = (language === 'zh-CN' ? chineseQuestionData : questionData) as Bank;
	const bank: Bank =
		language === 'zh-CN'
			? {
					...sourceBank,
					dimensions: sourceBank.dimensions.map((dimension) => ({
						...dimension,
						...chineseDimensions[dimension.id],
					})),
				}
			: sourceBank;
	const storageKey = `lmti:v3:session:${language}`;
	const quizPath = language === 'zh-CN' ? `/zh${CONFIG.BASE_PATH}` : CONFIG.BASE_PATH;
	const screen = app.querySelector<HTMLElement>('[data-lmti-screen]')!;
	const status = app.querySelector<HTMLElement>('[data-lmti-status]')!;
	const params = new URLSearchParams(location.search);
	const debug = CONFIG.DEBUG_ENABLED && params.get('debug') === '1';
	const overrideSeed =
		CONFIG.DEBUG_ENABLED && /^\d+$/.test(params.get('seed') || '')
			? Number(params.get('seed')) >>> 0
			: null;
	let session = loadSession(bank, storageKey);
	let seed = overrideSeed ?? session?.seed ?? randomSeed();
	if (session && overrideSeed !== null) session.seed = seed;
	let mode: 'human' | 'agent' = 'human';
	let answers: Answers = session?.answers ?? {};
	let notes = session?.notes ?? {};
	let nickname = session?.nickname ?? '';
	let model = 'unknown';
	let think: Think = 'unknown';
	let who: Who = 'human';
	let view: 'landing' | 'quiz' | 'result' = 'landing';
	let dryRun = false;
	let submitted = false;
	let fallback: HTMLElement | null = null;
	const submissionIds = new Map<string, string>();

	const counts = app.querySelector<HTMLElement>('[data-lmti-counts]');
	if (counts && CONFIG.SUBMIT_ENDPOINT) {
		void (async () => {
			try {
				const response = await fetch(`${CONFIG.SUBMIT_ENDPOINT.replace(/\/$/, '')}/counts`);
				if (!response.ok) return;
				const data: unknown = await response.json();
				if (!data || typeof data !== 'object' || !('human' in data) || !('agent' in data)) return;
				if (
					typeof data.human !== 'number' ||
					typeof data.agent !== 'number' ||
					!Number.isSafeInteger(data.human) ||
					!Number.isSafeInteger(data.agent) ||
					data.human < 0 ||
					data.agent < 0
				)
					return;
				counts.textContent = text(s.submissionCounts, { human: data.human, agent: data.agent });
				counts.hidden = false;
			} catch {
				/* Counts are optional; a failed request leaves the subtitle hidden. */
			}
		})();
	}
	function announce(message: string) {
		status.textContent = '';
		requestAnimationFrame(() => {
			status.textContent = message;
		});
	}
	function save() {
		if (mode !== 'human' || !session) return;
		session.answers = answers;
		session.notes = notes;
		session.seed = seed;
		session.nickname = nickname;
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(session));
		} catch {
			/* In-memory answering still works when storage is blocked. */
		}
	}
	function clearSession() {
		session = null;
		try {
			sessionStorage.removeItem(storageKey);
		} catch {
			/* Storage may be unavailable. */
		}
	}
	function focusHeading() {
		const heading = screen.querySelector<HTMLElement>('[data-lmti-focus]');
		heading?.focus({ preventScroll: true });
		if (view === 'quiz') heading?.scrollIntoView({ block: 'nearest' });
	}
	function heading(label: string, level: 'h2' | 'h3' = 'h2') {
		const node = el(level, 'lmti-heading', label);
		node.tabIndex = -1;
		node.dataset.lmtiFocus = '';
		return node;
	}
	function finishRender() {
		screen.append(el('p', 'lmti-muted lmti-footer', s.betaFooter));
		if (debug) renderDebug();
		focusHeading();
	}
	async function copy(value: string, target: HTMLButtonElement, successLabel: string = s.copied) {
		fallback?.remove();
		try {
			await navigator.clipboard.writeText(value);
			const original = target.textContent;
			target.textContent = successLabel;
			announce(successLabel);
			window.setTimeout(() => {
				target.textContent = original;
			}, 4000);
		} catch {
			fallback = el('section', 'lmti-panel lmti-copy-fallback');
			fallback.append(el('p', '', s.copyFallback));
			const area = el('textarea', 'lmti-textarea');
			area.value = value;
			area.readOnly = true;
			area.setAttribute('aria-label', s.copyText);
			fallback.append(
				area,
				button(s.selectAll, () => {
					area.focus();
					area.select();
				}),
			);
			target.after(fallback);
			area.focus();
			area.select();
			announce(s.copyFallback);
		}
	}
	function inferWho(name: string): Who {
		return (
			(Object.keys(s.families) as Who[]).find(
				(family) => family !== 'human' && family !== 'other' && name.toLowerCase().includes(family),
			) ?? 'other'
		);
	}
	function decode(value: string, errors: HTMLElement) {
		const result = decodeReply(value, bank);
		if (!result.ok) {
			const messages: string[] = [];
			if (result.error === 'version') messages.push(s.decodeVersion);
			else if (result.error === 'format') messages.push(s.decodeFormat);
			else {
				if (result.missing.length)
					messages.push(text(s.missing, { items: result.missing.join(', ') }));
				if (result.invalid.length)
					messages.push(
						text(s.invalid, {
							items: result.invalid
								.map(({ q, value }) => text(s.invalidEntry, { q, value }))
								.join(', '),
						}),
					);
				if (result.duplicates.length)
					messages.push(text(s.duplicates, { items: result.duplicates.join(', ') }));
			}
			errors.textContent = messages.join(' ');
			return;
		}
		answers = result.answers;
		notes = {};
		mode = 'agent';
		model = result.model;
		think = result.think;
		who = inferWho(model);
		submitted = false;
		submissionIds.clear();
		renderResult();
		if (result.multiple) announce(s.multipleCodes);
	}
	function renderLanding() {
		view = 'landing';
		screen.replaceChildren();
		const intro = el('section', 'lmti-intro');
		intro.append(el('span', 'lmti-badge', s.beta), heading(s.subtitle), el('p', '', s.honesty));
		const nicknameInput = el('input', 'lmti-input');
		nicknameInput.type = 'text';
		nicknameInput.setAttribute('autocomplete', 'nickname');
		nicknameInput.value = nickname;
		nicknameInput.setAttribute('aria-describedby', 'lmti-nickname-help');
		nicknameInput.addEventListener('input', () => {
			nicknameInput.value = Array.from(nicknameInput.value.replace(/[\p{Cc}\p{Cf}]/gu, ''))
				.slice(0, 32)
				.join('');
			nickname = cleanNickname(nicknameInput.value);
			if (session) {
				session.nickname = nickname;
				try {
					sessionStorage.setItem(storageKey, JSON.stringify(session));
				} catch {
					/* The nickname remains usable when session storage is blocked. */
				}
			}
		});
		nicknameInput.addEventListener('blur', () => {
			nicknameInput.value = nickname;
		});
		const nicknameHelp = el('p', 'lmti-muted', s.nicknameHelp);
		nicknameHelp.id = 'lmti-nickname-help';
		intro.append(field(s.nickname, nicknameInput, 'lmti-nickname'), nicknameHelp);
		if (session && session.index < bank.questions.length)
			intro.append(
				button(text(s.resume, { n: session.index + 1 }), () => {
					mode = 'human';
					answers = session!.answers;
					notes = session!.notes;
					seed = session!.seed;
					renderQuestion();
				}),
			);
		intro.append(
			button(s.start, () => start(), true),
			el('p', 'lmti-muted', s.startNote),
		);
		const agent = el('section', 'lmti-panel');
		agent.append(el('h2', 'lmti-divider', s.agentDivider));
		const copyButton = button(s.agentCopy, () => {
			void copy(generateAgentPrompt(bank, seed, language), copyButton, s.agentCopied);
		});
		const area = el('textarea', 'lmti-textarea');
		area.id = 'lmti-agent-reply';
		area.placeholder = s.agentPlaceholder;
		area.rows = 5;
		const label = el('label', 'lmti-label', s.agentPaste);
		label.htmlFor = area.id;
		const errors = el('p', 'lmti-error');
		errors.setAttribute('aria-live', 'polite');
		const decodeButton = button(s.decode, () => decode(area.value, errors), true);
		decodeButton.disabled = true;
		area.addEventListener('input', () => {
			decodeButton.disabled = !area.value.trim();
		});
		agent.append(copyButton, label, area, decodeButton, errors);
		screen.append(intro, agent);
		finishRender();
	}
	function start() {
		mode = 'human';
		who = 'human';
		model = 'unknown';
		think = 'unknown';
		answers = {};
		notes = {};
		submitted = false;
		submissionIds.clear();
		seed = overrideSeed ?? randomSeed();
		session = { seed, answers, notes, index: 0, mode, timing: { startedAt: Date.now() }, nickname };
		save();
		renderQuestion();
	}
	function goNext() {
		if (
			view !== 'quiz' ||
			!session ||
			answers[shuffleQuestions(bank, seed)[session.index].id] === undefined
		)
			return;
		session.index++;
		if (session.index === bank.questions.length) session.timing = finishHumanTiming(session.timing);
		save();
		if (session.index === bank.questions.length) renderResult();
		else renderQuestion();
	}
	function goBack() {
		if (view !== 'quiz' || !session || session.index === 0) return;
		session.index--;
		save();
		renderQuestion();
	}
	function renderQuestion() {
		if (!session) return;
		view = 'quiz';
		screen.replaceChildren();
		const q = shuffleQuestions(bank, seed)[session.index];
		const progress = el('p', 'lmti-progress', text(s.progress, { n: session.index + 1 }));
		progress.setAttribute('aria-live', 'polite');
		const bar = el('div', 'lmti-progress-track');
		bar.setAttribute('aria-hidden', 'true');
		const fill = el('span');
		fill.style.width = `${((session.index + 1) / bank.questions.length) * 100}%`;
		bar.append(fill);
		const stem = heading(q.stem);
		stem.id = 'lmti-stem';
		const group = el('div', 'lmti-options');
		group.setAttribute('role', 'radiogroup');
		group.setAttribute('aria-labelledby', stem.id);
		const displayed = [...shuffleOptions(q, seed), { pos: 0 as const, text: s.blank }];
		const next = button(
			session.index === bank.questions.length - 1 ? s.finish : s.next,
			goNext,
			true,
		);
		next.disabled = answers[q.id] === undefined;
		const noteBox = el('div', 'lmti-note');
		const note = el('textarea', 'lmti-textarea');
		note.id = 'lmti-note';
		note.maxLength = 300;
		note.placeholder = s.blankPlaceholder;
		note.value = notes[q.id] ?? '';
		const noteLabel = el('label', 'lmti-label', s.blankPlaceholder);
		noteLabel.htmlFor = note.id;
		const count = el('p', 'lmti-muted', text(s.noteCount, { n: Array.from(note.value).length }));
		note.addEventListener('input', () => {
			note.value = clean(note.value, 300);
			notes[q.id] = note.value;
			count.textContent = text(s.noteCount, { n: Array.from(note.value).length });
			save();
		});
		noteBox.hidden = answers[q.id] !== 0;
		noteBox.append(noteLabel, note, count);
		for (const [index, option] of displayed.entries()) {
			const label = el('label', `lmti-option${option.pos === 0 ? ' lmti-blank' : ''}`);
			const radio = el('input');
			radio.type = 'radio';
			radio.name = 'lmti-answer';
			radio.value = String(option.pos);
			radio.checked = answers[q.id] === option.pos;
			label.classList.toggle('lmti-selected', radio.checked);
			radio.addEventListener('change', () => {
				answers[q.id] = option.pos;
				for (const row of group.querySelectorAll('label'))
					row.classList.toggle('lmti-selected', Boolean(row.querySelector('input:checked')));
				noteBox.hidden = option.pos !== 0;
				next.disabled = false;
				save();
			});
			const number = el('span', 'lmti-option-number', String(index + 1));
			number.setAttribute('aria-hidden', 'true');
			label.append(radio, number, el('span', '', option.text));
			group.append(label);
		}
		const actions = el('div', 'lmti-actions');
		if (session.index > 0) actions.append(button(s.back, goBack));
		actions.append(next);
		const question = el('section', 'lmti-question');
		question.append(
			el('p', 'lmti-eyebrow', q.kind === 'dislike' ? s.dislikeEyebrow : s.questionEyebrow),
			stem,
			group,
			noteBox,
			actions,
		);
		screen.append(progress, bar, question);
		if (session.index === 0)
			screen.append(el('p', 'lmti-muted', text(s.tipKeys, { n: Math.min(9, displayed.length) })));
		finishRender();
	}
	function code() {
		return encodeResult(answers, {
			who: mode === 'human' ? 'human' : who,
			think,
			...(mode === 'agent' ? { model } : {}),
		});
	}
	function insufficientCalibration(result: ScoreResult) {
		const winner = models.find(({ id }) => id === result.matches[0]?.id);
		return (
			!winner ||
			winner.calibration_version !== 'LLMQ3' ||
			winner.profile_source !== 'owner-run' ||
			!(winner.n_submissions >= 3)
		);
	}
	function subscoreLines(result: ScoreResult) {
		return (Object.keys(s.subscoreLabels) as (keyof typeof s.subscoreLabels)[]).map((key) =>
			text(s.subscoreCount, { label: s.subscoreLabels[key], ...result.subscores[key] }),
		);
	}
	function resultCard(result: ScoreResult, enough: boolean, playful: boolean, portrait: string[]) {
		const [top, ...others] = result.matches;
		return [
			...(playful
				? [s.interpretationWarning, s.interpretationTitle, s.interpretationScope, ...portrait]
				: [s.resultEyebrow]),
			enough && top ? text(s.cardMatch, { model: top.name, n: top.similarity }) : s.noMatch,
			...(enough && top && insufficientCalibration(result) ? [s.calibrationWarning] : []),
			...(enough
				? [
						text(s.cardThen, {
							models: others
								.slice(0, 2)
								.map((m) => `${m.name} (${m.similarity}%)`)
								.join(', '),
						}),
					]
				: []),
			text(playful ? s.playfulCardStats : s.cardStats, {
				passed: result.depth.passed,
				scored: result.depth.scored,
				mask: result.mask?.toFixed(2) ?? s.noData,
			}),
			...(playful ? [s.playfulDepthCaption, s.roleShiftCaption] : [s.maskCaption]),
			...subscoreLines(result),
			s.imageFooter,
			code(),
			new URL(quizPath, location.origin).href,
		].join('\n');
	}
	function renderRadar(result: ScoreResult, enough: boolean) {
		const section = el('section', 'lmti-chart-section');
		section.append(el('h3', 'lmti-heading', s.radarTitle));
		const ns = 'http://www.w3.org/2000/svg';
		function svgNode(tag: string, attrs: Record<string, string>) {
			const node = document.createElementNS(ns, tag);
			for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
			return node;
		}
		const svg = svgNode('svg', {
			viewBox: '0 0 360 350',
			class: 'lmti-radar',
			role: 'img',
			'aria-label': enough
				? text(s.radarDescription, { model: result.matches[0].name })
				: s.radarNoMatch,
		});
		const point = (i: number, value: number) => {
			const angle = (i * Math.PI) / 3 - Math.PI / 2;
			return `${180 + Math.cos(angle) * value},${173 + Math.sin(angle) * value}`;
		};
		for (let ring = 1; ring <= 5; ring++) {
			svg.append(
				svgNode('polygon', {
					points: bank.dimensions.map((_, i) => point(i, ring * 22)).join(' '),
					class: 'lmti-radar-grid',
				}),
			);
			const label = svgNode('text', {
				x: '184',
				y: String(173 - ring * 22 + 10),
				class: 'lmti-ring-label',
			});
			label.textContent = String(ring);
			svg.append(label);
		}
		bank.dimensions.forEach((dim, i) => {
			const [x, y] = point(i, 110).split(',');
			svg.append(svgNode('line', { x1: '180', y1: '173', x2: x, y2: y, class: 'lmti-radar-grid' }));
			const [tx, ty] = point(i, 137).split(',');
			const label = svgNode('text', {
				x: tx,
				y: ty,
				'text-anchor': 'middle',
				'dominant-baseline': 'middle',
				class: 'lmti-axis-label',
			});
			label.textContent = dim.name;
			if (result.dimensions[dim.id] === null) {
				const extra = svgNode('tspan', { x: tx, dy: '15' });
				extra.textContent = s.noData;
				label.append(extra);
			}
			svg.append(label);
		});
		if (enough)
			svg.append(
				svgNode('polygon', {
					points: bank.dimensions
						.map((dim, i) => point(i, result.matches[0].profile[dim.id] * 22))
						.join(' '),
					class: 'lmti-model-polygon',
				}),
			);
		const valid = bank.dimensions.flatMap((dim, i) =>
			result.dimensions[dim.id] === null ? [] : [{ i, value: result.dimensions[dim.id]! }],
		);
		if (valid.length >= 3)
			svg.append(
				svgNode('polygon', {
					points: valid.map(({ i, value }) => point(i, value * 22)).join(' '),
					class: 'lmti-user-polygon',
				}),
			);
		for (const { i, value } of valid) {
			const [cx, cy] = point(i, value * 22).split(',');
			svg.append(svgNode('circle', { cx, cy, r: '3', class: 'lmti-user-point' }));
		}
		const legend = el(
			'p',
			'lmti-chart-legend',
			enough ? `${s.you} — ${result.matches[0].name} - - -` : s.you,
		);
		const poles = el('ul', 'lmti-poles');
		for (const dim of bank.dimensions)
			poles.append(el('li', '', `${dim.name}: ${dim.low} / ${dim.high}`));
		const table = makeTable(
			[s.dimension, s.you, ...(enough ? [result.matches[0].name] : [])],
			bank.dimensions.map((dim) => [
				dim.name,
				result.dimensions[dim.id]?.toFixed(2) ?? s.noData,
				...(enough ? [result.matches[0].profile[dim.id].toFixed(2)] : []),
			]),
		);
		table.className = 'lmti-sr-only';
		const poleDetails = el('details', 'lmti-pole-details');
		poleDetails.append(el('summary', '', s.polesDetails), poles);
		section.append(svg, legend, poleDetails, table);
		return section;
	}
	function field(labelText: string, input: HTMLElement, id: string) {
		const wrap = el('div', 'lmti-field');
		const label = el('label', 'lmti-label', labelText);
		label.htmlFor = id;
		input.id = id;
		wrap.append(label, input);
		return wrap;
	}
	function select<T extends string>(
		choices: Record<T, string>,
		value: T,
		update: (value: T) => void,
	) {
		const input = el('select', 'lmti-input');
		for (const [key, label] of Object.entries(choices)) {
			const option = el('option', '', String(label));
			option.value = key;
			input.append(option);
		}
		input.value = value;
		input.addEventListener('change', () => update(input.value as T));
		return input;
	}
	function renderResult() {
		view = 'result';
		screen.replaceChildren();
		const result = scoreAnswers(answers, bank, models, {
			...CONFIG.MASK_LABELS,
			closeCallPoints: CONFIG.CLOSE_CALL_POINTS,
		});
		const enough =
			result.matches.length > 0 && bank.dimensions.some(({ id }) => result.dimensions[id] !== null);
		const top = result.matches[0];
		let playful = false;
		const portrait = result.traits.length
			? result.traits.map(({ dim, pole }) => s.interpretationTraits[dim][pole])
			: [s.interpretationEmpty];
		const warning = el('aside', 'lmti-interpretation-warning', s.interpretationWarning);
		warning.hidden = true;
		const languageChoices = el('fieldset', 'lmti-result-language');
		languageChoices.append(el('legend', '', s.resultLanguage));
		const languageHelp = el('p', 'lmti-muted', s.resultLanguageHelp);
		languageHelp.id = 'lmti-result-language-help';
		languageChoices.setAttribute('aria-describedby', languageHelp.id);
		for (const [value, labelText] of Object.entries(s.resultLanguages)) {
			const input = el('input');
			input.type = 'radio';
			input.name = 'lmti-result-language';
			input.value = value;
			input.checked = value === 'literal';
			input.addEventListener('change', () => {
				if (!input.checked) return;
				playful = value === 'playful';
				refreshLanguage();
				announce(text(s.resultLanguageChanged, { language: labelText }));
			});
			const label = el('label', 'lmti-language-choice');
			label.append(input, document.createTextNode(labelText));
			languageChoices.append(label);
		}
		screen.append(warning, languageChoices, languageHelp);
		const hero = el('div', 'lmti-result-hero');
		const identity = el('section', 'lmti-result-identity');
		identity.append(el('p', 'lmti-eyebrow', s.resultEyebrow));
		if (mode === 'human' && nickname)
			identity.append(el('p', 'lmti-nickname', text(s.nicknameResult, { nickname })));
		if (enough) {
			identity.append(
				modelIcon(top.id),
				el('p', 'lmti-match-eyebrow', s.matchEyebrow),
				heading(top.name),
			);
			const percent = el('p', 'lmti-match-percent');
			percent.append(el('strong', '', `${top.similarity}%`), el('span', '', s.matchLabel));
			identity.append(percent);
			if (insufficientCalibration(result))
				identity.append(el('p', 'lmti-calibration-warning', s.calibrationWarning));
			if (result.closeCall)
				identity.append(
					el('p', 'lmti-close-call', text(s.closeCall, { a: top.name, b: result.matches[1].name })),
				);
			const runners = el('div', 'lmti-runners');
			runners.append(el('h3', '', s.runners));
			for (const match of result.matches.slice(1, 3)) {
				const runner = el('div', 'lmti-runner');
				runner.append(
					modelIcon(match.id),
					el('span', '', match.name),
					el('strong', '', `${match.similarity}%`),
				);
				runners.append(runner);
			}
			identity.append(runners);
		} else identity.append(heading(s.noMatch), el('p', 'lmti-muted', s.noMatchCaption));
		hero.append(identity, renderRadar(result, enough));
		screen.append(hero);
		const answered = el('p', 'lmti-muted');
		if (mode === 'agent') screen.append(answered);
		const interpretation = el('section', 'lmti-panel lmti-interpretation');
		interpretation.hidden = true;
		interpretation.append(
			el('h3', '', s.interpretationTitle),
			el('p', 'lmti-muted', s.interpretationScope),
		);
		const portraitList = el('ul');
		for (const line of portrait) portraitList.append(el('li', '', line));
		interpretation.append(portraitList);
		screen.append(interpretation);
		if (result.traits.length)
			screen.append(
				el(
					'p',
					'',
					text(s.leanings, {
						traits: result.traits
							.map((trait) => {
								const dim = bank.dimensions.find(({ id }) => id === trait.dim)!;
								return `${dim.name}: ${trait.pole === 'middle' ? s.middle : dim[trait.pole]}`;
							})
							.join('; '),
					}),
				),
			);
		const stats = el('div', 'lmti-stats');
		const depth = el('section', 'lmti-panel');
		const depthTitle = el('h3');
		const depthCaption = el('p', 'lmti-muted');
		depth.append(depthTitle, depthCaption);
		const mask = el('section', 'lmti-panel');
		const maskTitle = el('h3');
		const maskCaption = el('p', 'lmti-muted');
		mask.append(maskTitle, maskCaption);
		stats.append(depth, mask);
		screen.append(stats);
		const subscores = el('section', 'lmti-panel');
		subscores.append(el('h3', '', s.subscoreTitle));
		for (const line of subscoreLines(result)) subscores.append(el('p', '', line));
		subscores.append(el('p', 'lmti-muted', s.subscoreCaption));
		screen.append(subscores);
		const cardSection = el('section', 'lmti-panel lmti-share');
		const card = el('pre', 'lmti-card');
		const copyCard = button(s.copyCard, () => {
			void copy(resultCard(result, enough, playful, portrait), copyCard);
		});
		const copyCode = button(s.copyCode, () => {
			void copy(code(), copyCode);
		});
		const saveImage = button(
			s.saveImage,
			() => {
				void shareImage(false);
			},
			true,
		);
		const copyImage = button(s.copyImage, () => {
			void shareImage(true);
		});
		async function shareImage(toClipboard: boolean) {
			saveImage.disabled = copyImage.disabled = true;
			announce(s.imageBusy);
			const blob = createResultImage(
				bank,
				result,
				enough,
				new URL(quizPath, location.origin).href,
				mode === 'human' ? nickname : undefined,
				{ playful, portrait, calibrationWarning: enough && insufficientCalibration(result) },
				language,
			);
			try {
				if (toClipboard && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
					try {
						// Start the write in the click gesture, before image decoding awaits.
						await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
						announce(s.imageCopied);
						return;
					} catch {
						downloadResultImage(await blob, language);
						announce(s.imageFallback);
						return;
					}
				}
				downloadResultImage(await blob, language);
				announce(toClipboard ? s.imageFallback : s.imageSaved);
			} catch {
				announce(s.imageError);
			} finally {
				saveImage.disabled = copyImage.disabled = false;
			}
		}
		const cardActions = el('div', 'lmti-actions');
		cardActions.append(saveImage, copyImage);
		const details = el('details', 'lmti-code-details');
		const textActions = el('div', 'lmti-actions');
		textActions.append(copyCard, copyCode);
		const resultCode = el('pre', 'lmti-code');
		details.append(
			el('summary', '', s.codeDetails),
			card,
			textActions,
			el('h3', '', s.resultCode),
			resultCode,
		);
		cardSection.append(
			el('h3', '', s.resultCard),
			el('p', 'lmti-muted', s.shareCaption),
			cardActions,
			details,
		);
		screen.append(cardSection);
		function refreshMetadata() {
			card.textContent = resultCard(result, enough, playful, portrait);
			resultCode.textContent = code();
			answered.textContent = text(s.answeredBy, { model, think: s.thinkingLevels[think] });
		}
		function refreshLanguage() {
			warning.hidden = interpretation.hidden = !playful;
			depthTitle.textContent = text(playful ? s.playfulDepth : s.depth, {
				passed: result.depth.passed,
				scored: result.depth.scored,
			});
			const depthObservation =
				result.depth.scored === 0
					? s.depthNone
					: result.depth.passed === 4
						? s.depthFull
						: result.depth.passed <= 1
							? s.depthFast
							: s.depthOther;
			depthCaption.textContent = playful
				? `${depthObservation} ${s.playfulDepthCaption}`
				: depthObservation;
			maskTitle.textContent =
				result.mask === null
					? playful
						? s.roleShiftMissing
						: s.maskMissing
					: text(playful ? s.roleShift : s.mask, {
							mask: result.mask.toFixed(2),
							label: (playful ? s.roleShiftLabels : s.maskLabels)[result.maskLabel!],
						});
			maskCaption.textContent = playful ? s.roleShiftCaption : s.maskCaption;
			refreshMetadata();
		}
		refreshLanguage();
		if (mode === 'agent' || CONFIG.SUBMIT_ENDPOINT) {
			const metadata = el('div', 'lmti-metadata');
			const modelInput = el('input', 'lmti-input');
			modelInput.type = 'text';
			modelInput.maxLength = 40;
			modelInput.value = model === 'unknown' ? '' : model;
			modelInput.addEventListener('input', () => {
				model = clean(modelInput.value, 40) || 'unknown';
				refreshMetadata();
			});
			metadata.append(
				field(
					s.who,
					select(s.families, who, (value) => {
						who = value;
						refreshMetadata();
					}),
					'lmti-who',
				),
				field(s.model, modelInput, 'lmti-model'),
				field(
					s.thinking,
					select(s.thinkingLevels, think, (value) => {
						think = value;
						refreshMetadata();
					}),
					'lmti-think',
				),
			);
			screen.append(metadata);
		}
		if (CONFIG.SUBMIT_ENDPOINT && !dryRun && enough) renderSubmit();
		const actions = el('div', 'lmti-actions');
		actions.append(
			button(s.retake, () => {
				clearSession();
				answers = {};
				notes = {};
				submitted = false;
				submissionIds.clear();
				renderLanding();
			}),
		);
		const back = el('a', 'lmti-button', s.backBlog);
		back.href = language === 'zh-CN' ? '/zh/fun/' : '/fun/';
		actions.append(back);
		screen.append(actions);
		finishRender();
	}
	function renderSubmit() {
		const panel = el('section', 'lmti-panel lmti-submit');
		if (submitted) {
			panel.append(el('p', '', s.submitted));
			screen.append(panel);
			return;
		}
		panel.append(el('h3', '', s.submitTitle), el('p', '', s.submitBody));
		const form = el('form');
		const hp = el('input');
		hp.name = 'hp';
		hp.tabIndex = -1;
		hp.autocomplete = 'off';
		hp.setAttribute('aria-label', s.honeypot);
		const trap = el('div', 'lmti-sr-only');
		trap.append(hp);
		const consent = el('input');
		consent.type = 'checkbox';
		consent.required = true;
		const label = el('label', 'lmti-consent');
		label.append(consent, document.createTextNode(s.consent));
		const submit = el('button', 'lmti-button lmti-primary', s.submit);
		submit.type = 'submit';
		submit.disabled = true;
		consent.addEventListener('change', () => {
			submit.disabled = !consent.checked;
		});
		const feedback = el('p');
		feedback.setAttribute('aria-live', 'polite');
		form.append(trap, label, submit, feedback);
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			if (!consent.checked || submitted || submit.disabled || dryRun) return;
			submit.disabled = true;
			submit.textContent = s.sending;
			const durationMs = mode === 'human' ? humanDurationMs(session?.timing) : undefined;
			const payload = {
				v: bank.version,
				code: code(),
				mode,
				language,
				who,
				model,
				think,
				...(mode === 'human' && nickname ? { nickname } : {}),
				...(durationMs !== undefined ? { durationMs } : {}),
				fb:
					mode === 'human'
						? Object.entries(notes)
								.filter(([q, value]) => answers[q] === 0 && value.trim())
								.map(([q, value]) => ({ q: Number(q.slice(1)), text: clean(value, 300) }))
						: [],
				hp: hp.value,
			};
			try {
				const submissionKey = JSON.stringify(payload);
				let submissionId = submissionIds.get(submissionKey);
				if (!submissionId) {
					submissionId = crypto.randomUUID();
					submissionIds.set(submissionKey, submissionId);
				}
				const response = await fetch(CONFIG.SUBMIT_ENDPOINT, {
					method: 'POST',
					headers: { 'Content-Type': 'text/plain' },
					body: JSON.stringify({ ...payload, submissionId }),
				});
				if (!response.ok || (await response.json()).ok !== true) throw new Error('submit');
				submitted = true;
				panel.replaceChildren(el('p', '', s.submitted));
				announce(s.submitted);
			} catch {
				feedback.textContent = s.submitError;
				submit.textContent = s.submit;
				submit.disabled = !consent.checked;
				if (!feedback.querySelector('button')) {
					const fallbackCopy = button(s.copyCode, () => {
						void copy(code(), fallbackCopy);
					});
					feedback.append(fallbackCopy);
				}
			}
		});
		panel.append(form);
		screen.append(panel);
	}
	function makeTable(headers: string[], rows: string[][]) {
		const table = el('table', 'lmti-table');
		const head = el('thead');
		const headingRow = el('tr');
		for (const title of headers) {
			const cell = el('th', '', title);
			cell.scope = 'col';
			headingRow.append(cell);
		}
		head.append(headingRow);
		const body = el('tbody');
		for (const values of rows) {
			const row = el('tr');
			for (const value of values) row.append(el('td', '', value));
			body.append(row);
		}
		table.append(head, body);
		return table;
	}
	function renderDebug() {
		screen.append(el('p', 'lmti-debug-banner', s.debugBanner));
		const details = el('details', 'lmti-debug lmti-panel');
		details.append(el('summary', '', s.debugTitle));
		const controls = el('div', 'lmti-actions');
		const patterns = Object.keys(s.patterns) as (keyof typeof s.patterns)[];
		for (const pattern of patterns)
			controls.append(
				button(text(s.autofill, { pattern: s.patterns[pattern] }), () => {
					mode = 'human';
					who = 'human';
					model = 'unknown';
					think = 'unknown';
					notes = {};
					submitted = false;
					submissionIds.clear();
					answers = {};
					for (const q of bank.questions) {
						const positions = q.options
							.map(({ pos }) => pos)
							.filter((pos): pos is number => typeof pos === 'number');
						const target = pattern === 'one' ? 1 : pattern === 'three' ? 3 : 5;
						answers[q.id] =
							pattern === 'random'
								? q.options[crypto.getRandomValues(new Uint32Array(1))[0] % q.options.length].pos
								: pattern === 'pattern'
									? q.options[(q.n - 1) % q.options.length].pos
									: positions.reduce((best, pos) =>
											Math.abs(pos - target) < Math.abs(best - target) ? pos : best,
										);
					}
					session = {
						seed,
						answers,
						notes,
						index: bank.questions.length,
						mode,
						nickname,
					};
					save();
					renderResult();
				}),
			);
		const dry = el('input');
		dry.type = 'checkbox';
		dry.checked = dryRun;
		dry.addEventListener('change', () => {
			dryRun = dry.checked;
			if (view === 'result') renderResult();
		});
		const dryLabel = el('label', 'lmti-consent');
		dryLabel.append(dry, document.createTextNode(s.debugDry));
		const reroll = button(s.debugReroll, () => {
			seed = randomSeed();
			save();
			if (view === 'quiz') renderQuestion();
			else if (view === 'result') renderResult();
			else renderLanding();
		});
		details.append(el('p', '', text(s.debugSeed, { seed })), reroll, dryLabel, controls);
		const area = el('textarea', 'lmti-textarea');
		area.setAttribute('aria-label', s.importCode);
		const errors = el('p', 'lmti-error');
		errors.setAttribute('aria-live', 'polite');
		details.append(
			area,
			button(s.importCode, () => decode(area.value, errors)),
			errors,
		);
		if (view === 'result') {
			const result = scoreAnswers(answers, bank, models, {
				...CONFIG.MASK_LABELS,
				closeCallPoints: CONFIG.CLOSE_CALL_POINTS,
			});
			const exportButton = button(s.exportJson, () => {
				void copy(JSON.stringify({ seed, answers, result }, null, 2), exportButton);
			});
			details.append(
				exportButton,
				el('h3', '', s.rawAnswers),
				makeTable(
					[s.question, s.dimension, s.frame, s.role, s.position, s.probe],
					bank.questions.map((q) => [
						String(q.n),
						q.dim,
						q.frame,
						q.role,
						String(answers[q.id]),
						q.probe
							? s.depthStates[result.depth.probes.find((probe) => probe.q === q.id)!.result]
							: '—',
					]),
				),
			);
			details.append(
				el('h3', '', s.dimensionScores),
				makeTable(
					[s.dimension, s.score, s.itemsUsed],
					bank.dimensions.map((dim) => [
						dim.name,
						result.dimensions[dim.id]?.toFixed(2) ?? s.noData,
						bank.questions
							.filter(
								(q) =>
									q.dim === dim.id &&
									q.role !== 'H' &&
									typeof answers[q.id] === 'number' &&
									answers[q.id] !== 0,
							)
							.map((q) => `Q${q.n}`)
							.join(', '),
					]),
				),
			);
			details.append(
				el('h3', '', s.pairs),
				makeTable(
					[s.pair, s.dimension, s.scene, s.direct, s.gap, s.shift],
					result.pairs.map((pair) => [
						pair.id,
						pair.dim,
						pair.s?.toString() ?? s.noData,
						pair.h?.toString() ?? s.noData,
						pair.gap?.toString() ?? s.noData,
						pair.shift?.toString() ?? s.noData,
					]),
				),
			);
			details.append(
				el('h3', '', s.allModels),
				makeTable(
					[s.model, s.distance, s.similarity],
					result.matches.map((match) => [
						match.name,
						match.distance.toFixed(4),
						`${match.similarity}%`,
					]),
				),
			);
		}
		screen.append(details);
	}
	app.addEventListener('keydown', (event) => {
		const target = event.target;
		if (
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			target instanceof HTMLButtonElement ||
			(target instanceof HTMLInputElement && target.type !== 'radio')
		)
			return;
		if (event.ctrlKey || event.metaKey || event.altKey || view !== 'quiz') return;
		if (/^[1-9]$/.test(event.key)) {
			const radio =
				screen.querySelectorAll<HTMLInputElement>('.lmti-options input')[Number(event.key) - 1];
			if (radio) {
				event.preventDefault();
				radio.checked = true;
				radio.dispatchEvent(new Event('change'));
				radio.focus();
			}
		} else if (event.key === 'Enter' || event.key === 'ArrowRight') {
			event.preventDefault();
			goNext();
		} else if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
			event.preventDefault();
			goBack();
		}
	});
	if (session?.index === bank.questions.length) {
		mode = 'human';
		renderResult();
	} else renderLanding();
}
