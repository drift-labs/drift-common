import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Share = (allProps: IconProps) => {
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
						d="M10.307 2.105A.5.5 0 009.5 2.5v1.993a5.372 5.372 0 00-1.679.344 4.693 4.693 0 00-2.095 1.574c-.623.826-1.081 1.972-1.224 3.544a.5.5 0 00.852.399c1.188-1.19 2.369-1.776 3.242-2.067.36-.12.668-.19.904-.23V10a.5.5 0 00.832.374l4.5-4a.5.5 0 00-.025-.769l-4.5-3.5zm-.364 3.392h.003A.502.502 0 0010.5 5V3.522l3.219 2.504-3.219 2.86V7.5A.5.5 0 0010 7h-.045a4.774 4.774 0 00-.456.043c-.3.044-.72.128-1.22.295a8.895 8.895 0 00-2.547 1.36c.194-.716.476-1.264.793-1.685a3.693 3.693 0 011.654-1.242 4.373 4.373 0 011.741-.276l.022.002h.001zM4.5 3A2.5 2.5 0 002 5.5v6A2.5 2.5 0 004.5 14h6a2.5 2.5 0 002.5-2.5v-1a.5.5 0 00-1 0v1a1.5 1.5 0 01-1.5 1.5h-6A1.5 1.5 0 013 11.5v-6A1.5 1.5 0 014.5 4h2a.5.5 0 100-1h-2z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Share;
