import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { postbackApi, analyticsApi } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Input } from '../components/ui/Input.jsx';

export default function PostbackPage() {
  const navigate = useNavigate();
  const [recentClicks, setRecentClicks] = useState([]);
  const [loadingClicks, setLoadingClicks] = useState(true);
  const [responseResult, setResponseResult] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      click_id: '',
      payout: 25.0,
      network: 'HasOffers',
      txid: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      token: '',
    },
  });

  const selectedClickId = watch('click_id');

  const fetchRecentClicks = async () => {
    try {
      const res = await analyticsApi.getClicks(10);
      if (res.data?.success && res.data.data.length > 0) {
        setRecentClicks(res.data.data);
        if (!selectedClickId) {
          setValue('click_id', res.data.data[0].clickId);
        }
      }
    } catch (err) {
      console.error('Failed to load recent clicks:', err);
    } finally {
      setLoadingClicks(false);
    }
  };

  useEffect(() => {
    fetchRecentClicks();

    const fetchToken = async () => {
      try {
        const res = await postbackApi.getToken();
        if (res.data?.success && res.data.token) {
          setValue('token', res.data.token);
        }
      } catch (err) {
        console.error('Failed to load postback token:', err);
      }
    };

    fetchToken();
  }, [setValue]);

  const getPostbackUrlTemplate = () => {
    const host = window.location.origin.includes('localhost:3000')
      ? 'http://localhost:5000'
      : window.location.origin;
    return `${host}/postback?click_id={click_id}&payout={payout}&txid={transaction_id}`;
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(getPostbackUrlTemplate());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const onSubmit = async (data) => {
    setResponseResult(null);
    const startTime = performance.now();
    try {
      const res = await postbackApi.simulate({
        click_id: data.click_id.trim(),
        payout: Number(data.payout),
        network: data.network.trim(),
        txid: data.txid.trim(),
        ...(data.token && { token: data.token.trim() }),
      });

      const duration = (performance.now() - startTime).toFixed(1);
      setResponseResult({
        success: true,
        status: res.status,
        duration,
        data: res.data,
      });

      // Regenerate transaction ID for next test
      setValue('txid', `TX-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err) {
      const duration = (performance.now() - startTime).toFixed(1);
      setResponseResult({
        success: false,
        status: err.response?.status || 500,
        duration,
        data: err.response?.data || { message: err.message },
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-tight flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          S2S Postback Simulator
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Test conversion callbacks and verify payouts are attributed to the right click.
        </p>
      </div>

      {/* Global Postback URL Template Card */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            Your Postback Webhook URL
          </h2>
          <Badge variant="success" dot={true}>
            Idempotent
          </Badge>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          Provide this URL to your affiliate network (e.g. HasOffers/Tune, Everflow, Affise).
          When a conversion occurs, their server sends an HTTP callback with the original{' '}
          <code className="font-mono text-primary font-medium">click_id</code> and{' '}
          <code className="font-mono text-success font-medium">payout</code>.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2 bg-page border border-border rounded-lg p-3">
          <code className="text-sm font-mono text-primary flex-1 break-all select-all">
            {getPostbackUrlTemplate()}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={copyTemplate}
            icon={copiedUrl ? Check : Copy}
          >
            {copiedUrl ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* S2S Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator Form in Vertical Format */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Live S2S Webhook Simulator
            </h3>
            <button
              type="button"
              onClick={fetchRecentClicks}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-mono font-semibold"
            >
              <RefreshCw className="h-3 w-3" /> Refresh Clicks
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Target Click ID (click_id)"
                type="text"
                required
                placeholder="e.g., ByBbqNNrBc2rzFEH"
                error={errors.click_id?.message}
                {...register('click_id', { required: 'click_id is required' })}
              />

              {/* Quick Select from Recent Clicks */}
              {recentClicks.length > 0 && (
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">
                    Quick-pick from recent visitors:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {recentClicks.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => setValue('click_id', c.clickId)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                          selectedClickId === c.clickId
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {c.clickId} ({c.country || 'GEO'})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Payout Amount ($)"
                type="number"
                step="0.01"
                min="0"
                required
                error={errors.payout?.message}
                {...register('payout', { required: 'Payout is required' })}
              />

              <Input
                label="Affiliate Network"
                type="text"
                placeholder="e.g., HasOffers"
                {...register('network')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Transaction ID (txid)"
                type="text"
                {...register('txid')}
              />

              <div className="hidden">
                <input type="hidden" {...register('token')} />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
              icon={Send}
            >
              Dispatch S2S Postback Webhook
            </Button>
          </form>
        </div>

        {/* Live Simulator Response Card */}
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between shadow-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-muted" />
                <span className="text-sm font-semibold text-ink">Result</span>
              </div>
              {responseResult && (
                <span
                  className={`px-2 py-0.5 rounded-full text-sm font-medium border ${
                    responseResult.success
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-danger/10 text-danger border-danger/20'
                  }`}
                >
                  HTTP {responseResult.status} ({responseResult.duration}ms)
                </span>
              )}
            </div>

            {!responseResult ? (
              <div className="text-muted py-16 text-center space-y-2">
                <p className="text-base">No request sent yet</p>
                <p className="text-sm text-muted">
                  Pick a click ID from the form and dispatch a postback to see the response here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {responseResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-danger shrink-0" />
                  )}
                  <span
                    className={
                      responseResult.success
                        ? 'text-success font-semibold'
                        : 'text-danger font-semibold'
                    }
                  >
                    {responseResult.success
                      ? 'Postback received and attributed'
                      : 'Postback failed'}
                  </span>
                </div>

                <div className="bg-page rounded-lg p-3 border border-border overflow-x-auto text-sm">
                  <pre className="text-ink font-mono">
                    {JSON.stringify(responseResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {responseResult?.success && (
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm text-success font-medium">
                Conversion recorded and counters updated
              </span>
              <button
                onClick={() => navigate('/analytics')}
                className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary-hover font-medium"
              >
                <span>View dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
