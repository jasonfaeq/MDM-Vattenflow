import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { WBSElement } from '@/types';

export const exportToExcel = async (wbsData: WBSElement[]) => {
  try {
    // Load the template
    const response = await fetch('/templates/wbs_template.xlsx');
    if (!response.ok) {
      throw new Error('Failed to load template');
    }
    const templateArrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(templateArrayBuffer, { type: 'array' });

    // Get the "Datasheet" worksheet
    const worksheet = workbook.Sheets['Datasheet'];

    // Start from row 9 (right after the orange header row)
    const startRow = 9;

    // Map the data to match template columns
    wbsData.forEach((wbs, index) => {
      const row = startRow + index;
      
      // Column B: Type (Kind of change in process)
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.type]], { origin: `B${row}` });
      
      // Column C: System
      XLSX.utils.sheet_add_aoa(worksheet, [['Standard']], { origin: `C${row}` });
      
      // Column D: Controlling Area
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.controllingArea]], { origin: `D${row}` });
      
      // Column E: Company Code
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.companyCode]], { origin: `E${row}` });
      
      // Column F: Project Name
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.projectName]], { origin: `F${row}` });
      
      // Column G: Project Definition
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.projectDefinition]], { origin: `G${row}` });
      
      // Column H: Level
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.level]], { origin: `H${row}` });
      
      // Column I: Project Type
      XLSX.utils.sheet_add_aoa(worksheet, [['N & ND']], { origin: `I${row}` });
      
      // Column J: Investment profile
      XLSX.utils.sheet_add_aoa(worksheet, [['RL/Ler']], { origin: `J${row}` });
      
      // Column K: Responsible PC/CC
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.responsiblePCCC]], { origin: `K${row}` });
      
      // Column L: Planning element
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.planningElement ? 'X' : '']], { origin: `L${row}` });
      
      // Column M: Rubric element
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.rubricElement ? 'X' : '']], { origin: `M${row}` });
      
      // Column N: Billing element
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.billingElement ? 'X' : '']], { origin: `N${row}` });
      
      // Column O: Settlement Rule %
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.settlementRulePercent]], { origin: `O${row}` });
      
      // Column P: Settlement Rule goal
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.settlementRuleGoal]], { origin: `P${row}` });
      
      // Column Q: Responsible person
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.responsiblePerson]], { origin: `Q${row}` });
      
      // Column R: User ID
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.userId]], { origin: `R${row}` });
      
      // Column S: Employment number
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.employmentNumber]], { origin: `S${row}` });
      
      // Column T: Functional area
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.functionalArea]], { origin: `T${row}` });
      
      // Column U: Project specification
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.projectSpec]], { origin: `U${row}` });
      
      // Column V: Mother Code
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.motherCode]], { origin: `V${row}` });
      
      // Column W: TG Phase
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.tgPhase]], { origin: `W${row}` });
      
      // Column X: Comment
      XLSX.utils.sheet_add_aoa(worksheet, [[wbs.comment]], { origin: `X${row}` });
    });

    // Add the current date in cell B2
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB');
    XLSX.utils.sheet_add_aoa(worksheet, [[formattedDate]], { origin: 'B2' });

    // Write the workbook and save
    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `WBS_Request_${formattedDate}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};