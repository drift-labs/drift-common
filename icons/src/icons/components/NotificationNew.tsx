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
					<path d="M18 13a4 4 0 100-8 4 4 0 000 8z" fill="#B58AFF" />
					<path
						d="M10.73 21.65c.388.23.827.35 1.265.35h-.005.01-.005c.438 0 .876-.12 1.255-.35.38-.23.7-.56.91-.95.2-.37.07-.82-.3-1.02a.754.754 0 00-1.02.3.957.957 0 01-1.7 0 .765.765 0 00-1.02-.3c-.36.2-.5.66-.3 1.02.22.39.53.72.91.95zM4 18.6h16l.01-.01c.33 0 .61-.21.71-.52a.76.76 0 00-.28-.84c-.02-.007-1.136-.84-1.823-3.268a5.034 5.034 0 01-1.574-.054c.352 1.442.853 2.476 1.317 3.192H5.62c.83-1.28 1.78-3.58 1.78-7.41 0-1.24.49-2.45 1.35-3.32a4.517 4.517 0 015.55-.733c.354-.39.768-.722 1.229-.985A6.074 6.074 0 0012.75 3.55v-.8c0-.41-.34-.75-.75-.75s-.75.34-.75.75v.8c-1.35.17-2.59.78-3.56 1.77a6.19 6.19 0 00-1.78 4.37c0 5.79-2.32 7.53-2.34 7.54a.74.74 0 00-.29.84c.1.32.39.53.72.53z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default NotificationNew;
