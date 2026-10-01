import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  MapPin,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { employeeAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function EmployeeDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    checkedInToday: false,
    checkInTime: null,
    presentDays: 22,
    leavesRemaining: 4,
    currentSalary: '₹ 45,000',
    upcomingHolidays: 2,
  });

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await employeeAPI.getDashboard().catch(() => null);
      if (res && res.data && res.data.success) {
        setDashboardData(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {
      console.error('[DASHBOARD_FETCH_ERROR]', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDashboard} colors={[COLORS.primary]} />}
      >
        
        {/* TOP WELCOME HEADER */}
        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Employee'}</Text>
            <Text style={styles.userRoleText}>{user?.role || 'Staff'} • {user?.company_name || 'Kiaan Technology'}</Text>
          </View>
        </View>

        {/* TODAY'S ATTENDANCE QUICK PUNCH CARD */}
        <View style={[styles.punchCard, SHADOWS.medium]}>
          <View style={styles.punchCardHeader}>
            <View style={styles.punchHeaderLeft}>
              <Clock size={20} color={COLORS.primary} />
              <Text style={styles.punchCardTitle}>Today's Attendance</Text>
            </View>
            <View style={[styles.statusBadge, dashboardData.checkedInToday ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={[styles.statusBadgeText, dashboardData.checkedInToday ? styles.statusTextActive : styles.statusTextInactive]}>
                {dashboardData.checkedInToday ? 'PUNCHED IN' : 'NOT PUNCHED IN'}
              </Text>
            </View>
          </View>

          <Text style={styles.punchTimeText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>

          <TouchableOpacity
            style={[styles.punchBtn, dashboardData.checkedInToday ? styles.punchBtnOut : styles.punchBtnIn]}
            onPress={() => navigation.navigate('Attendance')}
            activeOpacity={0.85}
          >
            <MapPin size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.punchBtnText}>
              {dashboardData.checkedInToday ? 'View Check-in / Punch Out' : 'Punch In Now (Geo Check-in)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4 SUMMARY STATS GRID */}
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <View style={styles.statsGrid}>
          
          {/* Stat 1: Present Days */}
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={20} color="#16A34A" />
            </View>
            <Text style={styles.statNumber}>{dashboardData.presentDays} Days</Text>
            <Text style={styles.statLabel}>Present This Month</Text>
          </View>

          {/* Stat 2: Leaves Balance */}
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Calendar size={20} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{dashboardData.leavesRemaining} Days</Text>
            <Text style={styles.statLabel}>Available Leaves</Text>
          </View>

          {/* Stat 3: Estimated Salary */}
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <CreditCard size={20} color="#D97706" />
            </View>
            <Text style={styles.statNumber}>{dashboardData.currentSalary}</Text>
            <Text style={styles.statLabel}>Net Pay Preview</Text>
          </View>

          {/* Stat 4: Holidays */}
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEE2E2' }]}>
              <TrendingUp size={20} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>{dashboardData.upcomingHolidays} Days</Text>
            <Text style={styles.statLabel}>Upcoming Holidays</Text>
          </View>

        </View>

        {/* QUICK NAVIGATION SHORTCUTS */}
        <Text style={styles.sectionTitle}>Quick Services</Text>
        <View style={styles.shortcutsList}>
          
          <TouchableOpacity
            style={[styles.shortcutItem, SHADOWS.small]}
            onPress={() => navigation.navigate('Salary')}
          >
            <View style={styles.shortcutLeft}>
              <View style={[styles.shortcutIcon, { backgroundColor: COLORS.primaryLight }]}>
                <CreditCard size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.shortcutTitle}>Salary & Payslips</Text>
                <Text style={styles.shortcutSubtitle}>Download monthly payslip PDF</Text>
              </View>
            </View>
            <ArrowUpRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, SHADOWS.small]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={styles.shortcutLeft}>
              <View style={[styles.shortcutIcon, { backgroundColor: '#EFF6FF' }]}>
                <Calendar size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.shortcutTitle}>Attendance Logs</Text>
                <Text style={styles.shortcutSubtitle}>View monthly in/out punch logs</Text>
              </View>
            </View>
            <ArrowUpRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

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
  welcomeCard: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  userRoleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  punchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  punchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  punchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punchCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  punchTimeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 14,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
  },
  punchBtnIn: {
    backgroundColor: COLORS.primary,
  },
  punchBtnOut: {
    backgroundColor: '#0F172A',
  },
  punchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shortcutsList: {
    gap: 10,
  },
  shortcutItem: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  shortcutSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
