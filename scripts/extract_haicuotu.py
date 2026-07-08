import os
import sys
import json
import subprocess
import glob
from PIL import Image

# Setup paths
WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF_DIR = os.environ.get("HAICUOTU_PDF_DIR", os.path.join(WORKSPACE_DIR, "raw-pdfs"))
RAW_OUT_DIR = os.path.join(WORKSPACE_DIR, "extracted_raw")
DATA_OUT_DIR = os.path.join(WORKSPACE_DIR, "src/data")
PUBLIC_IMG_DIR = os.path.join(WORKSPACE_DIR, "public/images")
VENV_BIN = os.path.join(WORKSPACE_DIR, ".venv/bin/magic-pdf")

# Create directories
os.makedirs(RAW_OUT_DIR, exist_ok=True)
os.makedirs(DATA_OUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_IMG_DIR, exist_ok=True)

# Find all 4 volumes
pdf_files = glob.glob(os.path.join(PDF_DIR, "*.pdf"))
pdf_files = sorted(pdf_files)

print(f"Found {len(pdf_files)} PDF files in {PDF_DIR}:")
for i, f in enumerate(pdf_files):
    print(f"  Vol {i+1}: {os.path.basename(f)}")

def run_extraction(pdf_path, output_dir):
    """Run magic-pdf extraction on the PDF file."""
    vol_name = os.path.basename(pdf_path).replace(".pdf", "")
    vol_raw_dir = os.path.join(output_dir, vol_name)
    
    # Check if content_list.json already exists to avoid redundant heavy OCR runs
    check_glob = glob.glob(os.path.join(vol_raw_dir, "**", "*_content_list.json"), recursive=True)
    if check_glob:
        print(f"  [SKIPPED] {vol_name} already extracted.")
        return os.path.dirname(check_glob[0])
        
    print(f"  [RUNNING] Extracting {vol_name} using magic-pdf OCR... This will take a few minutes.")
    cmd = [
        VENV_BIN,
        "-p", pdf_path,
        "-o", vol_raw_dir,
        "-m", "ocr"
    ]
    
    try:
        # Run subprocess and capture output
        res = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"  [SUCCESS] Extracted {vol_name}.")
    except subprocess.CalledProcessError as e:
        print(f"  [ERROR] Failed to extract {vol_name}: {e.stderr}")
        raise e
        
    ocr_dirs = glob.glob(os.path.join(vol_raw_dir, "**", "ocr"), recursive=True)
    if ocr_dirs:
        return ocr_dirs[0]
    return None

