import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Apple = (allProps: IconProps) => {
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
						d="M17.331 20.238c-1.034 1.002-2.162.844-3.25.37-1.149-.486-2.204-.508-3.417 0-1.52.654-2.32.463-3.228-.37-5.148-5.31-4.389-13.394 1.456-13.69 1.424.075 2.415.782 3.249.845 1.245-.253 2.437-.981 3.766-.886 1.593.126 2.796.76 3.587 1.9-3.292 1.973-2.511 6.31.506 7.525-.601 1.583-1.382 3.155-2.68 4.316l.011-.01zM12.035 6.486C11.877 4.132 13.787 2.19 15.981 2c.306 2.723-2.469 4.75-3.946 4.486z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Apple;
