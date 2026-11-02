import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  emptyText: string;
  toItems: (payload: unknown) => Array<{ key: string; label: string; detail?: string }>;
};

export function CapabilityCard({ title, description, endpoint, emptyText, toItems }: Props) {
  const [items, setItems] = useState<Array<{ key: string; label: string; detail?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await getJson<unknown>(endpoint);
        if (!active) return;
        setItems(toItems(payload));
        setError(null);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load data');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [endpoint, toItems]);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="alert">Unable to load {title.toLowerCase()}: {error}</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{items.length === 0 ? <p>{emptyText}</p> : <ul className="mb-0">{items.map((item) => <li key={item.key}>{item.label}{item.detail ? <span> {item.detail}</span> : null}</li>)}</ul>}</div></section>;
}
