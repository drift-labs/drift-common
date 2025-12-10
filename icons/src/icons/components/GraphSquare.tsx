import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GraphSquare = (allProps: IconProps) => {
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
						d="M19 19.5V21H5v-1.5h14zm.5-.5V5a.5.5 0 00-.5-.5H5a.5.5 0 00-.5.5v14a.5.5 0 00.5.5V21l-.204-.01a2 2 0 01-1.785-1.786L3 19V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-1.796 1.99L19 21v-1.5a.5.5 0 00.5-.5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M16.372 8.59a.75.75 0 011.256.82l-3.443 5.28a1.25 1.25 0 01-2.159-.112l-2.017-3.92-2.338 4.677a.75.75 0 01-1.342-.67l2.56-5.12.094-.16a1.251 1.251 0 012.037-.011l.098.16 2.045 3.975 3.21-4.92z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GraphSquare;
