import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Bank = (allProps: IconProps) => {
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
						d="M12.07 4.037l8.397 4.453c.138.073.086.283-.07.283H3.603c-.156 0-.208-.21-.07-.283l8.397-4.453a.15.15 0 01.14 0zM20.788 19H3.213c-.053 0-.068-.072-.02-.095l1.16-.571a.15.15 0 01.067-.016H19.58a.15.15 0 01.066.016l1.16.571c.048.023.034.095-.018.095z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M5.942 9.455v8.863m0 0h13.639a.15.15 0 01.066.016l1.16.571c.048.023.034.095-.018.095H3.212c-.053 0-.068-.072-.02-.095l1.16-.571a.15.15 0 01.067-.016h1.522zm4.154-8.863v8.863m4.154-8.863v8.863m4.154-8.863v8.863M12.07 4.038l8.397 4.452c.138.073.086.283-.07.283H3.603c-.156 0-.208-.21-.07-.283l8.397-4.453a.15.15 0 01.14 0z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.15}
						strokeLinecap="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Bank;
