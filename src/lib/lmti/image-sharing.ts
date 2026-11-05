import type { Bank, ScoreResult } from './types';
import { strings as s, text } from './strings.en';
import { modelIconUrl } from './model-icons';

/** Local, self-contained PNG: no answer code, notes, network request, or external renderer. */
export async function createResultImage(
	bank: Bank,
	result: ScoreResult,
	enough: boolean,
	url: string,
	nickname?: string,
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = 1200;
	canvas.height = 760;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas unavailable');
	const ctx: CanvasRenderingContext2D = context;
	const color = {
		bg: '#101620',
		panel: '#192330',
		ink: '#f3f5f7',
		muted: '#abb9c8',
		accent: '#93dfd0',
		grid: '#3c4a59',
	};
	ctx.fillStyle = color.bg;
	ctx.fillRect(0, 0, 1200, 760);
	function panel(x: number, y: number, w: number, h: number) {
		ctx.fillStyle = color.panel;
		ctx.beginPath();
		ctx.roundRect(x, y, w, h, 24);
		ctx.fill();
	}
	function label(
		value: string,
		x: number,
		y: number,
		size: number,
		fill = color.ink,
		weight = 400,
		maxWidth?: number,
	) {
		ctx.fillStyle = fill;
		ctx.font = `${weight} ${size}px system-ui, sans-serif`;
		ctx.fillText(value, x, y, maxWidth);
	}
	async function icon(id: string, x: number, y: number, size: number) {
		const src = modelIconUrl(id, color.accent);
		if (!src) return;
		const image = new Image();
		image.src = src;
		await image.decode();
		ctx.drawImage(image, x, y, size, size);
	}
	label(s.imageTitle, 48, 57, 18, color.accent, 700);
	label(s.resultEyebrow, 48, 90, 20, color.muted);
	if (nickname) {
		ctx.textAlign = 'right';
		label(text(s.nicknameResult, { nickname }), 1152, 90, 22, color.ink, 600, 650);
		ctx.textAlign = 'left';
	}
	panel(32, 120, 548, 456);
	panel(600, 120, 568, 456);
	const top = result.matches[0];
	if (enough && top) {
		await icon(top.id, 64, 155, 76);
		label(s.matchEyebrow, 164, 178, 18, color.muted);
		label(top.name, 164, 224, 42, color.ink, 700, 380);
		label(`${top.similarity}%`, 64, 351, 100, color.accent, 750);
		label(s.matchLabel, 68, 385, 23, color.muted);
		label(s.runners, 64, 451, 16, color.muted, 600);
		for (const [index, match] of result.matches.slice(1, 3).entries()) {
			const x = 64 + index * 250;
			await icon(match.id, x, 477, 32);
			label(match.name, x + 42, 491, 19, color.ink, 600, 155);
			label(`${match.similarity}%`, x + 42, 520, 22, color.accent, 700);
		}
	} else {
		label(s.noMatch, 64, 250, 30, color.ink, 700, 480);
		label(s.radarNoMatch, 64, 300, 22, color.muted, 400, 480);
	}
	label(s.radarTitle, 630, 164, 21, color.ink, 600);
	const cx = 884,
		cy = 350,
		radius = 130;
	const point = (index: number, value: number): [number, number] => {
		const angle = (index * Math.PI) / 3 - Math.PI / 2;
		return [cx + Math.cos(angle) * value, cy + Math.sin(angle) * value];
	};
	function polygon(points: [number, number][], stroke: string, fill?: string) {
		ctx.beginPath();
		points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
		ctx.closePath();
		if (fill) {
			ctx.fillStyle = fill;
			ctx.fill();
		}
		ctx.strokeStyle = stroke;
		ctx.stroke();
	}
	ctx.lineWidth = 1;
	for (let ring = 1; ring <= 5; ring++)
		polygon(
			bank.dimensions.map((_, i) => point(i, (ring * radius) / 5)),
			color.grid,
		);
	bank.dimensions.forEach((dim, i) => {
		const [x, y] = point(i, radius);
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(x, y);
		ctx.strokeStyle = color.grid;
		ctx.stroke();
		const [tx, ty] = point(i, radius + 34);
		ctx.textAlign = 'center';
		label(dim.name, tx, ty, 16, color.muted, 500, 150);
		if (result.dimensions[dim.id] === null) label(s.noData, tx, ty + 20, 13, color.muted);
	});
	ctx.lineWidth = 2;
	if (enough && top) {
		ctx.setLineDash([7, 6]);
		polygon(
			bank.dimensions.map((dim, i) => point(i, (top.profile[dim.id] * radius) / 5)),
			color.ink,
		);
		ctx.setLineDash([]);
	}
	const points = bank.dimensions.flatMap((dim, i) => {
		const value = result.dimensions[dim.id];
		return value === null ? [] : [point(i, (value * radius) / 5)];
	});
	if (points.length >= 3) polygon(points, color.accent, '#93dfd033');
	for (const [x, y] of points) {
		ctx.beginPath();
		ctx.arc(x, y, 4, 0, Math.PI * 2);
		ctx.fillStyle = color.accent;
		ctx.fill();
	}
	label(enough && top ? `${s.you} —   ${top.name} - - -` : s.you, cx, 550, 17, color.muted);
	ctx.textAlign = 'left';
	panel(32, 596, 1136, 80);
	label(
		`${s.imageDepth}  ${result.depth.passed}/${result.depth.scored}`,
		64,
		645,
		25,
		color.ink,
		600,
	);
	label(`${s.imageMask}  ${result.mask?.toFixed(2) ?? s.noData}`, 390, 645, 25, color.ink, 600);
	label(result.maskLabel ? s.maskLabels[result.maskLabel] : '', 680, 645, 20, color.muted);
	label(url, 48, 714, 18, color.accent, 500, 1100);
	label(s.imageFooter, 48, 742, 14, color.muted);
	const { promise, resolve, reject } = Promise.withResolvers<Blob>();
	canvas.toBlob(
		(blob) => (blob ? resolve(blob) : reject(new Error('PNG unavailable'))),
		'image/png',
	);
	return promise;
}

export function downloadResultImage(blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = s.imageFilename;
	document.body.append(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
