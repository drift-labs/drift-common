import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SuccessFilled = (allProps: IconProps) => {
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
						d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm5.213 6.02a.75.75 0 00-1.06 0l-5.887 5.885L7.88 11.52l-.057-.052a.75.75 0 00-1.055 1.055l.051.057 2.917 2.917.057.05a.75.75 0 001.004-.05l6.416-6.417a.75.75 0 000-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SuccessFilled;
