import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const OrderbookVertical = (allProps: IconProps) => {
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
					<rect x={3} y={18} width={18} height={4} rx={0.5} fill="#23B133" />
					<rect x={3} y={13} width={11} height={4} rx={0.5} fill="#23B133" />
					<rect x={3} y={7} width={11} height={4} rx={0.5} fill="#CF3858" />
					<rect x={3} y={2} width={18} height={4} rx={0.5} fill="#CF3858" />
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderbookVertical;
