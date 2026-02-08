from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from fastapi.responses import StreamingResponse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(
    title="Lontso Fitness API",
    version="1.0.0",
    description="Backend de la aplicación Fitness Coach"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://macrobuilder.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trainer_id: str
    name: str
    age: int
    sex: str  # H or M
    weight: float  # kg
    height: float  # cm
    activity_level: str  # sedentaria, ligera, moderada, alta, muy_alta
    tmb: Optional[float] = None
    maintenance_kcal: Optional[float] = None
    target_kcal: Optional[float] = None
    protein_percentage: Optional[float] = 30.0
    carbs_percentage: Optional[float] = 40.0
    fats_percentage: Optional[float] = 30.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    age: int
    sex: str
    weight: float
    height: float
    activity_level: str
    protein_percentage: Optional[float] = 30.0
    carbs_percentage: Optional[float] = 40.0
    fats_percentage: Optional[float] = 30.0

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    activity_level: Optional[str] = None
    tmb: Optional[float] = None
    maintenance_kcal: Optional[float] = None
    target_kcal: Optional[float] = None
    protein_percentage: Optional[float] = None
    carbs_percentage: Optional[float] = None
    fats_percentage: Optional[float] = None

class Food(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    kcal_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fats_per_100g: float
    created_by: str  # trainer_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FoodCreate(BaseModel):
    name: str
    kcal_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fats_per_100g: float

class FoodItem(BaseModel):
    food_id: str
    food_name: str
    quantity_g: float
    kcal: float
    protein: float
    carbs: float
    fats: float

class Meal(BaseModel):
    meal_number: int
    meal_name: str
    foods: List[FoodItem]
    total_kcal: float
    total_protein: float
    total_carbs: float
    total_fats: float

class Diet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    trainer_id: str
    name: str
    meals: List[Meal]
    total_kcal: float
    total_protein: float
    total_carbs: float
    total_fats: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DietCreate(BaseModel):
    client_id: str
    name: str
    meals: List[Meal]

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

# ============ CALCULATION HELPERS ============

def calculate_tmb(sex: str, weight: float, height: float, age: int) -> float:
    """Calculate Basal Metabolic Rate using Harris-Benedict equation"""
    if sex.upper() == 'H':
        return 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age)
    else:  # M
        return 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age)

