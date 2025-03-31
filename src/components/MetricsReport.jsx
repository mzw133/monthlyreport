import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Path, Svg } from '@react-pdf/renderer';
import {
  SUMMARY_METRICS,
  PLAN_KEY,
  TOTAL_CLAIM_KEY,
  CLAIM_INVOICES_KEY,
  CLAIM_NON_MEMBERS_KEY,
  NEW_MEMBERS_KEY,
  ONLINE_KEY,
  MANUAL_KEY
} from '../constants/metrics';

// Register system fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 15,
    marginTop: 20,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#2a2a2a',
  },
  section: {
    marginVertical: 10,
    padding: 10,
    break: 'inside',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    paddingVertical: 8,
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 12,
    color: '#1a1a1a',
    marginTop: 2,
    fontWeight: 'bold',
  },
  monthInfo: {
    fontSize: 12,
    marginBottom: 20,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 5,
    marginBottom: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#1a1a1a',
  },
  positiveChange: {
    color: '#34C759',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  chart: {
    marginVertical: 10,
    height: 200,
  },
  breakdownSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  detailsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
});

const MetricsReport = ({ data, startMonth, endMonth }) => {
  // Helper functions
  const formatNumber = (num) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);

  const calculateChange = (current, previous) => {
    if (previous === 0) return { diff: current, percent: '100' };
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    return { diff, percent };
  };

  const formatMetricName = (metricName) => {
    if (metricName.includes('at the beginning of the month')) {
      return `Aktive Mitglieder am Anfang von ${startMonth}`;
    }
    if (metricName.includes('at the end of the month')) {
      return `Aktive Mitglieder am Ende von ${endMonth}`;
    }
    if (metricName.includes('Category members')) {
      return `Abteilungs-Mitglieder am Ende von ${endMonth}`;
    }
    if (metricName.includes('Members per plan')) {
      return `Mitglieder pro Beitrag am Ende von ${endMonth}`;
    }
    if (startMonth === endMonth) {
      return `${metricName} (${startMonth})`;
    }
    return `${metricName} (${startMonth} - ${endMonth})`;
  };

  // Helper function to get value for a specific month
  const getValue = (metricObj, month) => {
    return metricObj[month] ?? 0;
  };

  // Helper function to get sum of values over a range
  const getRangeValue = (metricObj) => {
    const months = Object.keys(metricObj).filter(key => key !== 'metric');
    const startIdx = months.indexOf(startMonth);
    const endIdx = months.indexOf(endMonth);
    
    let sum = 0;
    for (let i = startIdx; i <= endIdx; i++) {
      sum += getValue(metricObj, months[i]);
    }
    return sum;
  };

  // Get the value based on whether it's a range or single month
  const getMetricValue = (metricObj) => {
    if (startMonth === endMonth) {
      return getValue(metricObj, startMonth);
    }
    return getRangeValue(metricObj);
  };

  // Process data for the report
  const summaryMetrics = data.filter(m => SUMMARY_METRICS.includes(m.metric));
  const planData = data.find(m => m.metric === PLAN_KEY);
  const planRows = data.filter(m => {
    const planIndex = data.findIndex(d => d.metric === PLAN_KEY);
    const totalIndex = data.findIndex(d => d.metric === TOTAL_CLAIM_KEY);
    return data.indexOf(m) > planIndex && data.indexOf(m) < (totalIndex === -1 ? data.length : totalIndex);
  });
  const totalClaimData = data.find(m => m.metric === TOTAL_CLAIM_KEY);
  const invoiceData = data.find(m => m.metric === CLAIM_INVOICES_KEY);
  const nonMemberData = data.find(m => m.metric === CLAIM_NON_MEMBERS_KEY);
  const newMembersData = data.find(m => m.metric === NEW_MEMBERS_KEY);
  const onlineData = data.find(m => m.metric === ONLINE_KEY);
  const manualData = data.find(m => m.metric === MANUAL_KEY);

  // Render functions
  const renderMetricRow = (metricObj) => {
    const currentVal = getMetricValue(metricObj);
    const prevMonth = getLast12Months(metricObj)[getLast12Months(metricObj).indexOf(selectedMonth) - 1];
    const prevVal = getValue(metricObj, prevMonth);
    const { diff, percent } = calculateChange(currentVal, prevVal);

    return (
      <View style={styles.row}>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.label}>{formatMetricName(metricObj.metric)}</Text>
          <Text style={styles.value}>{formatNumber(currentVal)}</Text>
        </View>
        <View style={[styles.cell, { flex: 1 }]}>
          <Text style={styles.label}>Veränderung</Text>
          <Text style={[styles.value, diff >= 0 ? styles.positiveChange : styles.negativeChange]}>
            {diff >= 0 ? '+' : ''}{formatNumber(diff)} ({percent}%)
          </Text>
        </View>
      </View>
    );
  };

  const renderMembershipPlansSection = () => {
    if (!planData || !planRows.length) return null;

    const currentVals = {};
    const prevVals = {};
    const planTypes = planRows.map(row => row.metric);

    planTypes.forEach(plan => {
      currentVals[plan] = getMetricValue(data.find(m => m.metric === plan));
      const prevMonth = getLast12Months(planData)[getLast12Months(planData).indexOf(selectedMonth) - 1];
      prevVals[plan] = getValue(data.find(m => m.metric === plan), prevMonth);
    });

    const total = Object.values(currentVals).reduce((a, b) => a + b, 0);

    return (
      <View style={styles.section}>
        <Text style={styles.subHeader}>Mitglieder pro Beitrag am Ende von {selectedMonth}</Text>
        <View style={styles.breakdownSection}>
          {planTypes.map(plan => {
            const currentVal = currentVals[plan];
            const prevVal = prevVals[plan];
            const { percent, diff } = calculateChange(currentVal, prevVal);
            const percentage = ((currentVal / total) * 100).toFixed(1);

            return (
              <View key={plan} style={styles.row}>
                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.label}>{plan}</Text>
                  <Text style={styles.value}>
                    {formatNumber(currentVal)} ({percentage}%)
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 1 }]}>
                  <Text style={styles.label}>Veränderung</Text>
                  <Text style={[styles.value, diff >= 0 ? styles.positiveChange : styles.negativeChange]}>
                    {diff >= 0 ? '+' : ''}{formatNumber(diff)} ({percent}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTotalClaimSection = () => {
    if (!totalClaimData || !invoiceData || !nonMemberData) return null;

    const currentTotal = getMetricValue(totalClaimData);
    const prevMonth = getLast12Months(totalClaimData)[getLast12Months(totalClaimData).indexOf(selectedMonth) - 1];
    const prevTotal = getValue(totalClaimData, prevMonth);
    const { percent, diff } = calculateChange(currentTotal, prevTotal);

    const currentInvoice = getMetricValue(invoiceData);
    const currentNonMember = getMetricValue(nonMemberData);
    const invoicePercent = ((currentInvoice / currentTotal) * 100).toFixed(1);
    const nonMemberPercent = ((currentNonMember / currentTotal) * 100).toFixed(1);

    return (
      <View style={styles.section}>
        <Text style={styles.subHeader}>Gesamtforderung für {selectedMonth}</Text>
        <View style={styles.breakdownSection}>
          <View style={styles.row}>
            <View style={[styles.cell, { flex: 2 }]}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>{formatCurrency(currentTotal)}</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.label}>Veränderung</Text>
              <Text style={[styles.value, diff >= 0 ? styles.positiveChange : styles.negativeChange]}>
                {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({percent}%)
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { flex: 2 }]}>
              <Text style={styles.label}>Buchungsrechnungen</Text>
              <Text style={styles.value}>
                {formatCurrency(currentInvoice)} ({invoicePercent}%)
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { flex: 2 }]}>
              <Text style={styles.label}>Nicht-Mitglieder</Text>
              <Text style={styles.value}>
                {formatCurrency(currentNonMember)} ({nonMemberPercent}%)
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>Mitglieder Metriken Report</Text>
        <Text style={styles.monthInfo}>Berichtszeitraum: {startMonth} - {endMonth}</Text>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Zusammenfassung</Text>
          {summaryMetrics.map(metric => renderMetricRow(metric))}
        </View>

        {/* Membership Plans Section */}
        {renderMembershipPlansSection()}

        {/* Total Claim Section */}
        {renderTotalClaimSection()}

        {/* Footer */}
        <Text style={styles.footer}>
          Generiert am {new Date().toLocaleDateString('de-DE')} • Mitglieder Metriken Dashboard
        </Text>
      </Page>
    </Document>
  );
};

export default MetricsReport; 