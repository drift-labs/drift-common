import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LP = (allProps: IconProps) => {
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
						d="M5.5 14.173c0 3.464 2.88 6.327 6.5 6.327s6.5-2.863 6.5-6.327c0-1.746-.835-3.344-2.208-4.958-1.011-1.188-2.187-2.25-3.386-3.332-.301-.272-.604-.545-.906-.822-.302.277-.605.55-.906.822-1.199 1.082-2.375 2.144-3.386 3.332C6.335 10.83 5.5 12.427 5.5 14.173zm5.97-10.666a.775.775 0 011.06 0c.42.393.862.792 1.313 1.2C16.74 7.322 20 10.264 20 14.172 20 18.496 16.418 22 12 22s-8-3.504-8-7.827c0-3.908 3.259-6.85 6.157-9.467.451-.407.893-.806 1.313-1.2z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 18a4 4 0 000-8v8z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LP;
