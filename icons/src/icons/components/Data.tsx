import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Data = (allProps: IconProps) => {
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
						d="M4.975 3.004A2.476 2.476 0 016.75 2.25h7.438a.75.75 0 01.537.227l4.813 4.95a.75.75 0 01.212.523V19.2c0 .67-.258 1.316-.725 1.796a2.475 2.475 0 01-1.775.754H6.75c-.67 0-1.308-.274-1.775-.754A2.576 2.576 0 014.25 19.2V4.8c0-.67.258-1.316.725-1.796zM17.662 7.65L14.5 4.397V7.65h3.162zM13 3.75V8.4c0 .414.336.75.75.75h4.5V19.2c0 .285-.11.555-.3.75a.976.976 0 01-.7.3H6.75a.976.976 0 01-.7-.3c-.19-.195-.3-.465-.3-.75V4.8c0-.285.11-.555.3-.75.19-.195.442-.3.7-.3H13zM7.75 9.3a.75.75 0 01.75-.75h1.75a.75.75 0 010 1.5H8.5a.75.75 0 01-.75-.75zm0 3.6a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75zm0 3.6a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Data;
