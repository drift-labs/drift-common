import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Replies = (allProps: IconProps) => {
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
						d="M5.778 4.75A1.028 1.028 0 004.75 5.778v12.411l2.275-2.275a.75.75 0 01.53-.22h10.667a1.028 1.028 0 001.028-1.027v-8.89a1.028 1.028 0 00-1.028-1.027H5.778zM3.99 3.99a2.528 2.528 0 011.788-.74h12.444a2.528 2.528 0 012.528 2.528v8.889a2.528 2.528 0 01-2.528 2.527H7.866L4.53 20.53A.75.75 0 013.25 20V5.778c0-.67.266-1.314.74-1.788z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Replies;
