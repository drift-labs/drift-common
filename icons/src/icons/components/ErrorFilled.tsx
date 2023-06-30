import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ErrorFilled = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M14.667 8A6.667 6.667 0 111.333 8a6.667 6.667 0 0113.334 0zm-3.944-2.724a.552.552 0 010 .78L8.78 8l1.944 1.943a.552.552 0 01-.781.78L8 8.78l-1.943 1.944a.552.552 0 01-.78-.781L7.218 8 5.276 6.057a.552.552 0 11.78-.78L8 7.218l1.943-1.943a.552.552 0 01.78 0z"
						fill="#FF887F"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ErrorFilled;
