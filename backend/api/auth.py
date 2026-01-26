
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from models import UserCreate, Token, User, UserInDB
from auth_utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from db import db

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    # Check if user already exists
    existing_user = await db.db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    
    new_user = await db.db.users.insert_one(user_in_db.dict(by_alias=True))
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = await db.db.users.find_one({"email": form_data.username})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user_dict["hashed_password"]):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_dict["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/demo", response_model=Token)
async def demo_login():
    demo_email = "demo@example.com"
    demo_user = await db.db.users.find_one({"email": demo_email})
    
    if not demo_user:
        hashed_password = get_password_hash("demo1234")
        user_in_db = {
            "email": demo_email,
            "name": "Demo User",
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow()
        }
        await db.db.users.insert_one(user_in_db)
        
        # Seed some demo projects
        demo_projects = [
            {
                "name": "Smart Temperature Monitor",
                "description": "An IoT device that monitors temperature and humidity and displays it on an OLED screen.",
                "category": "iot",
                "status": "completed",
                "tags": ["esp32", "dht22", "oled"],
                "user_id": demo_email,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "name": "Motor Controller",
                "description": "PWM-based motor speed controller for a small robot chassis.",
                "category": "robotics",
                "status": "building",
                "tags": ["arduino", "l298n"],
                "user_id": demo_email,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        await db.db.projects.insert_many(demo_projects)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": demo_email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
