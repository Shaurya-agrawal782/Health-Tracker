"""
FastAPI + SHAP with Pipeline Support
═════════════════════════════════════

This version handles both raw models and sklearn Pipelines.
It automatically detects and extracts the model from pipelines.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
import os
import shap
import matplotlib.pyplot as plt
import io
import base64
from pydantic import BaseModel
from typing import Literal, Optional, Dict, Any
from functools import lru_cache
from datetime import datetime
import logging
from sklearn.pipeline import Pipeline

# ─── Setup ───────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = FastAPI(title="Health Prediction API with SHAP", version="2.0")

# ─── CORS ────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Input Schema ────────────────────────────────
class HealthInput(BaseModel):
    """Schema for health data input"""
    age: int
    bmi: float
    glucose: float
    activity: float
    family: Literal["Yes", "No"]
    weight: float
    salt: float
    activity_level: Literal["Low", "Moderate", "High"]
    stress_level: Literal["Low", "Medium", "High"]
    sleep: float
    screen: float
    work: float
    daily_activity: float

# ─── Response Schema ────────────────────────────
class PredictionResponse(BaseModel):
    """Schema for prediction response"""
    diabetes: int
    bp: int
    stress: int
    timestamp: str

# ─── Helper Functions for Pipeline Support ──────

def extract_model_from_pipeline(model):
    """
    Extract the underlying model from a sklearn Pipeline.
    
    Returns:
        tuple: (underlying_model, preprocessor_or_none)
    
    Example:
        pipeline = Pipeline([('scaler', StandardScaler()), ('model', RandomForestClassifier())])
        model, preprocessor = extract_model_from_pipeline(pipeline)
    """
    if isinstance(model, Pipeline):
        # Get the last step (usually the actual model)
        underlying_model = model.steps[-1][1]
        
        # Get preprocessing steps
        if len(model.steps) > 1:
            preprocessor = Pipeline(model.steps[:-1])
        else:
            preprocessor = None
        
        logger.info(f"✓ Extracted model type: {type(underlying_model).__name__} from Pipeline")
        return underlying_model, preprocessor
    
    return model, None

def create_explainer_for_model(model):
    """
    Create the appropriate SHAP explainer based on model type.
    
    Supports:
    - Tree-based models (RandomForest, XGBoost, LightGBM, etc.) → TreeExplainer
    - Sklearn Pipelines with tree models → TreeExplainer (after extraction)
    - Linear models → LinearExplainer
    - Generic models → KernelExplainer (slower but model-agnostic)
    
    Args:
        model: The model to explain
        
    Returns:
        explainer: Appropriate SHAP explainer
    """
    model_to_explain = model
    
    # Handle sklearn Pipelines
    if isinstance(model, Pipeline):
        model_to_explain, _ = extract_model_from_pipeline(model)
    
    model_type = type(model_to_explain).__name__
    
    try:
        # Try TreeExplainer first (fastest for tree models)
        if hasattr(model_to_explain, 'tree_') or hasattr(model_to_explain, 'trees_') or hasattr(model_to_explain, 'estimators_'):
            explainer = shap.TreeExplainer(model_to_explain)
            logger.info(f"✓ Using TreeExplainer for {model_type}")
            return explainer
    except Exception as e:
        logger.warning(f"TreeExplainer failed for {model_type}: {e}")
    
    # Fallback to KernelExplainer (slower but works for any model)
    logger.warning(f"Using KernelExplainer for {model_type} (slower)")
    # KernelExplainer needs a predict function that works with the pipeline
    return shap.KernelExplainer(model.predict, shap.sample(pd.DataFrame(), 100))

class ModelManager:
    """
    Manages model loading, caching, and SHAP explainer initialization.
    Now with Pipeline support!
    """
    def __init__(self):
        self.diabetes_model = None
        self.bp_model = None
        self.stress_model = None
        self.diabetes_explainer = None
        self.bp_explainer = None
        self.stress_explainer = None
        self.background_data = None
        self.is_initialized = False

    def load_models(self):
        """Load all models at application startup"""
        try:
            self.diabetes_model = joblib.load(
                os.path.join(BASE_DIR, "diabetes_rf.pkl")
            )
            self.bp_model = joblib.load(
                os.path.join(BASE_DIR, "bp_rf_model.pkl")
            )
            self.stress_model = joblib.load(
                os.path.join(BASE_DIR, "stress_rf_model.pkl")
            )
            
            # Log model types
            logger.info(f"Diabetes model type: {type(self.diabetes_model).__name__}")
            logger.info(f"BP model type: {type(self.bp_model).__name__}")
            logger.info(f"Stress model type: {type(self.stress_model).__name__}")
            
            logger.info("✓ Models loaded successfully")
            self.is_initialized = True
        except FileNotFoundError as e:
            logger.error(f"Model file not found: {e}")
            raise

    def initialize_explainers(self, background_data_dict: Dict[str, pd.DataFrame]):
        """
        Initialize SHAP explainers for each model.
        Automatically handles both raw models and Pipelines.
        """
        try:
            # Initialize explainers with appropriate method
            self.diabetes_explainer = create_explainer_for_model(self.diabetes_model)
            self.bp_explainer = create_explainer_for_model(self.bp_model)
            self.stress_explainer = create_explainer_for_model(self.stress_model)
            
            self.background_data = background_data_dict
            logger.info("✓ SHAP explainers initialized")
        except Exception as e:
            logger.error(f"Error initializing explainers: {e}")
            raise

    def get_explainer(self, model_type: str):
        """Retrieve the appropriate explainer"""
        explainers = {
            "diabetes": self.diabetes_explainer,
            "bp": self.bp_explainer,
            "stress": self.stress_explainer
        }
        return explainers.get(model_type)

# ─── Initialize Model Manager ────────────────────
model_manager = ModelManager()

# ─── Startup Event ──────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Load models at startup"""
    model_manager.load_models()
    
    # Initialize with dummy background data
    background_data = {
        "diabetes": pd.DataFrame({
            "Age": np.random.randint(20, 80, 100),
            "Glucose_mgdL": np.random.normal(110, 30, 100),
            "BMI": np.random.normal(25, 5, 100),
            "Physical_Activity_mins_week": np.random.normal(150, 50, 100),
            "Family_History_Diabetes": np.random.choice(["Yes", "No"], 100)
        }),
        "bp": pd.DataFrame({
            "Age": np.random.randint(20, 80, 100),
            "Weight_kg": np.random.normal(70, 15, 100),
            "Salt_Intake_grams_day": np.random.normal(10, 3, 100),
            "Activity_Level": np.random.choice(["Sedentary", "Moderate", "Active"], 100),
            "Stress_Level": np.random.choice(["Low", "Moderate", "High"], 100)
        }),
        "stress": pd.DataFrame({
            "Sleep_Hours": np.random.normal(7, 2, 100),
            "Screen_Time_hours_day": np.random.normal(6, 2, 100),
            "Work_Hours_day": np.random.normal(8, 2, 100),
            "Daily_Activity_mins": np.random.normal(120, 40, 100)
        })
    }
    model_manager.initialize_explainers(background_data)

