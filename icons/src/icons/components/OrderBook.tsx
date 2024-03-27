import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const OrderBook = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3.5 16.5v3h17v-3h-17zM3 15a1 1 0 00-1 1v4a1 1 0 001 1h18a1 1 0 001-1v-4a1 1 0 00-1-1H3z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M4 15a1 1 0 001 1h.5v-3.5h13V16h.5a1 1 0 001-1v-3a1 1 0 00-1-1H5a1 1 0 00-1 1v3z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6 11a1 1 0 001 1h.5V8.5h9V12h.5a1 1 0 001-1V8a1 1 0 00-1-1H7a1 1 0 00-1 1v3z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8 7a1 1 0 001 1h.5V4.5h5V8h.5a1 1 0 001-1V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 3.75a.75.75 0 01.75.75V20a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderBook;
