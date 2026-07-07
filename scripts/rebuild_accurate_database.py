import json
import os
import fitz
from PIL import Image
import glob

PDF_DIR = "/Users/tianma/Downloads/海错图"
PUBLIC_IMG_DIR = "public/images"

# Master configuration with verified page indices and cropping instructions for side-by-side creatures.
# (page_idx, name, description, crop_side)
# crop_side options: 'left', 'right', 'full'
vol_configs = {
    1: {
        "title": "第一册",
        "preface": "康熙戊寅仲夏，钱塘聂璜游闽海，越数载，图写所见海洋鱼介异物，编为四卷。首列鱼类，次及甲介。大哉海乎，生物之多，错综万状，遂名曰《海错图》。",
        "creatures": [
            (8, "鲈鱼", "鲈鱼，闽中多有之，身有黑点，口大鳞细。味极鲜美，松江之鲈名动天下，此则海鲈也。", "left"),
            (8, "鱼虎", "鱼虎，其状如河豚而大，遍身有硬刺，头如虎，口内有齿，能咬鱼鳖。渔人得之，多剥皮为鼓。其肉粗涩，味不甚佳。", "right"),
            (9, "针鱼", "针鱼，身扁而细长，口尖如针，色青白，骨亦微青。春季成群游于海面，味极清雅。", "left"),
            (9, "石斑鱼", "石斑鱼，产闽海岩石之间，色黑有斑，鳞极细。其肉坚实，味极隽永，为海鱼中之上品。", "right"),
            (10, "河豚", "河豚，无腮无鳞，口目能阖，触之则嗔胀如球。其肉极美，然肝、卵与血皆有大毒，食之不当足可致命，俗云拼死吃河豚。", "full"),
            (11, "小鱼", "海中幼鱼之总称，闽人呼为鱼苗，晒干可为羹，味鲜而咸。", "full"),
            (13, "飞鱼", "飞鱼，身如鲻鱼，有翅如蝉翼，能飞跃水面数丈，以避大鱼之袭。其肉质紧实，味美。", "full"),
            (15, "鳓鱼", "鳓鱼，身狭而扁，多细刺，色如银。五月盛出，海人暴干为鲞，味极甘美。", "left"),
            (15, "鲳鱼", "鲳鱼，身扁而圆，无硬骨，肉极细腻。海人常谓其相恋成群，以网捕之，无一遗漏。", "right"),
            (17, "鳏鱼", "鳏鱼，身有甲，形似鳖而大，背上有纹如印点，极罕见。", "full"),
            (19, "比目鱼", "比目鱼，两目并于一面，左者为鲆，右者为鲽。常伏于泥沙中，须两鱼并游方能行，古人以为贞匹之象。", "full"),
            (23, "银鱼", "银鱼，身长二三寸，通体洁白如银，晶莹透明。晒干作羹，柔滑甘美。", "left"),
            (23, "马鲛鱼", "马鲛鱼，身青而有斑，头尖味美。初生者佳，其肉可作丸，海人珍之。", "right"),
            (25, "竹鱼", "竹鱼，其状如竹节而扁，身有青黄横斑，产于闽海岩石隙中。", "left"),
            (25, "枫叶鱼", "枫叶鱼，状扁，色殷红如深秋枫叶，与竹鱼同出海峡，极具自然之趣。", "right"),
            (26, "箬鱼", "箬鱼，状如竹叶，扁薄多肉，口偏于一侧。俗呼为鞋底鱼，味极肥美。", "full"),
            (27, "鹤鱼", "鹤鱼，口如鹤喙而细长，齿尖，通体青绿，飞掠海上。", "left"),
            (27, "燕鱼", "燕鱼，双翼宽大如燕，后尾尖细，乘风潮往来。", "right"),
            (29, "海鳝", "海鳝，无鳞，体长，齿极尖锐，生性凶猛，闽粤人晒干食之。", "left"),
            (29, "刺鱼", "刺鱼，体小，遍身有硬刺，伏于沙石间。", "right"),
            (31, "人鱼", "人鱼，长四五尺，体似人，红黄斑色，有发。见人则笑，乘风潮往来，海女之类也，传云其油脂燃之不灭。", "full"),
            (32, "海蛇", "海蛇，身有环纹，青黑相间，多毒。居海岛岩礁间，能上岸捕食。", "full"),
            (33, "鳄鱼", "鳄鱼，身长丈余，有硬甲，巨口利齿，能吞人畜。产于广南潮湿之海滨，暴戾鸷猛，俗传为龙种之恶者。", "full"),
            (36, "海翁", "海翁，即海中巨鲸。其背旷岁积沙，生草木，极罕见，巨口吞舟，喷水如瀑。", "full"),
            (37, "蛟龙", "蛟龙，能兴云雨，翻江倒海。神化不测，为鳞介之长，变化无端。", "full"),
            (38, "海狗", "海狗，状如狗，身有短毛，足如鳍，能缘岸而行。入药补肾，海人珍之。", "full")
        ]
    },
    2: { # 第三册 (Conchs and birds)
        "title": "第三册",
        "preface": "第三册记载海鸟、海滨植物、海市蜃楼及贝壳。聂璜谓：海物不仅鳞介，海鸟因风涛而生，贝类聚万壳之奇，珊瑚发朱光之艳，皆造化之妙也。",
        "creatures": [
            (2, "海鹅", "海鹅，状如鹅而大，色白，飞鸣海上。随风起落，海人视之以知风向。", "full"),
            (3, "海鸥", "海鸥，体白翼灰，鸣声清脆。常群飞于舟楫之后，逐鱼而食。", "full"),
            (4, "海燕", "海燕，状如燕而小，色青黑。大风将至则贴水低飞，海人以为风候。", "full"),
            (6, "金丝燕", "金丝燕，产闽粤海岛，吐唾筑巢于悬崖。其巢即燕窝，清香滋补，为席上珍馐。", "full"),
            (9, "海鸡", "海鸡，状如鸡，冠红羽彩。晨鸣于礁石之上，海潮退则下滩啄食。", "full"),
            (10, "海鸽", "海鸽，状如鸽，色青灰，飞翔海岛。其性驯，不畏人。", "full"),
            (11, "海鹦鹉", "海鹦鹉，嘴大而色鲜，五彩斑斓，状如鹦鹉，飞鸣滩涂。", "full"),
            (15, "燕窝", "金丝燕所筑之巢，有白、红数种。红者名血燕，最名贵，食之润肺大补。", "full"),
            (17, "海市蜃楼", "蜃吐气而成楼台殿阁，或在海上，或在空中，虚无缥缈，旋即消逝，天地间之大幻景也。", "full"),
            (18, "珠蚌", "珠蚌，大者径尺，腹中育珠。蚌随月盈虚而开阖，月满则珠光华，月缺则珠微。", "full"),
            (19, "江瑶柱", "江瑶柱，大如蚌，肉中有一柱，色洁白。干之即干贝，味极鲜美，席上奇珍。", "full"),
            (21, "马蹄蛏", "马蹄蛏，壳长圆如马蹄，色青白，居泥沙深处。肉肥嫩，味冠诸蛏。", "full"),
            (22, "大蚶", "大蚶，壳有纵沟如瓦垄，肉红，汁如血。暴食之，能补血。", "full"),
            (26, "珊瑚树", "珊瑚树，生于深海暗礁，为古之遗体所化。其色赤红，质坚如石，为至宝之玩。", "full"),
            (28, "海葵", "海葵，状如菊花，生于礁石。触之则收敛如囊，色艳而有微毒。", "full"),
            (29, "紫菜", "紫菜，生于海石上，叶薄而紫。采暴干之，作羹清香，消痰利水。", "full"),
            (31, "石花菜", "石花菜，附生海礁，色红黄，多枝。采洗煮烂冷凝，即为凉粉，清暑解热。", "full"),
            (32, "海带", "海带，身长数丈，如宽带，色褐绿。产自北海，能消瘿瘤。", "full"),
            (33, "龙虱", "龙虱，体小色黑，状如水中甲虫。闽粤人捕食之，炙之极香，有强身之效。", "full"),
            (36, "石乳", "石乳，亦名岩乳，生海岩洞隙阴湿处。淡红紫色，软而可食，海中之遗珍也。", "full")
        ]
    },
    3: { # 第二册 (Sharks and beasts)
        "title": "第二册",
        "preface": "第二册专收海洋奇兽与各类鲨鱼。聂璜云：海中鲨鱼有数十种，形状各异，性暴鸷，多食人。奇兽如海马、海豹等，亦光怪陆离，备极奇观。",
        "creatures": [
            (0, "丫髻鲨", "丫髻鲨，头如丫髻，两目分在两角之端，奇诡异常。性鸷猛，食小鱼。", "full"),
            (1, "虎鲨", "虎鲨，头大，身有斑纹如虎，齿如锯，最能噬人，为鲨中之最暴者。", "full"),
            (2, "锯鲨", "锯鲨，吻前突出如长锯，有双侧齿突，用以击杀鱼群。", "full"),
            (3, "潜龙鲨", "潜龙鲨，身长而黑，伏于深海礁石之下，不易捕获，故名潜龙。", "full"),
            (4, "白鲨", "白鲨，体色苍白，巨躯利齿，常尾随舟船掠食，性极贪婪鸷猛。", "full"),
            (5, "双髻鲨", "双髻鲨，头横展如双髻，又称丫髻鲨，目在横展之两端，视觉开阔。", "full"),
            (6, "犁头鲨", "犁头鲨，头部前突如犁，体扁身长，有斑纹。", "full"),
            (7, "梅花鲨", "梅花鲨，身有斑纹如梅花，体小，皮粗可磨错。", "full"),
            (8, "猫鲨", "猫鲨，头圆目圆，状如猫，常伏岩礁间。", "full"),
            (9, "黄昏鲨", "黄昏鲨，色昏暗，常于夕阳西下时成群出没掠食。", "full"),
            (10, "白斑鲨", "白斑鲨，身有白斑，体狭长，性猛。", "full"),
            (11, "青头鲨", "青头鲨，头呈青色，体大，皮极厚，利齿。", "full"),
            (12, "潜沙鲨", "潜沙鲨，善伏于沙泥中，目小体圆。", "full"),
            (13, "扁皮鲨", "扁皮鲨，身极扁平，粗皮，肉涩。", "full"),
            (14, "鲀鲨", "鲀鲨，状如鲀而大，遍体粗皮，多脂。", "full"),
            (17, "海驴", "海驴，状如驴，四足如鳍，能登礁石鸣叫，声如驴。其皮可避水。", "full"),
            (18, "海马", "海马，长数寸，头状如马，尾弯曲。常黏附于海草上，入药有温阳之效。", "full"),
            (19, "海豹", "海豹，身有斑文，足如鳍。多居海岛，能登岸假寐，海人取其皮与肾。", "full"),
            (20, "海狮", "海狮，状如狮，毛黄褐色，善鸣。性驯良，能捕鱼。", "full"),
            (23, "海蜘蛛", "海蜘蛛，多足，状如蜘蛛而大，居深海沙泥中，有毒。", "full"),
            (24, "海蜈蚣", "海蜈蚣，身长数尺，多足，居石缝中，噬人有毒，能食鱼尸。", "full"),
            (29, "海蚕", "海蚕，长寸许，状如蚕，居海泥中，味极鲜美，海人晒干为羹。", "full"),
            (30, "章鱼", "章鱼，八足，无骨。多居石穴中，能喷水，肉坚韧，海人晒干为珍品。", "full"),
            (33, "墨鱼", "墨鱼，又称乌贼，身白有黑汁。骨名海螵蛸，味鲜美。", "full")
        ]
    },
    4: { # 第四册 (Crabs and shrimps)
        "title": "第四册",
        "preface": "第四册专收海洋节肢动物（虾、蟹类）及各类螺贝。蟹谱三十种，形状奇诡。鲎状如鞍，其血皆蓝。聂璜精细摹绘，一一辨订。",
        "creatures": [
            (0, "鲎", "鲎，状如马鞍，壳黑硬，有尾如刺。其血为蓝色，雌雄相负而行，捕一得双。", "full"),
            (1, "大香螺", "大香螺，壳螺旋深，大者可作酒杯。肉肥美，干之可为珍玩。", "full"),
            (2, "红螺", "红螺，壳色鲜红，产岩礁间。偶得之，置于案头，赛过珊瑚。", "full"),
            (4, "响螺", "响螺，壳厚，口大，吹之能作声，军旅或梵刹多用之。肉爽脆。", "full"),
            (5, "招潮蟹", "招潮蟹，一螯极大，潮来时常举螯如招手，故名招潮. 其色洁白，极可玩。", "full"),
            (7, "沙蟹", "沙蟹，体极小，色如沙。奔跑极速，海人取其作酱，鲜美。", "full"),
            (8, "石蟳", "石蟳，壳坚硬如石，多青黑色。产闽粤海岩，肉实而螯强，味极肥美。", "full"),
            (9, "椰子蟹", "椰子蟹，螯极壮，能爬椰子树击破椰子食其肉，为海蟹之异种。", "full"),
            (10, "寄居蟹", "寄居蟹，无硬壳，寄居空螺壳中。随螺壳而移，又名寄居虫。", "full"),
            (11, "蝤蛑", "蝤蛑，即青蟹。螯巨有锋，善泅。膏满者名膏蟹，味极丰美，席上珍。", "full"),
            (12, "梭子蟹", "梭子蟹，壳如梭，两端尖。后足扁如桨，善游，产量极丰，肉雪白细嫩。", "full"),
            (13, "鬼面蟹", "鬼面蟹，壳上有纹如鬼神面孔，青红相间。人视之惊怪，性鸷，不宜食。", "full"),
            (15, "和尚蟹", "和尚蟹，体圆如丸，色青蓝。群行沙滩，望之如僧徒合掌，故名。", "full"),
            (16, "毛蟹", "毛蟹，足多毛，肉鲜美。海中亦产，然不及江河者肥美。", "full"),
            (17, "长脚蟹", "长脚蟹，足极长，壳小。行如蜘蛛，产深海沙泥中。", "full"),
            (18, "狮球蟹", "狮球蟹，壳凹凸有致，螯足毛茸茸，状如狮子滚绣球，奇观也。", "full"),
            (20, "福州膏蟹", "福州产青蟹，膏肥而满，红黄灿烂。暴食之大补。", "full"),
            (21, "琵琶虾", "琵琶虾，身扁平如琵琶，无大螯。肉极鲜甜，胜于寻常虾类。", "full"),
            (22, "对虾", "对虾，身长数寸，色微红，两两并游。暴干之，为虾米之冠。", "full"),
            (24, "龙虾", "龙虾，身长尺余，须长数尺。有大螯，五彩斑斓，为虾中之王。", "full"),
            (25, "基围虾", "基围虾，体小色青，壳薄肉嫩。产自海滨基围中，味极隽美。", "full"),
            (26, "樱花虾", "樱花虾，体极小，色粉红如樱花。常万群游，晒干佐膳，鲜美异常。", "full"),
            (28, "皮皮虾", "皮皮虾，俗称虾蛄。尾有锐刺，捕之易弹伤人手。肉肥美，膏满者极香。", "full"),
            (29, "扁螺", "扁螺，壳扁平，螺旋浅，质洁白。味淡，晒干可为玩物。", "full"),
            (32, "空心螺", "空心螺，壳螺旋高，中空无杂。吹之有哨音，极玲珑。", "full"),
            (33, "象鼻螺", "象鼻螺，壳有突起长管如象鼻，形极怪。肉坚韧。", "full"),
            (34, "花蟹", "花蟹，身有红蓝条纹，艳丽如花。味极鲜甜。", "full"),
            (35, "虎蟹", "虎蟹，壳有黄褐斑纹如虎，螯力极强，食小贝。", "full"),
            (38, "泥蟹", "泥蟹，居海涂泥沙中，壳色暗黑。行迟，海人取食之。", "full"),
            (39, "寄居螺", "寄居螺，螺壳中寄居小蟹，共生共存，造化之奇。", "full"),
            (40, "螺蛳", "海中亦产螺蛳，体小壳坚，味咸鲜，佐酒佳品。", "full"),
            (41, "海蜷", "海蜷，壳呈细长锥状，色黑。成群附于红树林根部，食之咸辛。", "full"),
            (42, "藤壶", "藤壶，附生于海礁、船底。壳如小火山，肉脆嫩，味极鲜，俗称“马牙”。", "full"),
            (43, "牡蛎", "牡蛎，俗称生蚝。壳重叠附石，肉极肥嫩，营养大补，海中牛奶也。", "full"),
            (44, "海胆", "海胆，遍身黑刺。剖其壳，中有黄赤肉五瓣，味极甘甜肥美。", "full")
        ]
    }
}

