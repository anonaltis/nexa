
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "nexa_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        try:
            self.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
            self.db = self.client[DB_NAME]
            print(f"Connected to MongoDB at {MONGODB_URL}")
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            self.db = None

    def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

db = Database()
