export interface BuildingKindFormData {
    bk_id?: number;
    code: string;
    name: string;
    description: string;
}

export interface MachineryTypeFormData {
    mt_id?: number;
    code: string;
    name: string;
    description: string;
}
export interface StructureType {
    bk_id: number;
    code: string;
    name: string;
    description: string | null;
}

export interface MachineryType {
    mt_id: number;
    code: string;
    name: string;
    description: string | null;
}
