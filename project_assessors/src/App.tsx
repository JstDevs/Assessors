import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Landing from "./pages/Landing.tsx"
import Login from "./pages/Login.tsx"
import Revision from "./pages/Revision.tsx"
import PropertyClassificationFile from "./pages/PropertyClassificationFile.tsx"
import Page404 from "./pages/Page404.tsx"
import LocationalValuationGroup from "./pages/LocationalValuationGrouping.tsx"
import ScheduleOfMarketValues from "./pages/ScheduleOfMarketValues.tsx"
import SMVBuildingManagement from "./pages/SMV_Building.tsx"
import SMVMachineryManagement from "./pages/SMV_Machinery.tsx"
import BkandMt from "./pages/BkandMt.tsx"
import Dashboard from "./pages/Dashboard.tsx"
import PropertyMasterFile from "./pages/PropertyMasterFile.tsx"
import AssessmentRoll from "./pages/AssessmentRoll.tsx"
import FAASManagement from "./pages/Faas.tsx"
import TaxDeclarationManagement from "./pages/TaxDeclaration.tsx"
import TransactionalCodes from "./pages/TransactionalCodes.tsx" 
import OwnerManagement from "./pages/OwnerList.tsx"
import BuildingSettings from "./pages/BuildingSetting.tsx"
import MachinerySettings from "./pages/MachinerySettings.tsx"
import BuildingAdditionals from "./pages/BuildingAdditionals.tsx"
import LandImprovements from "./pages/LandImprovements.tsx"
import RecordOfAssessments from "./pages/ROA.tsx"
import { use, useState } from "react"
import UserManagement from "./pages/UserManager.tsx"
interface User {
    id: number;
    username: string;
    role_id: number;
    role_name: string;
    permission_level: number;
}


function App() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />}/>
        <Route path="private" element={<Landing user={user} setUser={setUser} />}>
          <Route index element={<Navigate to={"dashboard"} replace/>} />
          <Route path="dashboard" element={<Dashboard />}/>
          <Route path="pml" element={<PropertyMasterFile />}/>
          <Route path="bs" element={<BuildingSettings />}/>
          <Route path="bai" element={<BuildingAdditionals />}/>
          <Route path="loi" element={<LandImprovements />}/>
          <Route path="ms" element={<MachinerySettings />}/>
          <Route path="um" element={<UserManagement />}/>
          <Route path="faas" element={<FAASManagement />}/>
          <Route path="td" element={<TaxDeclarationManagement />}/>
          <Route path="pc" element={<PropertyClassificationFile />}/>
          <Route path="lvg" element={<LocationalValuationGroup />}/>
          <Route path="gr" element={<Revision />}/>
          <Route path="bkmt" element={<BkandMt />}/>
          <Route path="ar" element={<AssessmentRoll />}/>
          <Route path="roa" element={<RecordOfAssessments />}/>
          <Route path="smvl" element={<ScheduleOfMarketValues />}/>
          <Route path="smvb" element={<SMVBuildingManagement />}/>
          <Route path="tc" element={<TransactionalCodes />}/>
          <Route path="smvm" element={<SMVMachineryManagement />}/>
          <Route path="ol" element={<OwnerManagement />} />
          <Route path="*" element={<Page404 />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

