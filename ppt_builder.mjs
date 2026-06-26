import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const W = 1280;
const H = 720;
const FONT = "Tahoma";
const COLORS = {
  navy: "#12304A",
  blue: "#176B87",
  teal: "#00A6A6",
  green: "#2E8B57",
  red: "#C64B4B",
  ink: "#17324D",
  muted: "#607386",
  line: "#D7E1E8",
  pale: "#F4F8FA",
  white: "#FFFFFF",
  amber: "#E9A23B",
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    args[argv[index].replace(/^--/, "")] = argv[index + 1];
  }
  return args;
}

function rtl(text) {
  return `\u200F${text}`;
}

function addShape(slide, name, left, top, width, height, fill, radius = "rounded-md") {
  const shape = {
    geometry: radius === "none" ? "rect" : "roundRect",
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: fill, width: 0 },
  };
  if (radius !== "none") shape.borderRadius = radius;
  return slide.shapes.add(shape);
}

function addText(slide, name, text, position, style = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = rtl(text);
  box.text.style = {
    fontSize: style.fontSize ?? 24,
    bold: style.bold ?? false,
    color: style.color ?? COLORS.ink,
    alignment: style.alignment ?? "right",
    verticalAlignment: style.verticalAlignment ?? "middle",
    autoFit: style.autoFit ?? "shrinkText",
    wrap: "square",
    typeface: FONT,
    insets: style.insets ?? { left: 8, right: 8, top: 4, bottom: 4 },
  };
  return box;
}

function addChrome(slide, title, page) {
  slide.background.fill = COLORS.white;
  addShape(slide, "top-rule", 0, 0, W, 12, COLORS.teal, "none");
  addText(
    slide,
    "slide-title",
    title,
    { left: 580, top: 34, width: 628, height: 58 },
    { fontSize: 45, bold: true, color: COLORS.navy },
  );
  addText(
    slide,
    "section-label",
    "گزارش مدیریت CPR",
    { left: 72, top: 44, width: 300, height: 36 },
    { fontSize: 17, color: COLORS.muted, alignment: "left" },
  );
  addShape(slide, "footer-rule", 72, 680, 1136, 1, COLORS.line, "none");
  addText(
    slide,
    "page-number",
    String(page),
    { left: 72, top: 684, width: 50, height: 24 },
    { fontSize: 14, color: COLORS.muted, alignment: "left", insets: { left: 0, right: 0, top: 0, bottom: 0 } },
  );
  addText(
    slide,
    "footer",
    "بیمارستان قلب شهید چمران اصفهان | سه ماهه اول ۱۴۰۵",
    { left: 700, top: 684, width: 508, height: 24 },
    { fontSize: 14, color: COLORS.muted, insets: { left: 0, right: 0, top: 0, bottom: 0 } },
  );
}

function addKpi(slide, { left, top, width, label, value, accent, note }) {
  addShape(slide, `${label}-card`, left, top, width, 118, COLORS.pale);
  addShape(slide, `${label}-accent`, left + width - 7, top, 7, 118, accent, "none");
  addText(
    slide,
    `${label}-label`,
    label,
    { left: left + 18, top: top + 14, width: width - 38, height: 30 },
    { fontSize: 17, color: COLORS.muted },
  );
  addText(
    slide,
    `${label}-value`,
    String(value),
    { left: left + 18, top: top + 42, width: width - 38, height: 48 },
    { fontSize: 35, bold: true, color: accent },
  );
  if (note) {
    addText(
      slide,
      `${label}-note`,
      note,
      { left: left + 18, top: top + 88, width: width - 38, height: 22 },
      { fontSize: 13, color: COLORS.muted },
    );
  }
}

function addInsight(slide, label, value, top, color = COLORS.blue) {
  addShape(slide, `${label}-insight`, 72, top, 390, 74, COLORS.pale);
  addShape(slide, `${label}-bar`, 72, top, 6, 74, color, "none");
  addText(
    slide,
    `${label}-text`,
    `${label}: ${value}`,
    { left: 92, top: top + 8, width: 350, height: 58 },
    { fontSize: 18, bold: true },
  );
}

