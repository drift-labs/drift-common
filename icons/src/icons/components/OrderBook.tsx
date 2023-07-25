import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const OrderBook = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6.667 1.4a.933.933 0 00-.934.933V4.4h-.4a.933.933 0 00-.933.933V7.4h-.733a.933.933 0 00-.934.933V10.4h-.4a.933.933 0 00-.933.933v2.334c0 .515.418.933.933.933h5.334c.117 0 .23-.022.333-.061.104.04.216.061.333.061h5.334a.933.933 0 00.933-.933v-2.334a.933.933 0 00-.933-.933h-.4V8.333a.933.933 0 00-.934-.933H11.6V5.333a.933.933 0 00-.933-.933h-.4V2.333a.933.933 0 00-.934-.933H6.667zM7.4 2.6h-.467v1.8H7.4V2.6zm0 3H5.6v1.8h1.8V5.6zm0 3H3.933v1.8H7.4V8.6zm0 3H2.6v1.8h4.8v-1.8zm1.2-9v1.8h.467V2.6H8.6zm0 3v1.8h1.8V5.6H8.6zm0 3v1.8h3.467V8.6H8.6zm0 3v1.8h4.8v-1.8H8.6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderBook;
