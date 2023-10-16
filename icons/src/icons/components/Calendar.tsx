import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Calendar = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3.2 4.8h9.6V3.2H3.2v1.6zM12.8 6H3.2v6.8h9.6V6zM2 6V2.5c0-.017 0-.034.003-.051A.5.5 0 012.5 2h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<rect
						x={8.5}
						y={8.5}
						width={3}
						height={3}
						rx={0.5}
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Calendar;
