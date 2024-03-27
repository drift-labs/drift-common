import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Account = (allProps: IconProps) => {
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
						d="M12 3.75c-2.122 0-3.821 1.69-3.821 3.75s1.7 3.75 3.821 3.75c2.122 0 3.821-1.69 3.821-3.75S14.121 3.75 12 3.75zM6.679 7.5c0-2.91 2.393-5.25 5.321-5.25s5.321 2.34 5.321 5.25-2.393 5.25-5.321 5.25-5.321-2.34-5.321-5.25zm-1.866 7.784A5.359 5.359 0 018.57 13.75h6.858c1.407 0 2.76.55 3.758 1.534 1 .983 1.563 2.32 1.563 3.716v2a.75.75 0 01-1.5 0v-2c0-.99-.4-1.943-1.115-2.648a3.858 3.858 0 00-2.706-1.102H8.57c-1.017 0-1.99.398-2.706 1.102A3.715 3.715 0 004.75 19v2a.75.75 0 01-1.5 0v-2c0-1.396.564-2.733 1.563-3.716z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Account;
