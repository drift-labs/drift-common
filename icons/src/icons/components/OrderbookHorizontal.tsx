import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const OrderbookHorizontal = (allProps: IconProps) => {
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
						d="M10.563 1h-2.23v2.947h2.23A.438.438 0 0011 3.51V1.438A.438.438 0 0010.562 1zm1.333 3.684H8.333v2.948h3.563a.438.438 0 00.437-.438V5.122a.438.438 0 00-.437-.438zM8.333 8.368h4.896c.242 0 .438.196.438.438v2.072a.438.438 0 01-.438.438H8.333V8.368zm6.23 3.685h-6.23V15h6.23a.438.438 0 00.437-.438V12.49a.438.438 0 00-.438-.437z"
						fill="#FF887F"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M5.438 1h2.229v2.947h-2.23A.438.438 0 015 3.51V1.438C5 1.196 5.196 1 5.438 1zM4.104 4.684h3.563v2.948H4.104a.437.437 0 01-.437-.438V5.122c0-.242.196-.438.437-.438zm3.563 3.684H2.77a.438.438 0 00-.438.438v2.072c0 .242.196.438.438.438h4.896V8.368zm-6.23 3.685h6.23V15h-6.23A.438.438 0 011 14.562V12.49c0-.242.196-.437.438-.437z"
						fill="#34CB88"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderbookHorizontal;
