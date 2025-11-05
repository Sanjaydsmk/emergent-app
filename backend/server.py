from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 24  # hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ===== Models =====

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str  # "Admin" or "Staff"
    dept_id: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    dept_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    role: str
    dept_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    dept_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dept_name: str
    budget: float
    head_name: str

class DepartmentCreate(BaseModel):
    dept_name: str
    budget: float
    head_name: str

class Item(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    category: str
    quantity: int
    cost: float
    dept_id: str

class ItemCreate(BaseModel):
    item_name: str
    category: str
    quantity: int
    cost: float
    dept_id: str

class Supplier(BaseModel):
    model_config = ConfigDict(extra="ignore")
    supplier_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_name: str
    contact: str
    email: str

class SupplierCreate(BaseModel):
    supplier_name: str
    contact: str
    email: str

class Purchase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    purchase_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    supplier_id: str
    quantity: int
    date: str
    total_cost: float

class PurchaseCreate(BaseModel):
    item_id: str
    supplier_id: str
    quantity: int

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# ===== Helper Functions =====

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===== Authentication Routes =====

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user['user_id'], user['username'], user['role'])
    user_response = UserResponse(
        user_id=user['user_id'],
        username=user['username'],
        role=user['role'],
        dept_id=user.get('dept_id')
    )
    return TokenResponse(access_token=token, token_type="Bearer", user=user_response)

