from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import openpyxl
import os
import tempfile
import json
from fastapi.responses import StreamingResponse
import io
import sys

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fill_excel_template(template_path, output_path, wbs_data):
    wb = openpyxl.load_workbook(template_path, keep_vba=True)
    ws = wb['Shared Template']
    start_row = 18
    ws['D7'] = wbs_data[0].get('requesterDisplayName', '') if wbs_data else ''
    ws['D8'] = wbs_data[0].get('responsiblePerson', '') if wbs_data else ''
    # Helper to write integer if possible
    def write_int(ws, row, col, value):
        try:
            if value is not None and value != '':
                ws.cell(row=row, column=col, value=int(value))
            else:
                ws.cell(row=row, column=col, value=value)
        except Exception:
            ws.cell(row=row, column=col, value=value)

    for i, element in enumerate(wbs_data):
        row = start_row + i
        ws.cell(row=row, column=1, value=element.get('regionLabel', ''))
        ws.cell(row=row, column=2, value=element.get('type', ''))
        ws.cell(row=row, column=3, value=element.get('system', 'KIS'))
        ws.cell(row=row, column=4, value=element.get('controllingAreaLabel', element.get('controllingArea', '')))
        write_int(ws, row, 5, element.get('companyCode', ''))
        ws.cell(row=row, column=6, value=element.get('projectName', ''))
        ws.cell(row=row, column=7, value=element.get('projectDefinition', ''))
        write_int(ws, row, 8, element.get('level', ''))
        ws.cell(row=row, column=9, value=element.get('projectType', ''))
        write_int(ws, row, 10, element.get('investmentProfile', ''))
        write_int(ws, row, 11, element.get('responsibleProfitCenter', ''))
        write_int(ws, row, 12, element.get('responsibleCostCenter', ''))
        ws.cell(row=row, column=13, value='x' if element.get('planningElement') else '')
        ws.cell(row=row, column=14, value='x' if element.get('rubricElement') else '')
        ws.cell(row=row, column=15, value='x' if element.get('billingElement') else '')
        percent = element.get('settlementRulePercent', '')
        if percent not in ('', None):
            try:
                ws.cell(row=row, column=16, value=float(percent) / 100)
            except Exception:
                ws.cell(row=row, column=16, value=percent)
        else:
            ws.cell(row=row, column=16, value='')
        ws.cell(row=row, column=17, value=element.get('settlementRuleGoal', ''))
        ws.cell(row=row, column=18, value=element.get('projectProfile', ''))
        ws.cell(row=row, column=19, value=element.get('responsiblePerson', ''))
        ws.cell(row=row, column=20, value=element.get('userId', ''))
        ws.cell(row=row, column=21, value=element.get('employmentNumber', ''))
        ws.cell(row=row, column=22, value=element.get('functionalArea', ''))
        ws.cell(row=row, column=24, value=element.get('comment', ''))
        ws.cell(row=row, column=25, value=element.get('tm1Project', ''))
        ws.cell(row=row, column=26, value=element.get('tgPhase', ''))
        ws.cell(row=row, column=27, value=element.get('projectSpec', ''))
        ws.cell(row=row, column=28, value=element.get('motherCode', ''))
    wb.save(output_path)

@app.post("/export")
async def export_excel(payload: dict):
    wbs_data = payload.get("wbsData", [])
    try:
        template_path = os.path.join(os.path.dirname(__file__), 'templates', 'wbs_template_actual.xlsm')
        wb = openpyxl.load_workbook(template_path, keep_vba=True)
        ws = wb['Shared Template']
        start_row = 18
        ws['D7'] = wbs_data[0].get('requesterDisplayName', '') if wbs_data else ''
        ws['D8'] = wbs_data[0].get('responsiblePerson', '') if wbs_data else ''
        # Helper to write integer if possible
        def write_int(ws, row, col, value):
            try:
                if value is not None and value != '':
                    ws.cell(row=row, column=col, value=int(value))
                else:
                    ws.cell(row=row, column=col, value=value)
            except Exception:
                ws.cell(row=row, column=col, value=value)

        for i, element in enumerate(wbs_data):
            row = start_row + i
            ws.cell(row=row, column=1, value=element.get('regionLabel', ''))
            ws.cell(row=row, column=2, value=element.get('type', ''))
            ws.cell(row=row, column=3, value=element.get('system', 'KIS'))
            ws.cell(row=row, column=4, value=element.get('controllingAreaLabel', element.get('controllingArea', '')))
            write_int(ws, row, 5, element.get('companyCode', ''))
            ws.cell(row=row, column=6, value=element.get('projectName', ''))
            ws.cell(row=row, column=7, value=element.get('projectDefinition', ''))
            write_int(ws, row, 8, element.get('level', ''))
            ws.cell(row=row, column=9, value=element.get('projectType', ''))
            write_int(ws, row, 10, element.get('investmentProfile', ''))
            write_int(ws, row, 11, element.get('responsibleProfitCenter', ''))
            write_int(ws, row, 12, element.get('responsibleCostCenter', ''))
            ws.cell(row=row, column=13, value='x' if element.get('planningElement') else '')
            ws.cell(row=row, column=14, value='x' if element.get('rubricElement') else '')
            ws.cell(row=row, column=15, value='x' if element.get('billingElement') else '')
            percent = element.get('settlementRulePercent', '')
            if percent not in ('', None):
                try:
                    ws.cell(row=row, column=16, value=float(percent) / 100)
                except Exception:
                    ws.cell(row=row, column=16, value=percent)
            else:
                ws.cell(row=row, column=16, value='')
            ws.cell(row=row, column=17, value=element.get('settlementRuleGoal', ''))
            ws.cell(row=row, column=18, value=element.get('projectProfile', ''))
            ws.cell(row=row, column=19, value=element.get('responsiblePerson', ''))
            ws.cell(row=row, column=20, value=element.get('userId', ''))
            ws.cell(row=row, column=21, value=element.get('employmentNumber', ''))
            ws.cell(row=row, column=22, value=element.get('functionalArea', ''))
            ws.cell(row=row, column=24, value=element.get('comment', ''))
            ws.cell(row=row, column=25, value=element.get('tm1Project', ''))
            ws.cell(row=row, column=26, value=element.get('tgPhase', ''))
            ws.cell(row=row, column=27, value=element.get('projectSpec', ''))
            ws.cell(row=row, column=28, value=element.get('motherCode', ''))
        with tempfile.NamedTemporaryFile(suffix='.xlsm', delete=False) as tmp:
            wb.save(tmp.name)
            tmp.seek(0)
            excel_data = tmp.read()
        tmp.close()
        os.unlink(tmp.name)
        return StreamingResponse(
            io.BytesIO(excel_data),
            media_type="application/vnd.ms-excel.sheet.macroEnabled.12",
            headers={"Content-Disposition": "attachment; filename=wbs_export.xlsm"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print('Usage: python fill_excel_template.py <template_path> <output_path> <wbs_data_json>')
        sys.exit(1)
    template_path = sys.argv[1]
    output_path = sys.argv[2]
    wbs_data_json = sys.argv[3]
    with open(wbs_data_json, 'r', encoding='utf-8') as f:
        wbs_data = json.load(f)
    fill_excel_template(template_path, output_path, wbs_data)
    print('Excel file filled and saved successfully.') 