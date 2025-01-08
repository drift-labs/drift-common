import './inlineLoading.css';

export const InlineLoadingBar = () => {
	return (
		<div className="block w-[40px] h-[10px] rounded-[5px] border-darkBlue-80 border-solid p-[1px] bg-transparent">
			<div
				className="bg-static-emphasized h-full rounded-[5px]"
				style={{
					animationName: `progress-loading`,
					animationDuration: '1000ms',
					animationTimingFunction: 'ease-in-out',
					animationPlayState: 'running',
					animationIterationCount: 'infinite',
				}}
			/>
		</div>
	);
};
