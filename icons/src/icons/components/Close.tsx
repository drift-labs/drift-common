import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Close = ({ svgProps, ...rest }: IconProps) => {
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
						d="M18.47 4.47a.75.75 0 1 1 1.06 1.06L13.06 12l6.47 6.47a.75.75 0 1 1-1.06 1.06L12 13.06l-6.47 6.47a.75.75 0 1 1-1.06-1.06L10.94 12 4.47 5.53a.75.75 0 1 1 1.06-1.06L12 10.94z"
						fill={rest.color ? rest.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default Close;
