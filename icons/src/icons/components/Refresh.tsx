import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Refresh = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M2.55 3.995v2.97h2.97M13.44 11.915v-2.97h-2.97"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.167}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M12.198 6.47a4.455 4.455 0 00-7.351-1.663L2.55 6.965m10.89 1.98l-2.296 2.158A4.456 4.456 0 013.791 9.44"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.167}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Refresh;
