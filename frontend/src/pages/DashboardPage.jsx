import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  Link2,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Tablet,
  Target,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { analyticsApi } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

function MetricCard({ label, value, secondary, icon: Icon, iconClass = 'text-slate-600 bg-slate-100' }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>

        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">{secondary}</p>
    </div>
  );
}

function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>

      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div className="flex min-h-32 items-center justify-center px-4 py-7 text-center text-sm text-slate-500 sm:min-h-36 sm:px-5 sm:py-8">
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [geoStats, setGeoStats] = useState([]);
  const [deviceStats, setDeviceStats] = useState([]);
  const [recentClicks, setRecentClicks] = useState([]);
  const [recentConvs, setRecentConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(7);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const [
        overviewRes,
        timeseriesRes,
        geoRes,
        deviceRes,
        clicksRes,
        convsRes,
      ] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getTimeSeries(timeRange),
        analyticsApi.getGeo(),
        analyticsApi.getDevice(),
        analyticsApi.getClicks(5),
        analyticsApi.getConversions(5),
      ]);

      if (overviewRes.data?.success) {
        setOverview(overviewRes.data.data);
      }

      if (timeseriesRes.data?.success) {
        setTimeseries(timeseriesRes.data.data || []);
      }

      if (geoRes.data?.success) {
        setGeoStats(geoRes.data.data || []);
      }

      if (deviceRes.data?.success) {
        setDeviceStats(deviceRes.data.data || []);
      }

      if (clicksRes.data?.success) {
        setRecentClicks(clicksRes.data.data || []);
      }

      if (convsRes.data?.success) {
        setRecentConvs(convsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const totalDeviceClicks = useMemo(
    () => deviceStats.reduce((sum, item) => sum + Number(item.clicks || 0), 0),
    [deviceStats]
  );

  const chartData = useMemo(
    () =>
      (timeseries || []).map((item) => ({
        ...item,
        date: formatDate(item.date || item._id),
        clicks: Number(item.clicks || 0),
        conversions: Number(item.conversions || 0),
      })),
    [timeseries]
  );

  if (loading && !overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-slate-50 px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-5">
        {/* Page header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                Overview
              </h1>
              <Badge variant="success" dot>
                Live
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              Monitor traffic, conversions, revenue, and routing performance.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="grid w-full grid-cols-3 rounded-md border border-slate-200 bg-white p-0.5 sm:flex sm:w-auto">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeRange(days)}
                  className={`flex-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-3 ${
                    timeRange === days
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              loading={refreshing}
              icon={RefreshCw}
            >
              Refresh
            </Button>
          </div>
        </header>

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total clicks"
            value={formatNumber(overview?.totalClicks)}
            secondary={`Today: ${formatNumber(overview?.todayClicks)} clicks`}
            icon={MousePointerClick}
            iconClass="bg-blue-50 text-blue-700"
          />

          <MetricCard
            label="Conversions"
            value={formatNumber(overview?.totalConversions)}
            secondary={`Today: ${formatNumber(overview?.todayConversions)} conversions`}
            icon={Target}
            iconClass="bg-emerald-50 text-emerald-700"
          />

          <MetricCard
            label="Revenue"
            value={formatMoney(overview?.totalRevenue)}
            secondary={`Today: ${formatMoney(overview?.todayRevenue)}`}
            icon={CircleDollarSign}
            iconClass="bg-amber-50 text-amber-700"
          />

          <MetricCard
            label="Conversion rate"
            value={`${overview?.conversionRate || 0}%`}
            secondary={`EPC: ${formatMoney(overview?.epc)}`}
            icon={BarChart3}
            iconClass="bg-violet-50 text-violet-700"
          />
        </div>

        {/* Main analytics */}
        <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-3">
          <SectionCard
            title="Traffic & conversions"
            description={`Daily activity over the last ${timeRange} days`}
            className="min-w-0 xl:col-span-2"
            action={
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Clicks
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Conversions
                </span>
              </div>
            }
          >
            <div className="h-60 min-w-0 px-2 py-3 sm:h-72 sm:px-3 sm:py-4">
              {chartData.length === 0 ? (
                <EmptyState>
                  No traffic data available for this period.
                </EmptyState>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 4, left: -28, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="2 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <YAxis
                      width={32}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: '#ffffff',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      name="Conversions"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Device breakdown"
            description="Clicks by device type"
          >
            {deviceStats.length === 0 ? (
              <EmptyState>No device data available yet.</EmptyState>
            ) : (
              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                {['desktop', 'mobile', 'tablet'].map((device) => {
                  const item =
                    deviceStats.find((entry) => entry.device === device) || {};
                  const clicks = Number(item.clicks || 0);
                  const percentage = totalDeviceClicks
                    ? (clicks / totalDeviceClicks) * 100
                    : 0;

                  const Icon =
                    device === 'mobile'
                      ? Smartphone
                      : device === 'tablet'
                        ? Tablet
                        : Monitor;

                  return (
                    <div key={device}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="capitalize">{device}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {formatNumber(clicks)} · {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700 transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Secondary analytics */}
        <div className="grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-2">
          <SectionCard
            title="Top countries"
            description="Where your clicks are coming from"
            action={<Globe2 className="h-4 w-4 text-slate-400" />}
          >
            {geoStats.length === 0 ? (
              <EmptyState>
                No geolocation data recorded yet.
              </EmptyState>
            ) : (
              <div className="divide-y divide-slate-100">
                {geoStats.slice(0, 6).map((item, index) => {
                  const percentage =
                    Number(overview?.totalClicks || 0) > 0
                      ? (Number(item.clicks || 0) /
                          Number(overview.totalClicks)) *
                        100
                      : 0;

                  return (
                    <div
                      key={`${item.country}-${index}`}
                      // className="flex min-w-0 items-center gap-2.5 px-4 py-3 sm:gap-4 sm:px-5"
                      className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5"
                    >
                      {/* <span className="w-6 shrink-0 text-xs font-medium text-slate-400 sm:w-8"> */}
                      <span className="w-5 shrink-0 text-xs font-medium text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span 
                      // className="w-10 shrink-0 text-sm font-medium text-slate-800 sm:w-12"
                      className="w-24 shrink-0 truncate text-sm font-medium text-slate-800 sm:w-28"
                      >
                        {item.country || '—'}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"> */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            // className="h-full rounded-full bg-blue-600"
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* <span className="w-12 shrink-0 text-right text-xs text-slate-500 sm:w-16"> */}
                      <span className="w-12 shrink-0 text-right text-xs text-slate-500 sm:w-16">
                        {formatNumber(item.clicks)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent activity"
            description="Latest clicks and conversions"
          >
            {recentClicks.length === 0 && recentConvs.length === 0 ? (
              <EmptyState>No activity recorded yet.</EmptyState>
            ) : (
              <div className="divide-y divide-slate-100">
                {[
                  ...recentClicks.slice(0, 3).map((item) => ({
                    type: 'click',
                    id: item._id || item.clickId,
                    label: 'Click',
                    detail:
                      item.offerId?.name ||
                      item.campaignId?.name ||
                      item.country ||
                      'Tracking link',
                    date: item.createdAt || item.timestamp,
                  })),
                  ...recentConvs.slice(0, 2).map((item) => ({
                    type: 'conversion',
                    id: item._id || item.clickId,
                    label: 'Conversion',
                    detail:
                      item.offerId?.name ||
                      item.campaignId?.name ||
                      'Conversion recorded',
                    date: item.createdAt || item.timestamp,
                  })),
                ]
                  .slice(0, 5)
                  .map((item, index) => (
                    <div
                      key={`${item.type}-${item.id || index}`}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                          item.type === 'conversion'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {item.type === 'conversion' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <MousePointerClick className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {item.label}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {item.detail}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] text-slate-400 sm:text-xs">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Setup / navigation */}
        <SectionCard
          title="Workspace"
          description="Manage the objects used by your routing system"
        >
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {[
              {
                label: 'Campaigns & links',
                value: overview?.totalCampaigns,
                icon: Link2,
                path: '/campaigns',
              },
              {
                label: 'Offers',
                value: overview?.totalOffers,
                icon: Target,
                path: '/offers',
              },
              {
                label: 'Landers',
                value: overview?.totalLanders,
                icon: Users,
                path: '/landers',
              },
              {
                label: 'S2S postback',
                value: 'Configure',
                icon: ArrowUpRight,
                path: '/postbacks',
              },
            ].map(({ label, value, icon: Icon, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="group flex min-w-0 items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="truncate text-sm font-medium text-slate-800">{label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {typeof value === 'number'
                        ? `${formatNumber(value)} configured`
                        : value}
                    </p>
                  </div>
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-600" />
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
