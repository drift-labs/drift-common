import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Positions = (allProps: IconProps) => {
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
						d="M10.84 3.569a2.272 2.272 0 012.32 0l5.445 3.2c.351.21.64.507.84.863.2.356.305.758.305 1.166V15.2c0 .408-.105.81-.305 1.166-.2.356-.489.654-.84.862l-.003.002-5.441 3.199h-.002a2.273 2.273 0 01-2.32 0L5.398 17.23l-.003-.002a2.328 2.328 0 01-.84-.862A2.386 2.386 0 014.25 15.2V8.8c0-.408.105-.811.305-1.167s.489-.654.84-.862l.003-.002 5.443-3.2zm1.91 15.361l5.09-2.991v-.001a.83.83 0 00.297-.307.886.886 0 00.113-.431V9.175l-5.5 3.252v6.503zM12 11.128l5.514-3.26-5.12-3.009a.773.773 0 00-.789 0l-.003.002-5.116 3.007L12 11.128zM5.75 9.176v6.023c0 .153.04.302.113.432.072.13.176.235.297.307l5.09 2.992v-6.503l-5.5-3.251z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Positions;
