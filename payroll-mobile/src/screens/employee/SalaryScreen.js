import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreditCard,
  Download,
  CheckCircle2,
  FileText,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function SalaryScreen() {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  const salaryDetails = {
    netPay: '₹ 45,250',
    grossPay: '₹ 50,000',
    totalDeductions: '₹ 4,750',
    paymentStatus: 'Processed & Credited',
    paymentDate: '28 Sep 2026',
    bankAccount: 'HDFC Bank •••• 4892',
    earnings: [
      { title: 'Basic Salary', amount: '₹ 25,000' },
      { title: 'House Rent Allowance (HRA)', amount: '₹ 12,500' },
      { title: 'Special Allowance', amount: '₹ 8,500' },
      { title: 'Performance Bonus', amount: '₹ 4,000' },
    ],
    deductions: [
      { title: 'Provident Fund (PF)', amount: '₹ 1,800' },
      { title: 'Professional Tax (PT)', amount: '₹ 200' },
      { title: 'Income Tax (TDS)', amount: '₹ 2,250' },
      { title: 'Health Insurance (ESI)', amount: '₹ 500' },
    ],
  };

  const handleDownloadPayslip = () => {
    Alert.alert('Payslip Download', 'Payslip for September 2026 has been downloaded to your device.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Salary & Payslips</Text>
          <Text style={styles.headerSubtitle}>Transparent breakdown of earnings and statutory deductions</Text>
        </View>

        {/* NET PAY HIGHLIGHT CARD */}
        <View style={[styles.netPayCard, SHADOWS.large]}>
          <View style={styles.netPayTop}>
            <Text style={styles.netPayLabel}>Net Take-Home Pay</Text>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#166534" />
              <Text style={styles.statusBadgeText}>{salaryDetails.paymentStatus}</Text>
            </View>
          </View>

          <Text style={styles.netPayAmount}>{salaryDetails.netPay}</Text>
          
          <View style={styles.netPayMeta}>
            <Text style={styles.netPayMetaText}>Credited: {salaryDetails.paymentDate}</Text>
            <Text style={styles.netPayMetaText}>{salaryDetails.bankAccount}</Text>
          </View>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownloadPayslip}
            activeOpacity={0.8}
          >
            <Download size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.downloadBtnText}>Download Payslip (PDF)</Text>
          </TouchableOpacity>
        </View>

        {/* EARNINGS BREAKDOWN */}
        <View style={[styles.breakdownCard, SHADOWS.small]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <TrendingUp size={18} color="#16A34A" />
            </View>
            <Text style={styles.cardHeaderTitle}>Earnings (Gross: {salaryDetails.grossPay})</Text>
          </View>

          <View style={styles.itemsList}>
            {salaryDetails.earnings.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemAmountPositive}>{item.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* DEDUCTIONS BREAKDOWN */}
        <View style={[styles.breakdownCard, SHADOWS.small]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <TrendingDown size={18} color="#DC2626" />
            </View>
            <Text style={styles.cardHeaderTitle}>Deductions (Total: {salaryDetails.totalDeductions})</Text>
          </View>

          <View style={styles.itemsList}>
            {salaryDetails.deductions.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemAmountNegative}>-{item.amount}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  netPayCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },
  netPayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEE2E2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  netPayAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  netPayMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
    marginBottom: 16,
  },
  netPayMetaText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  downloadBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemsList: {
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  itemAmountPositive: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemAmountNegative: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
