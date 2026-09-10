/** Browser-enforced script blocking is expected ONLY in an explicit no-JS profile. */
export function classifyRequestFailure({javaScriptEnabled,resourceType,errorText}) {
  return !javaScriptEnabled && resourceType === 'script' && errorText === 'csp' ? 'disabled-script' : 'request';
}
