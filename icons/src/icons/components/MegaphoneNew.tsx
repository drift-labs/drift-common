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
						d="M12.129 7.686c.11.499.286.973.521 1.41l-8.9 2.473v1.829l16.5 3.666v-5.802a5.524 5.524 0 001.5-1.272V18a.75.75 0 01-.913.732l-8.49-1.886a.75.75 0 01-.024.153 3.76 3.76 0 01-7.299-1.781l-2.187-.486A.75.75 0 012.25 14v-3l.01-.124a.75.75 0 01.539-.599l9.33-2.591zM6.49 15.544a2.259 2.259 0 004.387 1.057.756.756 0 01.025-.077l-4.412-.98z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path d="M17.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" fill="#CF3858" />
				</svg>
			}
			{...restProps}
		/>
	);
};
export default MegaphoneNew;
