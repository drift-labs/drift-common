import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const HamburgerNew = (allProps: IconProps) => {
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
						d="M20 17.25a.75.75 0 010 1.5H4a.75.75 0 010-1.5h16zm-5.271-6c.814.476 1.76.75 2.771.75.986 0 1.911-.261 2.712-.716A.747.747 0 0120 12.75H4a.75.75 0 010-1.5h10.729zm-2.585-6a5.513 5.513 0 00-.138 1.5H4a.75.75 0 010-1.5h8.144z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path d="M17.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" fill="#CF3858" />
				</svg>
			}
			{...restProps}
		/>
	);
};
export default HamburgerNew;
