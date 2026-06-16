"""
Product CRUD Schemas
====================
Request/response models for product management endpoints.
"""

from typing import Optional, List, Any
from pydantic import BaseModel, Field, AliasChoices, model_validator


class ProductCreate(BaseModel):
    """POST /products"""
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="Electronics", max_length=100)
    brand: str = Field(default="Generic", max_length=100)
    status: str = Field(default="Active", max_length=50)
    cost_price: float = Field(default=0.0, ge=0, validation_alias=AliasChoices("cost", "cost_price", "costPrice"))
    retail_price: float = Field(default=0.0, ge=0, validation_alias=AliasChoices("price", "retail_price", "retailPrice"))
    tax: float = Field(default=0.0, ge=0)
    discount: float = Field(default=0.0, ge=0)
    stock_quantity: int = Field(default=0, ge=0, validation_alias=AliasChoices("stock", "stock_quantity", "stockQuantity"))
    safety_stock: int = Field(default=5, ge=0, validation_alias=AliasChoices("safetyStock", "safety_stock"))
    warehouse: str = Field(default="Chicago", max_length=100)
    platforms: Optional[List[str]] = Field(default=None)
    description: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = Field(default=None, validation_alias=AliasChoices("image", "image_url", "imageUrl"))

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fields_to_clean = ["description", "notes", "image_url", "image", "imageUrl"]
            for f in fields_to_clean:
                if f in data and data[f] == "":
                    data[f] = None
        return data


class ProductUpdate(BaseModel):
    """PUT /products/{id}"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)
    brand: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = Field(default=None, max_length=50)
    cost_price: Optional[float] = Field(default=None, ge=0, validation_alias=AliasChoices("cost", "cost_price", "costPrice"))
    retail_price: Optional[float] = Field(default=None, ge=0, validation_alias=AliasChoices("price", "retail_price", "retailPrice"))
    tax: Optional[float] = Field(default=None, ge=0)
    discount: Optional[float] = Field(default=None, ge=0)
    stock_quantity: Optional[int] = Field(default=None, ge=0, validation_alias=AliasChoices("stock", "stock_quantity", "stockQuantity"))
    safety_stock: Optional[int] = Field(default=None, ge=0, validation_alias=AliasChoices("safetyStock", "safety_stock"))
    warehouse: Optional[str] = Field(default=None, max_length=100)
    platforms: Optional[List[str]] = Field(default=None)
    description: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = Field(default=None, validation_alias=AliasChoices("image", "image_url", "imageUrl"))

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fields_to_clean = ["description", "notes", "image_url", "image", "imageUrl"]
            for f in fields_to_clean:
                if f in data and data[f] == "":
                    data[f] = None
        return data
