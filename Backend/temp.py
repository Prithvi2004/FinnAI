from fastapi import FastAPI, HTTPException, Depends, Form
from pydantic import BaseModel
from uuid import uuid4
from pymongo import MongoClient
from typing import List, Optional
import os


# MongoDB connection
client = MongoClient("mongodb://localhost:27017")
db = client["UserData"]
users_collection = db["CollectionDB"]

# Initialize FastAPI app
app = FastAPI()

# Pydantic models for data validation
class UserData(BaseModel):
    monthlySalary: int
    expenses: dict
    lifeGoals: List[dict]
    riskTolerance: str
    investmentPreferences: List[str]
    debt: dict


class User(BaseModel):
    userId: str
    data: UserData


# Endpoint to simulate user login and generate a new user ID
@app.post("/login")
def login():
    user_id = str(uuid4())  # Generate a unique user ID
    return {"user_id": user_id}


# Endpoint to submit form data and save it with the user ID
@app.post("/submit/{user_id}")
def submit_data(user_id: str, form_data: UserData):
    # Save data to MongoDB
    user_record = {
        "userId": user_id,
        "data": form_data.dict()
    }
    result = users_collection.insert_one(user_record)
    if result.inserted_id:
        return {"message": "Data saved successfully", "user_id": user_id}
    else:
        raise HTTPException(status_code=500, detail="Failed to save data")


# Retrieve user data using user ID
@app.get("/user/{user_id}", response_model=Optional[User])
def get_user_data(user_id: str):
    user_data = users_collection.find_one({"userId": user_id})
    if user_data:
        user_data["_id"] = str(user_data["_id"])  # Convert ObjectId to string
        return user_data
    else:
        raise HTTPException(status_code=404, detail="User not found")


# Retrieve all users' data
@app.get("/users", response_model=List[User])
def get_all_users():
    users = list(users_collection.find())
    for user in users:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
    return users


# Run the app using Uvicorn
# Command: uvicorn main:app --reload
