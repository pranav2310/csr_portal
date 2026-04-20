from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import io
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import SERVER_TIMESTAMP
import os
from openpyxl.utils import get_column_letter
import json

app = FastAPI(title="CSR Portal API")

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.1.165:3000",'*'], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FIREBASE SETUP ---
try:
    # 1. Check if we are in Production (Vercel)
    firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS")

    if firebase_creds_json:
        # We are in the Cloud! Parse the string into a dict
        print("☁️ Loading Firebase credentials from Environment Variable")
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
    else:
        # 2. Fallback to Local MacBook file path
        print("💻 Loading Firebase credentials from local JSON file")
        current_dir = os.path.dirname(os.path.realpath(__file__))
        key_path = os.path.join(current_dir, "firebase-service-account.json")
        
        if not os.path.exists(key_path):
            raise FileNotFoundError(f"Missing local key file at {key_path}")
            
        cred = credentials.Certificate(key_path)

    if not firebase_admin._apps: 
        firebase_admin.initialize_app(cred)
        
    db = firestore.client()
    FIREBASE_CONNECTED = True
    print("✅ Firebase successfully connected!")
    
except Exception as e:
    print(f"❌ FIREBASE INITIALIZATION ERROR: {str(e)}")
    FIREBASE_CONNECTED = False

# --- DATA MODELS ---
class ProposalData(BaseModel):
    projectName: str
    implementingAgency: str
    csr_no: str
    proposalType: str
    vipRefDate: Optional[str] = ""
    vipRefDetails: Optional[str] = ""
    workCentreName: Optional[str] = ""
    fy25_26: float
    fy26_27: float
    fy27_28: float
    remarks: Optional[str] = ""
    proposedTotal: float

# NEW: Model for Admin Updates
class ProposalUpdate(BaseModel):
    rec_fy25_26: float = 0.0
    rec_fy26_27: float = 0.0
    rec_fy27_28: float = 0.0
    adminRemarks: Optional[str] = ""
    status: str


# --- ROUTES ---
@app.post("/api/proposals")
async def create_proposal(proposal: ProposalData):
    if not FIREBASE_CONNECTED: raise HTTPException(status_code=500, detail="Database not connected.")
    try:
        proposal_dict = proposal.dict()
        proposal_dict['status'] = 'Submitted' 
        proposal_dict['createdAt'] = SERVER_TIMESTAMP
        doc_ref = db.collection('proposals').document()
        doc_ref.set(proposal_dict)
        return {"message": "Proposal saved successfully!", "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proposals")
async def get_all_proposals():
    if not FIREBASE_CONNECTED: raise HTTPException(status_code=500, detail="Database not connected.")
    try:
        docs = db.collection('proposals').stream()
        proposals_list = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id 
            if 'createdAt' in data and data['createdAt']:
                data['createdAt'] = data['createdAt'].isoformat()
            else:
                data['createdAt'] = "1970-01-01T00:00:00Z" 
            proposals_list.append(data)
        proposals_list.sort(key=lambda x: x['createdAt'], reverse=True)
        return proposals_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Route to update recommendations and status
@app.patch("/api/proposals/{proposal_id}")
async def update_proposal(proposal_id: str, update_data: ProposalUpdate):
    if not FIREBASE_CONNECTED: raise HTTPException(status_code=500, detail="Database not connected.")
    try:
        rec_total = update_data.rec_fy25_26 + update_data.rec_fy26_27 + update_data.rec_fy27_28
        
        db.collection('proposals').document(proposal_id).update({
            "rec_fy25_26": update_data.rec_fy25_26,
            "rec_fy26_27": update_data.rec_fy26_27,
            "rec_fy27_28": update_data.rec_fy27_28,
            "rec_total": rec_total,
            "adminRemarks": update_data.adminRemarks,
            "status": update_data.status
        })
        return {"message": "Proposal updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export-collation/{proposal_type}")
async def export_collation(proposal_type: str):
    if not FIREBASE_CONNECTED: raise HTTPException(status_code=500, detail="Database not connected.")
    try:
        docs = db.collection('proposals').where('proposalType', '==', proposal_type).stream()
        raw_data = [doc.to_dict() for doc in docs]

        if not raw_data:
            raise HTTPException(status_code=404, detail=f"No proposals found for type: {proposal_type}")

        processed_data = []
        for i, row in enumerate(raw_data, start=1):
            flat_row = {
                "Sl no.": i,
                "Project Name": row.get("projectName", ""),
                "Implementing Agency": row.get("implementingAgency", ""),
                "CSR 1 No.": row.get("csr_no", ""),
            }

            if proposal_type == 'BOUNDARY':
                flat_row["VIP Ref Date"] = row.get("vipRefDate", "")
                flat_row["VIP Details"] = row.get("vipRefDetails", "")
            elif proposal_type == 'WC_OTHER':
                flat_row["Work Centre"] = row.get("workCentreName", "")
                flat_row["VIP Reference"] = row.get("vipRefDetails", "")

            flat_row["Prop_TOTAL"] = row.get("proposedTotal", 0)
            flat_row["Prop_FY25"] = row.get("fy25_26", 0)
            flat_row["Prop_FY26"] = row.get("fy26_27", 0)
            flat_row["Prop_FY27"] = row.get("fy27_28", 0)
            
            # UPDATED: Pull actual recommended amounts from DB
            flat_row["Rec_TOTAL"] = row.get("rec_total", 0)
            flat_row["Rec_FY25"] = row.get("rec_fy25_26", 0)
            flat_row["Rec_FY26"] = row.get("rec_fy26_27", 0)
            flat_row["Rec_FY27"] = row.get("rec_fy27_28", 0)
            
            flat_row["Remarks"] = row.get("adminRemarks", row.get("remarks", ""))
            
            # NEW: Added Status explicitly
            flat_row["Status"] = row.get("status", "Submitted")
            
            processed_data.append(flat_row)

        df = pd.DataFrame(processed_data)

        header_tuples = [
            ("Sl no.", ""),
            ("Project Name", ""),
            ("Implementing Agency", ""),
            ("CSR 1 No.", "")
        ]

        if proposal_type == 'BOUNDARY':
            header_tuples.insert(1, ("VIP Ref Date", ""))
            header_tuples.insert(2, ("VIP Details", ""))
        elif proposal_type == 'WC_OTHER':
            header_tuples.insert(1, ("Work Centre", ""))
            header_tuples.insert(2, ("VIP Reference", ""))

        header_tuples.extend([
            ("Proposed Amount (Rs. in Lakhs)", "TOTAL"),
            ("Proposed Amount (Rs. in Lakhs)", "FY 25-26"),
            ("Proposed Amount (Rs. in Lakhs)", "FY 26-27"),
            ("Proposed Amount (Rs. in Lakhs)", "FY 27-28"),
            ("Recommended (Rs. in Lakhs)", "Total"),
            ("Recommended (Rs. in Lakhs)", "FY 25-26"),
            ("Recommended (Rs. in Lakhs)", "FY 26-27"),
            ("Recommended (Rs. in Lakhs)", "FY 27-28"),
            ("Remarks", ""),
            ("Status", "") # NEW: Added Status Header
        ])

        df.columns = pd.MultiIndex.from_tuples(header_tuples)

        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer)
            worksheet = writer.sheets['Sheet1']
            worksheet.delete_cols(1)
            
            for i, col in enumerate(worksheet.columns, start=1):
                max_length = 0
                column_letter = get_column_letter(i) 
                for cell in col:
                    try:
                        if cell.value and len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except: pass
                worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)

        buffer.seek(0)
        return StreamingResponse(
            buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Collation_{proposal_type}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))