import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Star = (allProps: IconProps) => {
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
						d="M11.284 4.441a.8.8 0 011.432 0l1.878 3.779a.8.8 0 00.602.435l4.192.609a.8.8 0 01.441 1.367l-3.025 2.925a.8.8 0 00-.232.712l.715 4.138a.8.8 0 01-1.159.845L12.37 17.29a.8.8 0 00-.74 0L7.872 19.25a.8.8 0 01-1.159-.845l.715-4.138a.8.8 0 00-.232-.712L4.17 10.631a.8.8 0 01.441-1.367l4.192-.609a.8.8 0 00.602-.435l1.878-3.779z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Star;
