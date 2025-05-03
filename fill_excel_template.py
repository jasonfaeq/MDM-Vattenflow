import xlwings as xw
import os
import sys
import json

def fill_excel_template(template_path, output_path, wbs_data):
    app = xw.App(visible=False)
    wb = app.books.open(os.path.abspath(template_path))
    ws = wb.sheets['Shared Template']
    start_row = 18

    # Set Business Controller (D7) to the requester's name from the first element
    ws.range('D7').value = wbs_data[0].get('requesterDisplayName', '')
    # Set Business Responsible (D8) to the responsible person from the first element
    ws.range('D8').value = wbs_data[0].get('responsiblePerson', '')

    for i, element in enumerate(wbs_data):
        row = start_row + i
        ws.range((row, 1)).value = element.get('regionLabel', '')  # Region / language
        ws.range((row, 2)).value = element.get('type', '')  # Kind of change to process
        ws.range((row, 3)).value = 'KIS'               # System
        ws.range((row, 4)).value = element.get('controllingAreaLabel', element.get('controllingArea', ''))
        ws.range((row, 5)).value = element.get('companyCode', '')
        ws.range((row, 6)).value = element.get('projectName', '')
        ws.range((row, 7)).value = element.get('projectDefinition', '')
        ws.range((row, 8)).value = element.get('level', '')
        ws.range((row, 9)).value = element.get('projectType', '')
        ws.range((row, 10)).value = ''  # Investment profile
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

    wb.save(os.path.abspath(output_path))
    wb.close()
    app.quit()

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