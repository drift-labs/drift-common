import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const EyeShow = (allProps: IconProps) => {
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
						d="M3.84 12a11.638 11.638 0 001.834 2.476C7.045 15.881 9.113 17.25 12 17.25c2.888 0 4.956-1.369 6.326-2.774A11.637 11.637 0 0020.159 12a11.639 11.639 0 00-1.834-2.476C16.956 8.119 14.889 6.75 12 6.75c-2.888 0-4.956 1.369-6.325 2.774A11.64 11.64 0 003.84 12zM21 12l.684-.308-.002-.003-.002-.006-.008-.018a4.359 4.359 0 00-.136-.271c-.094-.18-.234-.43-.42-.729A13.142 13.142 0 0019.4 8.476C17.843 6.881 15.412 5.25 12 5.25c-3.412 0-5.844 1.631-7.4 3.226a13.143 13.143 0 00-1.716 2.189 11.279 11.279 0 00-.527.94 4.787 4.787 0 00-.029.06l-.008.018-.002.006-.001.002L3 12l-.684-.308a.75.75 0 000 .616L3 12l-.684.308v.001l.002.002.002.006.008.018a4.787 4.787 0 00.136.271c.094.18.233.43.42.729.373.596.94 1.392 1.717 2.189C6.155 17.119 8.588 18.75 12 18.75s5.844-1.631 7.4-3.226a13.144 13.144 0 001.716-2.189 11.246 11.246 0 00.527-.94l.029-.06.008-.018.002-.006.001-.002L21 12zm0 0l.684.308a.751.751 0 000-.616L21 12z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<circle
						cx={12}
						cy={12}
						r={3}
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default EyeShow;
