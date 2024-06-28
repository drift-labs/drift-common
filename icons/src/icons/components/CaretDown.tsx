import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CaretDown = (allProps: IconProps) => {
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
						d="M17 9.556c0 .15-.062.28-.186.39l-4.374 3.89A.64.64 0 0112 14a.64.64 0 01-.44-.165L7.186 9.946A.507.507 0 017 9.556c0-.15.062-.281.186-.391A.64.64 0 017.625 9h8.75a.64.64 0 01.44.165c.123.11.185.24.185.39z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default CaretDown;
