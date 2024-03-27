import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Download = (allProps: IconProps) => {
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
						d="M11.332 5.13a5.622 5.622 0 00-4.852.38A5.518 5.518 0 004.67 7.204a5.4 5.4 0 00-.638 4.746 5.46 5.46 0 001.298 2.098.75.75 0 11-1.066 1.056 6.96 6.96 0 01-1.653-2.675 6.9 6.9 0 01.813-6.06 7.019 7.019 0 012.3-2.156 7.122 7.122 0 016.15-.482c.994.386 1.888.99 2.613 1.77a6.961 6.961 0 011.383 2.192h1.078c1.028 0 2.03.326 2.856.932a4.752 4.752 0 011.738 2.437c.3.977.274 2.024-.075 2.985-.348.961-1 1.784-1.856 2.35a.75.75 0 01-.826-1.253 3.259 3.259 0 001.272-1.608 3.204 3.204 0 00.05-2.034 3.252 3.252 0 00-1.189-1.667 3.334 3.334 0 00-1.97-.642h-1.611a.75.75 0 01-.718-.533 5.454 5.454 0 00-1.23-2.138 5.555 5.555 0 00-2.058-1.392zm.666 6.119a.75.75 0 01.75.75v6.206l2.324-2.295a.75.75 0 111.054 1.067l-3.6 3.557a.75.75 0 01-1.054 0l-3.6-3.556a.75.75 0 111.053-1.068l2.323 2.295V12a.75.75 0 01.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Download;
