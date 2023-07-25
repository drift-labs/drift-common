import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Positions = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7.052 1.492a1.89 1.89 0 011.888 0l.001.001 4.235 2.42c.232.134.433.316.589.532a.683.683 0 01.16.267c.129.26.196.546.196.837v4.84a1.894 1.894 0 01-.945 1.637l-.002.001-4.233 2.419H8.94a1.89 1.89 0 01-.632.227.678.678 0 01-.625 0 1.89 1.89 0 01-.631-.226l-.002-.001-4.232-2.419-.003-.001a1.891 1.891 0 01-.945-1.636V5.55c0-.29.067-.576.195-.836a.683.683 0 01.163-.27 1.89 1.89 0 01.587-.53l.003-.002 4.234-2.42zM8.676 13.03l3.82-2.182a.53.53 0 00.264-.458V6.006L8.676 8.368v4.661zm-1.36-4.66v4.66l-3.82-2.182h-.001a.529.529 0 01-.264-.458V6.006L7.315 8.37zm.944-5.697l3.796 2.169-4.06 2.349-4.06-2.349 3.792-2.167.003-.002a.53.53 0 01.53 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Positions;
