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
						d="M12 21.75c-.44 0-.88-.12-1.27-.35-.38-.23-.69-.56-.91-.95-.2-.36-.06-.82.3-1.02.36-.19.82-.06 1.02.3a.957.957 0 001.7 0c.2-.36.65-.5 1.02-.3s.5.65.3 1.02c-.21.39-.53.72-.91.95-.38.23-.82.35-1.26.35H12zm8-3.4H4a.75.75 0 01-.72-.53.74.74 0 01.29-.84c.02-.01 2.34-1.75 2.34-7.54 0-1.65.63-3.2 1.78-4.37.97-.99 2.21-1.6 3.56-1.77v-.8c0-.41.34-.75.75-.75s.75.34.75.75v.8c1.34.17 2.6.8 3.56 1.77a6.19 6.19 0 011.78 4.37c0 5.79 2.32 7.53 2.35 7.54.26.19.38.53.28.84-.1.31-.38.52-.71.52l-.01.01zm-14.36-1.5h12.72c-.83-1.28-1.78-3.58-1.78-7.41 0-1.26-.48-2.43-1.35-3.32a4.517 4.517 0 00-3.24-1.37c-1.23 0-2.37.49-3.24 1.37A4.75 4.75 0 007.4 9.44c0 3.83-.95 6.13-1.78 7.41h.02z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Notification;
