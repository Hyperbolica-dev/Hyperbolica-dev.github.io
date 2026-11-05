export const CONFIG = {
	BASE_PATH: '/fun/llm-quiz/',
	QUIZ_VERSION: 2,
	PUBLISHED: false,
	DEBUG_ENABLED: true,
	SUBMIT_ENDPOINT: 'https://submit.hyperbolica-dev-tools.workers.dev/',
	MASK_LABELS: { steady: 0.7, some: 1.5 },
	CLOSE_CALL_POINTS: 3,
	MIN_SCORED_ITEMS: 9,
} as const;
