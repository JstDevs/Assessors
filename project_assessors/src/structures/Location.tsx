export interface LocationalGroup {
    lg_id: number;
    ry_id: number;
    code: string;
    name: string;
    description: string | null;
    zone_type: 'PRIME' | 'STANDARD' | 'SUBURBAN' | 'RURAL';
    active: boolean;
}