// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   MousePointerClick,
//   Target,
//   DollarSign,
//   TrendingUp,
//   RefreshCw,
//   Globe,
//   Smartphone,
//   Monitor,
//   Tablet,
//   ArrowUpRight,
//   Zap,
//   Layers,
//   Link as LinkIcon,
//   Cpu,
//   Database,
//   CheckCircle2,
//   Activity,
//   Sparkles
// } from 'lucide-react';
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer
// } from 'recharts';
// import { analyticsApi } from '../services/api.js';
// import Button from '../components/ui/Button.jsx';
// import Badge from '../components/ui/Badge.jsx';

// export default function DashboardPage() {
//   const navigate = useNavigate();
//   const [overview, setOverview] = useState(null);
//   const [timeseries, setTimeseries] = useState([]);
//   const [geoStats, setGeoStats] = useState([]);
//   const [deviceStats, setDeviceStats] = useState([]);
//   const [recentClicks, setRecentClicks] = useState([]);
//   const [recentConvs, setRecentConvs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [timeRange, setTimeRange] = useState(7);

//   const fetchDashboardData = async (isManual = false) => {
//     if (isManual) setRefreshing(true);
//     try {
//       const [overviewRes, timeseriesRes, geoRes, deviceRes, clicksRes, convsRes] = await Promise.all([
//         analyticsApi.getOverview(),
//         analyticsApi.getTimeSeries(timeRange),
//         analyticsApi.getGeo(),
//         analyticsApi.getDevice(),
//         analyticsApi.getClicks(5),
//         analyticsApi.getConversions(5),
//       ]);

//       if (overviewRes.data?.success) setOverview(overviewRes.data.data);
//       if (timeseriesRes.data?.success) setTimeseries(timeseriesRes.data.data);
//       if (geoRes.data?.success) setGeoStats(geoRes.data.data);
//       if (deviceRes.data?.success) setDeviceStats(deviceRes.data.data);
//       if (clicksRes.data?.success) setRecentClicks(clicksRes.data.data);
//       if (convsRes.data?.success) setRecentConvs(convsRes.data.data);
//     } catch (err) {
//       console.error('Failed to load dashboard metrics:', err);
//     } finally {
//       setLoading(false);
//       if (isManual) setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//     const interval = setInterval(() => {
//       fetchDashboardData();
//     }, 8000);
//     return () => clearInterval(interval);
//   }, [timeRange]);

//   if (loading && !overview) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <div className="flex flex-col items-center space-y-3">
//           <RefreshCw className="h-6 w-6 text-primary animate-spin" />
//           <p className="text-sm text-muted">Loading…</p>
//         </div>
//       </div>
//     );
//   }

//   const totalDeviceClicks = deviceStats.reduce((acc, curr) => acc + curr.clicks, 0) || 1;
//   const latestClick = recentClicks[0] || null;
//   const latestConv = recentConvs[0] || null;

//   return (
//     <div className="space-y-6 pb-8">
//       {/* Top Header Row with Controls */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <div className="flex items-center space-x-2">
//             <h1 className="text-xl font-semibold text-ink tracking-tight">
//               Performance Overview
//             </h1>
//             <Badge variant="success" dot={true}>
//               Live
//             </Badge>
//           </div>
//           <p className="text-sm text-muted mt-0.5">
//             Clicks, conversions, and revenue across your campaigns
//           </p>
//         </div>

//         <div className="flex items-center space-x-2.5">
//           {/* Time range selector */}
//           <div className="flex bg-surface border border-border rounded-lg p-0.5 text-sm shadow-card">
//             {[7, 14, 30].map((days) => (
//               <button
//                 key={days}
//                 onClick={() => setTimeRange(days)}
//                 className={`px-3 py-1 rounded-md font-medium transition-colors ${
//                   timeRange === days
//                     ? 'bg-primary text-white'
//                     : 'text-muted hover:text-ink'
//                 }`}
//               >
//                 Last {days}d
//               </button>
//             ))}
//           </div>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => fetchDashboardData(true)}
//             loading={refreshing}
//             icon={RefreshCw}
//           >
//             Refresh
//           </Button>
//         </div>
//       </div>

