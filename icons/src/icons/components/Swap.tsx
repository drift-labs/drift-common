import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Swap = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12.167 7.206a.595.595 0 000-1.19h-7.04l1.54-1.795a.595.595 0 00-.905-.775L3.437 6.158a.635.635 0 00.483 1.048h8.247zM3.833 8.794a.595.595 0 000 1.19h7.04l-1.54 1.795a.595.595 0 10.905.775l2.325-2.712a.635.635 0 00-.483-1.048H3.833z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Swap;
