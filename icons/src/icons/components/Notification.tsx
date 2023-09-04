import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Notification = (allProps: IconProps) => {
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
						d="M14.134 9.831l-1.306-1.307v-1.73A4.834 4.834 0 008.483 1.99V1h-.966v.99a4.834 4.834 0 00-4.345 4.803v1.731L1.866 9.831a.483.483 0 00-.142.341v1.449a.483.483 0 00.483.482h3.38v.376a2.487 2.487 0 002.172 2.51 2.415 2.415 0 002.655-2.403v-.482h3.38a.483.483 0 00.482-.483v-1.449c0-.128-.051-.25-.142-.34zm-4.686 2.755a1.448 1.448 0 01-2.896 0v-.482h2.896v.482zm3.862-1.448H2.69v-.766l1.306-1.307a.483.483 0 00.142-.34V6.792a3.862 3.862 0 017.724 0v1.931c0 .128.051.25.142.341l1.306 1.307v.766z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Notification;
