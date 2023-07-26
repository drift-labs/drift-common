import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Star = (allProps: IconProps) => {
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
						d="M7.601 2.14a.444.444 0 01.798 0l1.661 3.367 3.716.543c.364.053.51.501.246.758l-2.689 2.619.635 3.699a.444.444 0 01-.645.468L8 11.847l-3.323 1.747a.444.444 0 01-.645-.468l.635-3.7-2.689-2.618a.444.444 0 01.246-.758l3.716-.543L7.601 2.14z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Star;
