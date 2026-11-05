export type Position = number | 'X';
export type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6';
export type Answers = Record<string, Position>;
export interface Question {
	id: string;
	n: number;
	dim: DimensionId;
	frame: 'scene' | 'direct';
	cue: string;
	role: 'single' | 'S' | 'H';
	pair: string | null;
	probe: boolean;
	stem: string;
	options: { pos: Position; text: string; depth?: 'unscored' }[];
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
