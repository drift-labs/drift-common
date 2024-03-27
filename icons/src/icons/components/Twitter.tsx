import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Twitter = (allProps: IconProps) => {
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
						d="M9.743 12.512L3 4h5.341l4.163 5.261 4.446-5.237h2.942l-5.966 7.035L21 20h-5.325l-4.507-5.69-4.812 5.674H3.4l6.344-7.472zm6.708 5.91L6.275 5.578h1.29l10.163 12.846H16.45z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Twitter;
