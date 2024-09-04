import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Realms = (allProps: IconProps) => {
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
						d="M16.357 6.769c.11.186-.147.402-.339.304a3.126 3.126 0 00-1.431-.352c-2.247 0-4.068 2.476-4.068 5.53 0 3.055 1.821 5.531 4.068 5.531.347 0 .683-.059 1.005-.17.2-.069.421.167.297.338-1.35 1.87-3.324 3.05-5.525 3.05C6.297 21 3 16.97 3 12s3.297-9 7.364-9c2.471 0 4.657 1.487 5.993 3.769z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M15.948 19.893c-.195.081-.348-.166-.208-.325 1.586-1.794 2.582-4.39 2.582-7.277 0-3.144-1.181-5.942-3.018-7.736-.153-.149-.016-.41.185-.341C18.69 5.313 21 8.446 21 12.14c0 3.515-2.091 6.523-5.052 7.753z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Realms;
