import { twMerge } from 'tailwind-merge';
import Text from '../Text/Text';

export const AdvancedChip = (props: {
	customLabel?: string;
	customGradient?: string;
	className?: string;
}) => {
	return (
		<div
			className={twMerge(
				`w-[90px] ml-2 justify-center whitespace-nowrap text-white flex items-center px-2 py-0.5 space-x-2 rounded-sm text-xs`,
				props.className
			)}
			style={{
				background: props.customGradient ?? 'var(--alpha-program-gradient)',
			}}
		>
			{props.customLabel ?? 'ADVANCED'}
		</div>
	);
};

export const FeaturedChip = (props: { className?: string }) => {
	return (
		<>
			<div
				className={twMerge(
					'bg-container-bg-hover rounded-md items-center justify-center py-1 px-2 w-[67px] h-[24px]',
					props.className
				)}
			>
				<Text.BODY3 className="drift-gradient-text">Featured</Text.BODY3>
			</div>
		</>
	);
};

export const NewChip = (props: {
	className?: string;
	customLabel?: string;
}) => {
	return (
		<div
			className={twMerge(
				'bg-container-bg-hover rounded-md items-center justify-center px-1 py-[2px] flex ml-1',
				props.className
			)}
		>
			<Text.MICRO1 className="relative drift-gradient-text top-[1px]">
				{props.customLabel ? props.customLabel : 'NEW'}
			</Text.MICRO1>
		</div>
	);
};

export const AlphaChip = (props: {
	className?: string;
	customLabel?: string;
}) => {
	return (
		<div
			className={twMerge(
				'bg-interactive-secondary-bg rounded items-center justify-center px-1 py-[2px] flex ml-1',
				props.className
			)}
		>
			<Text.MICRO1 className="relative text-interactive-link top-[1px] text-[10px]">
				{props.customLabel ? props.customLabel : 'Alpha'}
			</Text.MICRO1>
		</div>
	);
};
