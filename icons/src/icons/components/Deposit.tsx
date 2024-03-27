import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Deposit = (allProps: IconProps) => {
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
						d="M12.53 21.03a.75.75 0 01-1.06 0l-6-6a.75.75 0 111.06-1.06l4.72 4.72V7a.75.75 0 011.5 0v11.69l4.72-4.72a.75.75 0 111.06 1.06l-6 6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M13 4a1 1 0 11-2 0 1 1 0 012 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Deposit;
