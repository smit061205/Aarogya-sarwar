from fastapi import APIRouter, Body
from fastapi.encoders import jsonable_encoder
from app.database import medications_collection
from app.models.schema import MedicationSchema

router = APIRouter()

def medication_helper(med) -> dict:
    return {
        "id": str(med["_id"]),
        "name": med["name"],
        "dosage": med["dosage"],
        "time": med["time"],
        "taken": med.get("taken", False)
    }

@router.get("/")
async def get_medications():
    medications = []
    async for med in medications_collection.find():
        medications.append(medication_helper(med))
    return medications

@router.post("/")
async def add_medication(med: MedicationSchema = Body(...)):
    med_dict = jsonable_encoder(med)
    del med_dict["id"]
    new_med = await medications_collection.insert_one(med_dict)
    created_med = await medications_collection.find_one({"_id": new_med.inserted_id})
    return medication_helper(created_med)

@router.put("/{id}")
async def toggle_medication_status(id: str, data: dict = Body(...)):
    if "taken" in data:
        updated_med = await medications_collection.update_one(
            {"_id": id} if type(id) != str else {"_id": __import__('bson').ObjectId(id)},
            {"$set": {"taken": data["taken"]}}
        )
        return {"status": "success"}
    return {"status": "failed"}
