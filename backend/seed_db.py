import asyncio
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import bcrypt

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Clear existing data
    await db.users.delete_many({})
    await db.foods.delete_many({})
    
    # Create trainer user
    hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    trainer = {
        'id': 'trainer-001',
        'email': 'trainer@lontso.com',
        'name': 'Entrenador Demo',
        'password': hashed_password,
        'created_at': '2024-01-01T00:00:00Z'
    }
    await db.users.insert_one(trainer)
    print('✓ Usuario creado: trainer@lontso.com / admin123')
    
    # Create sample foods
    foods = [
        {'id': 'f1', 'name': 'Arroz blanco', 'kcal_per_100g': 130, 'protein_per_100g': 2.7, 'carbs_per_100g': 28, 'fats_per_100g': 0.3, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f2', 'name': 'Pechuga de pollo', 'kcal_per_100g': 165, 'protein_per_100g': 31, 'carbs_per_100g': 0, 'fats_per_100g': 3.6, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f3', 'name': 'Avena', 'kcal_per_100g': 389, 'protein_per_100g': 16.9, 'carbs_per_100g': 66.3, 'fats_per_100g': 6.9, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f4', 'name': 'Plátano', 'kcal_per_100g': 89, 'protein_per_100g': 1.1, 'carbs_per_100g': 22.8, 'fats_per_100g': 0.3, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f5', 'name': 'Huevos', 'kcal_per_100g': 155, 'protein_per_100g': 13, 'carbs_per_100g': 1.1, 'fats_per_100g': 11, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f6', 'name': 'Aceite de oliva', 'kcal_per_100g': 884, 'protein_per_100g': 0, 'carbs_per_100g': 0, 'fats_per_100g': 100, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f7', 'name': 'Brócoli', 'kcal_per_100g': 34, 'protein_per_100g': 2.8, 'carbs_per_100g': 7, 'fats_per_100g': 0.4, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f8', 'name': 'Pasta integral', 'kcal_per_100g': 348, 'protein_per_100g': 13, 'carbs_per_100g': 73, 'fats_per_100g': 1.5, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f9', 'name': 'Salmón', 'kcal_per_100g': 208, 'protein_per_100g': 20, 'carbs_per_100g': 0, 'fats_per_100g': 13, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f10', 'name': 'Yogur griego', 'kcal_per_100g': 97, 'protein_per_100g': 10, 'carbs_per_100g': 3.6, 'fats_per_100g': 5, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f11', 'name': 'Almendras', 'kcal_per_100g': 579, 'protein_per_100g': 21, 'carbs_per_100g': 21.6, 'fats_per_100g': 49.9, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f12', 'name': 'Batata', 'kcal_per_100g': 86, 'protein_per_100g': 1.6, 'carbs_per_100g': 20.1, 'fats_per_100g': 0.1, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f13', 'name': 'Atún en lata', 'kcal_per_100g': 116, 'protein_per_100g': 26, 'carbs_per_100g': 0, 'fats_per_100g': 0.8, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f14', 'name': 'Pan integral', 'kcal_per_100g': 247, 'protein_per_100g': 13, 'carbs_per_100g': 41, 'fats_per_100g': 3.4, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
        {'id': 'f15', 'name': 'Espinacas', 'kcal_per_100g': 23, 'protein_per_100g': 2.9, 'carbs_per_100g': 3.6, 'fats_per_100g': 0.4, 'created_by': 'trainer-001', 'created_at': '2024-01-01T00:00:00Z'},
    ]
    
    await db.foods.insert_many(foods)
    print(f'✓ {len(foods)} alimentos creados')
    
    client.close()
    print('\n✅ Base de datos inicializada correctamente')
    print('📧 Email: trainer@lontso.com')
    print('🔑 Contraseña: admin123')

if __name__ == '__main__':
    asyncio.run(seed_database())
