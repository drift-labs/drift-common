import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SuccessFilled = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334zm3.501-8.61a.552.552 0 10-.78-.78L6.833 9.163 5.28 7.61a.552.552 0 00-.78.78l1.944 1.945a.552.552 0 00.78 0l4.278-4.278z"
						fill="#34CB88"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SuccessFilled;
