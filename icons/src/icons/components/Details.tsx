import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Details = (allProps: IconProps) => {
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
						d="M15.45 17.497a.75.75 0 01-.75.75H9.3a.75.75 0 010-1.5h5.4a.75.75 0 01.75.75zm-1.8-3.5a.75.75 0 01-.75.75H9.3a.75.75 0 010-1.5h3.6a.75.75 0 01.75.75zm-1.8-3.5a.75.75 0 01-.75.75H9.3a.75.75 0 010-1.5h1.8a.75.75 0 01.75.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M4.975 3.004A2.476 2.476 0 016.75 2.25H17.2a2.55 2.55 0 012.55 2.55v14.4c0 .67-.258 1.316-.725 1.796a2.475 2.475 0 01-1.775.754H6.75c-.67 0-1.308-.274-1.775-.754A2.576 2.576 0 014.25 19.2V4.8c0-.67.258-1.316.725-1.796zm1.775.746a.976.976 0 00-.7.3c-.19.195-.3.465-.3.75v14.4c0 .285.11.555.3.75.19.195.442.3.7.3h10.5c.258 0 .51-.105.7-.3.19-.195.3-.465.3-.75V4.8c0-.58-.47-1.05-1.05-1.05H6.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Details;
