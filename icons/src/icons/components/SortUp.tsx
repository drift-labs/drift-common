import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SortUp = (allProps: IconProps) => {
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
						d="M17 14.556c0 .15-.062.28-.186.39l-4.374 3.89A.64.64 0 0112 19a.64.64 0 01-.44-.165l-4.374-3.889a.507.507 0 01-.186-.39c0-.15.062-.281.186-.391A.64.64 0 017.625 14h8.75a.64.64 0 01.44.165c.123.11.185.24.185.39z"
						fill="#2E4665"
					/>
					<path
						d="M17 9.444c0 .15-.062.281-.186.391a.64.64 0 01-.439.165h-8.75a.64.64 0 01-.44-.165.507.507 0 01-.185-.39c0-.151.062-.281.186-.391l4.374-3.89A.64.64 0 0112 5a.64.64 0 01.44.165l4.374 3.889c.124.11.186.24.186.39z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SortUp;
