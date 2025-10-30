import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Megaphone = (allProps: IconProps) => {
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
						d="M20.799 5.277A.752.752 0 0121.75 6v12a.75.75 0 01-.913.732l-8.49-1.886a.75.75 0 01-.024.153 3.76 3.76 0 01-7.299-1.781l-2.187-.486A.75.75 0 012.25 14v-3l.01-.124a.75.75 0 01.539-.599l18-5zM6.49 15.544a2.259 2.259 0 004.387 1.057.756.756 0 01.025-.077l-4.412-.98zm-2.74-3.975v1.829l16.5 3.666V6.986L3.75 11.57z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Megaphone;
