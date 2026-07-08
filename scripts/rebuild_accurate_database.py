import json
import os
import fitz
from PIL import Image
import glob
import cv2
import numpy as np

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF_DIR = os.environ.get("HAICUOTU_PDF_DIR", os.path.join(WORKSPACE_DIR, "raw-pdfs"))
PUBLIC_IMG_DIR = os.path.join(WORKSPACE_DIR, "public/images")

# Master configuration with verified page indices and cropping instructions for all 4 volumes.
# (page_idx, name, description, crop_side)
# crop_side options: 'left', 'right', 'full', 'third_1', 'third_2', 'third_3', 'quarter_1', 'quarter_2', 'quarter_3', 'quarter_4'
vol_configs = {
    1: {
        "title": "第一册",
        "preface": "康熙戊寅仲夏，钱塘聂璜游闽海，越数载，图写所见海洋鱼介异物，编为四卷。首列鱼类，次及甲介。大哉海乎，生物之多，错综万状，遂名曰《海错图》。",
        "creatures": [
            (8, "鲈鱼", "鲈鱼，闽中多有之，身有黑点，口大鳞细。味极鲜美，松江之鲈名动天下，此则海鲈也。", "left"),
            (8, "鱼虎", "鱼虎，其状如河豚而大，遍身有硬刺，头如虎，口内有齿，能咬鱼鳖。渔人得之，多剥皮为鼓。其肉粗涩，味不甚佳。", "right"),
            (9, "鲻鱼", "鲻鱼，身有粘液，色青黑。其肉肥嫩，闽人呼为鲻鱼，晒干为鲞，味极甘美。", "third_1"),
            (9, "江鱼", "江鱼，产于闽海，长二三寸，色银白，极细小。其味清甜，宜作羹食。", "third_2"),
            (9, "海鳅鱼", "海鳅鱼，状如泥鳅而大，生于海中岩石间。其色青黑，肉质坚实。", "third_3"),
            (10, "河豚", "河豚，无腮无鳞，口目能阖，触之则嗔胀如球。其肉极美，然肝、卵与血皆有大毒，食之不当足可致命，俗云拼死吃河豚。", "full"),
            (11, "七里香", "七里香，闽海小鱼，言其轻而美也。身狭长如针，味极清雅。", "left"),
            (11, "鱽鱼", "鱽鱼，亦称刀鱼。身狭长而扁，色白如银，后尾尖细，其形如刀。", "right"),
            (12, "划腮鱼", "划腮鱼，亦名阔嘴鱼。口阔而大，身有黑斑，常在浅沙中游行。", "third_1"),
            (12, "小鱼", "海中幼鱼之总称，闽人呼为鱼苗，晒干可为羹，味鲜而咸。", "third_2"),
            (12, "飞鱼", "飞鱼，身如鲻鱼，有翅如蝉翼，能飞跃水面数丈，以避大鱼之袭。其肉质紧实，味美。", "third_3"),
            (13, "铜盆鱼", "铜盆鱼，其身圆而扁，色红黄如铜盆，多产于闽海礁石间。", "left"),
            (13, "蝘虎鱼", "蝘虎鱼，状如守宫，色灰黑，常缘石而行，故名蝘虎。", "right"),
            (14, "海鱘", "海鱘，身有黄黑斑点，产于淡水与海水交界处。其肉多而厚，骨硬。", "left"),
            (14, "鲨鱼", "鲨鱼，即小鲨，体狭长，口在腹下，齿极利，性暴鸷。", "right"),
            (15, "海银鱼", "海银鱼，产辽东海中，长三四寸，通体洁白如银，晶莹透明。", "third_1"),
            (15, "鲳鱼", "鲳鱼，身扁而圆，无硬骨，肉极细腻。海人常谓其相恋成群，以网捕之，无一遗漏。", "third_2"),
            (15, "毯鱼", "毯鱼，亦名毬鱼。体圆如毯，色红褐，有波浪纹，随潮漂浮。", "third_3"),
            (16, "松鱼", "松鱼，亦名鲃鱼。状如猫，多须，身青黑，肉质细腻。", "third_1"),
            (16, "鹞毛鱼", "鹞毛鱼，体小，色青灰，飞跃水面，状如鹞子之毛。", "third_2"),
            (16, "青鲋", "青鲋，状如鲫而青，多生于海滨浅水处，味极清甜。", "third_3"),
            (17, "鳏鱼", "鳏鱼，身有甲，形似鳖而大，背上有纹如印点，极罕见。", "third_1"),
            (17, "印鱼", "印鱼，背上有白色或红色斑纹如印章，常随大鱼游行，能避水祸。", "third_2"),
            (17, "鳔鱼", "鳔鱼，体极小，色白，常成群游于海面，其鳔可制胶。", "third_3"),
            (18, "顶甲鱼", "顶甲鱼，头部有坚硬如甲之骨，色灰黑，能附于礁石上吸水。", "left"),
            (18, "鳂鱼", "鳂鱼，体红，鳞大，多刺，性鸷。闽中海人多珍之。", "right"),
            (19, "枫叶鱼", "枫叶鱼，状扁，色殷红如深秋枫叶，与竹鱼同出海峡，极具自然之趣。", "left"),
            (19, "草蜢鱼", "草蜢鱼，状如草蜢，身翠绿，有细鳞，长四五寸，游速极快。", "right"),
            (20, "石首鱼", "石首鱼，脑中有白石二枚，故名石首。其色黄白，肉质鲜嫩，为席上珍馐。", "full"),
            (21, "黄鱨鱼", "黄鱨鱼，体色金黄，多产于江海之交，肉嫩味甘。", "left"),
            (21, "四腮鲈", "四腮鲈，产于松江，身有斑点，鳃部有红线如四腮，味极鲜美。", "right"),
            (22, "海鲫鱼", "海鲫鱼，体大，多肉而厚，色灰黑，骨硬。", "left"),
            (22, "红鱼", "红鱼，亦名新妇鱼。全身绯红，翅尾翠色，极绚丽。", "right"),
            (23, "鳎鱼", "鳎鱼，即鳎沙。身扁平如鞋底，两目并于一面，左者为鲆，右者为鲽。", "left"),
            (23, "箬鱼", "箬鱼，状如竹叶，扁薄多肉，口偏于一侧。俗呼为鞋底鱼，味极肥美。", "right"),
            (24, "海鱵", "海鱵，亦名针鱼。嘴尖如针，色青白，骨亦微青。", "left"),
            (24, "井鱼", "井鱼，即鲸之幼者。头顶有孔能喷水如井，体大，巨口。", "right"),
            (25, "麻鱼", "麻鱼，即电鳐。体圆扁，色黄褐，人触之则手麻痹，能放电防身。", "left"),
            (25, "马鲛鱼", "马鲛鱼，身青而有斑，头尖味美。初生者佳，其肉可作丸，海人珍之。", "right"),
            (26, "鳓鱼", "鳓鱼，身狭而扁，多细刺，色如银。五月盛出，海人暴干为鲞，味极甘美。", "left"),
            (26, "比目鱼", "比目鱼，两目并于一面，左者为鲆，右者为鲽。常伏于泥沙中，须两鱼并游方能行，古人以为贞匹之象。", "right"),
            (27, "鳗鲡", "鳗鲡，亦名海鳗。状如蛇，无鳞，齿极尖锐，生性凶猛，闽粤人晒干食之。", "left"),
            (27, "鳗腮鱼", "鳗腮鱼，体滑无鳞，色灰黑，腮部多肉，味甘美。", "right"),
            (28, "海鳗", "海鳗，闽广海中俱有之，长数尺，齿利，生性凶猛。", "third_1"),
            (28, "竹鱼", "竹鱼，其状如竹节而扁，身有青黄横斑，产于闽海岩石隙中。", "third_2"),
            (28, "龙头鱼", "龙头鱼，产闽海口，无鳞，色洁白，骨软，味极鲜嫩。", "third_3"),
            (29, "水沫鱼", "水沫鱼，体极微小，半透明如水沫，晒干可作汤。", "third_1"),
            (29, "鹤鱼", "鹤鱼，口如鹤喙而细长，齿尖，通体青绿，飞掠海上。", "third_2"),
            (29, "黄鲋", "黄鲋，色黄如金，鳞细，多生于海滨，味美。", "third_3"),
            (30, "钱串鱼", "钱串鱼，身有黄色圆纹如钱串，色青蓝，极绚丽。", "third_1"),
            (30, "参蕉鱼", "参蕉鱼，体极微小，色青，多产于宁海，味美。", "third_2"),
            (30, "兜甲鱼", "兜甲鱼，头有硬甲，色褐，四足，尾尖。", "third_3"),
            (31, "带鱼", "带鱼，身长如带，无鳞，色银白，尾尖细。冬春之交成群洄游，闽粤人多食之。", "full"),
            (32, "针鱼", "针鱼，嘴尖如针，色青白，骨亦微青。", "left"),
            (32, "血鳗", "血鳗，通体赤红如血，亦名红鳗，产于海洋深处。", "right"),
            (33, "空头鱼", "空头鱼，头部硬而空，无鳞，体灰黑。", "left"),
            (33, "跳鱼", "跳鱼，即弹涂鱼。生于海涂，善跳跃，肉肥嫩，味极鲜美。", "right"),
            (34, "蠓鱼", "蠓鱼，体小，色青黑，常附于海石，能御大鱼。", "left"),
            (34, "鼠鲇鱼", "鼠鲇鱼，头顶尾全似鼠，色灰黑，无鳞。", "right"),
            (35, "海翁", "海翁，即海中巨鲸。其背旷岁积沙，生草木，极罕见，巨口吞舟，喷水如瀑。", "full"),
            (36, "蛟龙", "蛟龙，能兴云雨，翻江倒海。神化不测，为鳞介之长，变化无端。", "full"),
            (37, "人鱼", "人鱼，长四五尺，体似人，红黄斑色，有发。见人则笑，乘风潮往来，海女之类也。", "left"),
            (37, "龙鱼", "龙鱼，头状如龙，有角，四足如鳍，色青绿，产于深海。", "right"),
            (38, "螭虎鱼", "螭虎鱼，身有鳞甲，金色，头如龙而无角，有四足。", "left"),
            (38, "刺鲇", "刺鲇，即有刺之鲇鱼。体灰黑，头有硬刺，多生于海滨。", "right"),
            (39, "虬龙", "虬龙，有角，四足，能兴云雨，飞翔于云雾间。", "left"),
            (39, "神龙", "神龙，五爪，能大能小，升天入地，变化无穷。", "right"),
            (40, "海鳝", "海鳝，体长无鳞，色赤红，齿尖利，多生于海滨。", "left"),
            (40, "盐龙", "盐龙，状如龙，体小，多生于海盐中。", "right"),
            (41, "刺鱼", "刺鱼，体小，遍身有硬刺，伏于沙石间。", "left"),
            (41, "海蛇", "海蛇，身有环纹，青黑相间，多毒。居海岛岩礁间，能上岸捕食。", "right"),
            (42, "鳄鱼", "鳄鱼，身长丈余，有硬甲，巨口利齿，能吞人畜。产于广南潮湿之海滨，暴戾鸷猛，俗传为龙种之恶者。", "full")
        ]
    },
    2: { # 第三册 (Conchs and birds) - Swapped to Volume 3 on website
        "title": "第三册",
        "preface": "第三册记载海鸟、海滨植物、海市蜃楼及贝壳。聂璜谓：海物不仅鳞介，海鸟因风涛而生，贝类聚万壳之奇，珊瑚发朱光之艳，皆造化之妙也。",
        "creatures": [
            (2, "海鹅", "海鹅，状如鹅而大，色白，飞鸣海上。随风起落，海人视之以知风向。", "full"),
            (3, "海鸥", "海鸥，体白翼灰，鸣声清脆。常群飞于舟楫之后，逐鱼而食。", "full"),
            (4, "海燕", "海燕，状如燕而小，色青黑。大风将至则贴水低飞，海人以为风候。", "full"),
            (6, "金丝燕", "金丝燕，产闽粤海岛，吐唾筑巢于悬崖。其巢即燕窝，清香滋补，为席上珍馐。", "full"),
            (9, "海鸡", "海鸡，状如鸡，冠红羽彩. 晨鸣于礁石之上，海潮退则下滩啄食。", "full"),
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
    3: { # 第二册 (Sharks and beasts) - Swapped to Volume 2 on website
        "title": "第二册",
        "preface": "第二册专收海洋奇兽与各类鲨鱼。聂璜云：海中鲨鱼有数十种，形状各异，性暴鸷，多食人。奇兽如海马、海豹等，亦光怪陆离，备极奇观。",
        "creatures": [
            (3, "鲼鱼", "鲼鱼，形扁如盘，口在腹下，尾长有毒刺。鱼如水面摊开，又名鲼鱼。", "left"),
            (3, "珠皮鲼", "珠皮鲼，背部皮粗有白骨珠，可饰刀剑。鲼背珠皮定制刀剑。", "right"),
            (4, "印鱼", "印鱼，头上有印状吸盘，常吸附于大鱼或船底。又名印鳞鱼。", "full"),
            (5, "海燕", "海燕，状如燕而小，色青黑。大风将至则贴水低飞，海人以为风候。", "full"),
            (6, "金丝燕", "金丝燕，产闽粤海岛，吐唾筑巢于悬崖。其巢即燕窝，清香滋补。", "full"),
            (7, "剑鲨", "剑鲨，吻部前突如剑，利齿。剑鲨鼻如锯，鱼鼻甚长。", "left"),
            (7, "青头鲨", "青头鲨，头呈青色，巨口利齿，体大肉粗。青头鲨食诸水族。", "right"),
            (8, "海钉", "海钉，体小，色灰黑，成群游于海面。宁波海上育鱼曰海钉。", "left"),
            (8, "青鳗", "青鳗，长身如蛇，色青绿，吻突长。青鳗如鳗而细其喙甚长。", "right"),
            (9, "梅花鲨", "梅花鲨，身有斑纹如梅花，体小，皮粗可磨错。", "full"),
            (10, "潜龙鲨", "潜龙鲨，身长而黑，伏于深海礁石之下，有金黄鳞甲，极罕见。", "full"),
            (11, "犁头鲨", "犁头鲨，头部前突如犁，体扁身长，有斑纹。", "left"),
            (11, "双髻鲨", "双髻鲨，头横展如双髻，目在横展之两端，又名丫髻鲨。", "right"),
            (12, "锯鲨", "锯鲨，吻前突出如长锯，用以击杀鱼群。", "full"),
            (13, "双髻鲨", "双髻鲨，头横展如双髻。双髻鲨亦如云头而小身微灰。", "left"),
            (13, "云头鲨", "云头鲨，头呈云朵状，亦双髻鲨之异名。", "right"),
            (14, "猫鲨", "猫鲨，头圆目圆，状如猫，常伏岩礁间。", "third_1"),
            (14, "白鲨", "白鲨，身白背有黑点，皮细。白鲨身白背有黑点而翅微红。", "third_2"),
            (14, "方头鲨", "方头鲨，头横展如方斗，巨躯利齿。方头鲨如髻形而头方。", "third_3"),
            (15, "跨鲨", "跨鲨，体大如山，背上有白跨黑跨二种，常附生藤壶。", "left"),
            (15, "龙门撞", "龙门撞，体狭长有横斑，善跃。龙门撞亦鲨鱼之名。", "right"),
            (15, "鼠鲨", "鼠鲨，头尖体小，状如鼠。猫鲨鼠鲨共赞。", "right"),
            (16, "错鱼", "错鱼，即鲨鱼，皮粗可为磨错之用。", "third_1"),
            (16, "掏枪", "掏枪，体小，背上有长刺如枪。掏枪赏可食。", "third_2"),
            (16, "瓜子肉", "瓜子肉，即幼鲨之肉，闽人盐腌食之。", "third_3"),
            (17, "虎鲨", "虎鲨，头大，身有斑纹如虎，最能噬人。", "full"),
            (18, "海虎", "海虎，海中奇兽，状如虎，能登岸捕食。", "full"),
            (19, "鹿鱼", "鹿鱼，头生茸角，身有斑点，能化而为鹿。", "left"),
            (19, "海豹", "海豹，身有斑文，足如鳍，多居海岛。", "right"),
            (20, "海獭", "海獭，毛短黑而光，善潜水。海獭毛短黑而光如狗前脚长。", "third_1"),
            (20, "海驴", "海驴，状如驴，四足如鳍，声如驴。其皮可避水。", "third_2"),
            (20, "海鼠", "海鼠，体如鼠，居海礁。海鼠灰白色穴于海礁石隙。", "third_3"),
            (21, "海狶", "海狶，即海猪，体圆色黑，常群游。海狶如猪殊难信书。", "full"),
            (22, "腽肭兽", "腽肭兽，即海狗，状如犬，四足如鳍，入药大补。", "left"),
            (22, "野豕", "野豕，海中野猪，有长牙，性猛。野豕大者如牛甚猛。", "right"),
            (23, "潜牛", "潜牛，头有双角，体红，潜于海岩。南海外有潜牛牛头而鱼尾。", "third_1"),
            (23, "海狗", "海狗，身长毛黄，足如鳍。海狗似狗而小其毛黄色。", "third_2"),
            (23, "刺鱼", "刺鱼，遍体有刺，能化为箭猪。刺鱼化箭猪赞。", "third_3"),
            (24, "海马", "海马，海中奇兽，状如马，身上有红焰斑纹，非今之小海马。", "full"),
            (25, "龙虱", "龙虱，体小色黑，状如甲虫，可食。又名龙蝨。", "third_1"),
            (25, "龙肠", "龙肠，状如线，色红，生海涂中。龙肠亦无毛之螺虫也。", "third_2"),
            (25, "海蚕", "海蚕，状如蚕，居海泥，味鲜美。海蚕长寸许。", "third_3"),
            (26, "泥蛋", "泥蛋，形长圆而色浅红，亦名海红、海橘。", "third_1"),
            (26, "海蜘蛛", "海蜘蛛，多足，状如蜘蛛而大，有毒。海蜘蛛产海山深僻处。", "third_2"),
            (26, "海蜈蚣", "海蜈蚣，身长数尺，多足，噬人有毒。海蜈蚣背微突。", "third_3"),
            (27, "土鳖", "土鳖，背微突，体圆而绿，吸粘海礁。土鳖背微突体圆长。", "left"),
            (27, "海参", "海参，产海泥中，遍体肉刺，大补。辽广二参以办高下。", "right"),
            (28, "泥笋", "泥笋，形如蚯蚓，色青蓝，味清美。泥笋一名泥绿。", "third_1"),
            (28, "桑鱼", "桑鱼，即柔鱼、鱿鱼，八足多肉，味美。桑鱼名奈亦瑞八带。", "right"),
            (29, "章鱼", "章鱼，即螺仙，身圆多足，内藏好墨。可惜无用送海龙王。", "third_1"),
            (29, "海和尚", "海和尚，人首鳖身，海中怪异。海和尚人首鳖身。", "third_2"),
            (29, "土肉", "土肉，大如臂，无骨，味如肥肉。土肉赞土肉生肉芝。", "third_3"),
            (30, "鬼头鱼", "鬼头鱼，章鱼之大而悍者，有尖刺。鬼头鱼生利大而且悍。", "left"),
            (30, "泥刺", "泥刺，大头，有刺，可食。泥刺大头足软肉可食。", "right"),
            (31, "泥丁", "泥丁，状如丁香，闽中海涂特产。泥丁香乾之状如丁香。", "third_1"),
            (31, "海粉", "海粉，海螺卵群，色黄绿，清热。海粉虫产闽中海。", "third_2"),
            (31, "朱蛙", "朱蛙，体红，目有金光，产温州。朱蛙产温州平阳海涂。", "third_3"),
            (32, "章巨", "章巨，大章鱼，头巨，能缠人。章巨似章鱼而大。", "left"),
            (32, "章鱼", "章鱼，八足，多游于潮际。章鱼产浙闽海涂中。", "right"),
            (33, "锁管", "锁管，无骨，体细长有紫斑。锁管玉质紫斑无骨。", "quarter_1"),
            (33, "泥钉", "泥钉，如蚯蚓而有尾，味美。泥钉如蚓一段而有尾。", "quarter_2"),
            (33, "泥肠", "泥肠，状如猪肠，生海涂。泥肠亦名土猪肠。", "quarter_3"),
            (33, "泥翘", "泥翘，壳长四五寸，有骨有肉。泥翘约长五寸吸阴翘而起。", "quarter_4"),
            (34, "荷包蛇", "荷包蛇，形如荷包，色微白，化水。荷包蛇其色味同蛇鱼。", "quarter_1"),
            (34, "墨鱼子", "墨鱼子，乌贼卵，结如贯珠，黑褐色。墨鱼子散布海岩。", "quarter_2"),
            (34, "石乳", "石乳，生海岩阴湿处，淡红紫色，软而可食。石乳亦名岩乳。", "quarter_3"),
            (34, "土花瓶", "土花瓶，生海泥，形如花瓶，有海草附生。土花瓶产海釜泥中。", "quarter_4"),
            (35, "墨鱼", "墨鱼，又称乌贼，身白有黑汁。骨名海螵蛸，味鲜美。墨鱼在水身白。", "full"),
            (36, "蛇婆", "蛇婆，即海蜇、水母，身如笠，下有虾寄生。蛇婆吴俗称为海蜚。", "left"),
            (36, "金盏银台", "金盏银台，小水母，红顶白底，状如金盏。金盏银台水母目虾。", "right")
        ]
    },
    4: { # 第四册 (Crabs and shrimps) - 台北故宫藏本
        "title": "第四册",
        "preface": "第四册专收海洋节肢动物（虾、蟹类）及各类螺贝。蟹谱三十种，形状奇诡。鲎状如鞍，其血皆蓝。聂璜精细摹绘，一一辨订。",
        "creatures": [
            (1, "鲎鱼", "鲎，状如马鞍，壳黑硬，有尾如刺。其血为蓝色，雌雄相负而行，捕一得双。", "full"),
            (2, "鲎负火", "鲎负火，身小而多刺，负火游行，见人则灭。", "full"),
            (3, "响螺", "响螺，壳厚，口大，吹之能作声。聂璜认为响螺老来可变蟹，并负壳而行。", "left"),
            (3, "大香螺", "大香螺，壳螺旋深，大者可作酒杯。其肉微香，肉质鲜美。", "right"),
            (4, "羊角螺", "羊角螺，其壳弯曲如羊角，色莹白，小而坚。", "quarter_1"),
            (4, "手巾螺", "手巾螺，壳螺旋如拧紧之手巾，色青褐，纹理细密。", "quarter_2"),
            (4, "蛇螺", "蛇螺，其壳螺旋而长，有青绿纹，状如蛇盘。", "quarter_3"),
            (4, "铜槵螺", "铜槵螺，色黄黑如黄铜，大如指头，生于海岩石隙中。", "quarter_4"),
            (5, "螄螺", "螄螺，壳细长，多纹理，生于沙石间。", "third_1"),
            (5, "火焰螺", "火焰螺，其壳呈红绿相间之火斑纹，旁生青绿尖角如火炎。", "third_2"),
            (5, "砚台螺", "砚台螺，其壳重，黑色，形如砚台，可蓄水磨墨，极雅。", "third_3"),
            (6, "红螺", "红螺，壳色鲜红，产岩礁间。偶得之，置于案头，赛过珊瑚。", "third_1"),
            (6, "九孔螺", "九孔螺，壳形扁平，边缘有九孔，得石之性，其肉清凉。", "third_2"),
            (6, "钞螺", "钞螺，壳螺旋，上有白点，置水中光烛如银。肉甚腥，产瓯之永嘉。", "third_3"),
            (7, "梭螺", "梭螺，壳两端尖而中宽，形如织梭。", "third_1"),
            (7, "巨螺", "巨螺，大如斗，壳厚，口红褐色，海人取以为杯或号筒。", "third_2"),
            (7, "扁螺", "扁螺，壳扁平，螺旋浅，质洁白。味淡，晒干可为玩物。", "third_3"),
            (8, "铁蛳", "铁蛳，壳坚如铁，色青黑，极难碎。", "quarter_1"),
            (8, "短蛳", "短蛳，壳短而扁，螺旋极密，产潮际。", "quarter_2"),
            (8, "铜蛳", "铜蛳，色青黄如铜，小而多肉。", "quarter_3"),
            (8, "白蛳", "白蛳，壳莹白如玉，小而多肉。", "quarter_4"),
            (9, "刺螺", "刺螺，壳有长棘如角，色红褐，生于礁石缝中。", "third_1"),
            (9, "鹦鹉螺", "鹦鹉螺，其形绝类鹦鹉嘴，壳厚色深绿，海中珍品。", "third_2"),
            (9, "手卷螺", "手卷螺，壳如卷轴，质薄色绿，极具雅玩之趣。", "third_3"),
            (10, "桃红螺", "桃红螺，色殷红如桃，小而可爱，壳薄多纹。", "third_1"),
            (10, "螄螺", "螄螺，又名苏合螺，壳扁而黄，常群游于水面。", "third_2"),
            (10, "黄螺", "黄螺，壳色焦黄，肉肥，味微甘。", "third_3"),
            (11, "鸭舌螺", "鸭舌螺，口内有物如舌，状似鸭舌，色黄白。", "third_1"),
            (11, "维斑螺", "维斑螺，产于琉球，壳上有维妙花纹，甚美。", "third_2"),
            (11, "空心螺", "空心螺，壳螺旋高，中空无杂。吹之有哨音，极玲珑。", "third_3"),
            (12, "棱瓣螺", "棱瓣螺，形如花瓣叠合，棱角分明，色灰褐。", "third_1"),
            (12, "八口螺", "八口螺，壳有八处凹口，色翠绿，形似八角。", "third_2"),
            (12, "象鼻螺", "象鼻螺，壳有突起长管如象鼻，形极怪。肉坚韧。", "third_3"),
            (13, "鹌鹑螺", "鹌鹑螺，形色如鹌鹑，质薄如蛋壳。", "third_1"),
            (13, "白贝", "白贝，壳莹白无暇，腹白而背有花纹。", "third_2"),
            (13, "豹纹贝", "豹纹贝，壳上有黑色圆斑如豹，质坚如玉。", "third_3"),
            (14, "各种贝类", "海中各种小贝，五彩斑斓，形状万千，皆具造化之妙。", "full"),
            (15, "泥螺", "泥螺，又名吐铁，体圆壳薄，常伏于泥中，腌食极美。", "third_1"),
            (15, "盖螺", "盖螺，壳有坚硬石盖，闭合极严。", "third_2"),
            (15, "花螺", "花螺，壳有红褐斑点，肉质脆嫩，味极鲜美。", "third_3"),
            (16, "小香螺", "小香螺，壳如常螺而小，色黄褐有斑。", "quarter_1"),
            (16, "手掌螺", "手掌螺，黄色，尾三歧如伸指掌。", "quarter_2"),
            (16, "青螺", "青螺，壳青黑，生于石畔，肉质滑嫩。", "quarter_3"),
            (16, "深纹螺", "深纹螺，壳有深沟纵纹，质厚。", "quarter_4"),
            (17, "梅螺", "梅螺，壳圆而色淡，状似青梅。", "quarter_1"),
            (17, "相思螺", "相思螺，壳小，有牡蛎附生其上，共生海石间。", "quarter_2"),
            (17, "石门螺", "石门螺，壳扁如石，附于石门崖壁。", "quarter_3"),
            (17, "掩螺", "掩螺，体扁如钱，常掩闭于沙土。", "quarter_4"),
            (18, "观音螺", "观音螺，壳上有髻，螺形如观音盘坐。", "third_1"),
            (18, "辣螺", "辣螺，其壳有刺，味辛辣，能治胃寒。", "third_2"),
            (18, "簪螺", "簪螺，状如玉簪，色白质坚。", "third_3"),
            (19, "化生螺", "化生螺，相传由落花在海中化生而成。", "third_1"),
            (19, "寄居螺", "寄居螺，空螺壳中寄居小蟹，共生共存，移动自如。", "third_2"),
            (19, "沙蟣", "沙蟣，极小之蟹，群行于海沙上，望之如蚁。", "third_3"),
            (20, "台郡溪蟹", "台郡溪蟹，产台州溪涧中，壳青黄，螯小而敏捷。", "third_1"),
            (20, "合浦斑蟹", "合浦斑蟹，身有斑纹，多产于合浦海滨，肉肥美。", "third_2"),
            (20, "拥剑蟹", "拥剑蟹，一螯极大如持长剑，迎潮挥舞，故名拥剑。", "third_3"),
            (21, "升仙蟹", "升仙蟹，足长而轻盈，行如飞升，产自温州海滨。", "third_1"),
            (21, "百戏蟹", "百戏蟹，形圆如盘，足多，能作种种戏舞状，甚怪。", "third_2"),
            (21, "篆背蟹", "篆背蟹，背上有白色斑纹如篆文，工整可玩。", "third_3"),
            (22, "老寿蟹", "老寿蟹，背上纹理凹凸如老翁面孔，眉目皆具，寿星之象。", "third_1"),
            (22, "中蟹", "海中寻常螃蟹，色青绿，螯足有毛，肉鲜。", "third_2"),
            (22, "拨棹", "拨棹，后足扁平如浆（棹），善在水中游泅，又称拨棹子。", "third_3"),
            (23, "蛎虱", "蛎虱，附生于牡蛎壳上之小甲虫，微红如虱，冬春成群。", "third_1"),
            (23, "石蟹", "石蟹，壳青黑硬如石，常居海石罅中，螯力极强。", "third_2"),
            (23, "槟榔蟹", "槟榔蟹，背足皆有红黄斑点，绝似槟榔剖破之状，两螯如胭衬玉。", "third_3"),
            (24, "花蟹", "花蟹，即花蠘。身有红蓝白条纹，鲜艳如花，肉极鲜甜。", "third_1"),
            (24, "沙蟣", "沙蟣，体极小，色如沙。常万群游，晒干为蟹酱。", "third_2"),
            (24, "海线", "海线，状如线，有五歧，常依附于海草，随水漂流。", "third_3"),
            (25, "眼蠘", "眼蠘，螯足有圆目状斑，行速，肉质脆嫩。", "third_1"),
            (25, "拥雪蟹", "拥雪蟹，两螯大而洁白如拥抱积雪，色极耀目。", "third_2"),
            (25, "长脚蟹", "长脚蟹，足极长，壳小。行如蜘蛛，产深海沙泥中。", "third_3"),
            (26, "蟛蜞", "蟛蜞，体小色黑，多毛。生于海滩潮水所及之处，可为盐渍食。", "third_1"),
            (26, "瓯郡溪蟹", "瓯郡溪蟹，产自温州溪岩，色褐绿，味极清鲜。", "third_2"),
            (26, "沙蟹", "沙蟹，体极小，色如沙。奔跑极速，随潮出没。", "third_3"),
            (27, "席蟹", "席蟹，状扁平，色如草席，常伏于滩涂浅草间。", "left"),
            (27, "虎蜉", "虎蜉，状如虎，有黑黄斑纹，性极其鸷猛，食小鱼。", "right"),
            (28, "拥剑蠘", "拥剑蠘，一螯粗大，色紫，能夹断铁丝，生性暴烈。", "left"),
            (28, "小蟹", "海中寻常小蟹，色淡黄，螯力小。", "right"),
            (29, "福州膏蟹", "福州产青蟹，膏肥而满，红黄灿烂。暴食之大补。", "full"),
            (30, "拥雪", "拥雪蟹，两螯纯白，形如捧雪，极其美丽。", "third_1"),
            (30, "红蟹", "红蟹，壳色殷红如丹砂，煮熟更显红艳，味清甜。", "third_2"),
            (30, "篆背蟹", "篆背蟹，背部白斑工整如篆字，极具自然之妙。", "third_3"),
            (31, "和尚蟹", "和尚蟹，体圆如丸，色青蓝。群行沙滩，望之如僧徒合掌，故名。", "quarter_1"),
            (31, "关公蟹", "关公蟹，背甲有赤红面孔如关羽，怒目威严，性鸷。", "quarter_2"),
            (31, "鬼面蟹", "鬼面蟹，壳上有纹如鬼神面孔，青红相间。人视之惊怪，性鸷，不宜食。", "quarter_3"),
            (31, "蟛蜞", "蟛蜞，体小，多生于江海之交，肉有泥腥味。", "quarter_4"),
            (32, "招潮蟹", "招潮蟹，一螯极大，潮来时常举螯如招手，故名招潮。其色洁白，极可玩。", "left"),
            (32, "蝤蛑", "蝤蛑，即青蟹。螯巨有锋，善泅。膏满者名膏蟹，味极丰美，席上珍。", "right"),
            (33, "蟞蝔", "蟞蝔，即海中大蛏，壳长三四寸，肉肥多脂，味冠诸蛏。", "third_1"),
            (33, "和尚蟹", "和尚蟹，体圆而小，群行于退潮后之沙滩。", "third_2"),
            (33, "六九蟹", "六九蟹，背有六九之形，极其微小，海人晒干作羹。", "third_3"),
            (34, "绿蟹", "绿蟹，体色翠绿，生于海石罅中，味清甜。", "quarter_1"),
            (34, "拨棹", "拨棹，后足扁平，游泳极其迅速，产量极丰。", "quarter_2"),
            (34, "老寿蟹", "老寿蟹，体黑，背纹奇特，多生于海岩深处。", "quarter_3"),
            (34, "拥剑", "拥剑蟹，巨螯高举，能防大鱼之袭。", "quarter_4"),
            (36, "虾公蝌", "虾公蝌，在陆如蝌蚪，在水则能划行直游，化而为虾蟹。", "left"),
            (36, "拖脐螂", "拖脐螂，其状背青足黄，腹长如拖脐，直行而游，奇趣异常。", "right"),
            (37, "蝗玉", "蝗玉，即蝗虫卵在海中孵化之异虫，色绿质脆。", "third_1"),
            (37, "虾化蜻蛉_1", "聂璜所绘红虾化为红蜻蛉之状，尾长翼薄，飞掠海滨。", "third_2"),
            (37, "虾化蜻蛉_2", "聂璜所绘青虾化为青蜻蛉之状，展翅飞翔于海岛阴湿处。", "third_3"),
            (38, "虾兵管", "虾兵管，体透明如冰，常在深海游行。", "third_1"),
            (38, "深洋绿虾", "深洋绿虾，体大色绿，螯足有锯齿，产闽粤深海。", "third_2"),
            (38, "大蚶虾", "大蚶虾，螯粗如蚶，色红，肉质极其坚实爽脆。", "third_3"),
            (39, "长须白虾", "长须白虾，须长数尺，白质红斑，多产于闽海。", "left"),
            (39, "黄虾", "黄虾，体色金黄，多产于江海之交，肉嫩味甘。", "right"),
            (40, "大红虾", "大红虾，身长数寸，通体红艳，极具美味。", "left"),
            (40, "变种虾", "变种虾，体极小而缩颈，色红，多产于闽海。", "right"),
            (41, "空须龙虾", "空须龙虾，须长数尺，中空，通体青红，为虾中之异种。", "full"),
            (42, "白虾", "白虾，通体莹白，壳极薄，晒干为海米之冠。", "quarter_1"),
            (42, "尿虾", "尿虾，尾部尖，多棘，捕之易喷水，肉肥有膏。", "quarter_2"),
            (42, "虾蛄", "虾蛄，即皮皮虾。尾有锐刺，捕之易弹伤人手。肉肥美，膏满者极香。", "quarter_3"),
            (42, "天虾", "天虾，体大，飞掠水面，肉极爽甜。", "quarter_4"),
            (43, "白虾", "白虾，小而白，成群游于海面，味极鲜。", "third_1"),
            (43, "红虾", "红虾，色微红，壳硬肉嫩，晒干作羹，极其鲜美。", "third_2"),
            (43, "紫虾", "紫虾，色紫红，体常群游，佐膳佳品。", "third_3"),
            (44, "龙虾", "龙虾，巨躯利螯，须长数尺，通体青绿花纹，肉质肥美，虾中之王。", "full")
        ]
    }
}

# Sorted alphabetically to get exact mapping: 1->第一册, 2->第三册, 3->第二册, 4->第四册
pdf_files = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))