//       {/* ========================================================================= */}
//       {/* ROW 1: Divided into 2 Columns: (Left: KPI Cards Grid) + (Right: Live Execution Engine Card) */}
//       {/* ========================================================================= */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
//         {/* Left Column (7 cols): 2x2 KPI Metrics Grid */}
//         <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {/* Total Clicks */}
//           <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
//             <div className="flex items-center justify-between">
//               <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
//                 Total Clicks
//               </span>
//               <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
//                 <MousePointerClick className="h-4 w-4" />
//               </div>
//             </div>
//             <div className="mt-3">
//               <p className="text-2xl font-black text-slate-900 font-mono">
//                 {(overview?.totalClicks || 0).toLocaleString()}
//               </p>
//               <div className="flex items-center mt-1 text-[11px] text-indigo-600 font-medium">
//                 <span>Today: +{overview?.todayClicks || 0} clicks</span>
//               </div>
//             </div>
//           </div>

//           {/* Total Conversions */}
//           <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
//             <div className="flex items-center justify-between">
//               <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
//                 Conversions
//               </span>
//               <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
//                 <Target className="h-4 w-4" />
//               </div>
//             </div>
//             <div className="mt-3">
//               <p className="text-2xl font-black text-slate-900 font-mono">
//                 {(overview?.totalConversions || 0).toLocaleString()}
//               </p>
//               <div className="flex items-center mt-1 text-[11px] text-emerald-600 font-medium">
//                 <span>Today: +{overview?.todayConversions || 0} converted</span>
//               </div>
//             </div>
//           </div>

//           {/* Total Revenue */}
//           <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
//             <div className="flex items-center justify-between">
//               <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
//                 Total Revenue
//               </span>
//               <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
//                 <DollarSign className="h-4 w-4" />
//               </div>
//             </div>
//             <div className="mt-3">
//               <p className="text-2xl font-black text-slate-900 font-mono">
//                 ${(overview?.totalRevenue || 0).toFixed(2)}
//               </p>
//               <div className="flex items-center mt-1 text-[11px] text-amber-600 font-medium">
//                 <span>Today: +${(overview?.todayRevenue || 0).toFixed(2)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Conversion Rate & EPC */}
//           <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
//             <div className="flex items-center justify-between">
//               <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
//                 CR% & EPC
//               </span>
//               <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
//                 <TrendingUp className="h-4 w-4" />
//               </div>
//             </div>
//             <div className="mt-3 flex items-baseline justify-between">
//               <div>
//                 <p className="text-2xl font-black text-slate-900 font-mono">
//                   {overview?.conversionRate || 0}%
//                 </p>
//                 <p className="text-[10px] text-slate-400">Conv. Rate</p>
//               </div>
//               <div className="text-right border-l border-slate-100 pl-3">
//                 <p className="text-xl font-bold text-indigo-600 font-mono">
//                   ${overview?.epc || 0}
//                 </p>
//                 <p className="text-[10px] text-slate-400">Earn Per Click</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Column (5 cols): Hot-Path Redirect Execution Engine Visualizer Card */}
//         <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden">
//           {/* Header with dots and status badges */}
//           <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
//             <div className="flex items-center space-x-2">
//               <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
//               <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
//               <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
//               <span className="text-xs font-mono font-bold text-slate-700 ml-1">
//                 Hot-Path Redirect Execution Engine
//               </span>
//             </div>
//             <div className="flex items-center space-x-1.5">
//               <Badge variant="success" dot={true} className="text-[10px] py-0 px-2">
//                 Latency: 42.1ms
//               </Badge>
//               <Badge variant="purple" className="text-[10px] py-0 px-2 hidden sm:inline-flex">
//                 In-RAM Redis
//               </Badge>
//             </div>
//           </div>

//           {/* 3 Compact Vertical/Grid Execution Boxes */}
//           <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
//             {/* Box 1: Incoming Hit */}
//             <div className="bg-[#F0F6FC] rounded-xl p-2.5 border border-slate-200/80 space-y-1">
//               <div className="flex items-center justify-between">
//                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
//                   INCOMING HIT
//                 </span>
//                 <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-semibold border border-indigo-100">
//                   Offline MMDB (0ms API)
//                 </span>
//               </div>
//               <p className="font-semibold text-slate-800 text-[11px] truncate">
//                 IP: {latestClick?.ip || '8.8.8.8'} ({latestClick?.country || 'US'} - {latestClick?.device || 'Desktop'})
//               </p>
//             </div>