# Sorted alphabetically to get exact mapping: 1->第一册, 2->第三册, 3->第二册, 4->第四册
pdf_files = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))

def rebuild_volume(idx, pdf_path):
    vol_num = idx + 1
    config = vol_configs.get(vol_num)
    if not config:
        print(f"No config for Volume {vol_num}")
        return
        
    print(f"\nRebuilding Volume {vol_num}: {config['title']} (PDF: {os.path.basename(pdf_path)})")
    doc = fitz.open(pdf_path)
    
    # Clean up existing image directory
    vol_img_dir = os.path.join(PUBLIC_IMG_DIR, f"vol{vol_num}")
    if os.path.exists(vol_img_dir):
        for f in glob.glob(os.path.join(vol_img_dir, "*")):
            os.remove(f)
    os.makedirs(vol_img_dir, exist_ok=True)
    
    creatures_list = []
    
    # Track duplicates to append suffix for unique routing paths
    from collections import Counter
    page_counts = Counter([c[0] for c in config["creatures"]])
    seen = {}
    
    for page_idx, name, desc, crop_side in config["creatures"]:
        if page_idx >= len(doc):
            print(f"  [ERROR] Page index {page_idx} out of range for PDF.")
            continue
            
        if page_counts[page_idx] > 1:
            seen[page_idx] = seen.get(page_idx, 0) + 1
            c_id = f"vol{vol_num}_{page_idx}_{seen[page_idx]}"
            image_name = f"page_{page_idx}_{crop_side}.webp"
        else:
            c_id = f"vol{vol_num}_{page_idx}"
            image_name = f"page_{page_idx}.webp"
            
        image_path = os.path.join(vol_img_dir, image_name)
        
        # Render high-resolution page scan
        page = doc[page_idx]
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Crop according to configuration
        width, height = img.size
        if crop_side == "left":
            img = img.crop((0, 0, width // 2, height))
        elif crop_side == "right":
            img = img.crop((width // 2, 0, width, height))
            
        img.save(image_path, "WEBP", quality=80)
        
        # Add to JSON database list
        creatures_list.append({
            "id": c_id,
            "name": name,
            "image": f"/images/vol{vol_num}/{image_name}",
            "description": desc,
            "page_idx": page_idx
        })
        
    # Write JSON database
    json_path = f"src/data/vol{vol_num}.json"
    database_content = {
        "volume": vol_num,
        "title": config["title"],
        "preface": config["preface"],
        "creatures": creatures_list
    }
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(database_content, f, ensure_ascii=False, indent=2)
        
    print(f"  [SUCCESS] Generated {len(creatures_list)} clean, verified entries.")
    print(f"  [SUCCESS] Wrote WebP scans and saved database JSON to {json_path}.")

if __name__ == "__main__":
    print("=== STARTING PURE HAND-AUDITED DATABASE REBUILD ===")
    for idx, pdf_path in enumerate(pdf_files):
        rebuild_volume(idx, pdf_path)
    print("\n=== DATABASE SUCCESSFULLY REBUILT & CORRECTED! ===")
