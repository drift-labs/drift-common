import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ArrowRight = ({ svgProps, ...rest }: IconProps) => {
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
						d="M12.4697 4.46973C12.7626 4.17683 13.2374 4.17683 13.5303 4.46973L20.5303 11.4697C20.8232 11.7626 20.8232 12.2374 20.5303 12.5303L13.5303 19.5303C13.2374 19.8232 12.7626 19.8232 12.4697 19.5303C12.1768 19.2374 12.1768 18.7626 12.4697 18.4697L18.1895 12.75H4C3.58579 12.75 3.25 12.4142 3.25 12C3.25 11.5858 3.58579 11.25 4 11.25H18.1895L12.4697 5.53027C12.1768 5.23738 12.1768 4.76262 12.4697 4.46973Z"
						fill={rest.color ? rest.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default ArrowRight;
