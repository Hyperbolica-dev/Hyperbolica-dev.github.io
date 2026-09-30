export const categories = {
	cognition: {
		icon: 'notes',
		en: { label: 'Cognition', description: 'Mind, psychology, and learning.' },
		zh: { label: '认知优化', description: '心理机制、自我观察、认知工具、神经科学' },
	},
	systems: {
		icon: 'server',
		en: { label: 'Systems', description: 'Computers, networks, and repair.' },
		zh: { label: '技术存档', description: 'Linux、网络、远程开发、软件配置、故障解决' },
	},
	science: {
		icon: 'star',
		en: { label: 'Science', description: 'Mathematics and natural science.' },
		zh: { label: '学术思考', description: '物理、化学、数学、课程延伸与研究思考' },
	},
	frontier: {
		icon: 'rocket',
		en: { label: 'Frontier', description: 'AI, technology, and what comes next.' },
		zh: { label: '边界计算', description: 'AI 前沿、技术趋势、未来道路、新闻评论' },
	},
} as const;

export type BlogCategory = keyof typeof categories;
export const categoryIds = Object.keys(categories) as BlogCategory[];
