import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Lightning = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13.04 4.445L8.004 13.25h1.84a1.75 1.75 0 011.733 1.998l-.617 4.307 5.037-8.805h-1.841a1.75 1.75 0 01-1.732-1.998l.616-4.307zm-.855-1.526a1.328 1.328 0 012.467.847l-.744 5.199a.25.25 0 00.248.285h2.354c.317 0 .902.08 1.15.65.21.48.009.949-.148 1.223l-5.696 9.958a1.328 1.328 0 01-2.468-.847l.744-5.199a.25.25 0 00-.247-.285H7.49c-.318 0-.9-.08-1.15-.647L6.34 14.1c-.21-.48-.007-.948.15-1.222l5.696-9.96z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Lightning;
