import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Configure pdfMake with fonts (Using the setup you provided)
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  }
};

export const printFaas = (data) => {
  // Destructure the nested data
  const faas = data.faas || {};
  const land = data.land || {};
  const appraisal = land.appraisal || {};
  const assessment = land.assessment || {};
  const adjustments = land.adjustments || [];
  const improvements = land.improvements || [];

  // Helper function to format dates (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper for currency/number formatting (if needed)
  const formatCurrency = (val) => val ? val.toString() : '';

  // --- Dynamic Table Row Generation ---

  // 1. Improvements Rows
  // Map the improvements array to table rows
  const improvementRows = improvements.map(imp => {
    const totalValue = (parseFloat(imp.qty || 0) * parseFloat(imp.unit_value || 0)).toFixed(2);
    return [
      { text: imp.improvement_name || '', style: 'value' },
      { text: imp.qty || '', style: 'valueCenter' },
      { text: imp.unit_value || '', style: 'valueRight' },
      { text: totalValue, style: 'valueRight' }
    ];
  });

  // Fill with empty rows to maintain minimum height/layout if there are few improvements
  const minImprovementRows = 2;
  while (improvementRows.length < minImprovementRows) {
    improvementRows.push([{ text: ' ', style: 'value' }, '', '', '']);
  }

  // Calculate Improvement Totals
  const totalImprovementValue = improvements.reduce((acc, curr) => {
    return acc + (parseFloat(curr.qty || 0) * parseFloat(curr.unit_value || 0));
  }, 0).toFixed(2);


  // 2. Adjustment Rows (Market Value Section)
  // Map adjustments array. 
  // We place Base Market Value in the first row, first column.
  // We place Market Value in the first row, last column.
  let adjustmentRows = adjustments.map((adj, index) => [
    { text: index === 0 ? appraisal.base_market_value : '', style: 'valueCenter' }, 
    { text: adj.factor || '', style: 'valueCenter' },
    { text: adj.adjustment || '', style: 'valueCenter' }, // % Adjustment not explicitly in input
    { text: '' , style: 'valueCenter' },
    { text: index === 0 ? assessment.market_value : '', style: 'valueCenter' }
  ]);

  // If no adjustments, ensure at least one row exists with base/market values
  if (adjustmentRows.length === 0) {
    adjustmentRows = [[
        { text: appraisal.base_market_value || '', style: 'valueCenter' },
        { text: '', style: 'valueCenter' },
        { text: '', style: 'valueCenter' },
        { text: '', style: 'valueCenter' },
        { text: assessment.market_value || '', style: 'valueCenter' }
    ]];
  }

  // Add filler rows for Market Value table
  while (adjustmentRows.length < 2) {
    adjustmentRows.push([{ text: ' ', style: 'value' }, '', '', '', '']);
  }

  // --- Layout Configuration ---

  const tableLayout = {
    hLineWidth: (i, node) => 0.5,
    vLineWidth: (i, node) => 0.5,
    hLineColor: (i, node) => 'black',
    vLineColor: (i, node) => 'black',
    paddingLeft: (i, node) => 4,
    paddingRight: (i, node) => 4,
    paddingTop: (i, node) => 2,
    paddingBottom: (i, node) => 2,
  };

  const docDefinition = {
    pageSize: 'LEGAL',
    pageMargins: [30, 30, 30, 30],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9
    },

    content: [
      // --- PAGE 1 ---
      
      // Header
      { text: 'REAL PROPERTY FIELD APPRAISAL & ASSESSMENT SHEET- LAND / OTHER IMPROVEMENTS', style: 'header', alignment: 'center' },
      
      // Transaction Code
      {
        columns: [
          { text: '', width: '*' },
          { text: 'TRANSACTION CODE', width: 'auto', style: 'labelBold', margin: [0, 5, 5, 0] },
          { text: faas.faas_type || '', width: 100, style: 'valueUnderline', margin: [0, 5, 0, 0] }
        ],
        margin: [0, 0, 0, 5]
      },

      // Table 1: ARP & PIN
      {
        style: 'tableExample',
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: [{ text: 'ARP No. ', style: 'label' }, { text: faas.arp_no || '', style: 'value' }] },
              { text: [{ text: 'PIN: ', style: 'label' }, { text: faas.pin || '', style: 'value' }] }
            ]
          ]
        },
        layout: tableLayout
      },

      // Table 2: OCT details
      {
        style: 'tableExample',
        table: {
          widths: ['33%', '33%', '12%', '12%', '10%'],
          body: [
            [
              { text: [{ text: 'OCT/TCT/CLOA No. ', style: 'label' }, { text: '', style: 'value' }] }, // Not in input
              { text: [{ text: 'Dated: ', style: 'label' }, { text: '', style: 'value' }] },
              { text: [{ text: 'Survey No. ', style: 'label' }, { text: '', style: 'value' }] },
              { text: [{ text: 'Lot No. ', style: 'label' }, { text: faas.lot_no || '', style: 'value' }] },
              { text: [{ text: 'Blk: ', style: 'label' }, { text: faas.block_no || '', style: 'value' }] },
            ]
          ]
        },
        layout: tableLayout,
        margin: [0, -1, 0, 0]
      },

      // Table 3: Owner & Admin
      {
        style: 'tableExample',
        table: {
          widths: ['65%', '35%'],
          body: [
            // Owner
            [
              { 
                text: [
                  { text: 'Owner:\n', style: 'label' },
                  { text: (faas.owner_name || '') + '\n', style: 'value' },
                  { text: 'Address:\n', style: 'label' },
                  { text: (faas.owner_address || '') + '\n', style: 'value' },
                  { text: 'Tel No.: ', style: 'label' },
                  { text: '', style: 'value' } // Tel not in input
                ],
                border: [true, true, true, false]
              },
              {
                text: [
                  { text: '\n\n\n\nTIN: ', style: 'label' },
                  { text: '', style: 'value' } // TIN not in input
                ],
                border: [true, true, true, false]
              }
            ],
            // Admin (Not in input, using placeholders)
            [
              {
                text: [
                  { text: 'Administrator/Beneficial User:\n', style: 'label' },
                  { text: '\n', style: 'value' },
                  { text: 'Address:\n', style: 'label' },
                  { text: '\n', style: 'value' },
                  { text: 'Tel No.: ', style: 'label' },
                  { text: '', style: 'value' }
                ],
                border: [true, true, true, true]
              },
              {
                text: [
                   { text: '\n\n\n\nTIN: ', style: 'label' },
                   { text: '', style: 'value' }
                ],
                border: [true, true, true, true]
              }
            ]
          ]
        },
        layout: tableLayout,
        margin: [0, -1, 0, 0]
      },

      // Header: Property Location
      { text: 'PROPERTY LOCATION', style: 'sectionHeader', margin: [0, 10, 0, 2] },
      {
        style: 'tableExample',
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: [{ text: 'No./Street: ', style: 'label' }, { text: '', style: 'value' }] },
              { text: [{ text: 'Brgy/District: ', style: 'label' }, { text: faas.barangay || '', style: 'value' }] }
            ],
            [
              { text: [{ text: 'Municipality: ', style: 'label' }, { text: faas.lg_code || '', style: 'value' }] },
              { text: [{ text: 'Province/City: ', style: 'label' }, { text: 'PROVINCE', style: 'value' }] } // Hardcoded based on request, or leave empty
            ]
          ]
        },
        layout: tableLayout
      },

      // Header: Property Boundaries (Not in input, keeping structure empty)
      { text: 'PROPERTY BOUNDARIES', style: 'sectionHeader', margin: [0, 10, 0, 2] },
      {
        style: 'tableExample',
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                text: [
                  { text: 'North:\n', style: 'label' },
                  { text: '', style: 'value' }
                ],
                height: 30
              },
              {
                rowSpan: 4,
                text: [
                  { text: 'Land Sketch:\n\n', style: 'label' },
                  { text: '(Not necessarily drawn to scale)', style: 'smallItalic', alignment: 'center', margin: [0, 100, 0, 0] }
                ]
              }
            ],
            [
              {
                text: [
                  { text: 'East:\n', style: 'label' },
                  { text: '', style: 'value' }
                ],
                height: 30
              },
              ''
            ],
            [
              {
                text: [
                  { text: 'South:\n', style: 'label' },
                  { text: '', style: 'value' }
                ],
                height: 30
              },
              ''
            ],
            [
              {
                text: [
                  { text: 'West:\n', style: 'label' },
                  { text: '', style: 'value' }
                ],
                height: 30
              },
              ''
            ]
          ]
        },
        layout: tableLayout
      },

      // Header: Land Appraisal
      { text: 'LAND APPRAISAL', style: 'sectionHeader', margin: [0, 10, 0, 2] },
      {
        style: 'tableExample',
        table: {
          widths: ['*', '*', '15%', '15%', '15%'],
          headerRows: 1,
          body: [
            [
              { text: 'Classification', style: 'tableHeader' },
              { text: 'Sub-Classification', style: 'tableHeader' },
              { text: 'Area', style: 'tableHeader' },
              { text: 'Unit Value', style: 'tableHeader' },
              { text: 'Base Market Value', style: 'tableHeader' }
            ],
            // Row 1 (Data)
            [
              { text: appraisal.classification || '', style: 'valueCenter' },
              { text: appraisal.subclassification || '', style: 'valueCenter' },
              { text: appraisal.area || '', style: 'valueCenter' },
              { text: appraisal.unit_value || '', style: 'valueCenter' },
              { text: appraisal.base_market_value || '', style: 'valueCenter' }
            ],
             // Empty Rows for filler
            [{ text: ' ', style: 'value' }, '', '', '', ''],
            [{ text: ' ', style: 'value' }, '', '', '', ''],
            // Total Row
            [
              { text: 'Total', style: 'labelBold' },
              { text: '', style: 'value' },
              { text: appraisal.area || '', style: 'valueCenter' },
              { text: '', style: 'value' },
              { text: appraisal.base_market_value || '', style: 'valueCenter' }
            ]
          ]
        },
        layout: tableLayout
      },

      // Header: Other Improvements (Dynamic)
      { text: 'Other Improvements', style: 'sectionHeader', margin: [0, 10, 0, 2] },
      {
        style: 'tableExample',
        table: {
          widths: ['*', '20%', '20%', '20%'],
          headerRows: 1,
          body: [
            [
              { text: '', style: 'tableHeader' }, 
              { text: 'Total Number', style: 'tableHeader' },
              { text: 'Unit Value', style: 'tableHeader' },
              { text: 'Base Market Value', style: 'tableHeader' }
            ],
            // Dynamic Data Rows
            ...improvementRows,
            // Total Row
            [
              { text: 'Total', style: 'valueCenter' },
              { text: '', style: 'value' },
              { text: 'Total', style: 'valueCenter' },
              { text: totalImprovementValue === '0.00' ? '' : totalImprovementValue, style: 'value' }
            ]
          ]
        },
        layout: tableLayout,
        pageBreak: 'after' // FORCE PAGE 2
      },


      // --- PAGE 2 ---

      // Header: Market Value
      { text: 'MARKET VALUE', style: 'sectionHeader', margin: [0, 0, 0, 2] },
      {
        style: 'tableExample',
        table: {
          widths: ['20%', '20%', '15%', '20%', '25%'],
          headerRows: 1,
          body: [
            [
              { text: 'Base Market Value', style: 'tableHeader' },
              { text: 'Adjustment Factors', style: 'tableHeader' },
              { text: '% Adjustment', style: 'tableHeader' },
              { text: 'Value Adjustment', style: 'tableHeader' },
              { text: 'Market Value', style: 'tableHeader' }
            ],
            // Dynamic Adjustment Rows
            ...adjustmentRows,
            // Footer Totals Row
            [
              { text: appraisal.base_market_value || '', style: 'valueCenter' },
              { text: 'Totals', style: 'valueCenter' },
              { text: '', style: 'value' },
              { text: '', style: 'value' },
              { text: assessment.market_value || '', style: 'value' }
            ]
          ]
        },
        layout: tableLayout
      },

      // Header: Property Assessment
      { text: 'PROPERTY ASSESSMENT', style: 'sectionHeader', margin: [0, 10, 0, 2] },
      {
        style: 'tableExample',
        table: {
          widths: ['30%', '20%', '25%', '25%'],
          headerRows: 1,
          body: [
            [
              { text: 'Actual Use', style: 'tableHeader' },
              { text: 'Market Value', style: 'tableHeader' },
              { text: 'Assessment Level', style: 'tableHeader' },
              { text: 'Assessed Value', style: 'tableHeader' }
            ],
            [
              { text: assessment.actual_use || '', style: 'valueCenter' },
              { text: assessment.market_value || '', style: 'valueCenter' },
              { text: (assessment.assessment_level || '') + '%', style: 'valueCenter' },
              { text: assessment.assessed_value || '', style: 'valueCenter' }
            ],
            [{ text: ' ', style: 'value' }, '', '', ''],
            [
              { text: 'Total', style: 'valueCenter' },
              { text: '', style: 'value' },
              { text: '', style: 'value' },
              { text: '', style: 'value' }
            ]
          ]
        },
        layout: tableLayout
      },

      // Taxability Checkboxes & Effectivity
      {
          table: {
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', '*'],
              body: [
                  [
                      { text: 'Taxable', style: 'label', margin: [0, 5, 0, 0], border: [true, false, false, true] },
                      { 
                        stack: [
                            { canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 1 }] },
                            // Add X if taxable is 1
                            faas.taxable === 1 ? { text: 'X', relativePosition: { x: 2, y: -9 }, fontSize: 8, bold: true } : {}
                        ],
                        margin: [0, 5, 5, 5], 
                        border: [false, false, false, true] 
                      },
                      { text: 'Exempt', style: 'label', margin: [0, 5, 0, 0], border: [false, false, false, true] },
                      { 
                        stack: [
                            { canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 1 }] },
                            // Add X if taxable is 0
                            faas.taxable === 0 ? { text: 'X', relativePosition: { x: 2, y: -9 }, fontSize: 8, bold: true } : {}
                        ],
                        margin: [0, 5, 5, 5], 
                        border: [false, false, false, true] 
                      },
                      { text: 'Effectivity of Assessment/Reassessment:', style: 'label', margin: [5, 5, 0, 0], border: [false, false, false, true] },
                      { 
                          text: [
                              { text: `\n${formatDate(faas.effectivity_date)}`, style: 'valueCenter' },
                              { text: '\nQtr.                Yr.', style: 'label', alignment: 'right' }
                          ], 
                          border: [false, false, true, true] 
                      }
                  ]
              ]
          },
          layout: { defaultBorder: false }
      },

      // Signatories
      {
        margin: [0, 20, 0, 0],
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'APPRAISED/ASSESSED BY:', style: 'labelBold', margin: [0, 0, 0, 20] },
              {
                 columns: [
                   { stack: [{text: 'MYLENE L. DE LEON, REA', style: 'valueCenterBold'}, {text: 'Municipal Assessor', style: 'labelCenter'}] },
                   { stack: [{text: formatDate(faas.created_date), style: 'valueCenter', decoration: 'underline'}, {text: 'Date', style: 'labelCenter'}] }
                 ]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'RECOMMENDING APPROVAL:', style: 'labelBold', margin: [0, 0, 0, 20] },
              {
                 columns: [
                   { stack: [{text: 'MUNICIPAL ASSESSOR', style: 'valueCenterBold'}, {text: 'Municipal Assessor', style: 'labelCenter'}] },
                   { stack: [{text: '', style: 'valueCenter', decoration: 'underline'}, {text: 'Date', style: 'labelCenter'}] }
                 ]
              }
            ]
          }
        ]
      },

      {
          margin: [0, 20, 0, 0],
          columns: [
              { width: '25%', text: '' },
              {
                  width: '50%',
                  stack: [
                      { text: 'APPROVED BY:', style: 'labelBold', margin: [0, 0, 0, 20] },
                      {
                          columns: [
                              { stack: [{text: 'PROVINCIAL ASSESSOR', style: 'valueCenterBold', decoration: 'underline'}, {text: 'Provincial Assessor', style: 'labelCenter'}] },
                              { stack: [{text: '', style: 'valueCenter', decoration: 'underline'}, {text: 'Date', style: 'labelCenter'}] }
                          ]
                      }
                  ]
              },
              { width: '25%', text: '' }
          ]
      },

      // Memoranda
      { text: 'MEMORANDA:', style: 'labelBold', margin: [0, 20, 0, 5] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 10] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 10] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 10] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 10] },

      // Entry Date
      {
        margin: [0, 10, 0, 10],
        text: [
          { text: 'Date of Entry in the ROA: ', style: 'labelBold' },
          { text: `       ${formatDate(faas.created_date)}       `, style: 'valueUnderline' },
          { text: ' By: ', style: 'labelBold' },
          { text: `       ${faas.created_by || ''}       `, style: 'valueUnderline' }
        ]
      },

      // Superseded Assessment
      { text: 'RECORD OF SUPERSEDED ASSESSMENT', style: 'labelBold', margin: [0, 10, 0, 2] },
      {
          table: {
              widths: ['15%', '35%', '15%', '35%'],
              body: [
                  [
                      { text: [{ text: 'PIN:\n', style: 'label' }, { text: '', style: 'value' }] },
                      { text: '', border: [false, true, true, true] },
                      { text: '', border: [false, true, true, true] },
                      { text: '', border: [false, true, true, true] }
                  ],
                  [
                      { text: [{ text: 'ARP No.\n', style: 'label' }, { text: '', style: 'value' }], colSpan: 2 },
                      {},
                      { text: [{ text: 'TD No.\n', style: 'label' }, { text: '', style: 'value' }], colSpan: 2 },
                      {}
                  ],
                  [
                      { text: [{ text: 'Total Assessed Value:\n', style: 'label' }, { text: '', style: 'value' }], colSpan: 4 },
                      {},{},{}
                  ],
                  [
                      { text: [{ text: 'Previous Owner:\n', style: 'label' }, { text: '', style: 'value' }], colSpan: 4 },
                      {},{},{}
                  ],
                  [
                      { text: [{ text: 'Effectivity of Assessment:\n', style: 'label' }, { text: '', style: 'value' }], colSpan: 4 },
                      {},{},{}
                  ],
                  [
                      { text: [{ text: 'AR Page No.:\n', style: 'label' }, { text: '', style: 'value' }], colSpan: 4 },
                      {},{},{}
                  ],
                  [
                      { 
                          text: [{ text: 'Recording Person:\n\n\n', style: 'label' }, { text: '', style: 'value' }], 
                          colSpan: 2, 
                          border: [true, true, false, true]
                      },
                      {},
                      { 
                          text: [{ text: 'Date:\n\n\n', style: 'label' }, { text: '', style: 'value' }], 
                          colSpan: 2,
                          border: [false, true, true, true]
                      },
                      {}
                  ]
              ]
          },
          layout: tableLayout
      }

    ],

    styles: {
      header: { fontSize: 11, bold: true, margin: [0, 0, 0, 5] },
      sectionHeader: { fontSize: 9, bold: true, margin: [0, 5, 0, 2] },
      label: { fontSize: 8 },
      labelBold: { fontSize: 8, bold: true },
      labelCenter: { fontSize: 8, alignment: 'center' },
      value: { fontSize: 9, bold: true },
      valueUnderline: { fontSize: 9, bold: true, decoration: 'underline' },
      valueCenter: { fontSize: 9, bold: true, alignment: 'center' },
      valueCenterBold: { fontSize: 9, bold: true, alignment: 'center' },
      valueRight: { fontSize: 9, bold: true, alignment: 'right' },
      valueRightBold: { fontSize: 9, bold: true, alignment: 'right' },
      tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
      smallItalic: { fontSize: 7, italics: true }
    }
  };

  pdfMake.createPdf(docDefinition).open();
};

