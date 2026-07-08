import fitz
import json
import os
import glob
from PIL import Image

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF_DIR = os.environ.get("HAICUOTU_PDF_DIR", os.path.join(WORKSPACE_DIR, "raw-pdfs"))
PUBLIC_IMG_DIR = os.path.join(WORKSPACE_DIR, "public/images")

# Find PDF files and sort them alphabetically
# This gives the same alphabetical ordering: Vol 1 (第一册), Vol 2 (第三册), Vol 3 (第二册), Vol 4 (第四册)
pdf_files = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))

print(f"Found {len(pdf_files)} PDF files to extract pages from:")
for idx, f in enumerate(pdf_files):
    print(f"  Index {idx+1}: {os.path.basename(f)}")

def extract_volume_pages(vol_idx, pdf_path):
    vol_num = vol_idx + 1
    json_path = f"src/data/vol{vol_num}.json"
    if not os.path.exists(json_path):
        print(f"  [ERROR] Database file {json_path} does not exist. Run curate script first.")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        database = json.load(f)
        
    print(f"\nProcessing Volume {vol_num} PDF: {os.path.basename(pdf_path)}")
    doc = fitz.open(pdf_path)
    print(f"  PDF has {len(doc)} pages.")
    
    vol_img_dir = os.path.join(PUBLIC_IMG_DIR, f"vol{vol_num}")
    os.makedirs(vol_img_dir, exist_ok=True)
    
    extracted_count = 0
    for creature in database["creatures"]:
        p_idx = creature["page_idx"]
        if p_idx >= len(doc):
            print(f"    [WARNING] Page index {p_idx} out of range for PDF (length {len(doc)}).")
            continue
            
        output_name = f"page_{p_idx}.webp"
        output_path = os.path.join(vol_img_dir, output_name)
        
        # Render high-resolution page
        try:
            page = doc[p_idx]
            # Use 2.0x scale matrix for high resolution (equivalent to ~150-200 DPI)
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image and save as WebP
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img.save(output_path, "WEBP", quality=80)
            extracted_count += 1
        except Exception as e:
            print(f"    [ERROR] Failed to extract page {p_idx}: {e}")
            
    print(f"  [SUCCESS] Extracted {extracted_count} full-page WebP illustrations to {vol_img_dir}.")

if __name__ == "__main__":
    print("=== Starting Full Page High-Resolution Extraction Pipeline ===")
    for idx, pdf_path in enumerate(pdf_files):
        extract_volume_pages(idx, pdf_path)
    print("\n=== Full Page Extraction Finished! ===")
