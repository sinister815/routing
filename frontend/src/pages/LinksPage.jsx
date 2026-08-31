import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  Zap,
  Sliders,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { linkApi, campaignApi, offerApi, landerApi } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getTrackingUrl } from '../lib/urls.js';
import { Input, Select } from '../components/ui/Input.jsx';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../components/ui/Table.jsx';

export default function LinksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignFilterParam = searchParams.get('campaignId');

  const [links, setLinks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [offers, setOffers] = useState([]);
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState(campaignFilterParam || '');
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State in Vertical Layout
  const [formCampaignId, setFormCampaignId] = useState('');
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

  const fetchData = async () => {
    try {
      const [linksRes, campsRes, offersRes, landersRes] = await Promise.all([
        linkApi.getAll(selectedCampaignFilter || undefined),
        campaignApi.getAll(),
        offerApi.getAll(),
        landerApi.getAll(),
      ]);

      if (linksRes.data?.success) setLinks(linksRes.data.data);
      if (campsRes.data?.success) setCampaigns(campsRes.data.data);
      if (offersRes.data?.success) setOffers(offersRes.data.data);
      if (landersRes.data?.success) setLanders(landersRes.data.data);
    } catch (err) {
      console.error('Failed to load tracking links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCampaignFilter]);

  const handleOpenModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormCampaignId(link.campaignId?._id || link.campaignId || '');
      setFormSlug(link.slug || '');
      setFormTargets(
        (link.targets || []).map((t) => ({
          offerId: t.offerId?._id || t.offerId || '',
          landerId: t.landerId?._id || t.landerId || '',
          weight: t.weight || 100,
          geo: t.geo || [],
          device: t.device || [],
        }))
      );
    } else {
      setEditingLink(null);
      setFormCampaignId(selectedCampaignFilter || campaigns[0]?._id || '');
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
      alert('A tracking link requires at least 1 target.');
      return;
    }
    setFormTargets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index, field, value) => {
    setFormTargets((prev) =>
      prev.map((target, i) => (i === index ? { ...target, [field]: value } : target))
    );
  };

  const handleGeoToggle = (index, countryCode) => {
    const target = formTargets[index];
    const current = target.geo || [];
    const updated = current.includes(countryCode)
      ? current.filter((c) => c !== countryCode)
      : [...current, countryCode];
    handleTargetChange(index, 'geo', updated);
  };

  const handleDeviceToggle = (index, deviceType) => {
    const target = formTargets[index];
    const current = target.device || [];
    const updated = current.includes(deviceType)
      ? current.filter((d) => d !== deviceType)
      : [...current, deviceType];
    handleTargetChange(index, 'device', updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formCampaignId || !formSlug.trim() || formTargets.length === 0) {
      alert('Please fill out all required fields.');
      return;
    }

    for (const t of formTargets) {
      if (!t.offerId) {
        alert('Every target must have an assigned Offer.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        campaignId: formCampaignId,
        slug: formSlug.trim().toLowerCase(),
        targets: formTargets.map((t) => ({
          offerId: t.offerId,
          landerId: t.landerId || null,
          weight: Number(t.weight) || 0,
          geo: t.geo || [],
          device: t.device || [],
        })),
      };

      if (editingLink) {
        await linkApi.update(editingLink._id, payload);
      } else {
        await linkApi.create(payload);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to save tracking link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await linkApi.delete(deleteTarget._id);
      setLinks((prev) => prev.filter((l) => l._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete tracking link');
    }
  };

  const copyToClipboard = (slug) => {
    navigator.clipboard.writeText(getTrackingUrl(slug));
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1000);
  };

  const filteredLinks = links.filter((l) =>
    l.slug.toLowerCase().includes(search.toLowerCase()) ||
    l.campaignId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const availableGeos = ['US', 'IN', 'GB', 'CA', 'DE', 'AU', 'FR', 'BR'];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-indigo-600" />
            Tracking Links Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure sub-50ms routing rules with percentage weights and smart geo/device targeting
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={offers.length === 0}
          onClick={() => handleOpenModal()}
          icon={Plus}
        >
          New Tracking Link
        </Button>
      </div>

      {offers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Add an Offer first!</p>
            <p className="text-amber-700/90 mt-0.5">
              Before creating tracking links, you need at least 1 destination Offer in the "Offers & Landers" tab.
            </p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-card">
        <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links by slug or campaign..."
            className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedCampaignFilter}
            onChange={(e) => setSelectedCampaignFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabular View */}
      <TableContainer>
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">Loading tracking links...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <LinkIcon className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No tracking links found</p>
            <p className="text-xs text-slate-500">
              Create your first tracking link with weighted A/B split testing.
            </p>
            <Button
              variant="primary"
              size="sm"
              disabled={offers.length === 0}
              onClick={() => handleOpenModal()}
              icon={Plus}
            >
              Create Tracking Link
            </Button>
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Tracking Path</TableHeader>
                <TableHeader>Campaign</TableHeader>
                <TableHeader>Routing Destinations</TableHeader>
                <TableHeader>A/B Weights</TableHeader>
                <TableHeader align="center">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {filteredLinks.map((link) => {
                const trackingUrl = getTrackingUrl(link.slug);
                const isCopied = copiedSlug === link.slug;
                const campaignStatus = link.campaignId?.status || 'active';

                return (
                  <TableRow key={link._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-600 text-xs">
                          /go/{link.slug}
                        </span>
                        <Badge
                          variant={campaignStatus === 'active' ? 'success' : 'danger'}
                          dot={true}
                        >
                          {campaignStatus}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs select-all">
                        {trackingUrl}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800">
                        {link.campaignId?.name || 'Unknown'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {(link.targets || []).map((t, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-[11px]">
                            <span className="font-mono font-semibold text-slate-500">#{idx + 1}</span>
                            <span className="font-medium text-slate-800">{t.offerId?.name || 'Direct Offer'}</span>
                            {t.landerId && (
                              <span className="text-purple-600 font-medium">
                                ({t.landerId.name})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(link.targets || []).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-indigo-700"
                          >
                            T{idx + 1}: {t.weight}%
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => copyToClipboard(link.slug)}
                          className={`p-1.5 rounded-lg border transition-all text-xs font-mono flex items-center space-x-1 ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                          title="Copy Link"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>

                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                          title="Test Redirect"
                        >
                          <Zap className="h-3.5 w-3.5" />
                        </a>

                        <button
                          onClick={() => handleOpenModal(link)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(link)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
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

      {/* Link Builder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLink ? 'Edit Tracking Link & Multi-Target Rules' : 'Create High-Frequency Tracking Link'}
        subtitle="Configure A/B percentage split testing and smart geo/device criteria"
        icon={LinkIcon}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Campaign <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formCampaignId}
                onChange={(e) => setFormCampaignId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select Campaign</option>
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unique Tracking Slug (/go/:slug) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="e.g., summer-promo"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Targets Configuration */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Destination Targets ({formTargets.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Assign offers, pre-landers, and traffic percentage weights.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTarget}
                icon={Plus}
              >
                Add Target
              </Button>
            </div>

            <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
              {formTargets.map((target, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 font-mono">
                      Target #{idx + 1}
                    </span>
                    {formTargets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTarget(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove Target"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Offer Destination <span className="text-rose-500">*</span>
                      </label>
                      {offers.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => navigate('/offers')}
                          className="w-full rounded-lg border border-dashed border-primary bg-primary-50 text-primary py-1.5 px-2.5 text-xs font-medium hover:bg-primary-100 text-left"
                        >
                          No offers yet — Create an offer
                        </button>
                      ) : (
                        <select
                          required
                          value={target.offerId}
                          onChange={(e) => handleTargetChange(idx, 'offerId', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        >
                          <option value="">Select Offer</option>
                          {offers.map((o) => (
                            <option key={o._id} value={o._id}>
                              {o.name} (${o.payout} {o.currency})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pre-Lander {target.landerId ? '(Lander → Offer)' : '(Optional)'}
                      </label>
                      {landers.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => navigate('/landers')}
                          className="w-full rounded-lg border border-dashed border-primary bg-primary-50 text-primary py-1.5 px-2.5 text-xs font-medium hover:bg-primary-100 text-left"
                        >
                          No landers yet — Create a lander
                        </button>
                      ) : (
                        <select
                          value={target.landerId || ''}
                          onChange={(e) => handleTargetChange(idx, 'landerId', e.target.value || null)}
                          className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        >
                          <option value="">None (Direct Offer)</option>
                          {landers.map((l) => (
                            <option key={l._id} value={l._id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Traffic Weight Distribution</span>
                      <span className="font-mono font-bold text-indigo-700">{target.weight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={target.weight}
                      onChange={(e) => handleTargetChange(idx, 'weight', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Geo & Device Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-500 font-mono mb-1">
                        Geo Filter (Empty = All)
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {availableGeos.map((code) => {
                          const active = target.geo?.includes(code);
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => handleGeoToggle(idx, code)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                                active
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-500 font-mono mb-1">
                        Device Filter (Empty = All)
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {['mobile', 'desktop', 'tablet'].map((dType) => {
                          const active = target.device?.includes(dType);
                          return (
                            <button
                              key={dType}
                              type="button"
                              onClick={() => handleDeviceToggle(idx, dType)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize font-semibold transition-all ${
                                active
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {dType}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
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
              loading={submitting}
            >
              {editingLink ? 'Save Tracking Rules' : 'Create & Sync to Redis'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Tracking Link"
        subtitle="Are you sure you want to delete this link?"
        icon={AlertTriangle}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Deleting <span className="font-mono font-bold text-slate-900">/go/{deleteTarget?.slug}</span> will immediately purge it from the Redis hot cache.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              icon={Trash2}
            >
              Delete Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