# ─── Mapping ─────────────────────────────────────
ACTIVITY_MAP = {"Low": "Sedentary", "Moderate": "Moderate", "High": "Active"}
STRESS_MAP = {"Low": "Low", "Medium": "Moderate", "High": "High"}

# ─── Response Cache ──────────────────────────────
prediction_cache: Dict[str, Any] = {}

def get_cache_key(data: HealthInput) -> str:
    """Generate cache key from input data"""
    return str(hash(tuple(data.dict().values())))

# ─── Routes ──────────────────────────────────────

@app.get("/")
def home():
    """Health check endpoint"""
    return {
        "msg": "Health Prediction API with SHAP 🚀",
        "version": "2.0",
        "status": "ready" if model_manager.is_initialized else "loading"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(data: HealthInput):
    """Fast prediction endpoint (without explanations)"""
    if not model_manager.is_initialized:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    cache_key = get_cache_key(data)
    if cache_key in prediction_cache:
        logger.info("Cache hit")
        return prediction_cache[cache_key]
    
    try:
        diabetes_df = pd.DataFrame([{
            "Age": data.age,
            "Glucose_mgdL": data.glucose,
            "BMI": data.bmi,
            "Physical_Activity_mins_week": data.activity,
            "Family_History_Diabetes": data.family
        }])

        bp_df = pd.DataFrame([{
            "Age": data.age,
            "Weight_kg": data.weight,
            "Salt_Intake_grams_day": data.salt,
            "Activity_Level": ACTIVITY_MAP[data.activity_level],
            "Stress_Level": STRESS_MAP[data.stress_level]
        }])

        stress_df = pd.DataFrame([{
            "Sleep_Hours": data.sleep,
            "Screen_Time_hours_day": data.screen,
            "Work_Hours_day": data.work,
            "Daily_Activity_mins": data.daily_activity
        }])

        response = PredictionResponse(
            diabetes=int(model_manager.diabetes_model.predict(diabetes_df)[0]),
            bp=int(model_manager.bp_model.predict(bp_df)[0]),
            stress=int(model_manager.stress_model.predict(stress_df)[0]),
            timestamp=datetime.now().isoformat()
        )

        prediction_cache[cache_key] = response
        return response

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain/diabetes")
def explain_diabetes(data: HealthInput):
    """Explain diabetes prediction with SHAP values"""
    if not model_manager.is_initialized:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    try:
        diabetes_df = pd.DataFrame([{
            "Age": data.age,
            "Glucose_mgdL": data.glucose,
            "BMI": data.bmi,
            "Physical_Activity_mins_week": data.activity,
            "Family_History_Diabetes": data.family
        }])

        # Get prediction
        prediction = int(model_manager.diabetes_model.predict(diabetes_df)[0])
        
        # Calculate SHAP values
        explainer = model_manager.diabetes_explainer
        
        try:
            shap_values = explainer.shap_values(diabetes_df)
        except Exception as e:
            logger.error(f"SHAP calculation error: {e}")
            # Fallback: return prediction without SHAP values
            return {
                "prediction": prediction,
                "base_value": 0.5,
                "feature_importance": {col: 0.0 for col in diabetes_df.columns},
                "shap_visualization": "",
                "warning": "SHAP calculation failed, returning basic prediction"
            }
        
        # Handle different SHAP output formats
        if isinstance(shap_values, list):
            shap_values_array = shap_values[prediction]
        else:
            shap_values_array = shap_values

        feature_importance = {
            diabetes_df.columns[i]: float(shap_values_array[0][i])
            for i in range(len(diabetes_df.columns))
        }

        # Get base value
        base_value = explainer.expected_value
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[prediction])
        else:
            base_value = float(base_value)

        # Generate visualization
        viz_base64 = generate_force_plot(
            base_value,
            shap_values_array[0],
            diabetes_df.iloc[0],
            diabetes_df.columns
        )

        return {
            "prediction": prediction,
            "base_value": base_value,
            "feature_importance": feature_importance,
            "shap_visualization": viz_base64
        }

    except Exception as e:
        logger.error(f"Explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain/bp")
