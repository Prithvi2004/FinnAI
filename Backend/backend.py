from django.http import FileResponse, JsonResponse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  # Import Pydantic's BaseModel
from crew import CrewCall  # Import the CrewCall function from crew.py
from globalState import job_results, currentJob  # ✅ Import updated global variable
import threading
import uuid
import os  # Import os to check file existence

app = FastAPI()

# Add CORS middleware to allow requests from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (use specific origins in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def execute_crew_job(job_id, user_inputs):
    """Runs the CrewAI job and updates the result dictionary."""
    try:
        print(f"Executing job {job_id} with inputs: {user_inputs}")  # Debugging
        
        result = CrewCall(user_inputs)

        # Update job status
        job_results[job_id]["status"] = "completed"
        job_results[job_id]["file_path"] = "./final_report.txt"  # Store file path for later retrieval

    except Exception as e:
        job_results[job_id]["status"] = "failed"
        job_results[job_id]["error"] = str(e)


# Define a Pydantic model for the request body
class ExecuteRequest(BaseModel):
    user_data: str  # Define user_data as a string
    user_query: str  # Define user_query as a string
    


@app.post("/api/execute")
async def execute_crew_script(request: ExecuteRequest):  
    try:
        # Extract inputs from the request
        user_data = request.user_data
        user_query = request.user_query

        print(f"Received request - User Data: {user_data}, User Query: {user_query}")

        # Validate inputs
        if not isinstance(user_data, str) or not isinstance(user_query, str):
            raise HTTPException(status_code=400, detail="Both user_data and user_query must be strings.")
        if not user_data.strip() or not user_query.strip():
            raise HTTPException(status_code=400, detail="Both user_data and user_query must be non-empty strings.")

        # Prepare the inputs for CrewCall
        user_inputs = {"user_data": user_data, "user_query": user_query}
        
        # Generate a unique job ID and initialize job storage
        job_id = str(uuid.uuid4())
        job_results[job_id] = {"status": "processing", "result": []}
        currentJob["job_id"] = job_id
        # Start the job in a separate thread
        thread = threading.Thread(target=execute_crew_job, args=(job_id, user_inputs))
        thread.start()

        return {"job_id": job_id, "message": "Job started successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/{job_id}")
def get_job_result(job_id: str):
    """Returns job status and results dynamically."""
    
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")

    return job_results[job_id]



@app.get("/api/download/{job_id}")
def download_job_result(job_id: str):
    """Allows downloading the file once the job is completed."""
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")

    job_info = job_results[job_id]
    
    if job_info["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job is not yet completed")

    file_path = job_info.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename="final_report.txt",  # Custom filename for download
        media_type="text/plain"  # Correct MIME type for .txt file
    )


@app.get("/")
async def read_root():
    return {"message": "Welcome to the API!"}
