import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Apple = (allProps: IconProps) => {
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
						d="M14.127 7.231c.606-.197 1.17-.334 1.749-.293 1.305.105 2.29.568 2.988 1.367-3.016 2.183-2.28 6.37.582 7.846-.57 1.426-1.294 2.77-2.415 3.774l.037.042-.039-.04c-.444.43-.887.595-1.324.616-.452.022-.935-.108-1.45-.333l-.004-.002-.235-.094c-1.169-.437-2.28-.425-3.519.093l-.005.002c-.726.313-1.221.396-1.612.342-.38-.053-.728-.245-1.146-.628-2.485-2.57-3.522-5.789-3.26-8.365.13-1.288.583-2.399 1.32-3.199.727-.789 1.753-1.302 3.096-1.376.637.037 1.185.21 1.699.399.489.179 1.025.406 1.52.443l.059.005.06-.012c.654-.133 1.318-.397 1.899-.587zM15.568 2.5c-.026 1.01-.521 1.902-1.193 2.553a4.085 4.085 0 01-1.226.827 2.425 2.425 0 01-.686.186c.074-1.76 1.443-3.215 3.105-3.566z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.867}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Apple;
