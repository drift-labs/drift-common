import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Checkmark = (allProps: IconProps) => {
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
						d="M20.618 5.346a.9.9 0 01.036 1.272l-10.875 11.5a.9.9 0 01-1.343-.039l-4.625-5.5a.9.9 0 111.378-1.158l3.975 4.727L19.346 5.382a.9.9 0 011.272-.036z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Checkmark;
