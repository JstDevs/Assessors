import type React from "react";
const Loading:React.FC = ()=>{
    return(
        <div className="min-h-40 min-w-max flex flex-col justify-center items-center gap-3">
            <div className="flex gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 animate-[bounce_0.6s_infinite]"></span>
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-[bounce_0.6s_0.15s_infinite]"></span>
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-300 animate-[bounce_0.6s_0.3s_infinite]"></span>
            </div>
            <span className="text-emerald-600 font-medium animate-pulse">Loading...</span>
        </div>
    )
}

export default Loading;