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
						d="M18.47 4.47a.75.75 0 111.06 1.06l-14 14a.75.75 0 11-1.06-1.06l14-14zM20 17.25a.75.75 0 010 1.5h-6a.75.75 0 010-1.5h6zm-13-14a.75.75 0 01.75.75v2.25H10a.75.75 0 010 1.5H7.75V10a.75.75 0 01-1.5 0V7.75H4a.75.75 0 010-1.5h2.25V4A.75.75 0 017 3.25z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Calculator;
