import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Heart = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M7.541 3.948a3.25 3.25 0 00-4.595-.012 3.25 3.25 0 00.012 4.595l4.707 4.708a.5.5 0 00.707 0l4.683-4.68a3.25 3.25 0 00-.012-4.594 3.252 3.252 0 00-4.601-.012l-.447.448-.454-.453zm4.805 3.905L8.02 12.178 3.665 7.824a2.25 2.25 0 01-.012-3.18 2.25 2.25 0 013.181.01l.81.81a.5.5 0 00.715-.008l.79-.796a2.252 2.252 0 013.186.012 2.25 2.25 0 01.011 3.181z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Heart;
