import styled from '@emotion/styled';
import React, { CSSProperties, PropsWithChildren } from 'react';

const GradientBgTxt = styled.div`
	background: var(--app-gradient);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	display: inline-block;
`;

const HoverGradientParent = styled.div`
	& > *:nth-of-type(1) {
		display: inline-block;
	}
	& > *:nth-of-type(2) {
		display: none;
	}

	&:hover > *:nth-of-type(1) {
		display: none;
	}
	&:hover > *:nth-of-type(2) {
		display: inline-block;
	}
`;

export const GradientText = (
	props: PropsWithChildren<{
		className?: string;
		style?: CSSProperties;
		onHover?: boolean;
		disabled?: boolean;
	}>
) => {
	if (props.disabled) {
		return <>{props.children}</>;
	}

	if (props.onHover) {
		return (
			<HoverGradientParent>
				<span className={props.className} style={props.style}>
					<div>{props.children}</div>
				</span>
				<span className={props.className} style={props.style}>
					<GradientBgTxt>{props.children}</GradientBgTxt>
				</span>
			</HoverGradientParent>
		);
	}

	return (
		<GradientBgTxt className={props.className} style={props.style}>
			{props.children}
		</GradientBgTxt>
	);
};
export default GradientText;
