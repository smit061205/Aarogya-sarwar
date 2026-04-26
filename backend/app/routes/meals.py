from fastapi import APIRouter, Body
from fastapi.encoders import jsonable_encoder
from app.database import meals_collection
from app.models.schema import MealSchema

router = APIRouter()

def meal_helper(meal) -> dict:
    return {
        "id": str(meal["_id"]),
        "mealName": meal["mealName"],
        "calories": meal.get("calories"),
        "timestamp": meal.get("timestamp")
    }

@router.get("/")
async def get_meals():
    meals = []
    async for meal in meals_collection.find():
        meals.append(meal_helper(meal))
    return meals

@router.post("/")
async def add_meal(meal: MealSchema = Body(...)):
    meal_dict = jsonable_encoder(meal)
    del meal_dict["id"]
    new_meal = await meals_collection.insert_one(meal_dict)
    created_meal = await meals_collection.find_one({"_id": new_meal.inserted_id})
    return meal_helper(created_meal)
