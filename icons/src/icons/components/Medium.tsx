import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Medium = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M4.948 4.16c2.181 0 3.949 1.717 3.949 3.834s-1.768 3.834-3.949 3.834C2.768 11.828 1 10.11 1 7.994S2.768 4.16 4.948 4.16zm6.306.225c1.09 0 1.974 1.615 1.974 3.609 0 1.993-.884 3.61-1.974 3.61-1.09 0-1.974-1.617-1.974-3.61 0-1.993.884-3.61 1.974-3.61zm3.052.376c.383 0 .694 1.447.694 3.233 0 1.785-.31 3.233-.694 3.233-.384 0-.695-1.447-.695-3.233s.311-3.233.695-3.233z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Medium;