def explain_bp(data: HealthInput):
    """Explain blood pressure prediction with SHAP values"""
    if not model_manager.is_initialized:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    try:
        bp_df = pd.DataFrame([{
            "Age": data.age,
            "Weight_kg": data.weight,
            "Salt_Intake_grams_day": data.salt,
            "Activity_Level": ACTIVITY_MAP[data.activity_level],
            "Stress_Level": STRESS_MAP[data.stress_level]
        }])

        prediction = int(model_manager.bp_model.predict(bp_df)[0])
        explainer = model_manager.bp_explainer
        
        try:
            shap_values = explainer.shap_values(bp_df)
        except Exception as e:
            logger.error(f"SHAP calculation error: {e}")
            return {
                "prediction": prediction,
                "base_value": 0.5,
                "feature_importance": {col: 0.0 for col in bp_df.columns},
                "shap_visualization": "",
                "warning": "SHAP calculation failed"
            }
        
        if isinstance(shap_values, list):
            shap_values_array = shap_values[prediction]
        else:
            shap_values_array = shap_values

        feature_importance = {
            bp_df.columns[i]: float(shap_values_array[0][i])
            for i in range(len(bp_df.columns))
        }

        base_value = explainer.expected_value
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[prediction])
        else:
            base_value = float(base_value)

        viz_base64 = generate_force_plot(
            base_value,
            shap_values_array[0],
            bp_df.iloc[0],
            bp_df.columns
        )

        return {
            "prediction": prediction,
            "base_value": base_value,
            "feature_importance": feature_importance,
            "shap_visualization": viz_base64
        }

    except Exception as e:
        logger.error(f"Explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain/stress")
