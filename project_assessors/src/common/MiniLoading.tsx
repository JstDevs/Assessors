import type React from "react";
const MiniLoading:React.FC = ()=>{
    return(
        <div className="flex flex-col items-center">
            <div className="flex gap-1 w-fit transition-all duration-300 ease-in-out">
                <span className="inline-block h-1 w-1 rounded-full bg-emerald-500 animate-[bounce_0.6s_infinite]"></span>
                <span className="inline-block h-1 w-1 rounded-full bg-emerald-400 animate-[bounce_0.6s_0.15s_infinite]"></span>
                <span className="inline-block h-1 w-1 rounded-full bg-emerald-300 animate-[bounce_0.6s_0.3s_infinite]"></span>
            </div>
            <span className="text-emerald-600 font-medium mt-2 animate-pulse">
                Loading
            </span>
        </div>

        
    )
}

export default MiniLoading;