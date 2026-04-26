from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.str_schema()

class MedicationSchema(BaseModel):
    id: Optional[PyObjectId] = None
    name: str
    dosage: str
    time: str
    taken: bool = False
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Aspirin",
                "dosage": "1 Tablet (81mg)",
                "time": "8:00 AM",
                "taken": False
            }
        }
    )

class MealSchema(BaseModel):
    id: Optional[PyObjectId] = None
    mealName: str
    calories: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "mealName": "Oatmeal",
                "calories": "250",
            }
        }
    )
