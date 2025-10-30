import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Discourse = (allProps: IconProps) => {
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
						d="M3 11.328C3.615 3.644 13.16.072 18.476 5.875v-.001c5.21 5.687 1.462 14.974-6.21 15.315H3.003L3 11.329zm12.247-3.89c-2.46-2.473-6.614-1.91-8.448 1.034-1.186 1.903-1.08 4.259.122 6.124l-.637 3.253 3.583-.421c2.338 1.334 5.287.857 7.022-1.213v-.001c1.791-2.138 1.727-5.418-.264-7.39l.524.982c1.965 4.67-2.754 9.281-7.351 7.26l-2.877.64 2.773-.85c4.237 1.28 8.29-2.42 7.245-6.804-.858-3.595-5.338-3.86-7.832-1.815-1.946 1.598-2.533 4.214-1.694 6.57l-.951 2.472.777-2.613c-2.401-4.647 2.205-9.793 7.034-7.756l.974.527zM8.068 14.49C6.4 10.377 10.63 6.283 14.66 8.226c.563.272.804.467 1.1 1.024 2.062 3.897-1.696 8.3-5.815 6.936L6.92 17.21l1.15-2.718z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Discourse;
