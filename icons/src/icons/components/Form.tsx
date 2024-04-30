import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Form = (allProps: IconProps) => {
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
						d="M6.75 2.25c-.67 0-1.308.274-1.775.754A2.576 2.576 0 004.25 4.8V13a.75.75 0 001.5 0V4.8c0-.285.11-.555.3-.75.19-.195.442-.3.7-.3H13V8.4c0 .414.336.75.75.75h4.5V19.2c0 .285-.11.555-.3.75a.976.976 0 01-.7.3H11a.75.75 0 000 1.5h6.25c.67 0 1.308-.274 1.775-.754.467-.48.725-1.126.725-1.796V7.95a.75.75 0 00-.212-.523l-4.813-4.95a.75.75 0 00-.537-.227H6.75zm7.75 5.4V4.397l3.162 3.253H14.5zM10 13.964A.732.732 0 0111.037 15L7.41 18.624l-1.38.345.345-1.38L10 13.964zm.518-1.714c-.592 0-1.16.235-1.578.654l-3.772 3.772a.75.75 0 00-.197.348l-.699 2.794a.75.75 0 00.91.91l2.794-.699a.75.75 0 00.348-.197l3.772-3.772a2.232 2.232 0 00-1.578-3.81z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Form;
