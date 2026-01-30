export type PropertyKind = 'Land' | 'Building' | 'Machinery';


export type SMVLand = {
    smv_land_id: number;
    ry_id: string;
    lg_id: string;
    psc_id: string;
    unit_value: number;
    effective_date: Date;
    ordinance_no: string;
    approved_by: string;
    remarks: string;
    location: string;
    subclass: string;
};

export interface SMVLandFormData {
  smv_land_id: number;
  ry_id: number;
  lg_id: number;
  psc_id: number;
  unit_value: number;
  effective_date: string;
  ordinance_no: string;
  approved_by: string;
  remarks: string;
}


export interface SMVBuildingFormData {
    smv_building_id?: number;
    ry_id: number;
    pc_id: number;
    bk_id: number;
    unit_value: number;
    effective_date: string;
    ordinance_no: string;
    approved_by: string;
    remarks: string;
    bk_name: string;
    classification: string;
}

export interface PropertyClassification {
    pc_id: number;
    code: string;
    classname: string;
}

export interface BuildingKind {
    bk_id: number;
    code: string;
    name: string;
}