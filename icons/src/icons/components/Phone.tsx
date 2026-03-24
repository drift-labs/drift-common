import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Phone = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;

	return (
		<IconWrapper
			icon={
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 18 18"
					fill="none"
					{...props}
				>
					<path
						d="M12.3867 1.5C13.4156 1.5 14.25 2.35933 14.25 3.41895V14.5811C14.25 15.6407 13.4156 16.5 12.3867 16.5H5.61328C4.58443 16.5 3.75 15.6407 3.75 14.5811V3.41895C3.75 2.35933 4.58443 1.5 5.61328 1.5H12.3867ZM5.61328 2.54688C5.14562 2.54688 4.7666 2.9373 4.7666 3.41895V14.5811C4.7666 15.0627 5.14562 15.4531 5.61328 15.4531H12.3867C12.8544 15.4531 13.2334 15.0627 13.2334 14.5811V3.41895C13.2334 2.9373 12.8544 2.54688 12.3867 2.54688H5.61328ZM9 12.75C9.41421 12.75 9.75 13.0858 9.75 13.5C9.75 13.9142 9.41421 14.25 9 14.25C8.58579 14.25 8.25 13.9142 8.25 13.5C8.25 13.0858 8.58579 12.75 9 12.75Z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};

export default Phone;
