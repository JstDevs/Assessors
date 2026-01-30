export interface PropertyClassification {
    pc_id: number;
    ry_id: number;
    code: string;
    classname: string;
    description?: string;
}
export interface PropertyClassificationForm {
    pc_id: Number;
    code: string;
    classname: string;
    description?: string;
}


export interface PropertySubclassification {
    psc_id: number;
    pc_id: number;
    code: string;
    subclass_name: string;
    description?: string;
    valuation_factor?: number;
}

export interface ActualUse {
    au_id: number;
    pc_id: number;
    psc_id?: number;
    code: string;
    use_name: string;
    taxable: boolean;
    exempt_percentage?: string;
    assessment_level?: string;
    notes?: string;
    effective_date?: string;
}

export interface LandDetails{
    shape: 'REGULAR' | 'IRREGULAR';
    topography: 'LEVEL' | 'SLOPING' | 'ROLLING' | 'HILLY',
    corner_lot: boolean,
    road_access: 'PAVED' | 'GRAVEL' | 'EARTH' | 'NONE',
    additional_adj_factor: number,
    remarks: string,
}

export interface BuildingDetails{
    bk_id: number;
    floor_area: number;
    no_of_storeys: number;
    year_constructed: string;
    depreciation_rate: number;
    additional_adj_factor: number;
    remarks: string;
}

export interface MachineryDetails{
    machine_description: string;
    mt_id: number;
    year_acquired: string;
    acquisition_cost: number;
    estimated_life: number;
    depreciation_rate: number;
    operational_condition: 'OPERATIVE' | 'INOPERATIVE';
    remarks: string;
}