import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Search = (allProps: IconProps) => {
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
						d="M11.111 4.75a6.361 6.361 0 100 12.722 6.361 6.361 0 000-12.722zM3.25 11.111a7.861 7.861 0 1115.722 0 7.861 7.861 0 01-15.722 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M15.603 15.603a.75.75 0 011.06 0l3.867 3.867a.75.75 0 11-1.06 1.06l-3.867-3.866a.75.75 0 010-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Search;
