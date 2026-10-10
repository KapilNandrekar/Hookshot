import { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import ShinyText from '../components/ShinyText';

function RowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-9 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
    </TableRow>
  );
}

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { status, data } = await api.listEndpoints();
    if (status === 200) setEndpoints(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setAdding(true);
    const { status, data, headers } = await api.createEndpoint(newUrl);
    setAdding(false);
    if (status === 201) {
      setNewUrl('');
      toast.success('Endpoint created.');
      refresh();
    } else if (status === 429) {
      toast.error(`Rate limited. Retry in ${headers.get('retry-after') || '60'}s.`);
    } else {
      toast.error(data?.error || 'Could not create endpoint.');
    }
  }

  async function toggleActive(ep) {
    const { status } = await api.patchEndpoint(ep._id, { active: !ep.active });
    if (status === 200) {
      toast.success(ep.active ? 'Endpoint paused.' : 'Endpoint activated.');
      refresh();
    }
  }

  async function remove(ep) {
    const { status } = await api.deleteEndpoint(ep._id);
    if (status === 200) {
      toast.success('Endpoint deleted.');
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
  <ShinyText
    text="Endpoints"
    speed={2}
    delay={0.5}
    color="var(--muted-foreground)"
    shineColor="var(--foreground)"
    spread={120}
    direction="left"
  />
</h1>
        <p className="text-muted-foreground mt-1">The URLs your backend receives webhook events at.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-2">
            <Label htmlFor="url">New endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks"
                required
              />
              <Button type="submit" disabled={adding}>{adding ? 'Adding…' : 'Add endpoint'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </TableBody>
            </Table>
          ) : endpoints.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No endpoints yet — add your first one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep) => (
                  <TableRow key={ep._id}>
                    <TableCell className="font-mono text-sm max-w-60">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate cursor-default">{ep.url}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{ep.url}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={ep.active} onCheckedChange={() => toggleActive(ep)} />
                        <span className="text-sm text-muted-foreground">
                          {ep.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(ep.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this endpoint?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{ep.url}" will stop receiving events immediately. This can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(ep)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
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