def calculate_maintenance_kcal(tmb: float, activity_level: str) -> float:
    """Calculate maintenance calories based on activity level"""
    activity_multipliers = {
        "sedentaria": 1.2,
        "ligera": 1.375,
        "moderada": 1.55,
        "alta": 1.725,
        "muy_alta": 1.9
    }
    return tmb * activity_multipliers.get(activity_level, 1.2)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(email=user_data.email, name=user_data.name)
    hashed_pw = hash_password(user_data.password)
    
    doc = user.model_dump()
    doc['password'] = hashed_pw
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ CLIENT ROUTES ============

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    # Calculate TMB and maintenance calories
    tmb = calculate_tmb(client_data.sex, client_data.weight, client_data.height, client_data.age)
    maintenance_kcal = calculate_maintenance_kcal(tmb, client_data.activity_level)
    
    client = Client(
        trainer_id=current_user.id,
        name=client_data.name,
        age=client_data.age,
        sex=client_data.sex,
        weight=client_data.weight,
        height=client_data.height,
        activity_level=client_data.activity_level,
        tmb=tmb,
        maintenance_kcal=maintenance_kcal,
        target_kcal=maintenance_kcal,
        protein_percentage=client_data.protein_percentage,
        carbs_percentage=client_data.carbs_percentage,
        fats_percentage=client_data.fats_percentage
    )
    
    doc = client.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.clients.insert_one(doc)
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({"trainer_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for client in clients:
        if isinstance(client.get('created_at'), str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
        if isinstance(client.get('updated_at'), str):
            client['updated_at'] = datetime.fromisoformat(client['updated_at'])
    
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "trainer_id": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if isinstance(client.get('created_at'), str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    if isinstance(client.get('updated_at'), str):
        client['updated_at'] = datetime.fromisoformat(client['updated_at'])
    
    return Client(**client)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientUpdate, current_user: User = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "trainer_id": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_data.model_dump(exclude_unset=True)
    
    # Recalculate if needed
    if any(k in update_data for k in ['weight', 'height', 'age', 'sex', 'activity_level']):
        age = update_data.get('age', client['age'])
        sex = update_data.get('sex', client['sex'])
        weight = update_data.get('weight', client['weight'])
        height = update_data.get('height', client['height'])
        activity = update_data.get('activity_level', client['activity_level'])
        
        if 'tmb' not in update_data:
            update_data['tmb'] = calculate_tmb(sex, weight, height, age)
        if 'maintenance_kcal' not in update_data:
            update_data['maintenance_kcal'] = calculate_maintenance_kcal(update_data['tmb'], activity)
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated_client.get('created_at'), str):
        updated_client['created_at'] = datetime.fromisoformat(updated_client['created_at'])
    if isinstance(updated_client.get('updated_at'), str):
        updated_client['updated_at'] = datetime.fromisoformat(updated_client['updated_at'])
    
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "trainer_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Also delete associated diets
    await db.diets.delete_many({"client_id": client_id})
    
    return {"message": "Client deleted successfully"}

# ============ FOOD ROUTES ============

@api_router.post("/foods", response_model=Food)
async def create_food(food_data: FoodCreate, current_user: User = Depends(get_current_user)):
    food = Food(
        name=food_data.name,
        kcal_per_100g=food_data.kcal_per_100g,
        protein_per_100g=food_data.protein_per_100g,
        carbs_per_100g=food_data.carbs_per_100g,
        fats_per_100g=food_data.fats_per_100g,
        created_by=current_user.id
    )
    
    doc = food.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.foods.insert_one(doc)
    return food

@api_router.get("/foods", response_model=List[Food])
async def get_foods(current_user: User = Depends(get_current_user)):
    foods = await db.foods.find({"created_by": current_user.id}, {"_id": 0}).to_list(10000)
    
    for food in foods:
        if isinstance(food.get('created_at'), str):
            food['created_at'] = datetime.fromisoformat(food['created_at'])
    
    return foods

@api_router.get("/foods/{food_id}", response_model=Food)
async def get_food(food_id: str, current_user: User = Depends(get_current_user)):
    food = await db.foods.find_one({"id": food_id, "created_by": current_user.id}, {"_id": 0})
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    
    if isinstance(food.get('created_at'), str):
        food['created_at'] = datetime.fromisoformat(food['created_at'])
    
    return Food(**food)

@api_router.put("/foods/{food_id}", response_model=Food)
async def update_food(food_id: str, food_data: FoodCreate, current_user: User = Depends(get_current_user)):
    food = await db.foods.find_one({"id": food_id, "created_by": current_user.id}, {"_id": 0})
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    
    update_data = food_data.model_dump()
    await db.foods.update_one({"id": food_id}, {"$set": update_data})
    
    updated_food = await db.foods.find_one({"id": food_id}, {"_id": 0})
    if isinstance(updated_food.get('created_at'), str):
        updated_food['created_at'] = datetime.fromisoformat(updated_food['created_at'])
    
    return Food(**updated_food)

@api_router.delete("/foods/{food_id}")
async def delete_food(food_id: str, current_user: User = Depends(get_current_user)):
    result = await db.foods.delete_one({"id": food_id, "created_by": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Food not found")
    return {"message": "Food deleted successfully"}

# ============ DIET ROUTES ============

@api_router.post("/diets", response_model=Diet)
async def create_diet(diet_data: DietCreate, current_user: User = Depends(get_current_user)):
    # Verify client belongs to trainer
    client = await db.clients.find_one({"id": diet_data.client_id, "trainer_id": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate totals
    total_kcal = sum(meal.total_kcal for meal in diet_data.meals)
    total_protein = sum(meal.total_protein for meal in diet_data.meals)
    total_carbs = sum(meal.total_carbs for meal in diet_data.meals)
    total_fats = sum(meal.total_fats for meal in diet_data.meals)
    
    diet = Diet(
        client_id=diet_data.client_id,
        trainer_id=current_user.id,
        name=diet_data.name,
        meals=diet_data.meals,
        total_kcal=total_kcal,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fats=total_fats
    )
    
    doc = diet.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.diets.insert_one(doc)
    return diet

@api_router.get("/diets", response_model=List[Diet])
async def get_diets(client_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"trainer_id": current_user.id}
    if client_id:
        query["client_id"] = client_id
    
    diets = await db.diets.find(query, {"_id": 0}).to_list(1000)
    
    for diet in diets:
        if isinstance(diet.get('created_at'), str):
            diet['created_at'] = datetime.fromisoformat(diet['created_at'])
        if isinstance(diet.get('updated_at'), str):
            diet['updated_at'] = datetime.fromisoformat(diet['updated_at'])
    
    return diets

@api_router.get("/diets/{diet_id}", response_model=Diet)
async def get_diet(diet_id: str, current_user: User = Depends(get_current_user)):
    diet = await db.diets.find_one({"id": diet_id, "trainer_id": current_user.id}, {"_id": 0})
    if not diet:
        raise HTTPException(status_code=404, detail="Diet not found")
    
    if isinstance(diet.get('created_at'), str):
        diet['created_at'] = datetime.fromisoformat(diet['created_at'])
    if isinstance(diet.get('updated_at'), str):
        diet['updated_at'] = datetime.fromisoformat(diet['updated_at'])
    
    return Diet(**diet)

@api_router.delete("/diets/{diet_id}")
async def delete_diet(diet_id: str, current_user: User = Depends(get_current_user)):
    result = await db.diets.delete_one({"id": diet_id, "trainer_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Diet not found")
    return {"message": "Diet deleted successfully"}

@api_router.put("/diets/{diet_id}", response_model=Diet)
async def update_diet(diet_id: str, diet_data: DietCreate, current_user: User = Depends(get_current_user)):
    # Verify diet exists and belongs to trainer
    existing_diet = await db.diets.find_one({"id": diet_id, "trainer_id": current_user.id}, {"_id": 0})
    if not existing_diet:
        raise HTTPException(status_code=404, detail="Diet not found")
    
    # Calculate totals
    total_kcal = sum(meal.total_kcal for meal in diet_data.meals)
    total_protein = sum(meal.total_protein for meal in diet_data.meals)
    total_carbs = sum(meal.total_carbs for meal in diet_data.meals)
    total_fats = sum(meal.total_fats for meal in diet_data.meals)
    
    update_data = {
        "name": diet_data.name,
        "meals": [meal.model_dump() for meal in diet_data.meals],
        "total_kcal": total_kcal,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fats": total_fats,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.diets.update_one({"id": diet_id}, {"$set": update_data})
    
    updated_diet = await db.diets.find_one({"id": diet_id}, {"_id": 0})
    if isinstance(updated_diet.get('created_at'), str):
        updated_diet['created_at'] = datetime.fromisoformat(updated_diet['created_at'])
    if isinstance(updated_diet.get('updated_at'), str):
        updated_diet['updated_at'] = datetime.fromisoformat(updated_diet['updated_at'])
    
    return Diet(**updated_diet)

# ============ PDF EXPORT ============

@api_router.get("/diets/{diet_id}/export")
async def export_diet_pdf(diet_id: str, current_user: User = Depends(get_current_user)):
    diet = await db.diets.find_one({"id": diet_id, "trainer_id": current_user.id}, {"_id": 0})
    if not diet:
        raise HTTPException(status_code=404, detail="Diet not found")
    
    client = await db.clients.find_one({"id": diet['client_id']}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.black,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Subtitle style
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=20,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    # Title
    title = Paragraph(f"DIETA {client['name'].upper()}", title_style)
    story.append(title)
    story.append(Spacer(1, 0.5*cm))
    
    # Process meals
    for meal in diet['meals']:
        # Meal header
        meal_title = Paragraph(f"{meal['meal_name']}", subtitle_style)
        story.append(meal_title)
        
        # Create table data
        table_data = [['Alimento', 'Cantidad (g)']]
        for food_item in meal['foods']:
            table_data.append([
                food_item['food_name'],
                f"{food_item['quantity_g']:.0f}"
            ])
        
        # Add totals row
        table_data.append([
            'TOTAL',
            f"Kcal: {meal['total_kcal']:.0f} | P: {meal['total_protein']:.1f}g | C: {meal['total_carbs']:.1f}g | G: {meal['total_fats']:.1f}g"
        ])
        
        # Create table
        table = Table(table_data, colWidths=[12*cm, 5*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.white),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.8*cm))
    
    # Add daily totals
    totals_title = Paragraph("TOTALES DIARIOS", subtitle_style)
    story.append(totals_title)
    
    totals_data = [
        ['Calorías', 'Proteínas', 'Carbohidratos', 'Grasas'],
        [
            f"{diet['total_kcal']:.0f} kcal",
            f"{diet['total_protein']:.1f}g",
            f"{diet['total_carbs']:.1f}g",
            f"{diet['total_fats']:.1f}g"
        ]
    ]
    
    totals_table = Table(totals_data, colWidths=[4.25*cm, 4.25*cm, 4.25*cm, 4.25*cm])
    totals_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(totals_table)
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dieta_{client['name'].replace(' ', '_')}.pdf"}
    )

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Lontso Fitness API"}

# Include router
app.include_router(api_router)



logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