function addChartTitle(slide, text, left, top, width) {
  addText(
    slide,
    `${text}-chart-title`,
    text,
    { left, top, width, height: 34 },
    { fontSize: 19, bold: true, color: COLORS.navy, alignment: "center" },
  );
}

function addBarChart(slide, { title, categories, values, position, horizontal = false, percent = false, color = COLORS.blue }) {
  addChartTitle(slide, title, position.left, position.top, position.width);
  return slide.charts.add("bar", {
    position: { ...position, top: position.top + 34, height: position.height - 34 },
    categories: categories.map((value) => rtl(String(value))),
    series: [{ name: rtl(title), values, fill: color }],
    barOptions: {
      direction: horizontal ? "bar" : "column",
      grouping: "clustered",
      gapWidth: horizontal ? 34 : 62,
    },
    hasLegend: false,
    xAxis: horizontal
      ? {
          min: 0,
          max: percent ? 100 : undefined,
          numberFormatCode: percent ? '0"%"' : "0",
          majorGridlines: { style: "solid", fill: COLORS.line, width: 1 },
          textStyle: { fill: COLORS.muted, fontSize: 12 },
        }
      : {
          textStyle: { fill: COLORS.muted, fontSize: 12 },
          majorGridlines: null,
        },
    yAxis: horizontal
      ? {
          textStyle: { fill: COLORS.ink, fontSize: categories.length > 10 ? 10 : 12 },
          majorGridlines: null,
        }
      : {
          min: 0,
          max: percent ? 100 : undefined,
          numberFormatCode: percent ? '0"%"' : "0",
          majorGridlines: { style: "solid", fill: COLORS.line, width: 1 },
          textStyle: { fill: COLORS.muted, fontSize: 12 },
        },
    dataLabels: {
      showValue: true,
      position: "outEnd",
      textStyle: { fill: COLORS.ink, fontSize: 11, bold: true },
    },
    chartFill: COLORS.white,
    chartLine: { style: "solid", fill: COLORS.line, width: 1 },
    plotAreaFill: COLORS.white,
    plotAreaLine: { style: "solid", fill: COLORS.white, width: 0 },
  });
}

function addLineChart(slide, { title, categories, values, position, percent = false, color = COLORS.teal }) {
  addChartTitle(slide, title, position.left, position.top, position.width);
  return slide.charts.add("line", {
    position: { ...position, top: position.top + 34, height: position.height - 34 },
    categories: categories.map((value) => rtl(String(value))),
    series: [{
      name: rtl(title),
      values,
      line: { style: "solid", fill: color, width: 4 },
      marker: { symbol: "circle", size: 8 },
    }],
    hasLegend: false,
    lineOptions: { smooth: false },
    xAxis: {
      textStyle: { fill: COLORS.muted, fontSize: 12 },
      majorGridlines: null,
    },
    yAxis: {
      min: 0,
      max: percent ? 100 : undefined,
      numberFormatCode: percent ? '0"%"' : "0",
      majorGridlines: { style: "solid", fill: COLORS.line, width: 1 },
      textStyle: { fill: COLORS.muted, fontSize: 12 },
    },
    dataLabels: {
      showValue: true,
      position: "outEnd",
      textStyle: { fill: COLORS.ink, fontSize: 11, bold: true },
    },
    chartFill: COLORS.white,
    chartLine: { style: "solid", fill: COLORS.line, width: 1 },
    plotAreaFill: COLORS.white,
    plotAreaLine: { style: "solid", fill: COLORS.white, width: 0 },
  });
}

function addDoughnutChart(slide, { title, categories, values, position }) {
  addChartTitle(slide, title, position.left, position.top, position.width);
  return slide.charts.add("doughnut", {
    position: { ...position, top: position.top + 34, height: position.height - 34 },
    categories: categories.map((value) => rtl(String(value))),
    series: [{
      name: rtl(title),
      values,
      points: [
        { idx: 0, fill: COLORS.green },
        { idx: 1, fill: COLORS.red },
      ],
    }],
    doughnutOptions: { holeSize: 58 },
    hasLegend: true,
    legend: {
      position: "bottom",
      textStyle: { fill: COLORS.ink, fontSize: 12 },
    },
    dataLabels: {
      showValue: true,
      showPercent: true,
      position: "outEnd",
      textStyle: { fill: COLORS.ink, fontSize: 11, bold: true },
    },
    chartFill: COLORS.white,
    chartLine: { style: "solid", fill: COLORS.line, width: 1 },
  });
}

