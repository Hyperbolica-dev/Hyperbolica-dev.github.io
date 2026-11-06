export const CONFIG = {
	BASE_PATH: '/fun/llm-quiz/',
	PUBLISHED: true,
	DEBUG_ENABLED: false,
	SUBMIT_ENDPOINT: 'https://submit.hyperbolica-dev-tools.workers.dev/',
	MASK_LABELS: { steady: 0.7, some: 1.5 },
	CLOSE_CALL_POINTS: 3,
} as const;
