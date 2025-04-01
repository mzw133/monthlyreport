import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineUpload, HiChevronDown, HiOutlineChartBar, HiOutlineUsers, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import "rc-slider/assets/index.css";
import { sampleData } from "./test-data";

////////////////////////////////////////////////////////
// EXACT GERMAN -> ENGLISH MAPPING
////////////////////////////////////////////////////////
const METRIC_NAME_MAP = {
  // 1) Active Members
  "Aktive Mitglieder am Anfang des Monats": "Active members at the beginning of the month",
  "Zugänge": "New members per month",
  "Abgänge": "Lost members per month",
  "Aktive Mitglieder am Ende des Monats": "Active members at the end of the month",

  // 2) New Members
  "Neu hinzugefügte Mitglieder pro Monat": "New members added per month",
  "...davon über Online-Mitgliedsantrag": "...of which added via online membership application",
  "...davon manuell hinzugefügt": "...of which added manually",

  // 3) Category
  "Abteilungs-Mitglieder am Ende des Monats": "Category members at the end of the month",

  // 4) Plans
  "Mitglieder pro Beitrag am Ende des Monats": "Members per plan at the end of the month",

  // 5) Total Claim - EXACT MATCHES
  "Gesamtforderung pro Monat": "Total claim per month",
  "...davon aus Buchungsrechnungen": "...of that from booking invoices",
  "...davon sind Nicht-Mitglieder": "...of which are non members",

  // Reverse mapping for English input
  "Total claim per month": "Gesamtforderung pro Monat",
  "...of that from booking invoices": "...davon aus Buchungsrechnungen",
  "...of which are non members": "...davon sind Nicht-Mitglieder",

  // 6) Extra line from your screenshot
  "Erwartete Beitragseinnahmen in den nächsten 12 Monaten":
    "Approximate revenue forecast from plans next 12 months",
};

// Helper function to format metric names with month
const formatMetricName = (metricName, selectedMonth) => {
  if (metricName.includes('at the beginning of the month')) {
    return `Aktive Mitglieder am Anfang von ${selectedMonth}`;
  }
  if (metricName.includes('at the end of the month')) {
    return `Aktive Mitglieder am Ende von ${selectedMonth}`;
  }
  if (metricName.includes('Category members')) {
    return `Abteilungs-Mitglieder am Ende von ${selectedMonth}`;
  }
  if (metricName.includes('Members per plan')) {
    return `Mitglieder pro Beitrag am Ende von ${selectedMonth}`;
  }
  if (metricName.includes('New members')) {
    return `Neue Mitglieder im ${selectedMonth}`;
  }
  if (metricName.includes('Lost members')) {
    return `Verlorene Mitglieder im ${selectedMonth}`;
  }
  return `${metricName} (${selectedMonth})`;
};

// The English keys your code logic uses after mapping
const ALWAYS_SHOW_METRICS = [
  "Active members at the beginning of the month",
  "New members per month",
  "Lost members per month",
  "Active members at the end of the month",
  "New members added per month",
  "...of which added via online membership application",
  "...of which added manually",
  "Category members at the end of the month",
  "Members per plan at the end of the month",
  "Total claim per month"
];

// The top 4 summary
const SUMMARY_METRICS = [
  "Active members at the beginning of the month",
  "New members per month",
  "Lost members per month",
  "Active members at the end of the month",
];

// For expansions
const NEW_MEMBERS_KEY = "New members added per month";
const ONLINE_KEY = "...of which added via online membership application";
const MANUAL_KEY = "...of which added manually";
const TOTAL_CLAIM_KEY = "Total claim per month";
const CLAIM_INVOICES_KEY = "...of that from booking invoices";
const CLAIM_NON_MEMBERS_KEY = "...of which are non members";
const PLAN_KEY = "Members per plan at the end of the month";

