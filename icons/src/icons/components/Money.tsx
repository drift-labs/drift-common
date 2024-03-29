import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Money = (allProps: IconProps) => {
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
						d="M12 19.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zm0 1.5a9 9 0 100-18 9 9 0 000 18z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M11.366 17.297a15.539 15.539 0 01-1.886-.143c-.61-.095-1.104-.223-1.48-.382V15.42c.4.17.91.318 1.533.445.623.128 1.234.197 1.833.207v-3.214a13.413 13.413 0 01-1.516-.477 4.252 4.252 0 01-1.04-.605 2.31 2.31 0 01-.616-.764A2.53 2.53 0 018 9.994c0-.52.135-.965.405-1.337.282-.371.676-.663 1.18-.875.506-.223 1.1-.35 1.78-.382V6h1.128v1.384a8.15 8.15 0 011.692.191 9.34 9.34 0 011.41.398l-.476 1.178a8.923 8.923 0 00-1.251-.35 8.384 8.384 0 00-1.375-.207v3.198c.776.201 1.422.419 1.939.652.517.223.904.504 1.163.844.27.329.405.758.405 1.288 0 .743-.305 1.348-.916 1.814-.611.457-1.475.738-2.59.844V19h-1.128v-1.703zm1.127-1.304c.694-.064 1.199-.207 1.516-.43.317-.233.476-.53.476-.891 0-.265-.06-.483-.177-.652-.117-.18-.323-.335-.616-.462-.282-.127-.682-.25-1.199-.366v2.8zm-1.127-7.368c-.423.022-.77.09-1.04.207-.27.106-.476.25-.617.43-.129.18-.194.387-.194.62 0 .276.053.515.159.716.117.191.311.356.582.494.27.127.64.244 1.11.35V8.625z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Money;
