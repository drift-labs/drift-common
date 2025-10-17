import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Warning = (allProps: IconProps) => {
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
						d="M19 3C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19ZM11.5 16C10.9479 16.0003 10.5 16.4479 10.5 17V17.5C10.5 18.0521 10.9479 18.4997 11.5 18.5H12.5C13.0521 18.4997 13.5 18.0521 13.5 17.5V17C13.5 16.4479 13.0521 16.0003 12.5 16H11.5ZM11.1426 5C10.5379 5.00004 10.0717 5.53251 10.1514 6.13184L11.2461 14.3389C11.2965 14.717 11.6186 14.9998 12 15C12.3814 14.9998 12.7045 14.717 12.7549 14.3389L13.8496 6.13184C13.9293 5.53271 13.4628 5.00035 12.8584 5H11.1426Z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Warning;
