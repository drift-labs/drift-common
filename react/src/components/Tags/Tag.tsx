import { Typo } from '../Text/Typo';
import { twMerge } from 'tailwind-merge';

export type TagColor =
	| 'green'
	| 'purple'
	| 'yellow'
	| 'warning'
	| 'default'
	| 'red';

export type TagProps = {
	children: React.ReactNode;
	color: TagColor;
	className?: string;
};

const TAG_COLORS: Record<TagColor, { text: string; bg: string }> = {
	green: {
		text: 'text-text-positive-green-button',
		bg: 'bg-positive-green-secondary-bg',
	},
	purple: {
		text: 'text-interactive-link',
		bg: 'bg-interactive-secondary-bg',
	},
	yellow: { text: 'text-yellow-50', bg: 'bg-yellow-50/20' },
	warning: { text: 'text-warn-yellow', bg: 'bg-brand-yellow-secondary-bg' },
	default: { text: 'text-default', bg: 'bg-button-secondary-bg' },
	red: {
		text: 'text-text-negative-red-button',
		bg: 'bg-negative-red-secondary-bg',
	},
};

export const Tag: React.FC<TagProps> = ({ children, color, className }) => {
	return (
		<Typo.B5
			className={twMerge(
				'px-1 py-0.5 rounded-sm inline-block',
				TAG_COLORS[color].text,
				TAG_COLORS[color].bg,
				className
			)}
		>
			{children}
		</Typo.B5>
	);
};

export default Tag;
