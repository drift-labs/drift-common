import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Notification = (allProps: IconProps) => {
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
						d="M10.489 20.089c.148.276.367.506.633.666a1.7 1.7 0 001.756 0c.265-.16.484-.39.633-.666M6.667 9.439c0-1.443.562-2.826 1.562-3.846A5.282 5.282 0 0112 4c1.415 0 2.771.573 3.771 1.593a5.493 5.493 0 011.562 3.846c0 6.345 2.667 8.157 2.667 8.157H4s2.667-1.813 2.667-8.157zM12 4V2.5"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Notification;
