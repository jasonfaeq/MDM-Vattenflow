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

    // Use unique filenames for concurrent requests
    const unique = Date.now() + '_' + Math.floor(Math.random() * 10000);
    const wbsDataPath = path.join(tempDir, `wbs_data_${unique}.json`);
    const outputPath = path.join(tempDir, `wbs_export_${unique}.xlsm`);
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'wbs_template_actual.xlsm');

    // Write WBS data to JSON file
    fs.writeFileSync(wbsDataPath, JSON.stringify(wbsData));

    // Call the Python script (which uses xlwings)
    const pythonProcess = spawn('python', [
      'fill_excel_template.py',
      templatePath,
      outputPath,
      wbsDataPath,
    ]);

    return await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const excelBuffer = fs.readFileSync(outputPath);
            // Clean up
            fs.unlinkSync(wbsDataPath);
            fs.unlinkSync(outputPath);
            resolve(
              new NextResponse(excelBuffer, {
                headers: {
                  'Content-Type': 'application/vnd.ms-excel.macroEnabled.12',
                  'Content-Disposition': 'attachment; filename=\"wbs_export.xlsm\"',
                },
              })
            );
          } catch (err) {
            const error = err as Error;
            reject(new NextResponse(`Error reading output file: ${error.message}`, { status: 500 }));
          }
        } else {
          if (fs.existsSync(wbsDataPath)) fs.unlinkSync(wbsDataPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          reject(new NextResponse('Failed to generate Excel file', { status: 500 }));
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
      });

      pythonProcess.on('error', (err) => {
        if (fs.existsSync(wbsDataPath)) fs.unlinkSync(wbsDataPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(new NextResponse(`Error: ${err.message}`, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 