export type Position = number | 'X' | 'S' | 'U' | 'T';
export type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6';
export type Answers = Record<string, Position>;
export interface Question {
	id: string;
	n: number;
	dim: DimensionId;
	frame: 'scene' | 'direct';
	kind?: 'choose' | 'dislike';
	cue: string;
	role: 'single' | 'S' | 'H';
	pair: string | null;
	probe: boolean;
	stem: string;
	options: {
		pos: Position;
		text: string;
		depth?: 'failed' | 'unscored';
		tags?: ('hedge' | 'delegate')[];
	}[];
	agent_order: Position[];
}
export interface Bank {
	version: number;
	dimensions: { id: DimensionId; name: string; low: string; high: string }[];
	pairs: { id: string; dim: DimensionId; s: string; h: string }[];
	questions: Question[];
}
export interface Model {
	id: string;
	name: string;
	profile: Record<DimensionId, number>;
	provisional: boolean;
	n_submissions: number;
	profile_source?: 'placeholder' | 'owner-run' | 'measured';
	calibration_version?: string;
}
interface PairScore {
	id: string;
	dim: DimensionId;
	s: number | null;
	h: number | null;
	gap: number | null;
	shift: number | null;
}
interface Match {
	id: string;
	name: string;
	distance: number;
	similarity: number;
	profile: Record<DimensionId, number>;
}
export interface Trait {
	dim: DimensionId;
	pole: 'low' | 'high' | 'middle';
	score: number;
}
export interface ScoreResult {
	dimensions: Record<DimensionId, number | null>;
	distributions: Record<DimensionId, number[] | null>;
	subscores: {
		hesitation: { count: number; total: number };
		skips: { count: number; total: number };
		delegation: { count: number; total: number };
	};
	depth: {
		passed: number;
		scored: number;
		probes: { q: string; result: 'passed' | 'failed' | 'unscored' }[];
	};
	mask: number | null;
	maskLabel: 'steady' | 'some' | 'big' | null;
	pairs: PairScore[];
	matches: Match[];
	closeCall: boolean;
	traits: Trait[];
}
export type Thinking = 'off' | 'low' | 'medium' | 'high' | 'unknown';
export type DecodeResult =
	| { ok: true; answers: Answers; model: string; think: Thinking; multiple: boolean }
	| {
			ok: false;
			error: 'version' | 'format' | 'answers';
			missing: number[];
			invalid: { q: number; value: string }[];
			duplicates: number[];
	  };
