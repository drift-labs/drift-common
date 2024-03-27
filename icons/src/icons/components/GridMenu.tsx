import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GridMenu = (allProps: IconProps) => {
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
						d="M9.819 8.363h4.362V4H9.82v4.363zM15.637 4v4.363H20V5a1 1 0 00-1-1h-3.363zM4 8.363h4.363V4H5a1 1 0 00-1 1v3.363zm5.819 5.818h4.362V9.82H9.82v4.362zm5.818 0H20V9.82h-4.363v4.362zM4 14.181h4.363V9.82H4v4.362zM9.819 20h4.362v-4.363H9.82V20zm5.818 0H19a1 1 0 001-1v-3.363h-4.363V20zM4 19a1 1 0 001 1h3.363v-4.363H4V19z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GridMenu;
