# Source PDFs

Place the original Haicuotu PDF files in this directory when rebuilding the image and data pipeline locally.

Download the source PDFs from the Shuge Haicuotu page:

<https://www.shuge.org/view/hai_cuo_tu/>

After downloading, place the PDF files in this directory. The PDF files are intentionally ignored by Git because they are large binary source assets and may be subject to separate usage terms from Shuge and the holding institutions.

Expected files:

- `海错图.第一册.三十五开.清.聂璜绘.清康熙时期绘本.北京故宫博物院藏.pdf`
- `海错图.第二册.三十七开.清.聂璜绘.清康熙时期绘本.北京故宫博物院藏.pdf`
- `海错图.第三册.三十九开.清.聂璜绘.清康熙时期绘本.北京故宫博物院藏.pdf`
- `海错图.第四册.四十四开.清.聂璜绘.清康熙时期绘本.台北故宫博物院藏.pdf`

Scripts default to this directory. To use PDFs from another location, set:

```sh
HAICUOTU_PDF_DIR=/path/to/pdf-folder .venv/bin/python3 scripts/rebuild_accurate_database.py
```
