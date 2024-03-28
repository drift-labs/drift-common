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
						d="M8 4v3H7a1 1 0 00-1 1v3H5a1 1 0 00-1 1v3H3a1 1 0 00-1 1v4a1 1 0 001 1h18a1 1 0 001-1v-4a1 1 0 00-1-1h-1v-3a1 1 0 00-1-1h-1V8a1 1 0 00-1-1h-1V4a1 1 0 00-1-1H9a1 1 0 00-1 1zm6.5.5V7h-1.75V4.5h1.75zm-3.25 0V7H9.5V4.5h1.75zm0 4H7.5V11h3.75V8.5zm0 4H5.5V15h5.75v-2.5zm1.5 2.5v-2.5h5.75V15h-5.75zm-1.5 1.5H3.5v3h7.75v-3zm1.5 3v-3h7.75v3h-7.75zm0-8.5V8.5h3.75V11h-3.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderBook;
