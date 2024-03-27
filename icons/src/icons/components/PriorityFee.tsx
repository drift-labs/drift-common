import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PriorityFee = (allProps: IconProps) => {
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
						d="M12 6.5a8.5 8.5 0 00-8.302 10.333h16.604A8.5 8.5 0 0012 6.5zM2 15C2 9.477 6.477 5 12 5s10 4.477 10 10c0 .92-.124 1.812-.357 2.659a.94.94 0 01-.92.674H3.277a.94.94 0 01-.919-.674A10.01 10.01 0 012 15z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 13.528c-1.395 0-2.583 1.193-2.583 2.737 0 .346.06.676.17.979l-1.41.51a4.371 4.371 0 01-.26-1.49c0-2.307 1.796-4.236 4.083-4.236s4.083 1.929 4.083 4.237a4.37 4.37 0 01-.26 1.489l-1.41-.51c.11-.303.17-.633.17-.98 0-1.543-1.188-2.736-2.583-2.736z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M16.975 10.58a.75.75 0 010 1.061l-2.223 2.223a.75.75 0 01-1.06-1.061l2.222-2.222a.75.75 0 011.06 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default PriorityFee;
