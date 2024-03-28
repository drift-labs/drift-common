import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Bridge = (allProps: IconProps) => {
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
						d="M4.794 5.085c.85-.637 1.849-.835 2.524-.835H19a.75.75 0 010 1.5H7.318c-.431 0-1.091.136-1.624.535-.495.372-.944 1.016-.944 2.195 0 1.18.45 1.836.95 2.219a2.81 2.81 0 001.618.551H9a.75.75 0 010 1.5H7.318a4.307 4.307 0 01-2.53-.86c-.882-.675-1.538-1.778-1.538-3.41 0-1.634.657-2.73 1.544-3.395zM14.307 12a.75.75 0 01.75-.75h1.777c.671 0 1.638.208 2.454.857.85.675 1.462 1.772 1.462 3.386s-.612 2.713-1.46 3.391a4.042 4.042 0 01-2.456.866H5a.75.75 0 010-1.5h11.834c.405 0 1.02-.137 1.519-.537.466-.373.897-1.028.897-2.22 0-1.193-.431-1.843-.895-2.212a2.555 2.555 0 00-1.52-.531h-1.778a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M17.385 2.837a.75.75 0 011.06.012l1.591 1.627a.75.75 0 01-.008 1.057l-1.591 1.576a.75.75 0 11-1.056-1.065l1.062-1.052-1.07-1.094a.75.75 0 01.012-1.06zm-11.242 14a.75.75 0 01.011 1.061l-1.07 1.094 1.062 1.052a.75.75 0 01-1.055 1.065l-1.592-1.576a.75.75 0 01-.008-1.058l1.591-1.626a.75.75 0 011.06-.011zM12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM8.25 12a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Bridge;
