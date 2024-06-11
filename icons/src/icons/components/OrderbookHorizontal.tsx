import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const OrderbookHorizontal = (allProps: IconProps) => {
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
					<rect
						x={2}
						y={17.79}
						width={9.474}
						height={4.211}
						rx={0.5}
						fill="#5DD5A0"
					/>
					<rect
						x={12.526}
						y={17.79}
						width={9.474}
						height={4.211}
						rx={0.5}
						fill="#FF887F"
					/>
					<rect
						x={5.158}
						y={12.526}
						width={6.316}
						height={4.211}
						rx={0.5}
						fill="#5DD5A0"
					/>
					<rect
						x={12.526}
						y={12.526}
						width={6.316}
						height={4.211}
						rx={0.5}
						fill="#FF887F"
					/>
					<rect
						x={7.263}
						y={7.263}
						width={4.211}
						height={4.211}
						rx={0.5}
						fill="#5DD5A0"
					/>
					<rect
						x={12.526}
						y={7.263}
						width={4.211}
						height={4.211}
						rx={0.5}
						fill="#FF887F"
					/>
					<rect
						x={9.368}
						y={2}
						width={2.105}
						height={4.211}
						rx={0.5}
						fill="#5DD5A0"
					/>
					<rect
						x={12.526}
						y={2}
						width={2.105}
						height={4.211}
						rx={0.5}
						fill="#FF887F"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderbookHorizontal;
