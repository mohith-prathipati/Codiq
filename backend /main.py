"""
Codiq Engine — FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

import os
import uuid
import json
import time
import threading
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(title="Codiq Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory job store  { job_id: { status, stage, progress, log, output_path, stats, codebook } }
jobs: dict = {}


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────
def read_excel_preview(path: str) -> dict:
    """Read Excel and return preview data for the frontend."""
    df = pd.read_excel(path, dtype=str)
    df = df.fillna("")

    # Auto-detect columns
    col_map = {}
    for col in df.columns:
        low = col.lower()
        if any(k in low for k in ["respid", "resp_id", "response_id"]) and "RESPID" not in col_map:
            col_map["RESPID"] = col
        elif any(k in low for k in ["qid", "question_id", "q_id"]) and "QID" not in col_map:
            col_map["QID"] = col
        elif any(k in low for k in ["verbatim", "response", "text", "answer"]) and "Verbatim" not in col_map:
            col_map["Verbatim"] = col

    if len(col_map) < 3:
        cols = list(df.columns)
        col_map = {"RESPID": cols[0], "QID": cols[1], "Verbatim": cols[2]}

    df = df.rename(columns={v: k for k, v in col_map.items()})
    df["Verbatim"] = df["Verbatim"].str.strip()
    df = df[df["Verbatim"] != ""]

    question = df["QID"].mode()[0] if "QID" in df.columns else "N/A"
    total    = len(df)

    # First 10 rows for preview
    preview_rows = []
    for _, row in df.head(10).iterrows():
        preview_rows.append({
            "respid":   str(row.get("RESPID", "")),
            "qid":      str(row.get("QID", ""))[:60],
            "verbatim": str(row.get("Verbatim", ""))[:200],
        })

    return {
        "total":    total,
        "question": question[:120],
        "columns":  list(col_map.keys()),
        "preview":  preview_rows,
    }


def mock_pipeline(job_id: str, topic: str, min_threshold: int):
    """
    Placeholder pipeline — simulates stages with delays.
    Replace the body of each stage with the real pipeline calls later.
    """
    job = jobs[job_id]

    stages = [
        ("Discovering themes",   0.05, 0.25, 4),
        ("Consolidating themes", 0.25, 0.40, 2),
        ("Assigning NET codes",  0.40, 0.55, 2),
        ("Generating keywords",  0.55, 0.65, 2),
        ("Coding responses",     0.65, 0.88, 6),
        ("Validating output",    0.88, 0.97, 2),
        ("Writing Excel output", 0.97, 1.00, 1),
    ]

    for stage_name, prog_start, prog_end, duration in stages:
        if job["status"] == "cancelled":
            return

        job["stage"]  = stage_name
        job["status"] = "running"

        steps = 10
        for i in range(steps):
            time.sleep(duration / steps)
            job["progress"] = prog_start + (prog_end - prog_start) * ((i + 1) / steps)
            job["log"].append(f"  {stage_name}... {int(job['progress']*100)}%")

        job["log"].append(f"✓ {stage_name} complete")

    # ── Produce a mock output Excel ──────────────────────────────────────────
    # When real pipeline is integrated, this section gets replaced by actual output.
    input_path = job["input_path"]
    df = pd.read_excel(input_path, dtype=str).fillna("")

    # Detect verbatim column
    verbatim_col = None
    for col in df.columns:
        if any(k in col.lower() for k in ["verbatim","response","text","answer"]):
            verbatim_col = col; break
    if not verbatim_col:
        verbatim_col = df.columns[2] if len(df.columns) > 2 else df.columns[0]

    df["Sentiments"] = ["Positive", "Negative", "Mixed"][0]
    df["Code_1"]     = 201
    df["Code_2"]     = None

    output_path = UPLOAD_DIR / f"{job_id}_output.xlsx"
    df.to_excel(str(output_path), index=False)

    # Mock stats
    job["stats"] = {
        "total":    len(df),
        "themes":   18,
        "positive": int(len(df) * 0.64),
        "negative": int(len(df) * 0.08),
        "mixed":    int(len(df) * 0.24),
        "other":    int(len(df) * 0.04),
    }
    job["codebook"] = [
        {"code": 201, "net": 200, "net_name": "Functional Benefits",   "theme": "Core Product Attribute"},
        {"code": 202, "net": 200, "net_name": "Functional Benefits",   "theme": "Health / Wellness Benefit"},
        {"code": 301, "net": 300, "net_name": "Emotional Benefits",    "theme": "Positive Brand Feeling"},
        {"code": 302, "net": 300, "net_name": "Emotional Benefits",    "theme": "Nostalgic Association"},
        {"code": 401, "net": 400, "net_name": "Brand & Trust",         "theme": "Brand Recognition"},
        {"code": 801, "net": 800, "net_name": "Functional Concerns",   "theme": "Taste / Quality Concern"},
        {"code": 901, "net": 900, "net_name": "Experiential Concerns", "theme": "General Dissatisfaction"},
    ]

    job["output_path"] = str(output_path)
    job["status"]      = "done"
    job["progress"]    = 1.0
    job["log"].append("")
    job["log"].append("✓ Pipeline complete — output ready")


# ─────────────────────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"service": "Codiq Engine API", "version": "1.0.0", "status": "running"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload an Excel file. Returns file_id + preview data."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Only .xlsx or .xls files are supported.")

    file_id   = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        preview = read_excel_preview(str(file_path))
    except Exception as e:
        raise HTTPException(422, f"Could not read Excel file: {e}")

    # Also return all rows for the workspace
    try:
        df_all = pd.read_excel(str(file_path), dtype=str).fillna("")
        col_map2 = {}
        for col in df_all.columns:
            low = col.lower()
            if any(k in low for k in ["respid","resp_id"]) and "RESPID" not in col_map2: col_map2["RESPID"] = col
            elif any(k in low for k in ["qid","question_id"]) and "QID" not in col_map2: col_map2["QID"] = col
            elif any(k in low for k in ["verbatim","response","text","answer"]) and "Verbatim" not in col_map2: col_map2["Verbatim"] = col
        if len(col_map2) < 3:
            cols = list(df_all.columns)
            col_map2 = {"RESPID":cols[0],"QID":cols[1],"Verbatim":cols[2]}
        df_all = df_all.rename(columns={v:k for k,v in col_map2.items()})
        df_all["Verbatim"] = df_all["Verbatim"].str.strip()
        df_all = df_all[df_all["Verbatim"] != ""]
        all_rows = [{"respid":str(r.get("RESPID","")),"qid":str(r.get("QID",""))[:80],"verbatim":str(r.get("Verbatim",""))} for _,r in df_all.iterrows()]
    except Exception:
        all_rows = preview.get("preview", [])

    return {
        "file_id":  file_id,
        "filename": file.filename,
        "path":     str(file_path),
        "size_kb":  round(len(contents) / 1024, 1),
        "all_rows": all_rows,
        **preview,
    }


@app.post("/run")
async def run_pipeline(
    background_tasks: BackgroundTasks,
    file_id:       str = Form(...),
    file_path:     str = Form(...),
    topic:         str = Form(...),
    min_threshold: int = Form(5),
):
    """Start the coding pipeline. Returns a job_id for polling."""
    if not os.path.exists(file_path):
        raise HTTPException(404, "Uploaded file not found. Please re-upload.")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status":      "queued",
        "stage":       "Queued",
        "progress":    0.0,
        "log":         ["Job queued — starting pipeline..."],
        "input_path":  file_path,
        "topic":       topic,
        "output_path": None,
        "stats":       {},
        "codebook":    [],
        "created_at":  time.time(),
    }

    background_tasks.add_task(mock_pipeline, job_id, topic, min_threshold)
    return {"job_id": job_id}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    """Poll job status — stage, progress, log, stats."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found.")
    job = jobs[job_id]
    return {
        "job_id":   job_id,
        "status":   job["status"],
        "stage":    job["stage"],
        "progress": round(job["progress"], 3),
        "log":      job["log"][-40:],   # last 40 lines
        "stats":    job["stats"],
        "codebook": job["codebook"],
    }