//             {/* Box 2: A/B Split Selection */}
//             <div className="bg-[#F0F6FC] rounded-xl p-2.5 border border-slate-200/80 space-y-1">
//               <div className="flex items-center justify-between">
//                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
//                   A/B SPLIT SELECTION
//                 </span>
//                 <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold border border-purple-100">
//                   Single Redis Hot Read
//                 </span>
//               </div>
//               <p className="font-semibold text-indigo-700 text-[11px] truncate">
//                 Target: {latestClick?.offerId?.name || 'Quiz Lander + Offer A (70% Weight)'}
//               </p>
//               <p className="text-slate-500 text-[10px] truncate">
//                 Generated: click_id={latestClick?.clickId || 'ByBbqNNrBc2r'}
//               </p>
//             </div>

//             {/* Box 3: S2S Attribution */}
//             <div className="bg-[#F0F6FC] rounded-xl p-2.5 border border-slate-200/80 space-y-1">
//               <div className="flex items-center justify-between">
//                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
//                   S2S ATTRIBUTION
//                 </span>
//                 <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-100">
//                   Zero Double-Count Risk
//                 </span>
//               </div>
//               <p className="font-semibold text-emerald-700 text-[11px]">
//                 Payout: ${latestConv?.payout?.toFixed(2) || '45.00'} USD (Approved)
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========================================================================= */}
//       {/* ROW 2: Divided into 2 Columns: (Left: Trends Velocity Chart) + (Right: Device Classification & Quick Actions) */}
//       {/* ========================================================================= */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
//         {/* Left Column (8 cols): Main Velocity Area Chart */}
//         <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card flex flex-col justify-between">
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
//             <div>
//               <h2 className="text-sm font-bold text-slate-900">Traffic & Conversion Velocity Trends</h2>
//               <p className="text-[11px] text-slate-500">Daily click velocity versus confirmed S2S conversions</p>
//             </div>
//             <div className="flex items-center space-x-4 text-[11px] font-medium font-mono">
//               <div className="flex items-center space-x-1.5">
//                 <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
//                 <span className="text-slate-600">Clicks</span>
//               </div>
//               <div className="flex items-center space-x-1.5">
//                 <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
//                 <span className="text-slate-600">Conversions</span>
//               </div>
//             </div>
//           </div>

//           <div className="h-64 w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                 <defs>
//                   <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
//                     <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
//                   </linearGradient>
//                   <linearGradient id="convsGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
//                     <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                 <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
//                 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: '#ffffff',
//                     borderColor: '#e2e8f0',
//                     borderRadius: '0.75rem',
//                     color: '#0f172a',
//                     fontSize: '12px',
//                     boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
//                   }}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="clicks"
//                   stroke="#4f46e5"
//                   strokeWidth={2}
//                   fillOpacity={1}
//                   fill="url(#clicksGrad)"
//                   name="Clicks"
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="conversions"
//                   stroke="#10b981"
//                   strokeWidth={2}
//                   fillOpacity={1}
//                   fill="url(#convsGrad)"
//                   name="Conversions"
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Right Column (4 cols): Device Classification & Quick Actions */}
//         <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
//           {/* Device Classification Card */}
//           <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card flex-1">
//             <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
//               <Smartphone className="h-4 w-4 text-emerald-600" />
//               Device Classification
//             </h2>

//             <div className="space-y-2.5">
//               {['desktop', 'mobile', 'tablet'].map((devType) => {
//                 const found = deviceStats.find((d) => d.device === devType) || { clicks: 0 };
//                 const pct = ((found.clicks / totalDeviceClicks) * 100).toFixed(1);
//                 const Icon = devType === 'mobile' ? Smartphone : devType === 'tablet' ? Tablet : Monitor;

