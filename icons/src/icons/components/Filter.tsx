import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Filter = (allProps: IconProps) => {
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
						d="M3.317 4.69A.75.75 0 014 4.25h16a.75.75 0 01.566 1.242l-6.216 7.146V19a.75.75 0 01-1.078.674l-3.2-1.555a.75.75 0 01-.422-.675v-4.806L3.434 5.492a.75.75 0 01-.117-.803zm2.33 1.06l5.319 6.116a.75.75 0 01.184.492v4.617l1.7.826v-5.443a.75.75 0 01.184-.492l5.32-6.116H5.646z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Filter;
