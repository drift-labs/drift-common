import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const NotificationNew = (allProps: IconProps) => {
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
						d="M12.005 22h-.01l.004-.001.006.001zm.84-2.02c.2-.36.65-.5 1.02-.3s.5.65.3 1.02c-.21.39-.53.72-.91.95-.379.23-.817.348-1.256.349a2.505 2.505 0 01-1.264-.349c-.38-.23-.69-.56-.91-.95-.2-.36-.06-.82.3-1.02.36-.19.82-.06 1.02.3a.957.957 0 001.7 0zM12.005 2c.41 0 .75.34.75.75v.8l.095.013c-.28.442-.498.927-.644 1.442A4.517 4.517 0 008.755 6.37c-.86.87-1.35 2.08-1.35 3.32 0 3.83-.95 6.13-1.78 7.41h12.74c-.652-1.007-1.377-2.644-1.658-5.159.26.038.524.059.793.059.247 0 .489-.018.727-.05.49 3.988 2.185 5.267 2.218 5.28.26.19.38.53.28.84-.1.31-.38.52-.71.52l-.01.01h-16a.75.75 0 01-.72-.53.74.74 0 01.29-.84c.029-.016 2.34-1.76 2.34-7.54 0-1.65.63-3.2 1.78-4.37.97-.99 2.21-1.6 3.56-1.77v-.8c0-.41.34-.75.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path d="M17.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" fill="#CF3858" />
				</svg>
			}
			{...restProps}
		/>
	);
};
export default NotificationNew;
