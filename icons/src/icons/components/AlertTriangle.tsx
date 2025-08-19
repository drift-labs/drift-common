import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const AlertTriangle = (allProps: IconProps) => {
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
						d="M10.72 3.592a2.566 2.566 0 012.56 0 2.538 2.538 0 01.935.935l7.192 12.43v.002a2.51 2.51 0 01-.933 3.454c-.387.22-.825.337-1.27.337H4.818a2.565 2.565 0 01-1.275-.328 2.538 2.538 0 01-.944-.922 2.51 2.51 0 01-.006-2.542v-.001l7.192-12.43v-.001c.224-.389.547-.71.935-.934zM12 4.75c-.187 0-.37.05-.531.142-.161.092-.293.224-.383.382l-.002.002-7.196 12.438a1.01 1.01 0 00.003 1.023c.092.156.225.287.386.377.161.09.344.138.531.136h14.394c.186 0 .368-.049.528-.14.16-.091.291-.222.382-.377a1.01 1.01 0 000-1.02l-.002-.002-7.194-12.435-.002-.002a1.037 1.037 0 00-.383-.382A1.066 1.066 0 0012 4.75zm.01 3.842a.75.75 0 01.75.75V14a.75.75 0 01-1.5 0V9.342a.75.75 0 01.75-.75zm-.75 7.855a.75.75 0 01.75-.75h.008a.75.75 0 010 1.5h-.009a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : '#F2C94C'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default AlertTriangle;
