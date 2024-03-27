import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const EyeHide = (allProps: IconProps) => {
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
						d="M12 6.75c-.81 0-1.552.107-2.23.29a.75.75 0 11-.392-1.447A9.993 9.993 0 0112 5.25c3.412 0 5.844 1.631 7.4 3.226a13.142 13.142 0 011.716 2.189 11.304 11.304 0 01.527.94l.029.06.008.018.002.006.001.002s.001.001-.683.309l.684.308v.001l-.002.002-.002.006-.008.018-.029.06c-.025.05-.06.122-.107.211-.094.18-.234.43-.42.729-.373.596-.94 1.392-1.716 2.189a.75.75 0 11-1.074-1.048A11.637 11.637 0 0020.159 12a11.639 11.639 0 00-1.834-2.476C16.956 8.119 14.889 6.75 12 6.75zM21 12l.684.308a.751.751 0 000-.616L21 12zM7.683 6.884a.75.75 0 01-.23 1.035c-1.287.817-2.232 1.911-2.86 2.817a11.408 11.408 0 00-.757 1.255c.077.143.184.33.32.549.33.529.833 1.233 1.519 1.936C7.045 15.881 9.112 17.25 12 17.25c1.663 0 2.866-.651 4.117-1.395a.75.75 0 01.766 1.29C15.608 17.903 14.1 18.75 12 18.75c-3.412 0-5.844-1.631-7.4-3.226a13.145 13.145 0 01-1.716-2.189 11.279 11.279 0 01-.527-.94 4.649 4.649 0 01-.029-.06l-.008-.018-.002-.006-.001-.002L3 12l-.69-.295.001-.002.002-.003.004-.01.014-.031a9.496 9.496 0 01.247-.498c.172-.325.432-.774.782-1.28.7-1.008 1.78-2.27 3.288-3.228a.75.75 0 011.035.23zM3 12l-.69-.295a.751.751 0 00.006.603L3 12z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3.47 3.47a.75.75 0 011.06 0l16 16a.75.75 0 11-1.06 1.06l-16-16a.75.75 0 010-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M9.966 9.795a3 3 0 104.24 4.24l-4.24-4.24z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default EyeHide;