export const printTaxDec = (inputData) => {
    // Helper: Format Currency
    const formatCurrency = (val) => {
        if (val === null || val === undefined || val === '') return '';
        return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    // Helper: Format Date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString();
    };

    // Helper: Map data to layout structure
    const data = {
        tdNo: inputData.td_no,
        propId: inputData.property_identification_no,
        owner: inputData.owner_name,
        ownerTin: inputData.owner_tin,
        ownerTel: inputData.owner_tel,
        ownerAddress: inputData.owner_address,
        admin: inputData.admin_name,
        adminTin: inputData.admin_tin,
        adminTel: inputData.admin_tel,
        adminAddress: inputData.admin_address,
        locStreet: inputData.location_street,
        locBrgy: inputData.location_barangay,
        locMuni: `${inputData.location_municipality || ''} ${inputData.location_province ? '/ ' + inputData.location_province : ''}`,
        oct: "", // Not in input
        survey: inputData.survey_no,
        cct: inputData.cct_no,
        lot: inputData.lot_no,
        dated: "", // Not in input
        blk: inputData.block_no,
        boundNorth: inputData.boundary_north,
        boundSouth: inputData.boundary_south,
        boundEast: inputData.boundary_east,
        boundWest: inputData.boundary_west,
        // Assessment
        kind: inputData.property_kind || "Land", // Default to Land if empty
        actualUse: "Residential", // Placeholder or derived from kind if needed
        marketValue: formatCurrency(inputData.market_value),
        level: inputData.assessment_level ? `${inputData.assessment_level}%` : '',
        assessedValue: formatCurrency(inputData.assessed_value),
        totalAssessedValue: formatCurrency(inputData.assessed_value),
        totalAssessedWord: "", // Placeholder for number-to-words
        taxable: inputData.taxable,
        effectivityQtr: inputData.effectivity_qtr,
        effectivityYear: inputData.effectivity_year,
        // Signatories
        approvedBy: inputData.approved_by,
        date: formatDate(inputData.approved_date),
        // Footer
        cancelsTd: inputData.previous_td_no,
        cancelsOwner: "", // Not in input
        cancelsAv: "" // Not in input
    };

    // Helper: Create a line with bottom border (simulating input line)
    const line = (text, width = '*') => ({
        text: text || ' ',
        style: 'value',
        width: width,
        border: [false, false, false, true],
        margin: [0, 0, 0, 1] // Reduced margin
    });

    // Helper: Create a label cell
    const label = (text, width = 'auto') => ({
        text: text,
        style: 'label',
        width: width,
        border: [false, false, false, false],
        margin: [0, 2, 5, 0] // align with line
    });

    // Helper: Checkbox
    const checkbox = (isChecked = false) => ({
        canvas: [
            { type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 1 }, // Smaller checkbox
            isChecked ? { type: 'line', x1: 2, y1: 2, x2: 8, y2: 8, lineWidth: 1 } : {},
            isChecked ? { type: 'line', x1: 8, y1: 2, x2: 2, y2: 8, lineWidth: 1 } : {}
        ],
        width: 15,
        margin: [0, 1, 5, 0]
    });

    const docDefinition = {
      pageSize: 'LEGAL',
      // Tighter margins to fit everything
      pageMargins: [30, 30, 30, 30], 
      defaultStyle: {
        font: 'Roboto',
        fontSize: 9 // Reduced base font size
      },

      content: [
        // --- HEADER ---
        { text: 'TAX DECLARATION OF REAL PROPERTY', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },

        // --- TOP FORM SECTION ---
        {
            table: {
                widths: ['auto', '35%', 'auto', '*'],
                body: [
                    // Row 1
                    [
                        label('TD No.'),
                        line(data.tdNo),
                        label('Property Identification No.'),
                        line(data.propId)
                    ]
                ]
            },
            layout: { defaultBorder: false }
        },
        {
            table: {
                widths: ['auto', '50%', 'auto', '15%', 'auto', '*'],
                body: [
                    // Row 2: Owner
                    [
                        label('Owner:'),
                        line(data.owner),
                        label('TIN:'),
                        line(data.ownerTin),
                        label('Telephone No.'),
                        line(data.ownerTel) 
                    ],
                    // Row 3: Address
                    [
                        label('Address:'),
                        { ...line(data.ownerAddress), colSpan: 3 },
                        {}, {},
                        label('Telephone No.'),
                        line('') 
                    ],
                    // Row 4: Admin
                    [
                        label('Administrator/Beneficial User:'),
                        line(data.admin),
                        label('TIN:'),
                        line(data.adminTin),
                        label('Telephone No.'),
                        line(data.adminTel)
                    ],
                    // Row 5: Admin Address
                    [
                        label('Address:'),
                        { ...line(data.adminAddress), colSpan: 3 },
                        {}, {},
                        label('Telephone No.'),
                        line('') 
                    ]
                ]
            },
            layout: { defaultBorder: false },
            margin: [0, 0, 0, 2]
        },

        // Location Header
        { text: 'Location of Property :', style: 'label', margin: [0, 5, 0, 0] },
        {
            table: {
                widths: ['33%', '33%', '34%'],
                body: [
                    [
                        line(data.locStreet),
                        line(data.locBrgy),
                        line(data.locMuni)
                    ],
                    [
                        { text: '(Number and Street)', style: 'labelItalic', alignment: 'center' },
                        { text: '(Barangay/District)', style: 'labelItalic', alignment: 'center' },
                        { text: '(Municipality & Province /City)', style: 'labelItalic', alignment: 'center' }
                    ]
                ]
            },
            layout: { defaultBorder: false },
            margin: [0, 0, 0, 2]
        },

        // OCT/TCT Details
        {
            table: {
                widths: ['auto', '40%', 'auto', '*'],
                body: [
                    [
                        label('OCT/TCT/CLOA No.'),
                        line(data.oct),
                        label('Survey No.'),
                        line(data.survey)
                    ],
                    [
                        label('CCT'),
                        line(data.cct),
                        label('Lot No.'),
                        line(data.lot)
                    ],
                    [
                        label('Dated:'),
                        line(data.dated),
                        label('Blk. No.'),
                        line(data.blk)
                    ]
                ]
            },
            layout: { defaultBorder: false },
            margin: [0, 0, 0, 5]
        },

        // Boundaries
        { text: 'Boundaries:', style: 'label', margin: [0, 2, 0, 0] },
        {
            table: {
                widths: ['10%', '40%', '10%', '40%'],
                body: [
                    [
                        label('North:'), line(data.boundNorth),
                        label('South:'), line(data.boundSouth)
                    ],
                    [
                        label('East:'), line(data.boundEast),
                        label('West:'), line(data.boundWest)
                    ]
                ]
            },
            layout: { defaultBorder: false },
            margin: [0, 0, 0, 10]
        },

        // --- KIND OF PROPERTY ---
        { text: 'KIND OF PROPERTY ASSESSED:', style: 'labelBold', margin: [0, 0, 0, 2] },
        {
            columns: [
                // Left Column
                {
                    width: '50%',
                    stack: [
                        {
                            columns: [
                                checkbox(data.kind === 'Land'), // Land
                                { text: 'LAND', style: 'labelBold', margin: [0, 1, 0, 0] }
                            ],
                            margin: [0, 0, 0, 5]
                        },
                        {
                            columns: [
                                checkbox(data.kind === 'Building'), // Building
                                { text: 'BUILDING', style: 'labelBold', margin: [0, 1, 0, 0] }
                            ]
                        },
                        {
                            columns: [
                                { text: 'No. of Storeys:', style: 'label', width: 70, margin: [15, 1, 0, 0] },
                                line('', '*')
                            ]
                        },
                        {
                            columns: [
                                { text: 'Brief Description:', style: 'labelBold', width: 85, margin: [15, 1, 0, 0] },
                                line('', '*')
                            ]
                        }
                    ]
                },
                // Right Column
                {
                    width: '50%',
                    stack: [
                        {
                            columns: [
                                checkbox(data.kind === 'Machinery'), // Machinery
                                { text: 'MACHINERY', style: 'labelBold', margin: [0, 1, 0, 0] }
                            ]
                        },
                        {
                            columns: [
                                { text: 'Brief Description:', style: 'labelBold', width: 85, margin: [15, 1, 0, 0] },
                                line('', '*')
                            ],
                            margin: [0, 0, 0, 5]
                        },
                        {
                            columns: [
                                checkbox(!['Land', 'Building', 'Machinery'].includes(data.kind)), // Others
                                { text: 'Others:', style: 'labelBold', width: 'auto', margin: [0, 1, 5, 0] },
                                { text: 'Specify:', style: 'label', width: 'auto', margin: [0, 1, 5, 0] },
                                line(!['Land', 'Building', 'Machinery'].includes(data.kind) ? data.kind : '', '*')
                            ]
                        },
                        line('', '*') // Long line for Others description
                    ]
                }
            ],
            margin: [0, 0, 0, 10]
        },

        // --- ASSESSMENT TABLE ---
        {
            table: {
                widths: ['15%', '15%', '20%', '15%', '15%', '20%'],
                headerRows: 1,
                body: [
                    // Headers
                    [
                        { text: 'Classification', style: 'tableHeader' },
                        { text: 'Area', style: 'tableHeader' },
                        { text: 'Market Value', style: 'tableHeader' },
                        { text: 'Actual Use', style: 'tableHeader' },
                        { text: 'Assessment\nLevel', style: 'tableHeader' },
                        { text: 'Assessed Value', style: 'tableHeader' }
                    ],
                    // Value Row (Simulating the first row filled)
                    [
                         line(data.kind), // Classification derived from kind or placeholder
                         { columns: [{text: '', alignment: 'center'}, {text: 'Php', fontSize: 8, width: 20}] }, // Area not in input, left empty
                         line(data.marketValue),
                         line(data.actualUse), // Actual Use not in input, using placeholder
                         { columns: [{text: data.level, alignment: 'center'}, {text: '', fontSize: 8, width: 20}] },
                         line(data.assessedValue)
                    ],
                    [
                         line(''),
                         line(''),
                         line(''),
                         line(''),
                         line(''),
                         line('')
                    ],
                    [
                         line(''),
                         line(''),
                         line(''),
                         line(''),
                         line(''),
                         line('')
                    ],
                    // Total Row
                    [
                        { text: 'Total', alignment: 'right', bold: true },
                        { columns: [{text: '', alignment: 'center'}, {text: 'Php', fontSize: 8, width: 20}] },
                        line(''),
                        line(''),
                        { columns: [{text: '', alignment: 'center'}, {text: '', fontSize: 8, width: 20}] },
                        line(data.totalAssessedValue)
                    ]
                ]
            },
            layout: {
                hLineWidth: (i) => i === 0 ? 0 : 0, 
                vLineWidth: () => 0, 
                paddingTop: () => 2, // Reduced padding
                paddingBottom: () => 2
            },
            margin: [0, 0, 0, 5]
        },

        // Total Assessed Value
        {
            columns: [
                { text: 'Total Assessed Value', style: 'label', width: 'auto', margin: [0, 5, 5, 0] },
                line(data.totalAssessedWord)
            ],
            margin: [0, 5, 0, 0]
        },
        { text: '(Amount in Words)', style: 'labelItalic', alignment: 'center', margin: [0, 0, 0, 10] },

        // Taxable / Exempt / Effectivity
        {
            columns: [
                { text: 'Taxable', style: 'label', width: 'auto', margin: [0, 2, 5, 0] },
                {
                    table: { body: [[{text: data.taxable ? 'X' : '', bold: true, alignment: 'center', fontSize: 9}]]},
                    width: 25
                },
                { text: 'Exempt', style: 'label', width: 'auto', margin: [15, 2, 5, 0] },
                {
                    table: { body: [[{text: !data.taxable ? 'X' : '', bold: true, fontSize: 9}]]},
                    width: 25
                },
                { text: '', width: '*' }, // Spacer
                { text: 'Effectivity of Assessment/Reassessment', style: 'label', width: 'auto', margin: [0, 2, 5, 0] },
                line(data.effectivityQtr), // Qtr
                { text: 'Qtr.', style: 'label', width: 'auto', margin: [0, 2, 5, 0] },
                line(data.effectivityYear), // Yr
                { text: 'Yr.', style: 'label', width: 'auto', margin: [0, 2, 0, 0] }
            ],
            margin: [0, 0, 0, 15]
        },

        // --- SIGNATORIES ---
        { text: 'APPROVED BY:', style: 'labelBold', margin: [50, 0, 0, 15] },
        {
            columns: [
                { width: '10%', text: '' },
                {
                    width: '40%',
                    stack: [
                        { text: data.approvedBy || 'ZENAIDA A. GABRIEL', style: 'valueCenterBold', fontSize: 10 },
                        { text: 'Provincial Assessor', style: 'labelItalic', alignment: 'center' }
                    ]
                },
                { width: '10%', text: '' },
                {
                    width: '30%',
                    stack: [
                        line(data.date),
                        { text: 'Date', style: 'label', alignment: 'center' }
                    ]
                },
                { width: '10%', text: '' }
            ],
            margin: [0, 0, 0, 15]
        },

        // --- FOOTER INFO ---
        {
            columns: [
                { text: 'This declaration cancels TD No.', style: 'label', width: 'auto', margin: [0, 0, 5, 0] },
                line(data.cancelsTd),
                { text: 'Owner:', style: 'label', width: 'auto', margin: [5, 0, 5, 0] },
                line(data.cancelsOwner),
                { text: 'Previous A.V. Php', style: 'label', width: 'auto', margin: [5, 0, 5, 0] },
                line(data.cancelsAv, 80)
            ],
            margin: [0, 0, 0, 10]
        },

        // Memoranda
        { text: 'MEMORANDA:', style: 'labelBold', margin: [0, 2, 0, 2] },
        // Slightly reduced height for memoranda lines if needed by adjusting margin
        {stack: [
             line('', '*'),
             line('', '*'),
             line('', '*'),
             line('', '*'),
             line('', '*')
        ], margin: [0, 0, 0, 10]},

        // Notes
        {
            text: [
                { text: 'Notes: ', bold: true, italics: true },
                { text: 'This declaration is for real property taxation purposes only and the valuation indicated herein are based on the schedule of unit market values prepared for the purpose and duly enacted into an Ordinance by the Sangguniang Panlalawigan under Ordinance No. ______. It does not and cannot by itself alone confer any ownership or legal title to the property.', italics: true }
            ],
            fontSize: 7,
            margin: [0, 5, 0, 0]
        }
      ],

      styles: {
        header: { fontSize: 12, bold: true }, // Reduced header size
        label: { fontSize: 8 }, // Reduced label size
        labelBold: { fontSize: 8, bold: true },
        labelItalic: { fontSize: 7, italics: true },
        value: { fontSize: 9 }, // Reduced value size
        valueCenter: { fontSize: 9, alignment: 'center' },
        valueCenterBold: { fontSize: 9, bold: true, alignment: 'center' },
        tableHeader: { fontSize: 8, alignment: 'center', bold: true }
      }
    };

    window.pdfMake.createPdf(docDefinition).open();
  };