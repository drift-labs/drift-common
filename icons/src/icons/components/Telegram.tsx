import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Telegram = (allProps: IconProps) => {
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
						d="M4.98 10.762s7.077-2.905 9.532-3.927c.94-.41 4.13-1.718 4.13-1.718s1.474-.573 1.35.818c-.04.573-.367 2.577-.695 4.745-.49 3.068-1.022 6.422-1.022 6.422s-.082.94-.777 1.104c-.696.164-1.841-.572-2.046-.736-.163-.123-3.067-1.964-4.13-2.863-.287-.246-.614-.737.04-1.31a156.207 156.207 0 004.295-4.09c.49-.49.982-1.636-1.064-.245-2.904 2.004-5.767 3.886-5.767 3.886s-.655.409-1.882.04c-1.227-.367-2.658-.858-2.658-.858s-.982-.614.695-1.268z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Telegram;
