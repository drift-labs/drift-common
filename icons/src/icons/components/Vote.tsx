import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Vote = (allProps: IconProps) => {
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
						d="M7.5 5.75c-.503 0-1.05.488-1.05 1.25v11.25h11.1V7c0-.356-.128-.683-.335-.912a.965.965 0 00-.715-.338h-9zm11.55 12.5V7c0-.705-.252-1.396-.72-1.916a2.464 2.464 0 00-1.83-.834h-9C6.023 4.25 4.95 5.562 4.95 7v11.25H3a.75.75 0 000 1.5h18a.75.75 0 000-1.5h-1.95zm-3.848-8.807a.75.75 0 01.056 1.059l-3.6 4a.75.75 0 01-1.115 0l-1.8-2a.75.75 0 111.114-1.004l1.243 1.38 3.043-3.38a.75.75 0 011.059-.055z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Vote;
