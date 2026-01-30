import { Outlet } from "react-router-dom";
import LeftNavigation from "../common/LeftNavigation.tsx";

function Landing(){
    return(
        <div className="flex h-screen w-screen overflow-hidden border">
            <LeftNavigation />
            <Outlet />
        </div>
    )
}

export default Landing;