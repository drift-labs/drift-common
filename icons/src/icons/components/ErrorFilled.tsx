import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ErrorFilled = (allProps: IconProps) => {
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
						d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-5.97-4.03a.75.75 0 010 1.06L13.06 12l2.97 2.97a.75.75 0 01-1.06 1.06L12 13.06l-2.97 2.97a.75.75 0 11-1.06-1.06L10.94 12 7.97 9.03a.75.75 0 011.06-1.06L12 10.94l2.97-2.97a.75.75 0 011.06 0z"
						fill="#FF887F"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ErrorFilled;
