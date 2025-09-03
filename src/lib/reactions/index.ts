import z from 'zod';

export const reactions = [
	'👍',
	'❤️',
	'👀',
	'😮',
	'🤔',
	'🚀',
	'🤯',
	'💀',
	'🙏',
	'🌚',
	'🆒',
	'🏳️‍🌈'
] as const;

export type Reaction = (typeof reactions)[number];

export const reactionSchema = z.enum(reactions);
