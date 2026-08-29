import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Globe2,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  RefreshCw,
  Search,
  AlertTriangle
} from 'lucide-react';
import { offerApi, landerApi } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
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

export default function OffersLandersPage({ initialTab = 'offers' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab); // 'offers' | 'landers'
  const [offers, setOffers] = useState([]);
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [isLanderModalOpen, setIsLanderModalOpen] = useState(false);
  const [editingLander, setEditingLander] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'offer'|'lander', item: object }

  // Offer Form
  const {
    register: registerOffer,
    handleSubmit: handleSubmitOffer,
    reset: resetOffer,
    formState: { errors: offerErrors, isSubmitting: isSubmittingOffer },
  } = useForm({
    defaultValues: {
      name: '',
      url: '',
      advertiserName: '',
      payout: 5.0,
      currency: 'USD',
    },
  });

  // Lander Form
  const {
    register: registerLander,
    handleSubmit: handleSubmitLander,
    reset: resetLander,
    formState: { errors: landerErrors, isSubmitting: isSubmittingLander },
  } = useForm({
    defaultValues: {
      name: '',
      url: '',
    },
  });

  const fetchData = async () => {
    try {
      const [oRes, lRes] = await Promise.all([offerApi.getAll(), landerApi.getAll()]);
      if (oRes.data?.success) setOffers(oRes.data.data);
      if (lRes.data?.success) setLanders(lRes.data.data);
    } catch (err) {
      console.error('Failed to load offers and landers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenOfferModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      resetOffer({
        name: offer.name,
        url: offer.url,
        advertiserName: offer.advertiserName || '',
        payout: offer.payout || 0,
        currency: offer.currency || 'USD',
      });
    } else {
      setEditingOffer(null);
      resetOffer({
        name: '',
        url: '',
        advertiserName: '',
        payout: 5.0,
        currency: 'USD',
      });
    }
    setIsOfferModalOpen(true);
  };

  const handleOpenLanderModal = (lander = null) => {
    if (lander) {
      setEditingLander(lander);
      resetLander({ name: lander.name, url: lander.url });
    } else {
      setEditingLander(null);
      resetLander({ name: '', url: '' });
    }
    setIsLanderModalOpen(true);
  };

  const onOfferSubmit = async (data) => {
    try {
      if (editingOffer) {
        await offerApi.update(editingOffer._id, data);
      } else {
        await offerApi.create(data);
      }
      setIsOfferModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save offer');
    }
  };

  const onLanderSubmit = async (data) => {
    try {
      if (editingLander) {
        await landerApi.update(editingLander._id, data);
      } else {
        await landerApi.create(data);
      }
      setIsLanderModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save lander');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'offer') {
        await offerApi.delete(deleteTarget.item._id);
        setOffers((prev) => prev.filter((o) => o._id !== deleteTarget.item._id));
      } else {
        await landerApi.delete(deleteTarget.item._id);
        setLanders((prev) => prev.filter((l) => l._id !== deleteTarget.item._id));
      }
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const filteredOffers = offers.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.url.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLanders = landers.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-indigo-600" />
            Offers & Pre-Landers Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Normalized, reusable destination entities across campaigns and A/B split routing links
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Sub-tab pills */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setActiveSubTab('offers')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'offers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Offers ({offers.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('landers')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'landers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Pre-Landers ({landers.length})</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              activeSubTab === 'offers' ? handleOpenOfferModal() : handleOpenLanderModal()
            }
            icon={Plus}
          >
            {activeSubTab === 'offers' ? 'New Offer' : 'New Lander'}
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
            placeholder={`Search ${activeSubTab}...`}
            className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* OFFERS TAB */}
      {activeSubTab === 'offers' && (
        <TableContainer>
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">Loading offers catalog...</p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Globe2 className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No destination offers yet</p>
              <p className="text-xs text-slate-500">
                Add an offer with its conversion payout and target destination URL.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenOfferModal()}
                icon={Plus}
              >
                Add Offer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Offer Name</TableHeader>
                  <TableHeader>Target Destination URL</TableHeader>
                  <TableHeader>Advertiser / Network</TableHeader>
                  <TableHeader align="right">Default Payout</TableHeader>
                  <TableHeader align="center">Actions</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {filteredOffers.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{o.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {o._id}</div>
                    </TableCell>

                    <TableCell className="font-mono text-slate-600 max-w-sm truncate">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 inline-flex items-center gap-1"
                      >
                        <span className="truncate">{o.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </TableCell>

                    <TableCell className="text-slate-600">
                      {o.advertiserName || 'Direct'}
                    </TableCell>

                    <TableCell align="right" className="font-mono font-bold text-emerald-600">
                      ${o.payout?.toFixed(2)} {o.currency}
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenOfferModal(o)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'offer', item: o })}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* LANDERS TAB */}
      {activeSubTab === 'landers' && (
        <TableContainer>
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">Loading landers catalog...</p>
            </div>
          ) : filteredLanders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No pre-landers added</p>
              <p className="text-xs text-slate-500">
                Pre-landers allow warm-up pages before redirecting to affiliate offers.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenLanderModal()}
                icon={Plus}
              >
                Add Pre-Lander
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Pre-Lander Name</TableHeader>
                  <TableHeader>Landing Page URL</TableHeader>
                  <TableHeader align="center">Actions</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {filteredLanders.map((l) => (
                  <TableRow key={l._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{l.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {l._id}</div>
                    </TableCell>

                    <TableCell className="font-mono text-slate-600 max-w-md truncate">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 inline-flex items-center gap-1"
                      >
                        <span className="truncate">{l.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenLanderModal(l)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'lander', item: l })}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* Offer Modal in Vertical Form Format */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={editingOffer ? 'Edit Destination Offer' : 'Add Destination Offer'}
        subtitle="Configure offer URL, default payout amount, and advertiser"
        icon={Globe2}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitOffer(onOfferSubmit)} className="space-y-4">
          <Input
            label="Offer Name"
            type="text"
            required
            placeholder="e.g., Keto Diet Max Direct"
            error={offerErrors.name?.message}
            {...registerOffer('name', { required: 'Offer name is required' })}
          />

          <Input
            label="Destination URL"
            type="url"
            required
            placeholder="https://network-offer-landing.com/buy"
            helperText="The engine automatically appends ?click_id=<id> upon redirect"
            error={offerErrors.url?.message}
            {...registerOffer('url', { required: 'URL is required' })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Advertiser / Network"
              type="text"
              placeholder="e.g., Everflow"
              error={offerErrors.advertiserName?.message}
              {...registerOffer('advertiserName')}
            />

            <Input
              label="Default Payout ($)"
              type="number"
              step="0.01"
              min="0"
              required
              error={offerErrors.payout?.message}
              {...registerOffer('payout', { required: 'Payout is required' })}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOfferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmittingOffer}
            >
              {editingOffer ? 'Save Changes' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lander Modal in Vertical Form Format */}
      <Modal
        isOpen={isLanderModalOpen}
        onClose={() => setIsLanderModalOpen(false)}
        title={editingLander ? 'Edit Pre-Lander' : 'Add Pre-Lander'}
        subtitle="Configure pre-lander landing page URL"
        icon={FileText}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitLander(onLanderSubmit)} className="space-y-4">
          <Input
            label="Pre-Lander Name"
            type="text"
            required
            placeholder="e.g., Advertorial Quiz Lander V1"
            error={landerErrors.name?.message}
            {...registerLander('name', { required: 'Name is required' })}
          />

          <Input
            label="Landing Page URL"
            type="url"
            required
            placeholder="https://funnel-prelanders.com/quiz-v1"
            error={landerErrors.url?.message}
            {...registerLander('url', { required: 'URL is required' })}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLanderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmittingLander}
            >
              {editingLander ? 'Save Changes' : 'Create Lander'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type === 'offer' ? 'Offer' : 'Lander'}`}
        subtitle="Are you sure you want to delete this catalog entity?"
        icon={AlertTriangle}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Deleting <span className="font-bold text-slate-900">{deleteTarget?.item.name}</span> will trigger an automatic re-sync across all referencing links in the Redis hot cache.
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
              Delete Entity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
