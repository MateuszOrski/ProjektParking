import cv2
import numpy as np
import traceback
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fast_alpr import ALPR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
alpr = None

try:
    logger.info("Rozpoczynam ładowanie modelu...")
    alpr = ALPR(
        detector_model="yolo-v9-t-384-license-plate-end2end",
        ocr_model="global-plates-mobile-vit-v2-model" 
    )
    logger.info("Model załadowany poprawnie.")
except Exception as e:
    logger.error(f"KRYTYCZNY BŁĄD PODCZAS ŁADOWANIA MODELU: {e}")
    traceback.print_exc()

@app.post("/predict")
async def predict_license_plate(file: UploadFile = File(...)):
    global alpr
    if alpr is None:
        raise HTTPException(status_code=500, detail="Model nie został załadowany.")

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Nieprawidłowy plik obrazu.")

        logger.info("Rozpoczynam detekcję...")
        results = alpr.predict(img)
        logger.info(f"Znaleziono {len(results)} tablic.")

        formatted_results = []
        for result in results:
            
            if hasattr(result.detection, 'bounding_box'):
                box = result.detection.bounding_box
            elif hasattr(result.detection, 'box'):
                box = result.detection.box
            elif hasattr(result.detection, 'xyxy'):
                box = result.detection.xyxy
            else:
                box = [] 

            if hasattr(box, 'tolist'):
                box = box.tolist()

            formatted_results.append({
                "plate": result.ocr.text,
                "confidence": result.ocr.confidence,
                "box": box 
            })
            
        return {"results": formatted_results}

    except Exception as e:
        logger.error(f"BŁĄD PODCZAS PRZETWARZANIA: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))