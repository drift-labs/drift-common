import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const MegaphoneNew = (allProps: IconProps) => {
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
						d="M13.196 7.389c.143.495.36.96.639 1.379L3.75 11.569v1.829l16.5 3.666v-6.6a5.016 5.016 0 001.5-1.158V18a.75.75 0 01-.913.732l-8.49-1.886a.75.75 0 01-.024.153 3.76 3.76 0 01-7.299-1.781l-2.187-.486A.75.75 0 012.25 14v-3l.01-.124a.75.75 0 01.539-.599L13.196 7.39zM6.49 15.544a2.259 2.259 0 004.387 1.057.756.756 0 01.025-.077l-4.412-.98z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path d="M18 10a4 4 0 100-8 4 4 0 000 8z" fill="#B58AFF" />
				</svg>
			}
			{...restProps}
		/>
	);
};
export default MegaphoneNew;
