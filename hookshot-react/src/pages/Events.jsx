import { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import ShinyText from '../components/ShinyText';

const PRESET_TYPES = [
  'invoice.paid',
  'order.shipped',
  'payment.failed',
  'user.created',
  'subscription.cancelled',
];
const CUSTOM_VALUE = '__custom__';

function newKey() {
  return crypto.randomUUID ? crypto.randomUUID() : `key-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function RowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [type, setType] = useState('invoice.paid');
  const [selectValue, setSelectValue] = useState('invoice.paid');
  const [idempotencyKey, setIdempotencyKey] = useState(newKey());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { status, data } = await api.listEvents();
    if (status === 200) setEvents(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  function handleSelectChange(value) {
    setSelectValue(value);
    if (value !== CUSTOM_VALUE) {
      setType(value);
    } else {
      setType('');
    }
  }

  async function send(keyOverride) {
    setSending(true);
    const key = keyOverride || idempotencyKey;
    const { status, data, headers } = await api.sendEvent(type, { source: 'dashboard' }, key);
    setSending(false);

    if (status === 201) {
      toast.success('Event sent.');
    } else if (status === 200) {
      toast.success('Same key as before — original event returned, no duplicate created.');
    } else if (status === 429) {
      toast.error(`Rate limited. Retry in ${headers.get('retry-after') || '60'}s.`);
    } else {
      toast.error(data?.error || 'Could not send event.');
    }
    setIdempotencyKey(newKey());
    refresh();
  }

  async function resendLast() {
    if (!events.length) return;
    toast('Resending with the same idempotency key as the last event…');
    await send(events[0].idempotencyKey);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
  <ShinyText
    text="Events"
    speed={2}
    delay={0.5}
    color="var(--muted-foreground)"
    shineColor="var(--foreground)"
    spread={120}
    direction="left"
  />
</h1>
        <p className="text-muted-foreground mt-1">Events your backend has sent to Hookshot.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-50 space-y-2">
              <Label>Event type</Label>
              <Select value={selectValue} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event type" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_VALUE}>Custom…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={sending || !type}>{sending ? 'Sending…' : 'Send event'}</Button>
          </form>

          {selectValue === CUSTOM_VALUE && (
            <div className="space-y-2">
              <Label htmlFor="customType">Custom event type</Label>
              <Input
                id="customType"
                placeholder="e.g. refund.issued"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced ? 'Hide' : 'Show'} idempotency key
          </button>

          {showAdvanced && (
            <div className="space-y-2">
              <Label htmlFor="key">Idempotency-Key (sending the same key twice returns the original event, not a duplicate)</Label>
              <Input id="key" className="font-mono text-sm" value={idempotencyKey} onChange={(e) => setIdempotencyKey(e.target.value)} />
            </div>
          )}

          {events.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={resendLast}>
              Resend last event (same key — proves no duplicate is created)
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Endpoints notified</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </TableBody>
            </Table>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No events yet — send one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Endpoints notified</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev._id}>
                    <TableCell>{ev.type}</TableCell>
                    <TableCell>{ev.endpointIds?.length || 0}</TableCell>
                    <TableCell>{new Date(ev.createdAt).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