function heatColor(value, maximum) {
  if (!maximum || value === 0) return "#F1F6F7";
  const ratio = value / maximum;
  if (ratio >= 0.75) return "#148A8A";
  if (ratio >= 0.5) return "#55B6B3";
  if (ratio >= 0.25) return "#A7D9D5";
  return "#D8ECEA";
}

function addHeatmap(slide, { title, matrix, position }) {
  addChartTitle(slide, title, position.left, position.top, position.width);
  const columns = matrix.columns;
  const values = [
    columns.map((value) => rtl(value)),
    ...matrix.rows.map((row) => columns.map((column) => row[column] ?? 0)),
  ];
  const table = slide.tables.add({
    rows: values.length,
    columns: columns.length,
    left: position.left,
    top: position.top + 40,
    width: position.width,
    height: position.height - 40,
    values,
  });
  table.borders.assign({ style: "solid", fill: COLORS.white, width: 1 });
  const numericValues = matrix.rows.flatMap((row) => columns.slice(1).map((column) => Number(row[column] ?? 0)));
  const maximum = Math.max(...numericValues, 0);
  for (let column = 0; column < columns.length; column += 1) {
    const cell = table.getCell(0, column);
    cell.fill = COLORS.navy;
    cell.text.style = { color: COLORS.white, bold: true, fontSize: 11, alignment: "center" };
  }
  for (let row = 1; row < values.length; row += 1) {
    const labelCell = table.getCell(row, 0);
    labelCell.fill = COLORS.pale;
    labelCell.text.style = { color: COLORS.ink, bold: true, fontSize: matrix.rows.length > 10 ? 9 : 11, alignment: "right" };
    for (let column = 1; column < columns.length; column += 1) {
      const cell = table.getCell(row, column);
      const value = Number(values[row][column] ?? 0);
      cell.fill = heatColor(value, maximum);
      cell.text.style = {
        color: value / (maximum || 1) >= 0.5 ? COLORS.white : COLORS.ink,
        bold: true,
        fontSize: 11,
        alignment: "center",
      };
    }
  }
  return table;
}

