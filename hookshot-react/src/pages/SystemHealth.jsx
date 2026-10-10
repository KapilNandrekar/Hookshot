import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import AnimatedNumber from '../components/AnimatedNumber';
import { BentoGrid, BentoCard } from '../components/MagicBento';
import ShinyText from '../components/ShinyText';

function StatCardSkeleton({ withBar }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16" />
        {withBar && <Skeleton className="h-2 w-full mt-3" />}
      </CardContent>
    </Card>
  );
}

export default function SystemHealth() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { status, data } = await api.systemHealth();
    if (status === 200) setStats(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const hitRate = stats && stats.cache.hits + stats.cache.misses > 0
    ? Math.round((stats.cache.hits / (stats.cache.hits + stats.cache.misses)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
  <ShinyText
    text="System Health"
    speed={2}
    delay={0.5}
    color="var(--muted-foreground)"
    shineColor="var(--foreground)"
    spread={120}
    direction="left"
  />
</h1>
        <p className="text-muted-foreground mt-1">Live read-performance metrics for your account. Updates automatically.</p>
      </div>

      <BentoGrid className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton withBar />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cache hit rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold text-primary"><AnimatedNumber value={hitRate} suffix="%" /></div>
                    <Progress value={hitRate} className="mt-3 h-2" />
                  </CardContent>
                </Card>
              </BentoCard>

              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cache hits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold"><AnimatedNumber value={stats.cache.hits} /></div>
                  </CardContent>
                </Card>
              </BentoCard>

              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cache misses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold"><AnimatedNumber value={stats.cache.misses} /></div>
                  </CardContent>
                </Card>
              </BentoCard>

              <BentoCard>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Database reads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold"><AnimatedNumber value={stats.dbQueryCount} /></div>
                  </CardContent>
                </Card>
              </BentoCard>
            </>
          )}
        </div>

        <BentoCard>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">How this works</CardTitle>
              <CardDescription>
                Looking up which of your endpoints are active is cached for 5 minutes. A cache hit
                means your request was served without touching the database; a miss means fresh
                data was fetched — which always happens immediately after you create, update, or
                delete an endpoint, so you never see stale data.
              </CardDescription>
            </CardHeader>
          </Card>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}

