# -*- coding: utf-8 -*-

"""
CPR Reporting Engine
Configuration File
"""

# ======================================================
# HOSPITAL INFORMATION
# ======================================================

HOSPITAL_NAME = "بیمارستان قلب شهید چمران اصفهان"

REPORT_TITLE = "گزارش عملکرد احیای قلبی ریوی (CPR)"

REPORT_PERIOD = "سه ماهه اول سال 1405"

REPORT_AUTHOR = "کمیته CPR"

# ======================================================
# FILES
# ======================================================

INPUT_FILE = "CPR.xlsx"

OUTPUT_FOLDER = "output"

CHART_FOLDER = "charts"

OUTPUT_PPT = f"{OUTPUT_FOLDER}/CPR_Management_Report_Production.pptx"

# ======================================================
# FONT SETTINGS
# ======================================================

FONT_NAME = "B Nazanin"

TITLE_FONT_SIZE = 24

SUBTITLE_FONT_SIZE = 18

BODY_FONT_SIZE = 14

KPI_FONT_SIZE = 20

# ======================================================
# COLORS
# ======================================================

PRIMARY_COLOR = "#0B1F3A"       # Navy

SECONDARY_COLOR = "#1565C0"     # Medical Blue

SUCCESS_COLOR = "#2E7D32"

FAIL_COLOR = "#C62828"

BACKGROUND_COLOR = "#F5F7FA"

TEXT_COLOR = "#212121"

GRID_COLOR = "#DADADA"

# ======================================================
# KPI CARD COLORS
# ======================================================

CARD_1_COLOR = "#0B1F3A"

CARD_2_COLOR = "#1565C0"

CARD_3_COLOR = "#2E7D32"

CARD_4_COLOR = "#C62828"

CARD_5_COLOR = "#455A64"

CARD_6_COLOR = "#6A1B9A"

# ======================================================
# REQUIRED COLUMNS
# ======================================================

REQUIRED_COLUMNS = [
    "سن",
    "سوپروایزر حاضر بر احیا",
    "بخش",
    "شیفت",
    "ماه",
    "روز"
]

# ======================================================
# RESULT SETTINGS
# ======================================================

RESULT_COLUMN = "نتیجه"

SUCCESS_VALUE = "موفق"

FAIL_VALUE = "ناموفق"

# ======================================================
# MONTH ORDER
# ======================================================

MONTH_ORDER = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند"
]

# ======================================================
# AGE GROUPS
# ======================================================

AGE_BINS = [
    0,
    1,
    15,
    40,
    60,
    80,
    120
]

AGE_LABELS = [
    "نوزاد",
    "کودک",
    "جوان",
    "میانسال",
    "سالمند",
    "کهنسال"
]

# ======================================================
# CHART FILE NAMES
# ======================================================

CHART_FILES = {
    "dashboard": "01_dashboard.png",
    "outcome": "02_success_failure.png",
    "monthly_events": "03_monthly_events.png",
    "monthly_success": "04_monthly_success_rate.png",
    "age_distribution": "05_age_distribution.png",
    "age_success": "06_age_success.png",
    "department_volume": "07_department_volume.png",
    "department_success": "08_department_success.png",
    "shift_volume": "09_shift_volume.png",
    "shift_success": "10_shift_success.png",
    "supervisor_volume": "11_supervisor_volume.png",
    "supervisor_success": "12_supervisor_success.png",
    "department_shift_heatmap": "13_department_shift_heatmap.png",
    "month_shift_heatmap": "14_month_shift_heatmap.png"
}

# ======================================================
# SLIDE TITLES
# ======================================================

SLIDE_TITLES = [

    "داشبورد مدیریتی CPR",

    "نتیجه احیا",

    "روند ماهانه CPR",

    "نرخ موفقیت ماهانه",

    "توزیع سنی بیماران",

    "موفقیت بر اساس گروه سنی",

    "فراوانی CPR در بخش‌ها",

    "نرخ موفقیت بخش‌ها",

    "فراوانی CPR در شیفت‌ها",

    "نرخ موفقیت شیفت‌ها",

    "فعالیت سوپروایزرها",

    "نرخ موفقیت سوپروایزرها",

    "Heatmap بخش و شیفت",

    "Heatmap ماه و شیفت",

    "جمع‌بندی مدیریتی"
]

# ======================================================
# MANAGEMENT RECOMMENDATIONS
# ======================================================

RECOMMENDATIONS = [

    "پایش مستمر شاخص‌های CPR در تمامی بخش‌ها",

    "تمرکز ویژه بر بخش‌های دارای نرخ موفقیت پایین‌تر",

    "بازنگری فرآیندهای احیا در شیفت‌های پرتراکم",

    "انتقال تجربیات سوپروایزرهای موفق به سایر تیم‌ها",

    "تحلیل ماهانه روند CPR و ارائه گزارش مدیریتی"
]
