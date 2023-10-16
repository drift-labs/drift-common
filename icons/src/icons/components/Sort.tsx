import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Sort = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M12.357 9.636a.524.524 0 01-.162.384l-3.818 3.818a.524.524 0 01-.383.162.524.524 0 01-.384-.162L3.792 10.02a.524.524 0 01-.162-.384c0-.147.054-.275.162-.383a.524.524 0 01.383-.162h7.637c.148 0 .275.054.383.162a.524.524 0 01.162.383z"
						fill="#404852"
					/>
					<path
						d="M12.357 6.364a.524.524 0 01-.162.383.524.524 0 01-.383.162H4.175a.524.524 0 01-.383-.162.524.524 0 01-.162-.383c0-.148.054-.276.162-.384L7.61 2.162A.524.524 0 017.994 2c.147 0 .275.054.383.162l3.818 3.818a.524.524 0 01.162.384z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Sort;
