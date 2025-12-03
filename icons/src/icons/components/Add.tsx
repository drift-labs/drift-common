import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Add = ({ svgProps, ...rest }: IconProps) => {
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...svgProps}
				>
					<path
						d="M20 11.25a.75.75 0 0 1 0 1.5h-7.25V20a.75.75 0 1 1-1.5 0v-7.25H4a.75.75 0 0 1 0-1.5h7.25V4a.75.75 0 1 1 1.5 0v7.25z"
						fill={rest.color ? rest.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default Add;