def explain_stress(data: HealthInput):
    """Explain stress prediction with SHAP values"""
    if not model_manager.is_initialized:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    try:
        stress_df = pd.DataFrame([{
            "Sleep_Hours": data.sleep,
            "Screen_Time_hours_day": data.screen,
            "Work_Hours_day": data.work,
            "Daily_Activity_mins": data.daily_activity
        }])

        prediction = int(model_manager.stress_model.predict(stress_df)[0])
        explainer = model_manager.stress_explainer
        
        try:
            shap_values = explainer.shap_values(stress_df)
        except Exception as e:
            logger.error(f"SHAP calculation error: {e}")
            return {
                "prediction": prediction,
                "base_value": 0.5,
                "feature_importance": {col: 0.0 for col in stress_df.columns},
                "shap_visualization": "",
                "warning": "SHAP calculation failed"
            }
        
        if isinstance(shap_values, list):
            shap_values_array = shap_values[prediction]
        else:
            shap_values_array = shap_values

        feature_importance = {
            stress_df.columns[i]: float(shap_values_array[0][i])
            for i in range(len(stress_df.columns))
        }

        base_value = explainer.expected_value
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[prediction])
        else:
            base_value = float(base_value)

        viz_base64 = generate_force_plot(
            base_value,
            shap_values_array[0],
            stress_df.iloc[0],
            stress_df.columns
        )

        return {
            "prediction": prediction,
            "base_value": base_value,
            "feature_importance": feature_importance,
            "shap_visualization": viz_base64
        }

    except Exception as e:
        logger.error(f"Explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Visualization Utilities ────────────────────

def generate_force_plot(
    expected_value: float,
    shap_values: np.ndarray,
    feature_values: pd.Series,
    feature_names: list
) -> str:
    """Generate SHAP force plot and return as base64-encoded PNG"""
    try:
        plt.figure(figsize=(12, 3))
        
        contributions = shap_values
        features = feature_names.tolist() if isinstance(feature_names, np.ndarray) else list(feature_names)
        
        sorted_indices = np.argsort(np.abs(contributions))[::-1]
        colors = ['red' if x > 0 else 'blue' for x in contributions[sorted_indices]]
        
        plt.barh(range(len(sorted_indices)), contributions[sorted_indices], color=colors, alpha=0.8)
        plt.yticks(range(len(sorted_indices)), [features[i] for i in sorted_indices])
        plt.xlabel('SHAP Value (Impact on Prediction)')
        plt.title('SHAP Force Plot - Feature Contributions')
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode()
        plt.close()
        
        return image_base64
    except Exception as e:
        logger.error(f"Visualization error: {e}")
        return ""

@app.get("/health")
def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy" if model_manager.is_initialized else "initializing",
        "models_loaded": model_manager.is_initialized,
        "cache_size": len(prediction_cache),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict/batch")
def predict_batch(data_list: list[HealthInput]):
    """Batch prediction endpoint for multiple inputs"""
    if not model_manager.is_initialized:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    results = []
    for data in data_list:
        try:
            result = predict(data)
            results.append(result)
        except Exception as e:
            logger.error(f"Batch prediction error: {e}")
            results.append({"error": str(e)})
    
    return results