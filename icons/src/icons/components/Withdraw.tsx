import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Withdraw = (allProps: IconProps) => {
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
						d="M11.47 2.47a.75.75 0 011.06 0l6 6a.75.75 0 01-1.06 1.06l-4.72-4.72V16.5a.75.75 0 01-1.5 0V4.81L6.53 9.53a.75.75 0 01-1.06-1.06l6-6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M13 20a1 1 0 11-2 0 1 1 0 012 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Withdraw;
