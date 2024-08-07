import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GraphCircle = (allProps: IconProps) => {
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
						d="M16.398 9.364a.75.75 0 01.238 1.034l-2.655 4.24a1.25 1.25 0 01-2.18-.11l-1.391-2.815-1.734 3.612a.75.75 0 11-1.352-.65l1.956-4.074c.45-.94 1.786-.947 2.247-.013l1.42 2.875 2.417-3.861a.75.75 0 011.034-.238z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 19.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zm0 1.5a9 9 0 100-18 9 9 0 000 18z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GraphCircle;
