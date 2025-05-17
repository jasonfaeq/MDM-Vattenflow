from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import os
import tempfile
import io
from fill_excel_template import fill_excel_template

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "WBS Excel Export API is running"}

@app.post("/export")
async def export_excel(payload: dict):
    wbs_data = payload.get("wbsData", [])
    try:
        # Get the absolute path to the template file
        template_path = os.path.join(os.path.dirname(__file__), 'templates', 'wbs_template_actual.xlsm')
        
        # Create a temporary file for the output
        with tempfile.NamedTemporaryFile(suffix='.xlsm', delete=False, dir='/tmp') as tmp:
            # Fill the template with data
            fill_excel_template(template_path, tmp.name, wbs_data)
            
            # Read the filled template
            tmp.seek(0)
            excel_data = tmp.read()
            
            # Clean up the temporary file
            os.unlink(tmp.name)
            
            # Return the Excel file as a download
            return StreamingResponse(
                io.BytesIO(excel_data),
                media_type="application/vnd.ms-excel.sheet.macroEnabled.12",
                headers={"Content-Disposition": "attachment; filename=wbs_export.xlsm"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 