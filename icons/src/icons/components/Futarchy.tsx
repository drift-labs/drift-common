import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Futarchy = (allProps: IconProps) => {
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
						d="M3.508 3A.508.508 0 003 3.508V6.87a.508.508 0 001.015 0V4.74l2.508 2.528a8.25 8.25 0 10.72-.716L4.726 4.015H6.68A.508.508 0 006.68 3H3.508zm3.735 3.553a8.3 8.3 0 00-.72.716l4.323 4.359a.508.508 0 10.721-.715l-4.324-4.36z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Futarchy;
