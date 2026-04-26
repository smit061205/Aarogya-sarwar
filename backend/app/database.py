import motor.motor_asyncio
import os

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
database = client.aarogya_sarwar

# Collections
medications_collection = database.get_collection("medications")
meals_collection = database.get_collection("meals")
