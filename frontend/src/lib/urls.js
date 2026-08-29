const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const stripApiSuffix = (value = '') => value.replace(/\/api$/i, '');

export const getTrackingBaseUrl = () => {
  const configuredBase =
    import.meta.env.VITE_TRACKING_BASE_URL || import.meta.env.VITE_API_URL || '';

  if (configuredBase) {
    return stripApiSuffix(stripTrailingSlash(configuredBase));
  }

  return stripTrailingSlash(window.location.origin);
};

export const getTrackingUrl = (slug) => `${getTrackingBaseUrl()}/go/${slug}`;
