from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import xlwings as xw
import os
import json
import tempfile
from pathlib import Path
import platform

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure xlwings for Wine if on Linux
if platform.system() == 'Linux':
    xw.App.kill()  # Kill any existing Excel instances
    xw.App(visible=False, spec='wine')

@app.post("/export")
async def export_excel(wbs_data: dict):
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp_json:
            json.dump(wbs_data, temp_json)
            temp_json_path = temp_json.name

        with tempfile.NamedTemporaryFile(suffix='.xlsm', delete=False) as temp_excel:
            temp_excel_path = temp_excel.name

        # Get the template path
        template_path = os.path.join(os.path.dirname(__file__), 'templates', 'wbs_template_actual.xlsm')

        # Use xlwings to fill the template
        app = xw.App(visible=False)
        wb = app.books.open(template_path)
        ws = wb.sheets['Shared Template']
        start_row = 18

        # Set Business Controller (D7) and Business Responsible (D8)
        ws.range('D7').value = wbs_data[0].get('requesterDisplayName', '')
        ws.range('D8').value = wbs_data[0].get('responsiblePerson', '')

        for i, element in enumerate(wbs_data):
            row = start_row + i
            ws.range((row, 1)).value = element.get('regionLabel', '')
            ws.range((row, 2)).value = element.get('type', '')
            ws.range((row, 3)).value = 'KIS'
            ws.range((row, 4)).value = element.get('controllingAreaLabel', element.get('controllingArea', ''))
            ws.range((row, 5)).value = element.get('companyCode', '')
            ws.range((row, 6)).value = element.get('projectName', '')
            ws.range((row, 7)).value = element.get('projectDefinition', '')
            ws.range((row, 8)).value = element.get('level', '')
            ws.range((row, 9)).value = element.get('projectType', '')
            ws.range((row, 10)).value = ''
            ws.range((row, 11)).value = element.get('responsiblePCCC', '')
            ws.range((row, 12)).value = element.get('responsiblePCCC', '')
            ws.range((row, 13)).value = 'x' if element.get('planningElement') else ''
            ws.range((row, 14)).value = 'x' if element.get('rubricElement') else ''
            ws.range((row, 15)).value = 'x' if element.get('billingElement') else ''
            
            percent = element.get('settlementRulePercent', '')
            if percent not in ('', None):
                try:
                    ws.range((row, 16)).value = float(percent) / 100
                except Exception:
                    ws.range((row, 16)).value = percent
            else:
                ws.range((row, 16)).value = ''
                
            ws.range((row, 17)).value = element.get('settlementRuleGoal', '')
            ws.range((row, 19)).value = element.get('responsiblePerson', '')
            ws.range((row, 20)).value = element.get('userId', '')
            ws.range((row, 21)).value = element.get('employmentNumber', '')
            ws.range((row, 22)).value = element.get('functionalArea', '')
            ws.range((row, 24)).value = element.get('comment', '')
            ws.range((row, 26)).value = element.get('tgPhase', '')
            ws.range((row, 27)).value = element.get('projectSpec', '')
            ws.range((row, 28)).value = element.get('motherCode', '')

        # Save and close
        wb.save(temp_excel_path)
        wb.close()
        app.quit()

        # Read the generated Excel file
        with open(temp_excel_path, 'rb') as f:
            excel_data = f.read()

        # Clean up temporary files
        os.unlink(temp_json_path)
        os.unlink(temp_excel_path)

        return {"excel_data": excel_data}

    except Exception as e:
        # Clean up in case of error
        if 'temp_json_path' in locals() and os.path.exists(temp_json_path):
            os.unlink(temp_json_path)
        if 'temp_excel_path' in locals() and os.path.exists(temp_excel_path):
            os.unlink(temp_excel_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 