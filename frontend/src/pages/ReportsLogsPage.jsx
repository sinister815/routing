import React, { useState, useEffect } from 'react';
import {
  Radio,
  MousePointerClick,
  Target,
  RefreshCw,
  Search,
  Globe,
  Smartphone
} from 'lucide-react';
import { analyticsApi } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../components/ui/Table.jsx';

export default function ReportsLogsPage() {
  const [logType, setLogType] = useState('clicks'); // 'clicks' | 'conversions'
  const [clicks, setClicks] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [clicksRes, convsRes] = await Promise.all([
        analyticsApi.getClicks(50),
        analyticsApi.getConversions(50),
      ]);
      if (clicksRes.data?.success) setClicks(clicksRes.data.data);
      if (convsRes.data?.success) setConversions(convsRes.data.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const filteredClicks = clicks.filter((c) =>
    c.clickId?.toLowerCase().includes(search.toLowerCase()) ||
    c.country?.toLowerCase().includes(search.toLowerCase()) ||
    c.ip?.includes(search) ||
    c.campaignId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConversions = conversions.filter((c) =>
    c.clickId?.toLowerCase().includes(search.toLowerCase()) ||
    c.networkName?.toLowerCase().includes(search.toLowerCase()) ||
    c.campaignId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-600 animate-pulse" />
            Live Traffic & Conversion Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of incoming traffic requests and confirmed S2S postback conversions
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Sub-tab pills */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setLogType('clicks')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                logType === 'clicks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MousePointerClick className="h-3.5 w-3.5" />
              <span>Click Stream ({clicks.length})</span>
            </button>
            <button
              onClick={() => setLogType('conversions')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                logType === 'conversions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Conversions ({conversions.length})</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            loading={refreshing}
            icon={RefreshCw}
          >
            Live Sync
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-card">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${logType} by ID, IP, Campaign...`}
            className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* CLICKS LOGS TABLE */}
      {logType === 'clicks' && (
        <TableContainer>
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">Loading click stream...</p>
            </div>
          ) : filteredClicks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No clicks recorded yet. Click a tracking link to see incoming traffic here!
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Click ID</TableHeader>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Geo & Device</TableHeader>
                  <TableHeader>Client IP</TableHeader>
                  <TableHeader>Campaign</TableHeader>
                  <TableHeader>Destination Offer</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {filteredClicks.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-mono font-bold text-indigo-700">
                      {c.clickId}
                    </TableCell>

                    <TableCell className="text-slate-500 font-mono text-[11px]">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-indigo-700 font-mono font-bold text-[10px]">
                          {c.country || 'UNKNOWN'}
                        </span>
                        <span className="capitalize text-slate-600 text-[11px]">
                          {c.device || 'desktop'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-slate-600 text-[11px]">
                      {c.ip || '127.0.0.1'}
                    </TableCell>

                    <TableCell className="font-semibold text-slate-800">
                      {c.campaignId?.name || 'Campaign'}
                    </TableCell>

                    <TableCell className="text-purple-700 font-medium">
                      {c.offerId?.name || 'Direct'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* CONVERSIONS LOGS TABLE */}
      {logType === 'conversions' && (
        <TableContainer>
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">Loading conversion stream...</p>
            </div>
          ) : filteredConversions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No conversions recorded yet. Use the "S2S Postback & Tester" tab to simulate conversions.
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Click ID</TableHeader>
                  <TableHeader>Received Time</TableHeader>
                  <TableHeader align="right">Payout</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Network</TableHeader>
                  <TableHeader>Campaign</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {filteredConversions.map((conv) => (
                  <TableRow key={conv._id}>
                    <TableCell className="font-mono font-bold text-emerald-700">
                      {conv.clickId}
                    </TableCell>

                    <TableCell className="text-slate-500 font-mono text-[11px]">
                      {new Date(conv.receivedAt || conv.createdAt).toLocaleTimeString()}
                    </TableCell>

                    <TableCell align="right" className="font-mono font-bold text-amber-600">
                      ${conv.payout?.toFixed(2)} {conv.currency}
                    </TableCell>

                    <TableCell>
                      <Badge variant="success" dot={true}>
                        {conv.status?.toUpperCase() || 'APPROVED'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-slate-600">
                      {conv.networkName || 'generic'}
                    </TableCell>

                    <TableCell className="font-semibold text-slate-800">
                      {conv.campaignId?.name || 'Campaign'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}
    </div>
  );
}