@api_router.post("/auth/change-password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not user or not verify_password(data.current_password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"user_id": current_user['user_id']},
        {"$set": {"password_hash": new_hash}}
    )
    return {"message": "Password changed successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

# ===== Department Routes =====

@api_router.get("/departments", response_model=List[Department])
async def get_departments(current_user: dict = Depends(get_current_user)):
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    return departments

@api_router.post("/departments", response_model=Department)
async def create_department(dept: DepartmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    dept_obj = Department(**dept.model_dump())
    await db.departments.insert_one(dept_obj.model_dump())
    return dept_obj

@api_router.put("/departments/{dept_id}", response_model=Department)
async def update_department(dept_id: str, dept: DepartmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.departments.update_one(
        {"dept_id": dept_id},
        {"$set": dept.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    
    updated = await db.departments.find_one({"dept_id": dept_id}, {"_id": 0})
    return Department(**updated)

@api_router.delete("/departments/{dept_id}")
async def delete_department(dept_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.departments.delete_one({"dept_id": dept_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}

# ===== Item Routes =====

@api_router.get("/items", response_model=List[Item])
async def get_items(current_user: dict = Depends(get_current_user)):
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/items", response_model=Item)
async def create_item(item: ItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    item_obj = Item(**item.model_dump())
    await db.items.insert_one(item_obj.model_dump())
    return item_obj

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, item: ItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.items.update_one(
        {"item_id": item_id},
        {"$set": item.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    return Item(**updated)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.items.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

# ===== Supplier Routes =====

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(1000)
    return suppliers

@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    supplier_obj = Supplier(**supplier.model_dump())
    await db.suppliers.insert_one(supplier_obj.model_dump())
    return supplier_obj

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.suppliers.update_one(
        {"supplier_id": supplier_id},
        {"$set": supplier.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    updated = await db.suppliers.find_one({"supplier_id": supplier_id}, {"_id": 0})
    return Supplier(**updated)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.suppliers.delete_one({"supplier_id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

# ===== Purchase Routes =====

@api_router.get("/purchases", response_model=List[Purchase])
async def get_purchases(current_user: dict = Depends(get_current_user)):
    purchases = await db.purchases.find({}, {"_id": 0}).to_list(1000)
    return purchases

@api_router.post("/purchases", response_model=Purchase)
async def create_purchase(purchase: PurchaseCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get item details
    item = await db.items.find_one({"item_id": purchase.item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Calculate total cost
    total_cost = item['cost'] * purchase.quantity
    
    # Create purchase record
    purchase_obj = Purchase(
        item_id=purchase.item_id,
        supplier_id=purchase.supplier_id,
        quantity=purchase.quantity,
        date=datetime.now(timezone.utc).isoformat(),
        total_cost=total_cost
    )
    await db.purchases.insert_one(purchase_obj.model_dump())
    
    # Update item quantity
    await db.items.update_one(
        {"item_id": purchase.item_id},
        {"$inc": {"quantity": purchase.quantity}}
    )
    
    return purchase_obj

# ===== Reports Routes =====

@api_router.get("/reports/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_items = await db.items.count_documents({})
    total_departments = await db.departments.count_documents({})
    total_suppliers = await db.suppliers.count_documents({})
    
    # Calculate total budget
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    total_budget = sum(d['budget'] for d in departments)
    
    # Calculate total spending
    purchases = await db.purchases.find({}, {"_id": 0}).to_list(1000)
    total_spending = sum(p['total_cost'] for p in purchases)
    
    # Low stock items (quantity < 10)
    low_stock = await db.items.find({"quantity": {"$lt": 10}}, {"_id": 0}).to_list(100)
    
    return {
        "total_items": total_items,
        "total_departments": total_departments,
        "total_suppliers": total_suppliers,
        "total_budget": total_budget,
        "total_spending": total_spending,
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock
    }

@api_router.get("/reports/department-spending")
async def get_department_spending(current_user: dict = Depends(get_current_user)):
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    purchases = await db.purchases.find({}, {"_id": 0}).to_list(1000)
    
    # Create item_id to dept_id mapping
    item_dept_map = {item['item_id']: item['dept_id'] for item in items}
    
    # Calculate spending per department
    dept_spending = {}
    for purchase in purchases:
        dept_id = item_dept_map.get(purchase['item_id'])
        if dept_id:
            dept_spending[dept_id] = dept_spending.get(dept_id, 0) + purchase['total_cost']
    
    # Build result with department names
    result = []
    for dept in departments:
        result.append({
            "dept_id": dept['dept_id'],
            "dept_name": dept['dept_name'],
            "budget": dept['budget'],
            "spending": dept_spending.get(dept['dept_id'], 0)
        })
    
    return result

@api_router.get("/reports/monthly-purchases")
async def get_monthly_purchases(current_user: dict = Depends(get_current_user)):
    purchases = await db.purchases.find({}, {"_id": 0}).to_list(1000)
    
    # Group by month
    monthly_data = {}
    for purchase in purchases:
        try:
            date = datetime.fromisoformat(purchase['date'])
            month_key = date.strftime("%Y-%m")
            monthly_data[month_key] = monthly_data.get(month_key, 0) + purchase['total_cost']
        except:
            continue
    
    # Sort by month
    sorted_months = sorted(monthly_data.keys())
    result = [{"month": month, "spending": monthly_data[month]} for month in sorted_months]
    
    return result

# ===== Seed Data Route =====

@api_router.post("/seed")
async def seed_data():
    # Clear existing data
    await db.users.delete_many({})
    await db.departments.delete_many({})
    await db.items.delete_many({})
    await db.suppliers.delete_many({})
    await db.purchases.delete_many({})
    
    # Create admin user
    admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role="Admin"
    )
    await db.users.insert_one(admin.model_dump())
    
    # Create departments
    dept1 = Department(dept_name="IT Department", budget=50000, head_name="John Smith")
    dept2 = Department(dept_name="HR Department", budget=30000, head_name="Sarah Johnson")
    dept3 = Department(dept_name="Finance Department", budget=40000, head_name="Michael Brown")
    
    await db.departments.insert_many([dept1.model_dump(), dept2.model_dump(), dept3.model_dump()])
    
    # Create items
    items = [
        Item(item_name="Laptop", category="Electronics", quantity=15, cost=1200, dept_id=dept1.dept_id),
        Item(item_name="Monitor", category="Electronics", quantity=8, cost=300, dept_id=dept1.dept_id),
        Item(item_name="Keyboard", category="Electronics", quantity=5, cost=50, dept_id=dept1.dept_id),
        Item(item_name="Office Chair", category="Furniture", quantity=20, cost=250, dept_id=dept2.dept_id),
        Item(item_name="Desk", category="Furniture", quantity=12, cost=400, dept_id=dept2.dept_id),
        Item(item_name="Calculator", category="Office Supplies", quantity=7, cost=30, dept_id=dept3.dept_id),
        Item(item_name="Printer", category="Electronics", quantity=4, cost=500, dept_id=dept3.dept_id),
    ]
    await db.items.insert_many([item.model_dump() for item in items])
    
    # Create suppliers
    suppliers = [
        Supplier(supplier_name="Tech Solutions Inc", contact="555-0101", email="sales@techsolutions.com"),
        Supplier(supplier_name="Office Depot", contact="555-0102", email="orders@officedepot.com"),
        Supplier(supplier_name="Furniture World", contact="555-0103", email="contact@furnitureworld.com"),
    ]
    await db.suppliers.insert_many([supplier.model_dump() for supplier in suppliers])
    
    # Create sample purchases
    purchases = [
        Purchase(
            item_id=items[0].item_id,
            supplier_id=suppliers[0].supplier_id,
            quantity=5,
            date=(datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
            total_cost=6000
        ),
        Purchase(
            item_id=items[3].item_id,
            supplier_id=suppliers[2].supplier_id,
            quantity=10,
            date=(datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            total_cost=2500
        ),
    ]
    await db.purchases.insert_many([purchase.model_dump() for purchase in purchases])
    
    return {"message": "Database seeded successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()