import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { wbsData } = await request.json();

    // Create a temporary directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Create a temporary JSON file with the WBS data
    const tempDataPath = path.join(tempDir, 'wbs_data.json');
    fs.writeFileSync(tempDataPath, JSON.stringify(wbsData));

    // Get paths for template and output files
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'wbs_template_actual.xlsm');
    const outputPath = path.join(tempDir, 'wbs_export.xlsm');

    // Copy template to temp directory
    fs.copyFileSync(templatePath, outputPath);

    // Run the Python script with the output path
    const pythonProcess = spawn('python', ['populate_wbs_template.py', tempDataPath, outputPath]);

    return new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Read the generated Excel file
            const excelBuffer = fs.readFileSync(outputPath);
            
            // Clean up temporary files
            fs.unlinkSync(tempDataPath);
            fs.unlinkSync(outputPath);
            
            resolve(new NextResponse(excelBuffer, {
              headers: {
                'Content-Type': 'application/vnd.ms-excel.macroEnabled.12',
                'Content-Disposition': 'attachment; filename="wbs_export.xlsm"'
              }
            }));
          } catch (error) {
            reject(new NextResponse(`Error reading output file: ${error.message}`, { status: 500 }));
          }
        } else {
          // Clean up temporary files
          if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          
          reject(new NextResponse('Failed to generate Excel file', { status: 500 }));
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script error: ${data}`);
      });

      pythonProcess.on('error', (err) => {
        // Clean up temporary files
        if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        
        reject(new NextResponse(`Error: ${err.message}`, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 