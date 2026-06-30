import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Shield = (allProps: IconProps) => {
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
						d="M12.358 2.75l6.665 2.518.01.003.008.003c.203.068.409.292.409.726v6c0 2.501-1.387 4.48-3.003 6.097-1.572 1.571-3.287 2.582-3.886 2.887-.363.114-.651.087-.787.019l-.019-.01-.02-.008-.291-.133c-.775-.393-2.172-1.338-3.59-2.755l-.009-.01-.009-.007-.296-.28c-1.462-1.432-2.69-3.448-2.69-5.8V6c0-.434.206-.658.408-.726l.026-.01 6.36-2.514h.714zm3.145 6.496a1.225 1.225 0 00-1.757 0L11.1 11.893l-.846-.846a1.224 1.224 0 00-1.757 0 1.223 1.223 0 00-.018 1.736v.001l1.35 1.5.018.02c.34.34.817.483 1.254.483.437 0 .914-.143 1.254-.483l.008-.01 3.15-3.299h0a1.224 1.224 0 00-.009-1.749z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Shield;