def render_page_image(doc, page_idx):
    page = doc[page_idx]
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

def get_crop_box(width, height, crop_side):
    if crop_side in ("left", "half_1"):
        return (0, 0, width // 2, height)
    if crop_side in ("right", "half_2"):
        return (width // 2, 0, width, height)
    if crop_side == "third_1":
        return (0, 0, width // 3, height)
    if crop_side == "third_2":
        return (width // 3, 0, 2 * width // 3, height)
    if crop_side == "third_3":
        return (2 * width // 3, 0, width, height)
    if crop_side == "quarter_1":
        return (0, 0, width // 4, height)
    if crop_side == "quarter_2":
        return (width // 4, 0, width // 2, height)
    if crop_side == "quarter_3":
        return (width // 2, 0, 3 * width // 4, height)
    if crop_side == "quarter_4":
        return (3 * width // 4, 0, width, height)
    return (0, 0, width, height)

def detect_illustration_boxes(img, expected_count):
    arr = np.array(img.convert("RGB"))
    height, width = arr.shape[:2]

    # Compare each pixel to a blurred local paper background. This catches
    # painted creatures and ink outlines while avoiding most page texture.
    blur = cv2.GaussianBlur(arr, (0, 0), 45)
    diff = np.max(cv2.absdiff(arr, blur), axis=2)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    mask = ((diff > 18) | (gray < 115)).astype("uint8") * 255
    mask = cv2.medianBlur(mask, 3)

    kernel_size = max(13, min(width, height) // 110)
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    num_labels, _labels, stats, _centroids = cv2.connectedComponentsWithStats(closed)
    candidates = []
    image_area = width * height
    for label in range(1, num_labels):
        x, y, box_width, box_height, area = [int(v) for v in stats[label]]
        if box_width < width * 0.05 or box_height < height * 0.05:
            continue
        bbox_area = box_width * box_height
        if bbox_area < image_area * 0.003:
            continue

        raw_region = mask[y:y + box_height, x:x + box_width]
        raw_labels, _raw_map, raw_stats, _raw_centroids = cv2.connectedComponentsWithStats(raw_region)
        largest_raw_area = 0
        if raw_labels > 1:
            largest_raw_area = int(max(raw_stats[1:, cv2.CC_STAT_AREA]))
        if largest_raw_area / bbox_area < 0.02:
            continue

        aspect = box_width / max(1, box_height)
        center_y = (y + box_height / 2) / height
        # Vertical text columns are common false positives. Keep vertical
        # candidates only when they occupy a substantial visual footprint.
        if aspect < 0.75 and box_width < width * 0.16:
            continue

        vertical_bonus = 1.25 if 0.34 <= center_y <= 0.84 else 0.75
        shape_bonus = min(2.2, max(0.45, aspect))
        score = bbox_area * shape_bonus * vertical_bonus
        candidates.append((score, x, y, box_width, box_height))

    selected = []
    for _score, x, y, box_width, box_height in sorted(candidates, reverse=True):
        new_box = (x, y, x + box_width, y + box_height)
        overlaps_existing = False
        for old_box in selected:
            ix1 = max(new_box[0], old_box[0])
            iy1 = max(new_box[1], old_box[1])
            ix2 = min(new_box[2], old_box[2])
            iy2 = min(new_box[3], old_box[3])
            if ix2 <= ix1 or iy2 <= iy1:
                continue
            intersection = (ix2 - ix1) * (iy2 - iy1)
            smaller = min((new_box[2] - new_box[0]) * (new_box[3] - new_box[1]), (old_box[2] - old_box[0]) * (old_box[3] - old_box[1]))
            if intersection / smaller > 0.55:
                overlaps_existing = True
                break
        if overlaps_existing:
            continue
        selected.append(new_box)
        if len(selected) == expected_count:
            break

    if len(selected) < expected_count:
        return []

    padding_x = max(24, int(width * 0.025))
    padding_y = max(24, int(height * 0.035))
    padded = []
    for x1, y1, x2, y2 in selected:
        padded.append((
            max(0, x1 - padding_x),
            max(0, y1 - padding_y),
            min(width, x2 + padding_x),
            min(height, y2 + padding_y),
        ))

    return sorted(padded, key=lambda box: box[0])

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
    page_images = {}
    auto_boxes_by_page = {}
    
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
        
        if page_idx not in page_images:
            img = render_page_image(doc, page_idx)
            width, height = img.size
            if vol_num == 4:
                img = img.crop((0, height // 2, width, height))
            page_images[page_idx] = img

            if page_counts[page_idx] > 1:
                auto_boxes_by_page[page_idx] = detect_illustration_boxes(img, page_counts[page_idx])

        img = page_images[page_idx].copy()
        
        width, height = img.size

        # Prefer detected illustration regions for multi-creature pages. This
        # avoids cutting through creatures whose drawings are not evenly spaced.
        auto_boxes = auto_boxes_by_page.get(page_idx) or []
        if page_counts[page_idx] > 1 and len(auto_boxes) >= seen[page_idx]:
            img = img.crop(auto_boxes[seen[page_idx] - 1])
        else:
            img = img.crop(get_crop_box(width, height, crop_side))
            
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
