import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const AddCircle = (allProps: IconProps) => {
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
						d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5zM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M17 11.25a.75.75 0 010 1.5h-4.25V17a.75.75 0 01-1.5 0v-4.25H7a.75.75 0 010-1.5h4.25V7a.75.75 0 111.5 0v4.25H17z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default AddCircle;
