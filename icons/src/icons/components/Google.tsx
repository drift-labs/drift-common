import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Google = (allProps: IconProps) => {
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
						d="M2.758 5.306A5.998 5.998 0 018.12 2c1.617 0 2.975.594 4.014 1.563l-1.72 1.72C9.792 4.69 9 4.387 8.12 4.387c-1.563 0-2.886 1.056-3.357 2.474-.12.36-.188.744-.188 1.14 0 .396.068.78.188 1.14.472 1.418 1.794 2.474 3.357 2.474.807 0 1.494-.213 2.032-.573a2.76 2.76 0 001.197-1.811H8.12V6.91h5.65c.072.392.11.8.11 1.226 0 1.828-.654 3.366-1.79 4.41C11.099 13.463 9.74 14 8.12 14a5.998 5.998 0 01-5.362-8.694z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Google;