//                 return (
//                   <div key={devType} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
//                     <div className="flex items-center justify-between text-xs mb-1">
//                       <div className="flex items-center space-x-2">
//                         <Icon className="h-3.5 w-3.5 text-slate-500" />
//                         <span className="capitalize text-slate-700 font-semibold text-xs">{devType}</span>
//                       </div>
//                       <span className="font-mono text-slate-800 font-bold text-[11px]">{found.clicks} ({pct}%)</span>
//                     </div>
//                     <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
//                       <div
//                         className="h-full bg-emerald-500 rounded-full"
//                         style={{ width: `${Math.min(pct, 100)}%` }}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Quick Shortcuts Card */}
//           <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-2xl p-4 shadow-card">
//             <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
//               <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Quick Operations
//             </h3>
//             <div className="mt-3 grid grid-cols-2 gap-2">
//               <Button
//                 variant="primary"
//                 size="sm"
//                 onClick={() => navigate('/campaigns')}
//                 icon={LinkIcon}
//                 className="w-full text-xs"
//               >
//                 New Link
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => navigate('/postbacks')}
//                 icon={Zap}
//                 className="w-full text-xs"
//               >
//                 Test S2S
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========================================================================= */}
//       {/* ROW 3: MaxMind Geo-Location Breakdown & Live Pipeline Highlights */}
//       {/* ========================================================================= */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Left Column (8 cols): Geo Distribution Breakdown */}
//         <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card">
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
//                 <Globe className="h-4 w-4 text-indigo-600" />
//                 Offline MaxMind GeoLite2 Geolocation Breakdown
//               </h2>
//               <p className="text-[11px] text-slate-500">In-memory sub-millisecond IP Country lookup</p>
//             </div>
//             <span className="text-[11px] text-slate-400 font-mono">Top Geos</span>
//           </div>

//           {geoStats.length === 0 ? (
//             <div className="text-center py-8 text-slate-400 text-xs">
//               No click geolocation data recorded yet. Click a tracking link to see live geos.
//             </div>
//           ) : (
//             <div className="space-y-2.5 mt-3">
//               {geoStats.slice(0, 6).map((item, idx) => {
//                 const percentage = ((item.clicks / (overview?.totalClicks || 1)) * 100).toFixed(1);
//                 return (
//                   <div key={idx} className="flex items-center justify-between text-xs">
//                     <div className="flex items-center space-x-2 w-28">
//                       <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-indigo-700 font-mono font-bold text-[11px]">
//                         {item.country}
//                       </span>
//                     </div>
//                     <div className="flex-1 mx-4">
//                       <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
//                         <div
//                           className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
//                           style={{ width: `${Math.min(percentage, 100)}%` }}
//                         />
//                       </div>
//                     </div>
//                     <div className="text-right w-24 font-mono text-[11px]">
//                       <span className="text-slate-900 font-bold">{item.clicks}</span>
//                       <span className="text-slate-400 ml-1">({percentage}%)</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Right Column (4 cols): Quick actions */}
//         <div className="lg:col-span-4 bg-surface border border-border rounded-xl p-5 shadow-card space-y-3">
//           <h2 className="text-lg font-semibold text-ink">Next steps</h2>
//           <div className="space-y-2.5">
//             <div className="flex items-center justify-between p-2.5 rounded-lg bg-page border border-border">
//               <span className="text-sm text-ink">Create a campaign</span>
//               <span className="text-sm text-primary font-medium">{overview?.totalCampaigns || 0}</span>
//             </div>
//             <div className="flex items-center justify-between p-2.5 rounded-lg bg-page border border-border">
//               <span className="text-sm text-ink">Add tracking links</span>
//               <span className="text-sm text-primary font-medium">{overview?.totalLinks || 0}</span>
//             </div>
//             <div className="flex items-center justify-between p-2.5 rounded-lg bg-page border border-border">
//               <span className="text-sm text-ink">Offers</span>
//               <span className="text-sm text-primary font-medium">{overview?.totalOffers || 0}</span>
//             </div>
//             <div className="flex items-center justify-between p-2.5 rounded-lg bg-page border border-border">
//               <span className="text-sm text-ink">Landers</span>
//               <span className="text-sm text-primary font-medium">{overview?.totalLanders || 0}</span>
//             </div>
//           </div>
//           <p className="text-sm text-muted pt-1">
//             Point a tracking link to an offer, add a lander, and set weight & geo/device rules to start routing.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }


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
                      className="flex min-w-0 items-center gap-2.5 px-4 py-3 sm:gap-4 sm:px-5"
                    >
                      <span className="w-6 shrink-0 text-xs font-medium text-slate-400 sm:w-8">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span className="w-10 shrink-0 text-sm font-medium text-slate-800 sm:w-12">
                        {item.country || '—'}
                      </span>

                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

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
