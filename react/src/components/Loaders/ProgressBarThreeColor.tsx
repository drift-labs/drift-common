type ProgressBarThreeColorProps = {
    firstProgress: number;
    secondProgress: number;
};

export const ProgressBarThreeColor = ({ firstProgress, secondProgress }: ProgressBarThreeColorProps) => {
    return (<div className="w-full h-2 bg-darkBlue-50 rounded-full overflow-hidden flex">
        <div className="h-full bg-green-50" style={{ width: `${firstProgress - 1}%` }}></div>
        <div className="h-full bg-red-50" style={{ width: `${secondProgress - 1}%` }}></div>
    </div>);
};
