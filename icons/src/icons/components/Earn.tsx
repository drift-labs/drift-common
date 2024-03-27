import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Earn = (allProps: IconProps) => {
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
						d="M12 3.75c-.121 0-.302.058-.48.295l-.004.006-5.474 6.95c-.182.246-.292.598-.292.98 0 .385.11.737.293.982l5.473 6.986.005.006c.177.237.358.295.48.295.12 0 .3-.058.478-.295l.005-.006 5.473-6.986c.182-.245.293-.597.293-.981 0-.383-.11-.735-.292-.981l-5.473-6.95-.005-.006c-.178-.237-.36-.295-.48-.295zm1.673-.614c-.418-.551-1.016-.886-1.673-.886-.658 0-1.256.335-1.673.886l-5.475 6.952-.005.007c-.411.548-.597 1.233-.597 1.887 0 .653.186 1.339.597 1.887l.005.006 5.475 6.988c.417.552 1.016.887 1.673.887.658 0 1.256-.335 1.674-.887l5.474-6.988.005-.006c.411-.548.597-1.234.597-1.887 0-.654-.186-1.34-.597-1.887l-.005-.008-5.475-6.95z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M17.379 4.379a.45.45 0 010-.637l1.424-1.424a.45.45 0 01.636 0l1.425 1.424a.45.45 0 010 .637l-1.425 1.424a.45.45 0 01-.636 0L17.38 4.38z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Earn;
