export default function StorageBanner({ status }) {
  if (status === 'ok') return null;
  return (
    <div className={`storage-banner ${status}`}>
      {status === 'error'
        ? "Couldn't save — storage may be full. Try removing some house photos."
        : 'Storage almost full — consider removing photos from houses you\'ve ruled out.'}
    </div>
  );
}
