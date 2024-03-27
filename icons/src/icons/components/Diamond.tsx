import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Diamond = (allProps: IconProps) => {
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
						d="M11.085 3.25H6.6a.75.75 0 00-.623.332l-3.6 5.369a.75.75 0 00.03.876l9 11.632a.75.75 0 001.186 0l9-11.632a.75.75 0 00.03-.876l-3.6-5.369a.75.75 0 00-.623-.332H11.085zm1.353 1.5h-.876L9.617 8.618h4.766L12.438 4.75zm1.679 0l1.945 3.868h3.532L17 4.75h-2.883zm5.354 5.368h-3.318l-2.212 7.148 5.53-7.148zM12 18.463l2.583-8.345H9.417L12 18.463zM7.938 8.618L9.883 4.75H7L4.406 8.618h3.532zm-3.41 1.5h3.319l2.212 7.148-5.53-7.148z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Diamond;
