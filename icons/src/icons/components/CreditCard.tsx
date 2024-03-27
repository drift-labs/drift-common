import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CreditCard = (allProps: IconProps) => {
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
						d="M4.8 5.75c-.508 0-1.05.483-1.05 1.25v2.25h16.5V7c0-.767-.543-1.25-1.05-1.25H4.8zM21.75 7c0-1.442-1.07-2.75-2.55-2.75H4.8C3.32 4.25 2.25 5.558 2.25 7v10c0 1.442 1.07 2.75 2.55 2.75h14.4c1.48 0 2.55-1.308 2.55-2.75V7zm-1.5 3.75H3.75V17c0 .767.542 1.25 1.05 1.25h14.4c.508 0 1.05-.483 1.05-1.25v-6.25z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13 16.75h-2v-1.5h2v1.5zM19 16.75h-4v-1.5h4v1.5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default CreditCard;
