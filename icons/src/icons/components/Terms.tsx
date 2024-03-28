import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Terms = (allProps: IconProps) => {
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
						d="M11.55 2.37c.29-.112.61-.112.9 0l6.5 2.507c.482.186.8.65.8 1.166V12c0 2.707-1.562 4.942-3.164 6.53-1.614 1.602-3.375 2.655-3.997 3.004a1.196 1.196 0 01-1.178 0c-.622-.35-2.383-1.402-3.997-3.003C5.812 16.94 4.25 14.707 4.25 12V6.043c0-.517.318-.98.8-1.166l6.5-2.507zM12 3.804l-6.25 2.41V12c0 2.117 1.231 3.988 2.72 5.466 1.367 1.356 2.864 2.292 3.53 2.677.666-.385 2.163-1.321 3.53-2.677 1.489-1.478 2.72-3.349 2.72-5.466V6.215L12 3.804zm3.148 5.858a.75.75 0 01.015 1.06l-3.142 3.232a1.25 1.25 0 01-1.792 0l-1.392-1.431a.75.75 0 111.076-1.046l1.212 1.247 2.962-3.047a.75.75 0 011.06-.015z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Terms;
