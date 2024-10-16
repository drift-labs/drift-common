import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const MetaDAO = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<g>
						<path
							d="M0.54381 0.000659584C0.234596 0.0297887 -0.00127894 0.290071 6.02592e-05 0.600641V4.80053C-0.003 5.01689 0.110685 5.21816 0.297583 5.32725C0.484453 5.43634 0.715635 5.43634 0.902535 5.32725C1.08943 5.21816 1.20311 5.01689 1.20006 4.80053V2.04435L4.64066 5.48489C4.90875 5.18645 5.19518 4.90907 5.49379 4.64115L2.05318 1.20063H4.80004C5.01641 1.20368 5.21771 1.09001 5.32678 0.903113C5.43585 0.716216 5.43585 0.48507 5.32678 0.298174C5.21771 0.111281 5.01641 -0.00240063 4.80004 0.000659584H0.600059C0.581318 -0.000219819 0.562548 -0.000219819 0.54381 0.000659584ZM5.49379 4.64115L11.2219 10.3691C11.4524 10.5884 11.455 11.0054 11.2313 11.2316C11.0076 11.4578 10.5999 11.4503 10.3782 11.2222L4.64066 5.48489C2.87515 7.45039 1.80006 10.0503 1.80006 12.9003C1.80006 19.0305 6.76969 24 12.9 24C19.0304 24 24 19.0305 24 12.9003C24 6.77009 19.0304 1.80061 12.9 1.80061C10.0525 1.80061 7.45875 2.87845 5.49379 4.64115Z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<filter
							id="inner-shadow"
							x="-50%"
							y="-50%"
							width="200%"
							height="200%"
						>
							<feGaussianBlur in="SourceAlpha" stdDeviation="1" />
							<feOffset dy="1.5" result="offsetblur" />
							<feComposite
								in2="offsetblur"
								operator="arithmetic"
								k2="-1"
								k3="1"
							/>
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
							/>
						</filter>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};

export default MetaDAO;