@app.get("/download/{job_id}")
def download_output(job_id: str):
    """Download the coded Excel output."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found.")
    job = jobs[job_id]
    if job["status"] != "done" or not job["output_path"]:
        raise HTTPException(400, "Output not ready yet.")
    if not os.path.exists(job["output_path"]):
        raise HTTPException(404, "Output file missing.")
    return FileResponse(
        job["output_path"],
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"coded_output_{job_id[:8]}.xlsx",
    )


@app.delete("/job/{job_id}")
def cancel_job(job_id: str):
    """Cancel a running job."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found.")
    jobs[job_id]["status"] = "cancelled"
    return {"cancelled": True}


# ─────────────────────────────────────────────────────────────
#  EXPORT — write coded Excel from workspace data
# ─────────────────────────────────────────────────────────────
@app.post("/export")
async def export_coded(
    file_path: str = Form(...),
    responses: str = Form(...),
    codebook:  str = Form(...),
    question:  str = Form(""),
):
    """Build and return a coded Excel from workspace state."""
    import json as _json
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    import io

    rows  = _json.loads(responses)
    codes = _json.loads(codebook)

    wb  = Workbook()
    # ── Sheet 1: Codebook ─────────────────────────────────────
    ws1 = wb.active
    ws1.title = "Sheet1"
    hdr = Font(bold=True, color="FFFFFF")
    hf  = PatternFill("solid", fgColor="111111")

    ws1.cell(1, 1, f"Q: {question}").font = Font(bold=True)

    row = 3
    grouped = {}
    for t in codes:
        net = t.get("net", 900)
        if net not in grouped: grouped[net] = {"name": t.get("net_name",""), "themes":[]}
        grouped[net]["themes"].append(t)

    for net in sorted(grouped):
        nd = grouped[net]
        ws1.cell(row, 1, f"Net {net}: {nd['name']}").font = Font(bold=True)
        ws1.cell(row, 3, "Code")
        row += 1
        for t in nd["themes"]:
            ws1.cell(row, 1, f"    {t['theme']}")
            ws1.cell(row, 3, t["code"])
            row += 1
        row += 1

    for code, name in {9996:"Other",9997:"Nothing/None/NA",9998:"Don't Know",9999:"Can't Code"}.items():
        ws1.cell(row, 1, f"    {name}")
        ws1.cell(row, 3, code)
        row += 1

    ws1.column_dimensions["A"].width = 55
    ws1.column_dimensions["C"].width = 12

    # ── Sheet 2: Coded responses ──────────────────────────────
    ws2 = wb.create_sheet("Sheet2")
    headers = ["RESPID","QID","Verbatim","Sentiments","Code_1","Code_2","Code_3","Code_4"]
    for ci, h in enumerate(headers, 1):
        c = ws2.cell(1, ci, h)
        c.font = hdr; c.fill = PatternFill("solid", fgColor="1F4E79")
        c.alignment = Alignment(horizontal="center")

    SENT_FILLS = {
        "Positive": PatternFill("solid", fgColor="E2EFDA"),
        "Negative": PatternFill("solid", fgColor="FCE4D6"),
        "Mixed":    PatternFill("solid", fgColor="FFF2CC"),
    }

    for ri, r in enumerate(rows, 2):
        ws2.cell(ri, 1, r.get("respid",""))
        ws2.cell(ri, 2, r.get("qid",""))
        ws2.cell(ri, 3, r.get("verbatim",""))
        sc = ws2.cell(ri, 4, r.get("sentiment",""))
        if r.get("sentiment") in SENT_FILLS: sc.fill = SENT_FILLS[r["sentiment"]]
        for ci, code in enumerate((r.get("codes") or [])[:4], 5):
            try: ws2.cell(ri, ci, int(code))
            except: pass

    ws2.column_dimensions["A"].width = 10
    ws2.column_dimensions["B"].width = 60
    ws2.column_dimensions["C"].width = 60
    ws2.column_dimensions["D"].width = 12
    for l in ["E","F","G","H"]: ws2.column_dimensions[l].width = 10

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=coded_output.xlsx"}
    )