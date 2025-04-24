import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Books = (allProps: IconProps) => {
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
						d="M7.188 3.75c-.375 0-.738.153-1.01.432-.272.28-.428.663-.428 1.068v10.884a2.89 2.89 0 011.438-.384H18.25v-12H7.187zM19.75 3a.75.75 0 00-.75-.75H7.187c-.785 0-1.535.321-2.084.886A3.033 3.033 0 004.25 5.25v13.5c0 .789.304 1.55.853 2.114.55.565 1.299.886 2.085.886H19a.75.75 0 00.75-.75V3zm-1.5 14.25H7.187c-.374 0-.737.153-1.009.432-.272.28-.428.664-.428 1.068s.156.788.428 1.068.635.432 1.01.432H18.25v-3z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12.184 6.774a1.5 1.5 0 00-1.669.98.75.75 0 01-1.415-.497 3 3 0 015.83 1c0 1.147-.85 1.905-1.458 2.31a6.036 6.036 0 01-1.265.637l-.026.01-.008.002h-.003l-.002.001-.238-.71.239.71a.75.75 0 01-.477-1.422l.012-.004.056-.02c.05-.02.126-.05.217-.09a4.54 4.54 0 00.663-.362c.517-.344.79-.711.79-1.063v-.001a1.5 1.5 0 00-1.246-1.481zm-.943 6.733a.75.75 0 01.75-.75h.007a.75.75 0 110 1.5h-.007a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Books;
