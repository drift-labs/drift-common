import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trade = (allProps: IconProps) => {
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
						d="M7.75 3a.75.75 0 00-1.5 0v2H4a1 1 0 00-1 1v11a1 1 0 001 1h2.25v3a.75.75 0 001.5 0v-3H10a1 1 0 001-1V6a1 1 0 00-1-1H7.75V3zM4.5 16.5v-10h5v10h-5zm10-2v-4h5v4h-5zM13 10a1 1 0 011-1h2.25V3a.75.75 0 011.5 0v6H20a1 1 0 011 1v5a1 1 0 01-1 1h-2.25v5a.75.75 0 01-1.5 0v-5H14a1 1 0 01-1-1v-5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trade;
