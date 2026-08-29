import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Link as LinkIcon,
  Copy,
  Check,
  X,
  BarChart3,
  Globe,
  TrendingUp,
  Activity,
  MousePointerClick,
  Target
} from 'lucide-react';
import { campaignApi, analyticsApi, linkApi, offerApi, landerApi } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { getTrackingUrl } from '../lib/urls.js';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../components/ui/Table.jsx';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [perfMap, setPerfMap] = useState({});
  const [linksMap, setLinksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Resources
  const [offers, setOffers] = useState([]);
  const [landers, setLanders] = useState([]);

  // Analytics Modal State
  const [analyticsCampaign, setAnalyticsCampaign] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusToggling, setStatusToggling] = useState({});
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);

  // Success Link Modal State
  const [createdLinkModal, setCreatedLinkModal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Inline creation toggle flags
  const [showCreateOffer, setShowCreateOffer] = useState({});
  const [newOfferData, setNewOfferData] = useState({});
  const [showCreateLander, setShowCreateLander] = useState({});
  const [newLanderData, setNewLanderData] = useState({});

  // Integrated Campaign Routing Form State
  const [formSlug, setFormSlug] = useState('');
  const [formTargets, setFormTargets] = useState([
    {
      offerId: '',
      landerId: '',
      weight: 100,
      geo: [],
      device: [],
    },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      status: 'active',
    },
  });

  const loadResources = async () => {
    try {
      const [offersRes, landersRes] = await Promise.all([
        offerApi.getAll(),
        landerApi.getAll(),
      ]);
      if (offersRes.data?.success) setOffers(offersRes.data.data);
      if (landersRes.data?.success) setLanders(landersRes.data.data);
    } catch (err) {
      console.error('Failed to load offers or landers:', err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const [campRes, perfRes, linksRes] = await Promise.all([
        campaignApi.getAll(),
        analyticsApi.getCampaigns(),
        linkApi.getAll(),
      ]);

      if (campRes.data?.success) {
        const fetchedCampaigns = campRes.data.data;
        setCampaigns(fetchedCampaigns);

        const lMap = {};
        if (linksRes.data?.success) {
          linksRes.data.data.forEach((link) => {
            const campaignId = link.campaignId?._id || link.campaignId;
            if (campaignId && !lMap[campaignId]) {
              lMap[campaignId] = link.slug;
            }
          });
        }
        setLinksMap(lMap);
      }

      if (perfRes.data?.success) {
        const pMap = {};
        perfRes.data.data.forEach((item) => {
          pMap[item.campaignId] = item;
        });
        setPerfMap(pMap);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    loadResources();
  }, []);

  const handleCopyLink = (slug, campaignId = null) => {
    const url = getTrackingUrl(slug);
    navigator.clipboard.writeText(url);
    if (campaignId) {
      setCopiedId(campaignId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenAnalytics = async (campaign) => {
    setAnalyticsCampaign(campaign);
    setAnalyticsData(null);
    setAnalyticsLoading(true);
    setActiveHoverPoint(null);

    try {
      const [clicksRes, convsRes, geoRes, timeseriesRes] = await Promise.all([
        analyticsApi.getClicks({ campaignId: campaign._id, limit: 25 }),
        analyticsApi.getConversions({ campaignId: campaign._id, limit: 25 }),
        analyticsApi.getGeo({ campaignId: campaign._id }),
        analyticsApi.getTimeSeries({ campaignId: campaign._id, days: 7 }),
      ]);

      setAnalyticsData({
        clicks: clicksRes.data?.success ? clicksRes.data.data : [],
        conversions: convsRes.data?.success ? convsRes.data.data : [],
        geo: geoRes.data?.success ? geoRes.data.data : [],
        timeseries: timeseriesRes?.data?.success ? timeseriesRes.data.data : null,
      });
    } catch (err) {
      console.error('Failed to fetch modal analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const resetFormState = (campaign = null, existingLinks = []) => {
    if (campaign) {
      setEditingCampaign(campaign);
      reset({ name: campaign.name, status: campaign.status });

      if (existingLinks.length > 0) {
        const primaryLink = existingLinks[0];
        setFormSlug(primaryLink.slug);
        setFormTargets(
          (primaryLink.targets || []).map((t) => ({
            offerId: t.offerId?._id || t.offerId || '',
            landerId: t.landerId?._id || t.landerId || '',
            weight: t.weight || 100,
            geo: t.geo || [],
            device: t.device || [],
          }))
        );
      } else {
        setFormSlug(`tr-${Math.random().toString(36).substring(2, 8)}`);
        setFormTargets([
          {
            offerId: offers[0]?._id || '',
            landerId: '',
            weight: 100,
            geo: [],
            device: [],
          },
        ]);
      }
    } else {
      setEditingCampaign(null);
      reset({ name: '', status: 'active' });
      setFormSlug(`tr-${Math.random().toString(36).substring(2, 8)}`);
      setFormTargets([
        {
          offerId: offers[0]?._id || '',
          landerId: '',
          weight: 100,
          geo: [],
          device: [],
        },
      ]);
    }
    setShowCreateOffer({});
    setNewOfferData({});
    setShowCreateLander({});
    setNewLanderData({});
  };

  const handleOpenModal = async (campaign = null) => {
    await loadResources();
    if (campaign) {
      try {
        const linksRes = await linkApi.getAll(campaign._id);
        const fetchedLinks = linksRes.data?.success ? linksRes.data.data : [];
        resetFormState(campaign, fetchedLinks);
      } catch (err) {
        resetFormState(campaign, []);
      }
    } else {
      resetFormState(null, []);
    }
    setIsModalOpen(true);
  };

  const handleAddTarget = () => {
    setFormTargets((prev) => [
      ...prev,
      {
        offerId: offers[0]?._id || '',
        landerId: '',
        weight: 50,
        geo: [],
        device: [],
      },
    ]);
  };

  const handleRemoveTarget = (index) => {
    if (formTargets.length <= 1) {
      alert('A campaign requires at least 1 routing target.');
      return;
    }
    setFormTargets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index, field, value) => {
    setFormTargets((prev) =>
      prev.map((target, i) => (i === index ? { ...target, [field]: value } : target))
    );
  };

  const handleCreateInlineOffer = async (index) => {
    const data = newOfferData[index];
    if (!data?.name || !data?.url) {
      alert('Offer name and target URL are required.');
      return;
    }

    try {
      const res = await offerApi.create(data);
      if (res.data?.success) {
        const created = res.data.data;
        setOffers((prev) => [...prev, created]);
        handleTargetChange(index, 'offerId', created._id);
        setShowCreateOffer((prev) => ({ ...prev, [index]: false }));
        setNewOfferData((prev) => ({ ...prev, [index]: {} }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create inline offer');
    }
  };

  const handleCreateInlineLander = async (index) => {
    const data = newLanderData[index];
    if (!data?.name || !data?.url) {
      alert('Lander name and target URL are required.');
      return;
    }

    try {
      const res = await landerApi.create(data);
      if (res.data?.success) {
        const created = res.data.data;
        setLanders((prev) => [...prev, created]);
        handleTargetChange(index, 'landerId', created._id);
        setShowCreateLander((prev) => ({ ...prev, [index]: false }));
        setNewLanderData((prev) => ({ ...prev, [index]: {} }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create inline lander');
    }
  };

  const onSubmit = async (data) => {
    const finalSlug = formSlug.trim().toLowerCase();

    if (!finalSlug || formTargets.length === 0) {
      alert('Please fill out all required campaign & target fields.');
      return;
    }

    for (let i = 0; i < formTargets.length; i++) {
      if (!formTargets[i].offerId) {
        alert(`Target #${i + 1} must have an assigned Offer.`);
        return;
      }
    }

    try {
      let campaignId = editingCampaign?._id;

      if (editingCampaign) {
        await campaignApi.update(campaignId, data);
      } else {
        const campaignRes = await campaignApi.create(data);
        campaignId = campaignRes.data.data._id;
      }

      const linkPayload = {
        campaignId,
        slug: finalSlug,
        targets: formTargets.map((t) => ({
          offerId: t.offerId,
          landerId: t.landerId || null,
          weight: Number(t.weight) || 0,
          geo: t.geo || [],
          device: t.device || [],
        })),
      };

      const existingLinksRes = await linkApi.getAll(campaignId);
      const existingLinks = existingLinksRes.data?.success ? existingLinksRes.data.data : [];

      if (existingLinks.length > 0) {
        await linkApi.update(existingLinks[0]._id, linkPayload);
      } else {
        await linkApi.create(linkPayload);
      }

      setIsModalOpen(false);
      await fetchCampaigns();

      setCreatedLinkModal({
        name: data.name,
        url: getTrackingUrl(finalSlug),
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save campaign configuration');
    }
  };

  const handleToggleStatus = async (campaign) => {
    const nextStatus = campaign.status === 'active' ? 'paused' : 'active';
    setStatusToggling((prev) => ({ ...prev, [campaign._id]: true }));

    try {
      await campaignApi.update(campaign._id, { status: nextStatus });
      setCampaigns((prev) =>
        prev.map((c) => (c._id === campaign._id ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setStatusToggling((prev) => ({ ...prev, [campaign._id]: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const campaignId = deleteTarget._id;
    setDeletingCampaignId(campaignId);
    try {
      await campaignApi.delete(campaignId);
      setCampaigns((prev) => prev.filter((c) => c._id !== campaignId));
      setLinksMap((prev) => {
        const next = { ...prev };
        delete next[campaignId];
        return next;
      });
      setPerfMap((prev) => {
        const next = { ...prev };
        delete next[campaignId];
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to delete campaign'
      );
    } finally {
      setDeletingCampaignId(null);
    }
  };

  // Detailed Light-Theme Chart Renderer
  const renderTrendChart = () => {
    // Generate real date labels for the past 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    // Use actual backend timeseries data if present, otherwise process from raw clicks/conversions
    let dataset = [];
    if (analyticsData?.timeseries && analyticsData.timeseries.length === 7) {
      dataset = analyticsData.timeseries;
    } else {
      const clickMap = {};
      const convMap = {};

      (analyticsData?.clicks || []).forEach((c) => {
        const day = new Date(c.timestamp || c.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        clickMap[day] = (clickMap[day] || 0) + 1;
      });

      (analyticsData?.conversions || []).forEach((c) => {
        const day = new Date(c.receivedAt || c.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        convMap[day] = (convMap[day] || 0) + 1;
      });

      dataset = dates.map((d) => {
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          day: dayLabel,
          fullDate,
          clicks: clickMap[dayLabel] || 0,
          conversions: convMap[dayLabel] || 0,
        };
      });
    }

    const maxClicks = Math.max(...dataset.map((d) => d.clicks), 10);
    const maxConvs = Math.max(...dataset.map((d) => d.conversions), 2);

    const width = 600;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 25;
    const paddingBottom = 35;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const getX = (index) => paddingLeft + (index * chartW) / (dataset.length - 1);
    const getYClick = (val) => paddingTop + chartH - (val / maxClicks) * chartH;
    const getYConv = (val) => paddingTop + chartH - (val / maxConvs) * chartH;

    const clickPoints = dataset.map((d, i) => `${getX(i)},${getYClick(d.clicks)}`).join(' ');
    const convPoints = dataset.map((d, i) => `${getX(i)},${getYConv(d.conversions)}`).join(' ');

    const clickArea = `${getX(0)},${paddingTop + chartH} ` + clickPoints + ` ${getX(dataset.length - 1)},${paddingTop + chartH}`;
    const convArea = `${getX(0)},${paddingTop + chartH} ` + convPoints + ` ${getX(dataset.length - 1)},${paddingTop + chartH}`;

    return (
      <div className="w-full bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* Header & Legend */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-800">Traffic & Conversion Trend</h3>
              <p className="text-[11px] text-slate-400">Past 7 days performance metrics</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span>Clicks (Left Axis)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Conversions (Right Axis)</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Grid Lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const yPos = paddingTop + chartH * (1 - ratio);
              const clickVal = Math.round(maxClicks * ratio);
              const convVal = Math.round(maxConvs * ratio);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={width - paddingRight}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  {/* Left Axis Label (Clicks) */}
                  <text
                    x={paddingLeft - 8}
                    y={yPos + 3}
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="end"
                    fontFamily="sans-serif"
                  >
                    {clickVal}
                  </text>
                  {/* Right Axis Label (Conversions) */}
                  <text
                    x={width - paddingRight + 8}
                    y={yPos + 3}
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="start"
                    fontFamily="sans-serif"
                  >
                    {convVal}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Fills */}
            <polygon points={clickArea} fill="url(#clickGrad)" />
            <polygon points={convArea} fill="url(#convGrad)" />

            {/* Line Graphs */}
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={clickPoints}
            />
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={convPoints}
            />

            {/* X-Axis Labels & Interactive Points */}
            {dataset.map((d, i) => {
              const cx = getX(i);
              const cyClick = getYClick(d.clicks);
              const cyConv = getYConv(d.conversions);
              const isHovered = activeHoverPoint?.index === i;

              return (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setActiveHoverPoint({ ...d, index: i, cx, cyClick })}>
                  {/* Vertical Hover Guide Line */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingTop}
                      x2={cx}
                      y2={paddingTop + chartH}
                      stroke="#cbd5e1"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                  )}

                  {/* Click Dot */}
                  <circle
                    cx={cx}
                    cy={cyClick}
                    r={isHovered ? '5' : '3.5'}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />

                  {/* Conversion Dot */}
                  <circle
                    cx={cx}
                    cy={cyConv}
                    r={isHovered ? '5' : '3.5'}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2"
                  />

                  {/* Day Label */}
                  <text
                    x={cx}
                    y={height - 10}
                    fontSize="10"
                    fill={isHovered ? '#0f172a' : '#64748b'}
                    fontWeight={isHovered ? '600' : '400'}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Overlay */}
          {activeHoverPoint && (
            <div
              className="absolute pointer-events-none bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-[11px] space-y-1 transition-all z-10"
              style={{
                left: `${(activeHoverPoint.cx / width) * 100}%`,
                top: '0px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
                {activeHoverPoint.fullDate || activeHoverPoint.day}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-blue-400 font-medium">Clicks:</span>
                <span className="font-mono font-bold">{activeHoverPoint.clicks}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400 font-medium">Conversions:</span>
                <span className="font-mono font-bold">{activeHoverPoint.conversions}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Campaigns & Traffic Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create campaigns, assign routing rules, copy tracking links, and view live analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/offers')} icon={Layers}>
            Offers
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/landers')} icon={Layers}>
            Landers
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal()}
            icon={Plus}
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by name..."
            className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filtered.length} {filtered.length === 1 ? 'Campaign' : 'Campaigns'}
        </span>
      </div>

      {/* Tabular View */}
      <TableContainer>
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">Loading campaigns...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No campaigns found</p>
            <p className="text-xs text-slate-500">
              Create your first campaign to generate a tracking link.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              icon={Plus}
            >
              Create Campaign
            </Button>
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Campaign</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader align="right">Clicks</TableHeader>
                <TableHeader align="right">Conversions</TableHeader>
                <TableHeader align="right">CR%</TableHeader>
                <TableHeader align="right">Revenue</TableHeader>
                <TableHeader align="right">EPC</TableHeader>
                <TableHeader align="center">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {filtered.map((c) => {
                const perf = perfMap[c._id] || {
                  clicks: 0,
                  conversions: 0,
                  revenue: 0,
                  conversionRate: 0,
                  epc: 0,
                };
                const isToggling = statusToggling[c._id];
                const slug = linksMap[c._id];

                return (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {slug ? `/go/${slug}` : `ID: ${c._id}`}
                      </div>
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        disabled={isToggling}
                        className="transition-transform active:scale-95"
                      >
                        <Badge
                          variant={c.status === 'active' ? 'success' : 'danger'}
                          dot={true}
                          className="cursor-pointer"
                        >
                          {isToggling ? 'Updating...' : c.status.toUpperCase()}
                        </Badge>
                      </button>
                    </TableCell>

                    <TableCell align="right" className="font-mono font-semibold text-slate-800">
                      {perf.clicks.toLocaleString()}
                    </TableCell>

                    <TableCell align="right" className="font-mono font-bold text-emerald-600">
                      {perf.conversions.toLocaleString()}
                    </TableCell>

                    <TableCell align="right" className="font-mono text-slate-700">
                      {perf.conversionRate}%
                    </TableCell>

                    <TableCell align="right" className="font-mono font-bold text-amber-600">
                      ${perf.revenue.toFixed(2)}
                    </TableCell>

                    <TableCell align="right" className="font-mono text-indigo-700">
                      ${perf.epc}
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Analytics Modal Trigger */}
                        <button
                          onClick={() => handleOpenAnalytics(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Campaign Analytics & Graphs"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Copy Link Button */}
                        {slug && (
                          <button
                            onClick={() => handleCopyLink(slug, c._id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Copy Redirect Link"
                          >
                            {copiedId === c._id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <LinkIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Edit Campaign & Routing"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTarget(c)}
                          disabled={deletingCampaignId === c._id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Analytics Modal */}
      <Modal
        isOpen={!!analyticsCampaign}
        onClose={() => setAnalyticsCampaign(null)}
        title={analyticsCampaign ? `Analytics: ${analyticsCampaign.name}` : 'Campaign Analytics'}
        subtitle="Real-time conversion performance, timeseries trends, and traffic distributions."
        icon={BarChart3}
        maxWidth="max-w-3xl"
      >
        {analyticsCampaign && (
          <div className="space-y-5">
            {/* KPI Cards Header */}
            {(() => {
              const perf = perfMap[analyticsCampaign._id] || {
                clicks: 0,
                conversions: 0,
                revenue: 0,
                conversionRate: 0,
                epc: 0,
              };
              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      Clicks
                    </div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-1">
                      {perf.clicks.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-200/60">
                    <div className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">
                      Conversions
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-800 mt-1">
                      {perf.conversions.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-amber-50/40 rounded-xl p-3 border border-amber-200/60">
                    <div className="text-[10px] font-medium text-amber-700 uppercase tracking-wider">
                      Revenue
                    </div>
                    <div className="text-base font-bold font-mono text-amber-800 mt-1">
                      ${perf.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-blue-50/40 rounded-xl p-3 border border-blue-200/60">
                    <div className="text-[10px] font-medium text-blue-700 uppercase tracking-wider">
                      CR%
                    </div>
                    <div className="text-base font-bold font-mono text-blue-800 mt-1">
                      {perf.conversionRate}%
                    </div>
                  </div>
                  <div className="bg-purple-50/40 rounded-xl p-3 border border-purple-200/60 col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-medium text-purple-700 uppercase tracking-wider">
                      EPC
                    </div>
                    <div className="text-base font-bold font-mono text-purple-800 mt-1">
                      ${perf.epc}
                    </div>
                  </div>
                </div>
              );
            })()}

            {analyticsLoading ? (
              <div className="py-12 text-center">
                <RefreshCw className="h-6 w-6 text-slate-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-mono">Fetching campaign data & charts...</p>
              </div>
            ) : (
              <>
                {/* Refined Light-Theme SVG Trend Chart */}
                {renderTrendChart()}

                {/* Geo Breakdown & Recent Stream */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Traffic Geo Breakdown */}
                  <div className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-blue-600" /> Top Geos
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {analyticsData?.geo?.length || 0} Countries
                      </span>
                    </div>

                    {analyticsData?.geo && analyticsData.geo.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {analyticsData.geo.map((g, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50/60 border border-slate-100"
                          >
                            <span className="font-mono text-slate-800 font-semibold uppercase">
                              {g.country || 'GLOBAL'}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              {g.clicks} clicks
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-4 text-center">
                        No geo tracking data recorded
                      </p>
                    )}
                  </div>

                  {/* Live Activity Stream */}
                  <div className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-emerald-600" /> Live Activity Log
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {analyticsData?.conversions?.slice(0, 4).map((conv, idx) => (
                        <div
                          key={`conv-${idx}`}
                          className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60"
                        >
                          <span className="text-emerald-900 font-medium">
                            Conversion (+${conv.payout || 0})
                          </span>
                          <span className="font-mono text-emerald-700 text-[10px]">
                            {new Date(conv.receivedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {analyticsData?.clicks?.slice(0, 4).map((click, idx) => (
                        <div
                          key={`click-${idx}`}
                          className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-slate-50/60 border border-slate-100"
                        >
                          <span className="text-slate-600 font-mono">
                            Click: {click.country || 'GLOBAL'} ({click.device || 'desktop'})
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {new Date(click.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {(!analyticsData?.clicks?.length && !analyticsData?.conversions?.length) && (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">
                          No recent activity recorded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalyticsCampaign(null)}
              >
                Close Analytics
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Campaign"
        subtitle="Are you sure you want to delete this campaign? Associated tracking links will also be removed."
        icon={Trash2}
        maxWidth="max-w-md"
      >
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
            loading={deletingCampaignId === deleteTarget?._id}
          >
            Delete Campaign
          </Button>
        </div>
      </Modal>

      {/* Created Link Success Modal */}
      <Modal
        isOpen={!!createdLinkModal}
        onClose={() => setCreatedLinkModal(null)}
        title="Campaign Saved!"
        subtitle="Your tracking link is active and ready to receive traffic."
        icon={Check}
        maxWidth="max-w-md"
      >
        {createdLinkModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-1">Tracking Link:</div>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2">
                <span className="text-xs font-mono text-indigo-600 truncate mr-2">
                  {createdLinkModal.url}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdLinkModal.url);
                    alert('Copied to clipboard!');
                  }}
                  icon={Copy}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedLinkModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Unified Campaign & Targets Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? `Edit: ${editingCampaign.name}` : 'Create New Campaign'}
        subtitle="Configure campaign details, select/create offers & landers, and setup A/B rules."
        icon={Layers}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <Input
                label="Campaign Name"
                type="text"
                required
                placeholder="e.g., Summer Promo - Direct Nutra"
                error={errors.name?.message}
                {...register('name', { required: 'Campaign name is required' })}
              />
            </div>
            <div>
              <Select
                label="Status"
                required
                error={errors.status?.message}
                {...register('status', { required: 'Status is required' })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'paused', label: 'Paused' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tracking Link Slug
              </label>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-mono text-slate-400 bg-slate-200 px-2.5 py-2 rounded-l-lg border border-r-0 border-slate-300">
                  /go/
                </span>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) =>
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                  }
                  placeholder="e.g., summer-promo"
                  className="w-full rounded-r-lg border border-slate-300 bg-white py-2 px-3 text-xs font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Target Routing & A/B Splits
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {formTargets.length} Target{formTargets.length !== 1 ? 's' : ''} Configured
              </span>
            </div>

            {formTargets.map((target, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-slate-200 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600">
                    Target Route #{idx + 1}
                  </span>
                  {formTargets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTarget(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Remove Target"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Offer Target <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateOffer((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      {showCreateOffer[idx] ? (
                        <>
                          <X className="h-3 w-3" /> <span>Select Existing</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> <span>Create New Offer</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showCreateOffer[idx] ? (
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Offer Name (e.g., KETO Diet US)"
                        value={newOfferData[idx]?.name || ''}
                        onChange={(e) =>
                          setNewOfferData((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], name: e.target.value },
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:outline-none focus:border-indigo-600"
                      />
                      <input
                        type="url"
                        placeholder="Destination URL (e.g., https://offer.com?aff_id=123)"
                        value={newOfferData[idx]?.url || ''}
                        onChange={(e) =>
                          setNewOfferData((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], url: e.target.value },
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                      />
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleCreateInlineOffer(idx)}
                        >
                          Save & Select Offer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <select
                      required
                      value={target.offerId}
                      onChange={(e) => handleTargetChange(idx, 'offerId', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs focus:outline-none focus:border-indigo-600"
                    >
                      <option value="">-- Choose an Offer --</option>
                      {offers.map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Landing Page (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateLander((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      {showCreateLander[idx] ? (
                        <>
                          <X className="h-3 w-3" /> <span>Select Existing</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> <span>Create New Lander</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showCreateLander[idx] ? (
                    <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Lander Name (e.g., Advertorial V1)"
                        value={newLanderData[idx]?.name || ''}
                        onChange={(e) =>
                          setNewLanderData((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], name: e.target.value },
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:outline-none focus:border-indigo-600"
                      />
                      <input
                        type="url"
                        placeholder="Lander URL (e.g., https://myblog.com/presell)"
                        value={newLanderData[idx]?.url || ''}
                        onChange={(e) =>
                          setNewLanderData((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], url: e.target.value },
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                      />
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleCreateInlineLander(idx)}
                        >
                          Save & Select Lander
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={target.landerId || ''}
                      onChange={(e) =>
                        handleTargetChange(idx, 'landerId', e.target.value || null)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs focus:outline-none focus:border-indigo-600"
                    >
                      <option value="">Direct to Offer (No Lander)</option>
                      {landers.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Split Weight</span>
                    <span className="font-mono font-bold text-indigo-600">{target.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={target.weight}
                    onChange={(e) =>
                      handleTargetChange(idx, 'weight', Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTarget}
              icon={Plus}
              className="w-full py-2"
            >
              Add Split Target Route
            </Button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
            >
              {editingCampaign ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
