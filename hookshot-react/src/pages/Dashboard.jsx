import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedNumber from '../components/AnimatedNumber';
import { BentoGrid, BentoCard } from '../components/MagicBento';
import ShinyText from '../components/ShinyText';

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-14" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [endpoints, setEndpoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listEndpoints(), api.listEvents()]).then(([ep, ev]) => {
      if (ep.status === 200) setEndpoints(ep.data);
      if (ev.status === 200) setEvents(ev.data);
      setLoading(false);
    });
  }, []);

  const activeCount = endpoints.filter((e) => e.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
  <ShinyText
    text="Overview"
    speed={2}
    delay={0.5}
    color="var(--muted-foreground)"
    shineColor="var(--foreground)"
    spread={120}
    direction="left"
  />
</h1>
        <p className="text-muted-foreground mt-1">Your webhook delivery activity at a glance.</p>
      </div>

      <BentoGrid className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold"><AnimatedNumber value={endpoints.length} /></div>
                  </CardContent>
                </Card>
              </BentoCard>

              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold"><AnimatedNumber value={activeCount} /></div>
                  </CardContent>
                </Card>
              </BentoCard>

              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Events (last 50)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold"><AnimatedNumber value={events.length} /></div>
                  </CardContent>
                </Card>
              </BentoCard>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <BentoCard>
          <Button asChild variant="outline" className="bg-card dark:bg-card hover:bg-muted dark:hover:bg-muted">
            <Link to="/endpoints">Manage endpoints →</Link>
          </Button>
          </BentoCard>
          <BentoCard>
          <Button asChild variant="outline" className="bg-card dark:bg-card hover:bg-muted dark:hover:bg-muted">
            <Link to="/events">Send an event →</Link>
          </Button>
          </BentoCard>
        </div>
      </BentoGrid>
    </div>
  );
}
