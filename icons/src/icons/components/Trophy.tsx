import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trophy = (allProps: IconProps) => {
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
						d="M6.45 4a.75.75 0 01.75-.75h9.6a.75.75 0 01.75.75v.85H18a2.75 2.75 0 010 5.5h-.5a5.55 5.55 0 01-3.15 4.278V16s0 .005.005.016a.275.275 0 00.047.07c.06.067.16.142.287.2l-.313.682.312-.682c.808.37 1.072 1.085 1.154 1.74.04.318.042.656.037.978a35.39 35.39 0 01-.005.246H18.4a.75.75 0 010 1.5H5.6a.75.75 0 010-1.5h2.526l-.005-.246a7.163 7.163 0 01.037-.979c.082-.654.346-1.369 1.153-1.739a.884.884 0 00.287-.2.274.274 0 00.047-.07c.005-.011.005-.015.005-.016v-1.372A5.548 5.548 0 016.5 10.35H6a2.75 2.75 0 110-5.5h.45V4zm0 2.35H6a1.25 1.25 0 000 2.5h.45v-2.5zm1.5-1.6h8.1V9.6a4.05 4.05 0 01-8.1 0V4.75zm9.6 1.6v2.5H18a1.25 1.25 0 000-2.5h-.45zm-6.4 8.735V16c0 .89-.728 1.426-1.213 1.65-.137.062-.24.16-.29.56-.026.21-.03.46-.026.771l.005.269h4.748l.005-.268c.005-.311 0-.562-.026-.771-.05-.402-.153-.499-.29-.561-.485-.224-1.213-.76-1.213-1.65v-.915a5.54 5.54 0 01-1.7 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trophy;