async function buildDeck(data) {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  const k = data.kpis;

  // 1. Title
  {
    const slide = presentation.slides.add();
    slide.background.fill = COLORS.navy;
    addShape(slide, "title-accent", 0, 0, 18, H, COLORS.teal, "none");
    addText(
      slide,
      "hospital",
      k.hospital_name,
      { left: 600, top: 72, width: 600, height: 52 },
      { fontSize: 25, color: "#B9D3DF", bold: true },
    );
    addText(
      slide,
      "main-title",
      "گزارش عملکرد احیای قلبی ریوی",
      { left: 310, top: 205, width: 890, height: 100 },
      { fontSize: 64, bold: true, color: COLORS.white },
    );
    addText(
      slide,
      "cpr-title",
      "CPR",
      { left: 72, top: 205, width: 250, height: 100 },
      { fontSize: 66, bold: true, color: COLORS.teal, alignment: "left" },
    );
    addShape(slide, "title-rule", 72, 337, 1128, 2, "#3A566C", "none");
    addText(
      slide,
      "period",
      k.report_period,
      { left: 720, top: 365, width: 480, height: 58 },
      { fontSize: 29, color: COLORS.white, bold: true },
    );
    addText(
      slide,
      "author",
      "تهیه‌کننده: کمیته CPR",
      { left: 72, top: 590, width: 360, height: 42 },
      { fontSize: 20, color: "#B9D3DF", alignment: "left" },
    );
    addText(
      slide,
      "event-count",
      `${k.total_events} رویداد معتبر`,
      { left: 865, top: 590, width: 335, height: 42 },
      { fontSize: 20, color: "#B9D3DF" },
    );
  }

  // 2. Dashboard
  {
    const slide = presentation.slides.add();
    addChrome(slide, "داشبورد مدیریتی", 2);
    const cardW = 254;
    addKpi(slide, { left: 72, top: 108, width: cardW, label: "کل رویدادها", value: k.total_events, accent: COLORS.navy, note: "پس از حذف رکورد تکراری" });
    addKpi(slide, { left: 342, top: 108, width: cardW, label: "احیای موفق", value: k.success_count, accent: COLORS.green });
    addKpi(slide, { left: 612, top: 108, width: cardW, label: "احیای ناموفق", value: k.failure_count, accent: COLORS.red });
    addKpi(slide, { left: 882, top: 108, width: cardW, label: "نرخ موفقیت", value: `${k.success_rate}%`, accent: COLORS.teal });
    addLineChart(slide, {
      title: "روند نرخ موفقیت ماهانه",
      categories: data.monthly.map((row) => row["ماه"]),
      values: data.monthly.map((row) => row.success_rate),
      position: { left: 72, top: 244, width: 730, height: 410 },
      percent: true,
    });
    addDoughnutChart(slide, {
      title: "ترکیب نتایج",
      categories: ["موفق", "ناموفق"],
      values: [k.success_count, k.failure_count],
      position: { left: 828, top: 244, width: 380, height: 410 },
    });
  }

  // 3. Outcome and volume
  {
    const slide = presentation.slides.add();
    addChrome(slide, "نتیجه و حجم رویدادها", 3);
    addDoughnutChart(slide, {
      title: "نتیجه احیا",
      categories: ["موفق", "ناموفق"],
      values: [k.success_count, k.failure_count],
      position: { left: 72, top: 112, width: 546, height: 410 },
    });
    addBarChart(slide, {
      title: "تعداد رویدادهای ماهانه",
      categories: data.monthly.map((row) => row["ماه"]),
      values: data.monthly.map((row) => row.total),
      position: { left: 662, top: 112, width: 546, height: 410 },
    });
    addInsight(slide, "بیشترین حجم بخش", `${k.top_department}، ${k.top_department_count} رویداد`, 548, COLORS.blue);
    addInsight(slide, "پرتراکم‌ترین شیفت", `${k.top_shift}، ${k.top_shift_count} رویداد`, 548, COLORS.teal);
    addText(slide, "outcome-note", `${k.failure_count - k.success_count} مورد فاصله میان احیای ناموفق و موفق ثبت شده است.`, { left: 500, top: 558, width: 708, height: 52 }, { fontSize: 20, bold: true, color: COLORS.red });
  }

  // 4. Monthly performance
  {
    const slide = presentation.slides.add();
    addChrome(slide, "عملکرد ماهانه", 4);
    addLineChart(slide, {
      title: "نرخ موفقیت ماهانه",
      categories: data.monthly.map((row) => row["ماه"]),
      values: data.monthly.map((row) => row.success_rate),
      position: { left: 478, top: 118, width: 730, height: 430 },
      percent: true,
    });
    addInsight(slide, "بهترین ماه", `${k.best_month}، ${k.best_month_rate}%`, 146, COLORS.green);
    addInsight(slide, "کمترین نرخ", `${k.lowest_month}، ${k.lowest_month_rate}%`, 238, COLORS.red);
    addInsight(slide, "میانگین کل", `${k.success_rate}%`, 330, COLORS.teal);
    addText(slide, "monthly-takeaway", "نوسان ماهانه نشان می‌دهد پایش فرآیند و ترکیب تیم‌ها باید در سطح ماه و شیفت ادامه یابد.", { left: 72, top: 446, width: 390, height: 112 }, { fontSize: 21, bold: true, color: COLORS.navy });
  }

  // 5-9 paired charts
  // 5. Age
  {
    const slide = presentation.slides.add();
    addChrome(slide, "نمای سنی بیماران", 5);
    addBarChart(slide, {
      title: "توزیع گروه‌های سنی",
      categories: data.age_groups.map((row) => row["گروه سنی"]),
      values: data.age_groups.map((row) => row.total),
      position: { left: 72, top: 112, width: 550, height: 455 },
    });
    addBarChart(slide, {
      title: "نرخ موفقیت گروه‌های سنی",
      categories: data.age_groups.map((row) => row["گروه سنی"]),
      values: data.age_groups.map((row) => row.success_rate),
      position: { left: 658, top: 112, width: 550, height: 455 },
      percent: true,
      color: COLORS.teal,
    });
    addShape(slide, "takeaway-box", 72, 582, 1136, 72, COLORS.pale);
    addText(slide, "takeaway", `میانگین سن ${k.avg_age} و میانه سن ${k.median_age} سال است.`, { left: 96, top: 590, width: 1080, height: 54 }, { fontSize: 19, bold: true, color: COLORS.navy });
  }

  // 6. Departments
  {
    const slide = presentation.slides.add();
    addChrome(slide, "عملکرد بخش‌ها", 6);
    const volume = [...data.departments].sort((a, b) => a.total - b.total);
    const rates = [...data.departments].sort((a, b) => a.success_rate - b.success_rate);
    addBarChart(slide, {
      title: "فراوانی CPR در بخش‌ها",
      categories: volume.map((row) => row["بخش"]),
      values: volume.map((row) => row.total),
      position: { left: 72, top: 112, width: 550, height: 455 },
      horizontal: true,
    });
    addBarChart(slide, {
      title: "نرخ موفقیت بخش‌ها",
      categories: rates.map((row) => row["بخش"]),
      values: rates.map((row) => row.success_rate),
      position: { left: 658, top: 112, width: 550, height: 455 },
      horizontal: true,
      percent: true,
      color: COLORS.teal,
    });
    addShape(slide, "takeaway-box", 72, 582, 1136, 72, COLORS.pale);
    addText(slide, "takeaway", `${k.top_department} با ${k.top_department_count} رویداد، بیشترین حجم CPR را داشته است.`, { left: 96, top: 590, width: 1080, height: 54 }, { fontSize: 19, bold: true, color: COLORS.navy });
  }

  // 7. Shifts
  {
    const slide = presentation.slides.add();
    addChrome(slide, "عملکرد شیفت‌ها", 7);
    addBarChart(slide, {
      title: "فراوانی CPR در شیفت‌ها",
      categories: data.shifts.map((row) => row["شیفت"]),
      values: data.shifts.map((row) => row.total),
      position: { left: 72, top: 112, width: 550, height: 455 },
    });
    addBarChart(slide, {
      title: "نرخ موفقیت شیفت‌ها",
      categories: data.shifts.map((row) => row["شیفت"]),
      values: data.shifts.map((row) => row.success_rate),
      position: { left: 658, top: 112, width: 550, height: 455 },
      percent: true,
      color: COLORS.teal,
    });
    addShape(slide, "takeaway-box", 72, 582, 1136, 72, COLORS.pale);
    addText(slide, "takeaway", `شیفت ${k.top_shift} با ${k.top_shift_count} رویداد، پرتراکم‌ترین شیفت بوده است.`, { left: 96, top: 590, width: 1080, height: 54 }, { fontSize: 19, bold: true, color: COLORS.navy });
  }

  // 8. Supervisors
  {
    const slide = presentation.slides.add();
    addChrome(slide, "عملکرد سوپروایزرها", 8);
    const volume = [...data.supervisors].sort((a, b) => a.total - b.total);
    const rates = [...data.supervisors].sort((a, b) => a.success_rate - b.success_rate);
    addBarChart(slide, {
      title: "فراوانی حضور سوپروایزرها",
      categories: volume.map((row) => row["سوپروایزر حاضر بر احیا"]),
      values: volume.map((row) => row.total),
      position: { left: 72, top: 112, width: 550, height: 455 },
      horizontal: true,
    });
    addBarChart(slide, {
      title: "نرخ موفقیت سوپروایزرها",
      categories: rates.map((row) => row["سوپروایزر حاضر بر احیا"]),
      values: rates.map((row) => row.success_rate),
      position: { left: 658, top: 112, width: 550, height: 455 },
      horizontal: true,
      percent: true,
      color: COLORS.teal,
    });
    addShape(slide, "takeaway-box", 72, 582, 1136, 72, COLORS.pale);
    addText(slide, "takeaway", `${k.best_supervisor} با نرخ ${k.best_supervisor_rate}% در ${k.best_supervisor_cases} مورد، بهترین عملکرد واجد حداقل حجم را ثبت کرده است.`, { left: 96, top: 590, width: 1080, height: 54 }, { fontSize: 19, bold: true, color: COLORS.navy });
  }

  // 9. Heatmaps
  {
    const slide = presentation.slides.add();
    addChrome(slide, "الگوی تراکم رویدادها", 9);
    addHeatmap(slide, {
      title: "بخش و شیفت",
      matrix: data.department_shift,
      position: { left: 72, top: 112, width: 650, height: 455 },
    });
    addHeatmap(slide, {
      title: "ماه و شیفت",
      matrix: data.month_shift,
      position: { left: 752, top: 112, width: 456, height: 300 },
    });
    addText(slide, "heatmap-note", "سلول تیره‌تر نشان‌دهنده تعداد بیشتر رویداد است.", { left: 752, top: 440, width: 456, height: 70 }, { fontSize: 20, bold: true, color: COLORS.navy });
    addShape(slide, "takeaway-box", 72, 582, 1136, 72, COLORS.pale);
    addText(slide, "takeaway", "نقشه‌های حرارتی نقاط تمرکز عملیاتی را برای برنامه‌ریزی نیروی انسانی مشخص می‌کنند.", { left: 96, top: 590, width: 1080, height: 54 }, { fontSize: 19, bold: true, color: COLORS.navy });
  }

  // 10. Management summary
  {
    const slide = presentation.slides.add();
    addChrome(slide, "جمع‌بندی مدیریتی", 10);
    const recommendations = [
      ["۱", "تمرکز بر ماه با کمترین نرخ", `بررسی علل افت ${k.lowest_month} با نرخ ${k.lowest_month_rate}% در سطح بخش و شیفت.`],
      ["۲", "استانداردسازی تجربه تیم برتر", `انتقال تجربه ${k.best_supervisor} به سایر تیم‌ها؛ رتبه‌بندی با حداقل ${k.minimum_supervisor_cases} مورد انجام شده است.`],
      ["۳", "مدیریت ظرفیت عملیاتی", `بازنگری پوشش نیروی انسانی در شیفت ${k.top_shift} و بخش ${k.top_department}.`],
      ["۴", "کنترل کیفیت داده", `${k.quality.duplicates_removed} رکورد تکراری حذف شد؛ کنترل تکرار و یکسان‌سازی نام‌ها در ورود داده الزامی است.`],
    ];
    recommendations.forEach(([number, heading, body], index) => {
      const top = 120 + index * 126;
      addShape(slide, `rec-${number}`, 72, top, 1136, 102, index % 2 === 0 ? COLORS.pale : "#EDF4F7");
      addShape(slide, `rec-num-${number}`, 1122, top + 19, 58, 58, index === 0 ? COLORS.red : COLORS.teal);
      addText(slide, `rec-num-text-${number}`, number, { left: 1122, top: top + 19, width: 58, height: 58 }, { fontSize: 28, bold: true, color: COLORS.white, alignment: "center" });
      addText(slide, `rec-head-${number}`, heading, { left: 676, top: top + 14, width: 420, height: 36 }, { fontSize: 23, bold: true, color: COLORS.navy });
      addText(slide, `rec-body-${number}`, body, { left: 110, top: top + 48, width: 986, height: 42 }, { fontSize: 17, color: COLORS.ink });
    });
  }

  return presentation;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = JSON.parse(await fs.readFile(args.data, "utf8"));
  await fs.mkdir(args.preview, { recursive: true });
  await fs.mkdir(path.dirname(args.output), { recursive: true });

  const presentation = await buildDeck(data);
  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(args.preview, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(args.preview, `${stem}.layout.json`), await layout.text(), "utf8");
  }
  const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(path.join(args.preview, "deck-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
  const output = await PresentationFile.exportPptx(presentation);
  await output.save(args.output);
  console.log(`PowerPoint saved: ${args.output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
