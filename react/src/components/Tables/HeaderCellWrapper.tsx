import { PropsWithChildren } from 'react';
import { twMerge } from 'tailwind-merge';
import { Typo } from '../Text/Typo';

export const HeaderCellWrapper = ({
	children,
	className,
	alignRight,
}: PropsWithChildren<{
	className?: string;
	alignRight?: boolean;
}>) => {
	return (
		<div
			className={twMerge(
				`w-full flex items-center pt-3.5 pb-3 text-text-label capitalize select-none bg-main-bg`,
				alignRight && 'justify-end',
				className
			)}
		>
			<Typo.B2>{children}</Typo.B2>
		</div>
	);
};
