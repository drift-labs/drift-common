import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Emptydata = (allProps: IconProps) => {
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
						d="M4.725 2.754A2.476 2.476 0 016.5 2h7.438a.75.75 0 01.537.227l4.813 4.95a.75.75 0 01.212.523v11.25c0 .67-.258 1.316-.725 1.796A2.475 2.475 0 0117 21.5H6.5c-.67 0-1.308-.274-1.775-.754A2.576 2.576 0 014 18.95V4.55c0-.67.258-1.316.725-1.796zM17.412 7.4L14.25 4.147V7.4h3.162zM12.75 3.5v4.65c0 .414.336.75.75.75H18v10.05c0 .285-.11.555-.3.75a.976.976 0 01-.7.3H6.5a.976.976 0 01-.7-.3c-.19-.195-.3-.465-.3-.75V4.55c0-.285.11-.555.3-.75.19-.195.442-.3.7-.3h6.25z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M9.24 10.24a.818.818 0 011.157 0L12 11.843l1.603-1.603a.818.818 0 011.157 1.157L13.157 13l1.603 1.603a.818.818 0 01-1.157 1.157L12 14.157l-1.603 1.603a.818.818 0 01-1.157-1.157L10.843 13 9.24 11.397a.818.818 0 010-1.157z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Emptydata;