def process_extracted_volume(vol_idx, ocr_dir):
    """Process raw OCR output, convert images to WebP, and structure the text."""
    vol_num = vol_idx + 1
    print(f"\nProcessing Volume {vol_num} data in {ocr_dir}...")
    
    # Find files
    content_list_files = glob.glob(os.path.join(ocr_dir, "*_content_list.json"))
    if not content_list_files:
        print(f"  [ERROR] No content list found in {ocr_dir}")
        return
        
    content_list_path = content_list_files[0]
    with open(content_list_path, "r", encoding="utf-8") as f:
        content_list = json.load(f)
        
    # Group content by page index
    pages_data = {}
    for item in content_list:
        p_idx = item.get("page_idx")
        if p_idx not in pages_data:
            pages_data[p_idx] = {"images": [], "texts": []}
            
        if item.get("type") == "image" and item.get("img_path"):
            pages_data[p_idx]["images"].append(item.get("img_path"))
        elif item.get("type") == "text" and item.get("text"):
            pages_data[p_idx]["texts"].append(item.get("text").strip())
            
    # Structuring entries (creatures)
    entries = []
    preface_texts = []
    
    # Sort pages
    sorted_pages = sorted(pages_data.keys())
    
    # Heuristic grouping
    current_entry = None
    
    for p_idx in sorted_pages:
        data = pages_data[p_idx]
        has_images = len(data["images"]) > 0
        has_texts = len(data["texts"]) > 0
        
        if has_images:
            # We found an image! If we were building an entry, save it
            if current_entry:
                entries.append(current_entry)
                
            # Convert the first image on the page to WebP
            raw_img_rel = data["images"][0]
            raw_img_path = os.path.join(ocr_dir, raw_img_rel)
            
            # Destination path
            vol_img_dir = os.path.join(PUBLIC_IMG_DIR, f"vol{vol_num}")
            os.makedirs(vol_img_dir, exist_ok=True)
            webp_name = f"page_{p_idx}.webp"
            webp_path = os.path.join(vol_img_dir, webp_name)
            
            # Perform conversion
            try:
                if os.path.exists(raw_img_path):
                    with Image.open(raw_img_path) as img:
                        # Convert to RGB if needed (JPEG is RGB, PNG could be RGBA)
                        if img.mode in ('RGBA', 'LA'):
                            background = Image.new('RGB', img.size, (255, 255, 255))
                            background.paste(img, mask=img.split()[3])
                            img = background
                        img.save(webp_path, "WEBP", quality=80)
                    img_web_url = f"/images/vol{vol_num}/{webp_name}"
                else:
                    print(f"    [WARNING] Image file {raw_img_path} not found.")
                    img_web_url = None
            except Exception as e:
                print(f"    [ERROR] Image conversion failed for {raw_img_path}: {e}")
                img_web_url = None
                
            # Start new entry
            current_entry = {
                "id": f"vol{vol_num}_{p_idx}",
                "name": "",
                "image": img_web_url,
                "description": "\n".join(data["texts"]) if has_texts else "",
                "page_idx": p_idx
            }
        else:
            # No images on this page
            if has_texts:
                joined_texts = "\n".join(data["texts"])
                if current_entry:
                    # Append text to current entry description
                    current_entry["description"] += "\n" + joined_texts
                else:
                    # No entry started yet, this belongs to the volume prefaces
                    preface_texts.append(joined_texts)
                    
    # Append the last entry
    if current_entry:
        entries.append(current_entry)
        
    # Post-process entries to extract name/title
    for entry in entries:
        desc = entry["description"].strip()
        if not desc:
            entry["name"] = f"未名海怪 (页 {entry['page_idx']})"
            continue
            
        # Extract the first line or first few characters as the name
        lines = [l.strip() for l in desc.split("\n") if l.strip()]
        first_line = lines[0] if lines else ""
        
        # Heuristic for name extraction:
        # If the first line is very short (<= 15 chars), it's likely a title/name.
        # Otherwise, take the first 4-8 characters of the first line as a placeholder.
        if len(first_line) <= 15:
            entry["name"] = first_line
        else:
            # Check if there is punctuation, take characters before it
            placeholder = first_line[:6]
            for char in ["，", "。", "；", " "]:
                if char in first_line[:10]:
                    placeholder = first_line.split(char)[0]
                    break
            entry["name"] = placeholder
            
    # Extract volume title from path
    vol_title = "未知分卷"
    for part in ocr_dir.split(os.sep):
        if part.startswith("海错图"):
            vol_title = part
            break
    parts = vol_title.split(".")
    title_display = parts[1] if len(parts) > 1 else vol_title
    
    # Output structured data
    volume_data = {
        "volume": vol_num,
        "title": title_display,
        "preface": "\n".join(preface_texts),
        "creatures": entries
    }
    
    json_out_path = os.path.join(DATA_OUT_DIR, f"vol{vol_num}.json")
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(volume_data, f, ensure_ascii=False, indent=2)
        
    print(f"  [SUCCESS] Volume {vol_num} structured JSON written to {json_out_path}.")
    print(f"  [INFO] Extracted {len(entries)} creature entries and converted images.")

if __name__ == "__main__":
    print("=== Starting 《海错图》 PDF Content Extraction Pipeline ===")
    for idx, pdf_path in enumerate(pdf_files):
        try:
            ocr_dir = run_extraction(pdf_path, RAW_OUT_DIR)
            if ocr_dir:
                process_extracted_volume(idx, ocr_dir)
        except Exception as e:
            print(f"Error processing volume {idx+1}: {e}")
            
    print("\n=== Extraction Pipeline Finished! ===")
