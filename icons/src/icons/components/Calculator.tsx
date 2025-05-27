import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Calculator = (allProps: IconProps) => {
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
						d="M3.25 7A.75.75 0 014 6.25h6a.75.75 0 010 1.5H4A.75.75 0 013.25 7z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7 3.25a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V4A.75.75 0 017 3.25zM13.25 18a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM4.47 19.53a.75.75 0 010-1.06l14-14a.75.75 0 111.06 1.06l-14 14a.75.75 0 01-1.06 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Calculator;
