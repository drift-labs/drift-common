import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Like = (allProps: IconProps) => {
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
						d="M11.4 3.662a.75.75 0 01.678-.412 3.293 3.293 0 012.549 1.261 3.244 3.244 0 01.59 2.773v.001l-.579 2.365h3.748a2.375 2.375 0 011.89.938 2.344 2.344 0 01.379 2.071l-1.88 6.4c-.144.49-.444.918-.853 1.223-.41.304-.906.468-1.416.468H5.614a2.37 2.37 0 01-1.67-.686A2.343 2.343 0 013.25 18.4V12c0-.625.25-1.224.695-1.664a2.37 2.37 0 011.669-.686H7.84c.162 0 .32-.045.457-.13a.855.855 0 00.317-.344l.001-.002L11.4 3.662zM6.25 11.15h-.636a.87.87 0 00-.613.251.843.843 0 00-.251.599v6.4c0 .223.09.439.25.599a.87.87 0 00.614.251h.636v-8.1zm1.5 8.1h8.756c.189 0 .372-.06.521-.172a.85.85 0 00.309-.442l1.88-6.4a.839.839 0 00-.137-.744.859.859 0 00-.693-.342h-4.704a.75.75 0 01-.728-.928l.807-3.296v-.003a1.734 1.734 0 00-.317-1.49 1.77 1.77 0 00-.944-.623L9.955 9.848v.001c-.197.392-.499.72-.872.95-.373.23-.804.35-1.242.351H7.75v8.1z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Like;
