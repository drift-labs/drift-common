import { PropsWithChildren, type JSX } from 'react';

export const BodyRowWrapper = ({
	children,
	noBg,
}: PropsWithChildren<{ noBg?: boolean }>): JSX.Element => {
	return (
		<div
			className={`flex flex-col w-full h-full ${noBg ? '' : 'bg-container-bg'}`}
		>
			{children}
		</div>
	);
};
