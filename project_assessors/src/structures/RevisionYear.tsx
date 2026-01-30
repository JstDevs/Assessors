export interface RevisionYear {
    ry_id: number;
    revision_code: string;
    year: number;
    description?: string;
    td_prefix: string;
    city_assessor_name?: string;
    city_assessor_position?: string;
    asst_city_assessor_name?: string;
    asst_city_assessor_position?: string;
    provincial_assessor_name?: string;
    provincial_assessor_position?: string;
    start_date?: string;
    end_date?: string;
    active: boolean;
    created_by: string;
    created_at: string;
}

export interface RevisionYearPreviewForm {
    ry_id: number;
    revision_code: string;
    year: number | string;
    description: string;
    td_prefix: string;
    city_assessor_name: string;
    city_assessor_position: string;
    asst_city_assessor_name: string;
    asst_city_assessor_position: string;
    provincial_assessor_name: string;
    provincial_assessor_position: string;
    start_date: string;
    end_date: string;
    active: boolean;
    created_by: string;
    created_at: string;
}