// Updated card style using our new card class
const cardClass = "card p-6";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const MonthSelector = ({ startMonth, endMonth, onRangeChange, allMonths }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);

  const handleMonthChange = (month) => {
    onRangeChange(month, month);
    setIsOpen(false);
  };

  const handleStartMonthChange = (month) => {
    const startIdx = allMonths.indexOf(month);
    const endIdx = allMonths.indexOf(endMonth);
    if (startIdx > endIdx) {
      onRangeChange(month, month);
    } else {
      onRangeChange(month, endMonth);
    }
  };

  const handleEndMonthChange = (month) => {
    const startIdx = allMonths.indexOf(startMonth);
    const endIdx = allMonths.indexOf(month);
    if (endIdx < startIdx) {
      onRangeChange(month, month);
    } else {
      onRangeChange(startMonth, month);
    }
  };

  return (
    <div className="relative">
      <motion.div
        className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-900 font-medium px-2">
          {startMonth === endMonth 
            ? startMonth 
            : `${startMonth} - ${endMonth}`}
        </span>
        <HiChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Zeitraum auswählen</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRangeMode(false);
                    handleMonthChange(endMonth);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    !isRangeMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Einzelmonat
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRangeMode(true);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    isRangeMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Zeitraum
                </button>
              </div>
            </div>

            {!isRangeMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monat
                </label>
                <select
                  value={endMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {allMonths.slice(0, -1).map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Von
                  </label>
                  <select
                    value={startMonth}
                    onChange={(e) => handleStartMonthChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allMonths.slice(0, -1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bis
                  </label>
                  <select
                    value={endMonth}
                    onChange={(e) => handleEndMonthChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allMonths
                      .slice(0, -1)
                      .filter(month => allMonths.indexOf(month) >= allMonths.indexOf(startMonth))
                      .map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function MetricsDashboard({ initialData, onReset }) {
  const [data, setData] = useState([]);
  const [allMonths, setAllMonths] = useState([]);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("New members per month");
  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    totalClaim: false,
    plans: false
  });
  const [error, setError] = useState("");

  const handleRangeChange = (start, end) => {
    setStartMonth(start);
    setEndMonth(end);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Process initial data on mount
  useEffect(() => {
    if (initialData) {
      const headers = initialData[0];
      const rows = initialData.slice(1);

      // Convert rows -> { metric, Jan, Feb, ... }
      const metrics = rows
        .filter((row) => row[0])
        .map((row) => {
          let rawMetricName = row[0].trim();
          
          // Special handling for total claims
          if (rawMetricName === 'Gesamtforderung pro Monat') {
            rawMetricName = 'Gesamtforderung pro Monat';
          } else if (rawMetricName.startsWith('...davon aus Buchungsrechnungen')) {
            rawMetricName = '...davon aus Buchungsrechnungen';
          } else if (rawMetricName.startsWith('...davon sind Nicht-Mitglieder')) {
            rawMetricName = '...davon sind Nicht-Mitglieder';
          }

          const englishMetricName = METRIC_NAME_MAP[rawMetricName] || rawMetricName;
          
          console.log('Processing metric:', {
            raw: rawMetricName,
            english: englishMetricName,
            values: row.slice(1)
          });

          const obj = { metric: englishMetricName };
          for (let i = 1; i < headers.length; i++) {
            const monthLabel = headers[i];
            if (monthLabel) {
              // Convert string numbers to actual numbers
              let value = row[i];
              if (typeof value === 'string') {
                // First remove any currency symbols and spaces
                value = value.replace(/[€\s]/g, '');
                // Convert German number format (1.234,56 -> 1234.56)
                value = value.replace(/\./g, '').replace(',', '.');
                value = parseFloat(value);
              }
              obj[monthLabel] = !isNaN(value) ? value : 0; // Changed null to 0 for calculations
            }
          }
          return obj;
        });

      console.log('Processed metrics:', metrics);
      console.log('Total claim metrics:', metrics.filter(m => 
        m.metric === TOTAL_CLAIM_KEY || 
        m.metric === CLAIM_INVOICES_KEY || 
        m.metric === CLAIM_NON_MEMBERS_KEY
      ));

      const dynamicMonths = headers.slice(1).filter(Boolean);
      setData(metrics);
      setAllMonths(dynamicMonths);
      // Set initial range to last valid month
      const lastValidMonth = dynamicMonths[dynamicMonths.length - 2];
      setStartMonth(lastValidMonth);
      setEndMonth(lastValidMonth);
    }
  }, [initialData]);

  //////////////////////////////////////////////////////////////////////
  // 1) Upload & parse the XLSX file (German -> English mapping)
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      const wb = XLSX.read(bstr, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!raw || !raw.length) {
        console.warn("No rows found in the uploaded file.");
        return;
      }

      const headers = raw[0];
      const rows = raw.slice(1);

      // Convert rows -> { metric, Jan, Feb, ... }
      const metrics = rows
        .filter((row) => row[0])
        .map((row) => {
          const rawMetricName = row[0].trim();
          const englishMetricName = METRIC_NAME_MAP[rawMetricName] || rawMetricName;

          const obj = { metric: englishMetricName };
          for (let i = 1; i < headers.length; i++) {
            const monthLabel = headers[i];
            if (monthLabel) {
              obj[monthLabel] = typeof row[i] === "number" ? row[i] : null;
            }
          }
          return obj;
        });

      const dynamicMonths = headers.slice(1).filter(Boolean);
      setData(metrics);
      setAllMonths(dynamicMonths);
      setStartMonth(dynamicMonths[0]);
      setEndMonth(dynamicMonths[dynamicMonths.length - 1]);
      setExpandedSections({
        categories: false,
        totalClaim: false,
        plans: false
      });
      console.log("Parsed data:", metrics);
    };

    reader.readAsBinaryString(file);
  };

  //////////////////////////////////////////////////////////////////////
  // 2) Filter the recognized metrics
  const filteredData = data.filter((m) => ALWAYS_SHOW_METRICS.includes(m.metric));

  // 3) Summaries
  const summaryData = filteredData.filter((m) => SUMMARY_METRICS.includes(m.metric));

  // 4) Others (besides the top 4 summary)
  let otherData = filteredData.filter((m) => !SUMMARY_METRICS.includes(m.metric));

  // We'll skip sub-lines for new members & total claim from normal listing
  otherData = otherData.filter(
    (m) => ![ONLINE_KEY, MANUAL_KEY, CLAIM_INVOICES_KEY, CLAIM_NON_MEMBERS_KEY].includes(m.metric)
  );

  //////////////////////////////////////////////////////////////////////
  // Helpers
  function getValue(metricObj, monthIndex, ignoreFirstMonth = false) {
    if (monthIndex < 0) return 0;
    if (ignoreFirstMonth && monthIndex === 0) return null;
    // Ignore last month
    if (monthIndex === allMonths.length - 1) return null;
    const monthName = allMonths[monthIndex];
    if (!monthName) return 0;
    
    // If we're looking at a range, handle special cases
    if (startMonth !== endMonth) {
      const startIdx = allMonths.indexOf(startMonth);
      const endIdx = allMonths.indexOf(endMonth);
      
      // For "Active members at the beginning of the month", use the start month value
      if (metricObj.metric?.includes('Active members at the beginning of')) {
        // If it's the first month in the dataset, return null
        if (startIdx === 0) return null;
        return metricObj[startMonth] ?? 0;
      }
      
      // For metrics that should use end values
      if (metricObj.metric?.includes('Active members at the end of') ||
          metricObj.metric?.includes('Category members') ||
          metricObj.metric?.includes('Members per plan')) {
        return metricObj[endMonth] ?? 0;
      }
      
      // For new and lost members, sum up all values in the range
      if (metricObj.metric?.includes('New members per month') ||
          metricObj.metric?.includes('Lost members per month')) {
        let sum = 0;
        for (let i = startIdx; i <= endIdx; i++) {
          sum += metricObj[allMonths[i]] ?? 0;
        }
        return sum;
      }
      
      // For other metrics in the range
      if (monthIndex >= startIdx && monthIndex <= endIdx) {
        let sum = 0;
        for (let i = startIdx; i <= endIdx; i++) {
          sum += metricObj[allMonths[i]] ?? 0;
        }
        return sum;
      }
    }
    
    return metricObj[monthName] ?? 0;
  }

  function difference(current, prev) {
    if (current === null || prev === null) return { diff: null, percent: null };
    const diff = current - prev;
    
    // For ranges, adjust the comparison based on metric type
    if (startMonth !== endMonth) {
      const monthCount = allMonths.indexOf(endMonth) - allMonths.indexOf(startMonth) + 1;
      
      // For new and lost members, compare with previous period of same length
      const prevStartIdx = allMonths.indexOf(startMonth) - monthCount;
      const prevEndIdx = allMonths.indexOf(startMonth) - 1;
      
      if (prevStartIdx >= 0) {
        let prevSum = 0;
        for (let i = prevStartIdx; i <= prevEndIdx; i++) {
          prevSum += getValue({ ...metricObj, metric: metricObj.metric }, i) ?? 0;
        }
        const percent = prevSum > 0 ? ((diff / prevSum) * 100).toFixed(1) : "0";
        return { diff, percent };
      }
      
      // If we can't calculate previous period, just show the absolute numbers
      return { diff, percent: "0" };
    }
    
    const percent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0";
    return { diff, percent };
  }

  // Update the renameMetric function to handle the special case
  function renameMetric(metricName, monthName) {
    if (startMonth === endMonth) {
      return formatMetricName(metricName, monthName);
    }

    // Handle specific metrics differently in range mode
    if (metricName.includes('Active members at the beginning of')) {
      const startIdx = allMonths.indexOf(startMonth);
      if (startIdx === 0) {
        return `Aktive Mitglieder am Anfang von ${startMonth} (nicht verfügbar)`;
      }
      return `Aktive Mitglieder am Anfang von ${startMonth}`;
    }
    if (metricName.includes('Active members at the end of')) {
      return `Aktive Mitglieder am Ende von ${endMonth}`;
    }
    if (metricName.includes('Category members')) {
      return `Abteilungs-Mitglieder am Ende von ${endMonth}`;
    }
    if (metricName.includes('Members per plan')) {
      return `Mitglieder pro Beitrag am Ende von ${endMonth}`;
    }
    if (metricName.includes('New members per month')) {
      return `Neue Mitglieder (${startMonth} - ${endMonth}, Summe)`;
    }
    if (metricName.includes('Lost members per month')) {
      return `Verlorene Mitglieder (${startMonth} - ${endMonth}, Summe)`;
    }
    
    return `${metricName} (${startMonth} - ${endMonth}, Durchschnitt)`;
  }

  //////////////////////////////////////////////////////////////////////
  // Summaries (Top 4 Cards)
  const renderSummaryCard = (metricObj) => {
    const isBeginningOfMonth = metricObj.metric === "Active members at the beginning of the month";
    const currentVal = getValue(metricObj, allMonths.indexOf(endMonth), isBeginningOfMonth);
    
    // Determine if we should show comparison
    const isComparisonMetric = metricObj.metric === "Category members at the end of the month" ||
                              metricObj.metric === "Members per plan at the end of the month";
    
    // Get comparison value and text based on mode
    let prevVal, comparisonText, showComparison;
    if (startMonth !== endMonth) {
      // In range mode: only show comparison for specific metrics
      if (isComparisonMetric) {
        prevVal = getValue(metricObj, allMonths.indexOf(startMonth), isBeginningOfMonth);
        comparisonText = `vs. Anfang ${startMonth}`;
        showComparison = true;
      } else {
        showComparison = false;
      }
    } else {
      // In single month mode: always show comparison
      prevVal = getValue(metricObj, allMonths.indexOf(startMonth) - 1, isBeginningOfMonth);
      comparisonText = "vs. Vormonat";
      showComparison = true;
    }
    
    const diff = showComparison ? (currentVal - prevVal) : null;
    const percent = showComparison && prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : "0";
    const isPositive = diff !== null ? diff >= 0 : false;
    const displayName = renameMetric(metricObj.metric, startMonth);
    const isSelected = selectedMetric === metricObj.metric;

    return (
      <motion.div
        variants={itemVariants}
        className={`card p-6 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary-500' : 'hover:ring-2 hover:ring-gray-200'}`}
        whileHover={{ y: -2 }}
        onClick={() => setSelectedMetric(metricObj.metric)}
      >
        <p className="metric-label mb-2">{displayName}</p>
        <div className="flex flex-col">
          <motion.span
            className="text-3xl font-extrabold text-gray-900"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            key={currentVal}
          >
            {currentVal === null ? "Nicht verfügbar" : currentVal.toLocaleString()}
          </motion.span>
          {showComparison && currentVal !== null && diff !== null && (
            <span className={`text-sm mt-1 font-medium ${isPositive ? 'text-success-500' : 'text-danger-500'}`}>
              {isPositive ? '⬆' : '⬇'} {Math.abs(percent)}% ({isPositive ? '+' : ''}{diff}) {comparisonText}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  const renderDetailView = () => {
    const metricObj = data.find(m => m.metric === selectedMetric);
    if (!metricObj) return null;

    const isBeginningOfMonth = metricObj.metric === "Active members at the beginning of the month";
    const currentVal = getValue(metricObj, allMonths.indexOf(startMonth), isBeginningOfMonth);
    const prevVal = getValue(metricObj, allMonths.indexOf(startMonth) - 1, isBeginningOfMonth);
    const { diff, percent } = difference(currentVal, prevVal);
    const isPositive = diff !== null ? diff >= 0 : false;
    const displayName = renameMetric(metricObj.metric, startMonth);

    // Get last 12 months of data
    const last12Months = allMonths.slice(-12);
    const currentMonthIndex = last12Months.indexOf(startMonth);

    let content = null;
    if (selectedMetric === "Active members at the beginning of the month" || 
        selectedMetric === "Active members at the end of the month") {
      // Line chart data
      const chartData = last12Months
        .filter(month => {
          if (startMonth !== endMonth) {
            const monthIdx = allMonths.indexOf(month);
            const startIdx = allMonths.indexOf(startMonth);
            const endIdx = allMonths.indexOf(endMonth);
            return monthIdx >= startIdx && monthIdx <= endIdx;
          }
          return true;
        })
        .map((month, idx) => {
          const monthIndex = allMonths.indexOf(month);
          let value = null;
          
          // Skip first month for "beginning of month" metric
          if (selectedMetric === "Active members at the beginning of the month" && monthIndex === 0) {
            value = null;
          }
          // Skip last month for all metrics
          else if (monthIndex === allMonths.length - 1) {
            value = null;
          }
          else {
            value = getValue(metricObj, monthIndex);
          }
          
          return {
            month: month,
            value: value
          };
        }).filter(data => data.value !== null);

      content = (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 35 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                interval={0}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
                formatter={(value) => [value === null ? 'Keine Daten' : `${value} Mitglieder`]}
              />
              <ReferenceLine 
                x={startMonth} 
                stroke="#007AFF" 
                strokeDasharray="3 3"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#007AFF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#007AFF" 
                strokeWidth={2}
                dot={{ fill: "#007AFF", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#007AFF", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (selectedMetric === "New members per month") {
      // Stacked bar chart data
      const onlineRow = data.find((m) => m.metric === ONLINE_KEY);
      const manualRow = data.find((m) => m.metric === MANUAL_KEY);
      
      const chartData = last12Months
        .filter(month => {
          if (startMonth !== endMonth) {
            const monthIdx = allMonths.indexOf(month);
            const startIdx = allMonths.indexOf(startMonth);
            const endIdx = allMonths.indexOf(endMonth);
            return monthIdx >= startIdx && monthIdx <= endIdx;
          }
          return true;
        })
        .map((month, idx) => {
          const monthIndex = allMonths.indexOf(month);
          // Skip last month
          if (monthIndex === allMonths.length - 1) {
            return {
              month: month,
              online: null,
              manual: null
            };
          }
          return {
            month: month,
            online: getValue(onlineRow, monthIndex),
            manual: getValue(manualRow, monthIndex)
          };
        }).filter(data => data.online !== null && data.manual !== null);

      content = (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 35 }}>
              <XAxis 
                dataKey="month" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                interval={0}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
                formatter={(value, name) => [
                  `${value} Mitglieder`,
                  name === 'online' ? 'Online-Anmeldungen' : 'Manuelle Anmeldungen'
                ]}
              />
              <ReferenceLine 
                x={startMonth} 
                stroke="#007AFF" 
                strokeDasharray="3 3"
                strokeWidth={2}
              />
              <Bar 
                dataKey="online" 
                stackId="a" 
                fill="#007AFF" 
                name="Online-Anmeldungen"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="manual" 
                stackId="a" 
                fill="#34C759" 
                name="Manuelle Anmeldungen"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (selectedMetric === "Lost members per month") {
      // Bar chart data
      const chartData = last12Months
        .filter(month => {
          if (startMonth !== endMonth) {
            const monthIdx = allMonths.indexOf(month);
            const startIdx = allMonths.indexOf(startMonth);
            const endIdx = allMonths.indexOf(endMonth);
            return monthIdx >= startIdx && monthIdx <= endIdx;
          }
          return true;
        })
        .map((month, idx) => {
          const monthIndex = allMonths.indexOf(month);
          // Skip last month
          if (monthIndex === allMonths.length - 1) {
            return {
              month: month,
              value: null
            };
          }
          return {
            month: month,
            value: getValue(metricObj, monthIndex)
          };
        }).filter(data => data.value !== null);

      content = (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 35 }}>
              <XAxis 
                dataKey="month" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                interval={0}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
                formatter={(value) => [`${value} Mitglieder`]}
              />
              <ReferenceLine 
                x={startMonth} 
                stroke="#007AFF" 
                strokeDasharray="3 3"
                strokeWidth={2}
              />
              <Bar 
                dataKey="value" 
                fill="#FF3B30"
                name="Lost members"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.month === startMonth ? '#FF3B30' : '#FF3B3080'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return (
      <div key="detail-view" className={`${cardClass} flex flex-col h-full`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-xl text-gray-800 tracking-tight">
            {displayName} - Details
          </h2>
        </div>

        <div className="flex flex-col mb-4">
          <div className="text-3xl font-extrabold text-gray-900">
            {currentVal === null ? "Keine Daten" : currentVal.toLocaleString()}
          </div>
          {currentVal !== null && diff !== null && (
            <div className="text-sm mt-1">
              <span className={`font-medium ${isPositive ? 'text-success-500' : 'text-danger-500'}`}>
                {isPositive ? '⬆' : '⬇'} {Math.abs(percent)}% ({isPositive ? '+' : ''}{diff}) vs. Vormonat
              </span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          {content}
        </div>
      </div>
    );
  };

  //////////////////////////////////////////////////////////////////////
  // CATEGORY (expandable)
  function getCategoryRows() {
    const catIndex = data.findIndex(
      (m) => m.metric === "Category members at the end of the month"
    );
    const planIndex = data.findIndex(
      (m) => m.metric === "Members per plan at the end of the month"
    );

    if (catIndex < 0) return [];

    // if planIndex < 0 => no next metric => slice until end
    const endIndex = planIndex < 0 ? data.length : planIndex;
    if (endIndex <= catIndex) return [];

    return data.slice(catIndex + 1, endIndex);
  }

  function renderCategoryCard() {
    const mainRow = data.find(
      (m) => m.metric === "Category members at the end of the month"
    );
    if (!mainRow) return null;

    // Get current value (end of period)
    const currentVal = getValue(mainRow, allMonths.indexOf(endMonth));
    
    // Get comparison value based on mode
    let prevVal, comparisonText;
    if (startMonth !== endMonth) {
      // In range mode: compare with start of period
      prevVal = getValue(mainRow, allMonths.indexOf(startMonth));
      comparisonText = `vs. Anfang ${startMonth}`;
    } else {
      // In single month mode: compare with previous month
      prevVal = getValue(mainRow, allMonths.indexOf(startMonth) - 1);
      comparisonText = "vs. Vormonat";
    }
    
    const diff = currentVal - prevVal;
    const percent = prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : "0";

    const color = diff >= 0 ? "text-green-600" : "text-red-600";
    const arrow = diff >= 0 ? "⬆" : "⬇";

    const subRows = getCategoryRows();
    const hasCategories = subRows.length > 0;

    return (
      <div key="cat-main" className={`${cardClass} flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-800 tracking-tight">
            Abteilungs-Mitglieder am Ende von {endMonth}
          </h2>
          {hasCategories && (
            <button
              onClick={() => toggleSection('categories')}
              className="text-sm underline"
            >
              {expandedSections.categories ? "Details ausblenden" : "Details anzeigen"}
            </button>
          )}
        </div>

        <div className="flex flex-col">
          <div className="text-3xl font-extrabold text-gray-900">
            {currentVal.toLocaleString()}
          </div>
          <div className="text-sm mt-1">
            <span className={`font-medium ${color}`}>
              {arrow} {Math.abs(percent)}% ({diff >= 0 ? "+" : ""}
              {diff}) {comparisonText}
            </span>
          </div>
        </div>

        {expandedSections.categories && hasCategories && renderCategoryDetail(subRows)}
      </div>
    );
  }

  function renderCategoryDetail(subRows) {
    const categories = subRows.map((row) => {
      const curr = getValue(row, allMonths.indexOf(endMonth));
      const prev = startMonth !== endMonth 
        ? getValue(row, allMonths.indexOf(startMonth))
        : getValue(row, allMonths.indexOf(startMonth) - 1);
      
      const diff = curr - prev;
      const percent = prev === 0 ? (diff > 0 ? 100 : 0) : ((diff / prev) * 100).toFixed(1);
      
      return {
        catName: row.metric,
        currentVal: curr,
        diff,
        percent: parseFloat(percent)
      };
    });

    // Sort by size and get top 10
    const topBySize = [...categories]
      .sort((a, b) => b.currentVal - a.currentVal)
      .slice(0, 10);

    // Sort by absolute change and get top 10
    const topByChange = [...categories]
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 10);

    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-8">
          {/* Top 10 by Size */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Top 10 nach Größe</h3>
            <div className="space-y-2">
              {topBySize.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{cat.catName}</span>
                  <span>{cat.currentVal.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 by Change */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Top 10 Veränderung Total</h3>
            <div className="space-y-2">
              {topByChange.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{cat.catName}</span>
                  <div className="flex items-center gap-2">
                    <span>{cat.currentVal.toLocaleString()}</span>
                    <span
                      className={`font-medium ${
                        cat.diff >= 0 ? "text-success-500" : "text-danger-500"
                      }`}
                    >
                      {cat.diff >= 0 ? "+" : ""}{cat.diff} ({cat.percent}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////
  // NEW MEMBERS
  function renderNewMembersCard(mainRow) {
    const currentVal = getValue(mainRow, allMonths.indexOf(startMonth));
    const prevVal = getValue(mainRow, allMonths.indexOf(startMonth) - 1);
    const { diff, percent } = difference(currentVal, prevVal);

    const color = diff >= 0 ? "text-green-600" : "text-red-600";
    const arrow = diff >= 0 ? "⬆" : "⬇";

    const onlineRow = data.find((m) => m.metric === ONLINE_KEY);
    const manualRow = data.find((m) => m.metric === MANUAL_KEY);
    const hasSubRows = onlineRow && manualRow;

    return (
      <div key="new-members-main" className={`${cardClass} flex flex-col h-full`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-800 tracking-tight">
            New members added breakdown
          </h2>
        </div>

        <div className="flex flex-col">
          <div className="text-3xl font-extrabold text-gray-900">
            {currentVal.toLocaleString()}
          </div>
          <div className="text-sm mt-1">
            <span className={`font-medium ${color}`}>
              {arrow} {Math.abs(percent)}% ({diff >= 0 ? "+" : ""}
              {diff}) vs. Vormonat
            </span>
          </div>
        </div>

        {hasSubRows && renderNewMembersDonut(onlineRow, manualRow)}
      </div>
    );
  }

  function renderNewMembersDonut(onlineRow, manualRow) {
    const onlineVal = getValue(onlineRow, allMonths.indexOf(startMonth));
    const manualVal = getValue(manualRow, allMonths.indexOf(startMonth));

    const donutData = [
      { name: "Online-Anmeldungen", value: onlineVal },
      { name: "Manuelle Anmeldungen", value: manualVal },
    ];

    const COLORS = ["#007AFF", "#34C759"];

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="expandable-content"
      >
        <div className="flex flex-col items-center">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {donutData.map((entry, index) => (
                    <Cell 
                      key={entry.name} 
                      fill={COLORS[index % COLORS.length]}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  }}
                  formatter={(value) => [`${value} Mitglieder`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {donutData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-gray-600">
                  {entry.name}: {entry.value} Mitglieder
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  //////////////////////////////////////////////////////////////////////
  // TOTAL CLAIM
  function renderTotalClaimCard() {
    const totalRow = data.find((m) => m.metric === TOTAL_CLAIM_KEY);
    const invoiceRow = data.find((m) => m.metric === CLAIM_INVOICES_KEY);
    const nonMemberRow = data.find((m) => m.metric === CLAIM_NON_MEMBERS_KEY);

    if (!totalRow || !invoiceRow || !nonMemberRow) return null;

    // Get current values
    const monthIdx = allMonths.indexOf(endMonth);
    const currentTotal = getValue(totalRow, monthIdx);
    const currentInvoice = getValue(invoiceRow, monthIdx);
    const currentNonMember = getValue(nonMemberRow, monthIdx);

    // Get previous values for comparison
    let prevTotal, prevInvoice, prevNonMember;
    let comparisonText;
    
    if (startMonth === endMonth) {
      // Single month mode - compare with previous month
      prevTotal = getValue(totalRow, monthIdx - 1);
      prevInvoice = getValue(invoiceRow, monthIdx - 1);
      prevNonMember = getValue(nonMemberRow, monthIdx - 1);
      comparisonText = 'vs. Vormonat';
    } else {
      // Range mode - compare with previous period of same length
      const startIdx = allMonths.indexOf(startMonth);
      const endIdx = allMonths.indexOf(endMonth);
      const periodLength = endIdx - startIdx + 1;
      const prevStartIdx = startIdx - periodLength;
      const prevEndIdx = startIdx - 1;

      if (prevStartIdx >= 0) {
        // Calculate totals for previous period
        prevTotal = getValue(totalRow, prevEndIdx);
        prevInvoice = getValue(invoiceRow, prevEndIdx);
        prevNonMember = getValue(nonMemberRow, prevEndIdx);
        const prevPeriodStart = allMonths[prevStartIdx];
        const prevPeriodEnd = allMonths[prevEndIdx];
        comparisonText = `vs. ${prevPeriodStart} - ${prevPeriodEnd}`;
      } else {
        // Not enough historical data
        prevTotal = null;
        prevInvoice = null;
        prevNonMember = null;
        comparisonText = 'Vergleichszeitraum nicht verfügbar';
      }
    }

    const diff = prevTotal !== null ? currentTotal - prevTotal : null;
    const percent = (prevTotal !== null && prevTotal > 0) ? ((diff / prevTotal) * 100).toFixed(1) : null;

    const formatCurrency = (value) => 
      new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }).format(value);

    // Prepare historical data
    const chartData = allMonths.map(month => {
      const monthIndex = allMonths.indexOf(month);
      const total = getValue(totalRow, monthIndex);
      const invoices = getValue(invoiceRow, monthIndex);
      const nonMembers = getValue(nonMemberRow, monthIndex);
      const others = total - invoices - nonMembers;
      
      return {
        month,
        invoices,
        nonMembers,
        others
      };
    }).filter(data => 
      // Filter out months with no data and future months
      data.invoices !== null && 
      data.nonMembers !== null && 
      allMonths.indexOf(data.month) <= allMonths.indexOf(endMonth)
    );

    return (
      <div key="total-claim-main" className={`${cardClass} flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-800 tracking-tight">
            {`Gesamtforderung ${startMonth === endMonth ? endMonth : `${startMonth} - ${endMonth}`}`}
          </h2>
          <button
            onClick={() => toggleSection('totalClaim')}
            className="text-sm underline"
          >
            {expandedSections.totalClaim ? "Details ausblenden" : "Details anzeigen"}
          </button>
        </div>

        <div className="flex flex-col">
          <div className="text-3xl font-extrabold text-gray-900">
            {formatCurrency(currentTotal)}
          </div>
          <div className="text-sm mt-1">
            {diff !== null ? (
              <span className={`font-medium ${diff >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                {diff >= 0 ? '⬆' : '⬇'} {Math.abs(percent)}% ({diff >= 0 ? '+' : ''}{formatCurrency(diff)}) {comparisonText}
              </span>
            ) : (
              <span className="text-gray-500">{comparisonText}</span>
            )}
          </div>
        </div>

        {expandedSections.totalClaim && (
          <div className="mt-6">
            {/* Legend with current values */}
            <div className="flex flex-col space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-primary-500" />
                <span className="text-gray-600">
                  Buchungsrechnungen: {formatCurrency(currentInvoice)}
                  <span className="text-gray-400 ml-1">
                    ({((currentInvoice / currentTotal) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                <span className="text-gray-600">
                  Nicht-Mitglieder: {formatCurrency(currentNonMember)}
                  <span className="text-gray-400 ml-1">
                    ({((currentNonMember / currentTotal) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500" />
                <span className="text-gray-600">
                  Sonstige (z.B. Beiträge): {formatCurrency(currentTotal - currentInvoice - currentNonMember)}
                  <span className="text-gray-400 ml-1">
                    ({(((currentTotal - currentInvoice - currentNonMember) / currentTotal) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>

            {/* Historical Line Graph */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Historische Entwicklung</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 35 }}
                  >
                    <defs>
                      <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorNonMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#64748B" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorOthers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      interval={0}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={formatCurrency}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 1rem",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      }}
                      formatter={(value, name) => {
                        const label = {
                          invoices: 'Buchungsrechnungen',
                          nonMembers: 'Nicht-Mitglieder',
                          others: 'Sonstige (z.B. Beiträge)'
                        }[name];
                        return [formatCurrency(value), label];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="others"
                      stackId="1"
                      stroke="#EAB308"
                      fill="url(#colorOthers)"
                    />
                    <Area
                      type="monotone"
                      dataKey="nonMembers"
                      stackId="1"
                      stroke="#64748B"
                      fill="url(#colorNonMembers)"
                    />
                    <Area
                      type="monotone"
                      dataKey="invoices"
                      stackId="1"
                      stroke="#007AFF"
                      fill="url(#colorInvoices)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////
  // PLANS (expandable) - like Category
  function getPlanRows() {
    const planIndex = data.findIndex((m) => m.metric === PLAN_KEY);
    const totalIndex = data.findIndex((m) => m.metric === TOTAL_CLAIM_KEY);
    if (planIndex < 0) return [];

    // if no total claim -> slice until end
    const endIndex = totalIndex < 0 ? data.length : totalIndex;
    if (endIndex <= planIndex) return [];
    return data.slice(planIndex + 1, endIndex);
  }

  function renderPlanCard() {
    const mainRow = data.find((m) => m.metric === PLAN_KEY);
    if (!mainRow) return null;

    const currentVal = getValue(mainRow, allMonths.indexOf(startMonth));
    const prevVal = getValue(mainRow, allMonths.indexOf(startMonth) - 1);
    const { diff, percent } = difference(currentVal, prevVal);

    const color = diff >= 0 ? "text-green-600" : "text-red-600";
    const arrow = diff >= 0 ? "⬆" : "⬇";

    const subRows = getPlanRows();
    const hasPlans = subRows.length > 0;

    return (
      <div key="plan-main" className={`${cardClass} flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-800 tracking-tight">
            Mitglieder pro Beitrag am Ende von {startMonth}
          </h2>
          {hasPlans && (
            <button
              onClick={() => toggleSection('plans')}
              className="text-sm underline"
            >
              {expandedSections.plans ? "Details ausblenden" : "Details anzeigen"}
            </button>
          )}
        </div>

        <div className="flex flex-col">
          <div className="text-3xl font-extrabold text-gray-900">
            {currentVal.toLocaleString()}
          </div>
          <div className="text-sm mt-1">
            <span className={`font-medium ${color}`}>
              {arrow} {Math.abs(percent)}% ({diff >= 0 ? "+" : ""}
              {diff}) vs. Vormonat
            </span>
          </div>
        </div>

        {expandedSections.plans && hasPlans && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="expandable-content mt-6"
          >
            {renderPlanDetail(subRows)}
          </motion.div>
        )}
      </div>
    );
  }

  function renderPlanDetail(subRows) {
    const plans = subRows.map((row) => {
      const curr = getValue(row, allMonths.indexOf(endMonth));
      const prev = startMonth !== endMonth 
        ? getValue(row, allMonths.indexOf(startMonth))
        : getValue(row, allMonths.indexOf(startMonth) - 1);
      
      const diff = curr - prev;
      const percent = prev === 0 ? (diff > 0 ? 100 : 0) : ((diff / prev) * 100).toFixed(1);
      
      return {
        planName: row.metric,
        currentVal: curr,
        diff,
        percent: parseFloat(percent)
      };
    });

    // Sort by size and get top 10
    const topBySize = [...plans]
      .sort((a, b) => b.currentVal - a.currentVal)
      .slice(0, 10);

    // Sort by absolute change and get top 10
    const topByChange = [...plans]
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 10);

    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-8">
          {/* Top 10 by Size */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Top 10 nach Größe</h3>
            <div className="space-y-2">
              {topBySize.map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{plan.planName}</span>
                  <span>{plan.currentVal.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 by Change */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Top 10 Veränderung Total</h3>
            <div className="space-y-2">
              {topByChange.map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{plan.planName}</span>
                  <div className="flex items-center gap-2">
                    <span>{plan.currentVal.toLocaleString()}</span>
                    <span
                      className={`font-medium ${
                        plan.diff >= 0 ? "text-success-500" : "text-danger-500"
                      }`}
                    >
                      {plan.diff >= 0 ? "+" : ""}{plan.diff} ({plan.percent}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////
  // Render the "other" metrics, including expansions
  function renderOtherCard(metricObj) {
    if (metricObj.metric === "Category members at the end of the month") {
      return renderCategoryCard();
    }
    if (metricObj.metric === NEW_MEMBERS_KEY) {
      return renderNewMembersCard(metricObj);
    }
    if (metricObj.metric === TOTAL_CLAIM_KEY) {
      return renderTotalClaimCard();
    }
    if (metricObj.metric === PLAN_KEY) {
      return renderPlanCard();
    }

    // Normal card
    const currentVal = getValue(metricObj, allMonths.indexOf(startMonth));
    const prevVal = getValue(metricObj, allMonths.indexOf(startMonth) - 1);
    const { diff, percent } = difference(currentVal, prevVal);

    const color = diff >= 0 ? "text-green-600" : "text-red-600";
    const arrow = diff >= 0 ? "⬆" : "⬇";
    const displayName = renameMetric(metricObj.metric, startMonth);

    return (
      <div key={metricObj.metric} className={`${cardClass} flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
        </div>

        <div className="metric-value mb-2">
          {currentVal.toLocaleString()}
        </div>
        <div className={`metric-change ${diff >= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
          {diff >= 0 ? '⬆' : '⬇'} {Math.abs(percent)}% ({diff >= 0 ? '+' : ''}{diff}) vs. Vormonat
        </div>
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////
  // Final UI
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/61b735a7129dde869ed6bdf8_kurabu-logo.svg"
              alt="KURABU Logo"
              className="w-32 h-auto object-contain"
            />
            <h1 className="text-2xl font-semibold text-gray-900">
              Vereinsbericht
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <MonthSelector
              startMonth={startMonth}
              endMonth={endMonth}
              onRangeChange={handleRangeChange}
              allMonths={allMonths}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Speichern / Drucken
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Neue Datei hochladen
            </motion.button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Top Section: Summary Cards + Details */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left side: 4 summary cards stacked */}
            <div className="col-span-5 space-y-6">
              {summaryData.map((metric) => renderSummaryCard(metric))}
            </div>

            {/* Right side: Detail view */}
            <div className="col-span-7">
              {renderDetailView()}
            </div>
          </div>

          {/* Categories Section */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-8"
          >
            {otherData
              .filter(m => m.metric === "Category members at the end of the month")
              .map((m) => renderCategoryCard())}
          </motion.div>

          {/* Plans Section */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-8"
          >
            {otherData
              .filter(m => m.metric === "Members per plan at the end of the month")
              .map((m) => renderPlanCard())}
          </motion.div>

          {/* Total Claim Section - Always expanded */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-8"
          >
            {otherData
              .filter(m => m.metric === TOTAL_CLAIM_KEY)
              .map((m) => renderTotalClaimCard())}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

