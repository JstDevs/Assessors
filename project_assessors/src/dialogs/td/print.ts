import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize fonts
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// Helper to convert numbers to words (e.g., for Total Assessed Value)
const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";
    let str = '';
    str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
    str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
    str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
    str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
    str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
    return str.trim() + " Pesos";
};

const formatCurrency = (val: string | number | null | undefined) => {
    if (!val) return "";
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? "" : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Form Field Helper for underlined inputs
const field = (label: string, value: string, labelWidth: number | 'auto', valueWidth: number | '*') => {
    return {
        columns: [
            { text: label, width: labelWidth, fontSize: 9, margin: [0, 2, 0, 0] },
            { text: value || '', width: valueWidth, fontSize: 10, bold: true, decoration: 'underline', margin: [2, 2, 5, 0] }
        ]
    };
};

export const generateTDPdf = (data: any) => {
    const td = data.td;
    const owners = data.owners || [];
    const assessments = data.assessment || [];

    const ownerName = owners.map((o: any) => `${o.first_name} ${o.middle_name ? o.middle_name[0] + '.' : ''} ${o.last_name} ${o.suffix || ''}`).join(', ');
    const ownerTIN = owners.map((o: any) => o.tin_no).filter(Boolean).join(', ');
    const ownerTel = owners.map((o: any) => o.contact_no).filter(Boolean).join(', ');
    const ownerAddress = owners[0]?.address_house_no || '';

    const assessedValueWord = td.total_assessed_value ? numberToWords(parseFloat(td.total_assessed_value)) : '';

    const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
            fontSize: 9,
            font: 'Roboto'
        },
        content: [
            // Header
            { text: 'TAX DECLARATION OF REAL PROPERTY', alignment: 'center', fontSize: 14, bold: true, margin: [0, 0, 0, 20] },

            // Top Section (TD No & PIN)
            {
                columns: [
                    field('TD No.', td.td_no, 40, '*'),
                    field('Property Identification No.', td.property_identification_no || '', 120, '*')
                ],
                margin: [0, 0, 0, 10]
            },

            // Owner Details
            {
                columns: [
                    field('Owner:', ownerName, 40, '*'),
                    field('TIN:', ownerTIN, 30, 150)
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    field('Address:', ownerAddress, 40, '*'),
                    field('Telephone No.', ownerTel, 70, 110)
                ], margin: [0, 0, 0, 10]
            },

            // Admin Details
            {
                columns: [
                    field('Administrator/Beneficial User:', td.admin_name || '', 130, '*'),
                    field('TIN:', td.admin_tin || '', 30, 150)
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    field('Address:', td.admin_address || '', 40, '*'),
                    field('Telephone No.', td.admin_contact_no || '', 70, 110)
                ], margin: [0, 0, 0, 15]
            },

            // Location
            { text: 'Location of Property :', margin: [0, 0, 0, 5] },
            {
                columns: [
                    { text: td.street || '', decoration: 'underline', bold: true, alignment: 'center', width: '*' },
                    { text: td.barangay || '', decoration: 'underline', bold: true, alignment: 'center', width: '*' },
                    { text: td.municipality || '', decoration: 'underline', bold: true, alignment: 'center', width: '*' }
                ]
            },
            {
                columns: [
                    { text: '(Number and Street)', alignment: 'center', fontSize: 8, italics: true, width: '*' },
                    { text: '(Barangay/District)', alignment: 'center', fontSize: 8, italics: true, width: '*' },
                    { text: '(Municipality & Province/City)', alignment: 'center', fontSize: 8, italics: true, width: '*' }
                ],
                margin: [0, 0, 0, 15]
            },

            // Title & Survey
            {
                columns: [
                    field('OCT/TCT/CLOA No.', td.oct_no || '', 90, '*'),
                    field('Survey No.', td.survey_no || '', 50, '*')
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    field('CCT', td.cct_no || '', 30, '*'),
                    field('Lot No.', td.lot_no || '', 40, '*')
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    field('Dated:', td.title_date ? new Date(td.title_date).toLocaleDateString() : '', 30, '*'),
                    field('Blk. No.', td.block_no || '', 40, '*')
                ], margin: [0, 0, 0, 15]
            },

            // Boundaries
            { text: 'Boundaries:', margin: [0, 0, 0, 5] },
            {
                columns: [
                    { width: 40, text: '' }, // Indent
                    field('North:', td.boundary_north || '', 30, '*'),
                    field('South:', td.boundary_south || '', 30, '*')
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    { width: 40, text: '' },
                    field('East:', td.boundary_east || '', 30, '*'),
                    field('West:', td.boundary_west || '', 30, '*')
                ], margin: [0, 0, 0, 15]
            },

            // Kind of Property Assessed
            { text: 'KIND OF PROPERTY ASSESSED:', bold: true, margin: [0, 0, 0, 10] },
            {
                columns: [
                    { width: 30, text: td.property_kind === 'LAND' ? '[ X ]' : '[   ]', bold: true },
                    { width: '*', text: 'LAND' },
                    { width: 30, text: td.property_kind === 'MACHINERY' ? '[ X ]' : '[   ]', bold: true },
                    { width: 60, text: 'MACHINERY' },
                    field('Brief Description:', td.machinery_description || '', 80, '*')
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    { width: 30, text: td.property_kind === 'BUILDING' ? '[ X ]' : '[   ]', bold: true },
                    { width: 60, text: 'BUILDING' },
                    field('No. of Storeys:', td.building_storeys ? String(td.building_storeys) : '', 70, 70),
                    { width: 30, text: td.property_kind === 'OTHERS' ? '[ X ]' : '[   ]', bold: true },
                    { width: 40, text: 'Others:' },
                    field('Specify:', td.others_description || '', 40, '*')
                ], margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    { width: 90, text: '' }, // align with building
                    field('Brief Description:', td.building_description || '', 80, 150)
                ], margin: [0, 0, 0, 15]
            },

            // Assessment Table
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'Classification', alignment: 'center', border: [false, false, false, false] },
                            { text: 'Area', alignment: 'center', border: [false, false, false, false] },
                            { text: 'Market Value\nPhp', alignment: 'center', border: [false, false, false, false] },
                            { text: 'Actual Use', alignment: 'center', border: [false, false, false, false] },
                            { text: 'Assessment\nLevel', alignment: 'center', border: [false, false, false, false] },
                            { text: 'Assessed Value\nPhp', alignment: 'center', border: [false, false, false, false] }
                        ],
                        // Map Data
                        ...assessments.map((a: any) => [
                            { text: a.classification || '', alignment: 'center', decoration: 'underline', bold: true, border: [false, false, false, false] },
                            { text: a.area || '', alignment: 'center', decoration: 'underline', bold: true, border: [false, false, false, false] },
                            { text: formatCurrency(a.market_value), alignment: 'center', decoration: 'underline', bold: true, border: [false, false, false, false] },
                            { text: a.actual_use || '', alignment: 'center', decoration: 'underline', bold: true, border: [false, false, false, false] },
                            { text: a.assessment_level ? `${a.assessment_level}%` : '', alignment: 'center', decoration: 'underline', bold: true, border: [false, false, false, false] },
                            { text: formatCurrency(a.assessed_value), alignment: 'center', decoration: 'underline', bold: true, border: [false, false, false, false] }
                        ]),
                        // Fill empty rows to make it look like a form
                        ...Array.from({ length: Math.max(0, 3 - assessments.length) }).map(() => [
                            { text: '\n', decoration: 'underline', border: [false, false, false, false] },
                            { text: '\n', decoration: 'underline', border: [false, false, false, false] },
                            { text: '\n', decoration: 'underline', border: [false, false, false, false] },
                            { text: '\n', decoration: 'underline', border: [false, false, false, false] },
                            { text: '\n', decoration: 'underline', border: [false, false, false, false] },
                            { text: '\n', decoration: 'underline', border: [false, false, false, false] }
                        ]),
                        // Totals Row
                        [
                            { text: 'Total', alignment: 'center', margin: [0, 10, 0, 0], border: [false, false, false, false] },
                            { text: '', margin: [0, 10, 0, 0], border: [false, false, false, false] },
                            { text: formatCurrency(td.total_market_value), alignment: 'center', decoration: 'underline', bold: true, margin: [0, 10, 0, 0], border: [false, false, false, false] },
                            { text: '', margin: [0, 10, 0, 0], border: [false, false, false, false] },
                            { text: '', margin: [0, 10, 0, 0], border: [false, false, false, false] },
                            { text: formatCurrency(td.total_assessed_value), alignment: 'center', decoration: 'underline', bold: true, margin: [0, 10, 0, 0], border: [false, false, false, false] }
                        ]
                    ]
                },
                margin: [0, 0, 0, 15]
            },

            // Totals in Words
            {
                columns: [
                    { text: 'Total Assessed Value', width: 100 },
                    { text: assessedValueWord, width: '*', alignment: 'center', bold: true, decoration: 'underline' }
                ], margin: [0, 0, 0, 0]
            },
            { text: '(Amount in Words)', alignment: 'center', fontSize: 8, italics: true, margin: [0, 0, 0, 15] },

            // Taxable & Effectivity
            {
                columns: [
                    { text: 'Taxable', width: 40 },
                    { text: td.taxable === 1 ? '[ X ]' : '[   ]', bold: true, width: 30 },
                    { text: 'Exempt', width: 40 },
                    { text: td.taxable === 0 ? '[ X ]' : '[   ]', bold: true, width: 60 },
                    { text: 'Effectivity of Assessment/Reassessment', width: 'auto', margin: [0, 0, 10, 0] },
                    { text: td.assessment_effectivity_qtr || '', decoration: 'underline', bold: true, width: 30, alignment: 'center' },
                    { text: 'Qtr.', width: 20 },
                    { text: td.assessment_effectivity_year || '', decoration: 'underline', bold: true, width: 40, alignment: 'center' },
                    { text: 'Yr.', width: 20 }
                ], margin: [0, 0, 0, 20]
            },

            // Approvals
            {
                columns: [
                    { text: 'APPROVED BY:', width: 100, bold: true },
                    {
                        width: '*',
                        stack: [
                            { text: td.approved_by || '', bold: true, alignment: 'center', decoration: 'underline' },
                            { text: 'Provincial/City/Municipal Assessor', alignment: 'center', fontSize: 8, italics: true }
                        ]
                    },
                    {
                        width: 150,
                        stack: [
                            { text: td.approval_date ? new Date(td.approval_date).toLocaleDateString() : '', alignment: 'center', decoration: 'underline' },
                            { text: 'Date', alignment: 'center', fontSize: 8 }
                        ]
                    }
                ], margin: [0, 0, 0, 20]
            },

            // Memoranda
            {
                columns: [
                    field('This declaration cancels TD No', td.previous_td_id ? String(td.previous_td_id) : '', 140, 80),
                    field('Owner:', '', 40, '*'),
                    field('Previous A.V. Php', formatCurrency(td.previous_av), 90, '*')
                ], margin: [0, 0, 0, 10]
            },
            { text: 'MEMORANDA:', bold: true, margin: [0, 0, 0, 5] },
            { text: td.memoranda || '\n\n\n\n', decoration: 'underline', bold: true, margin: [0, 0, 0, 30] },

            // Footer Note
            {
                text: `Notes: This declaration is for real property taxation purposes only and the valuation indicated herein are based on the schedule of unit market values prepared for the purpose and duly enacted into an Ordinance by the Sanguniang Panlalawigan under Ordinance No. ${td.ordinance_no || '____'}. It does not and cannot by itself alone confer any ownership or legal title to the property.`,
                fontSize: 8,
                italics: true,
                alignment: 'justify'
            }
        ]
    };

    pdfMake.createPdf(docDefinition).open();
};