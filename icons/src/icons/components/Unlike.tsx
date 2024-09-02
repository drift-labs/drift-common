import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Unlike = (allProps: IconProps) => {
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
						d="M12.6 20.338a.75.75 0 01-.678.412 3.293 3.293 0 01-2.549-1.261 3.244 3.244 0 01-.59-2.773v-.001l.579-2.365H5.614a2.375 2.375 0 01-1.89-.938 2.344 2.344 0 01-.38-2.071h.001l1.88-6.4a2.35 2.35 0 01.853-1.223c.41-.304.906-.468 1.416-.468h10.892a2.37 2.37 0 011.67.686c.443.44.694 1.039.694 1.664V12c0 .625-.25 1.224-.695 1.664a2.37 2.37 0 01-1.669.686H16.16a.874.874 0 00-.457.13.855.855 0 00-.317.344l-.002.002-2.783 5.512zm5.15-7.488h.636a.87.87 0 00.613-.251.843.843 0 00.251-.599V5.6a.843.843 0 00-.25-.599.87.87 0 00-.614-.251h-.636v8.1zm-1.5-8.1H7.494a.873.873 0 00-.521.172.85.85 0 00-.309.442l-1.88 6.4a.838.838 0 00.137.744.86.86 0 00.693.342h4.704a.75.75 0 01.728.928l-.807 3.296v.003a1.734 1.734 0 00.317 1.49 1.771 1.771 0 00.944.623l2.545-5.038v-.001c.197-.392.499-.72.872-.95.373-.23.803-.35 1.242-.351h.091v-8.1z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Unlike;
