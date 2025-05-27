import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const List = (allProps: IconProps) => {
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
						d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2.33a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 10.83a1 1 0 011-1h14a1 1 0 011 1v2.34a1 1 0 01-1 1H5a1 1 0 01-1-1v-2.34zM4 16.67a1 1 0 011-1h14a1 1 0 011 1V19a1 1 0 01-1 1H5a1 1 0 01-1-1v-2.33z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default List;
