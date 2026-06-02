import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    projectCount, machineCount, partCount, sparePartCount,
    totalItems, lowStockItems, expiringProjects,
    pendingSpareParts, recentTxns,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.machine.count(),
    prisma.part.count(),
    prisma.part.count({ where: { isSpare: true } }),
    prisma.item.count(),
    prisma.item.findMany({
      where: { safetyStock: { gt: 0 } },
      orderBy: { quantity: "asc" },
    }).then((list) => list.filter((i) => i.quantity <= i.safetyStock).slice(0, 10)),
    prisma.project.findMany({
      where: {
        warrantyEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { warrantyEnd: "asc" },
      take: 10,
    }),
    prisma.part.findMany({
      where: {
        isSpare: true,
        spareStatus: { not: "OK" },
      },
      take: 10,
      orderBy: { spareStatus: "asc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { item: { select: { name: true, code: true, unit: true } } },
    }),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxns = await prisma.transaction.groupBy({
    by: ["type"],
    where: { createdAt: { gte: startOfMonth } },
    _count: true,
  });
  const inCount = monthTxns.find((t) => t.type === "IN")?._count ?? 0;
  const outCount = monthTxns.find((t) => t.type === "OUT")?._count ?? 0;

  const items = await prisma.item.findMany({
    where: { price: { not: null } },
    select: { price: true, quantity: true },
  });
  const estimatedValue = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Link href="/projects">
          <Card className="hover:shadow-md hover:border-primary/30 transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">项目数</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{projectCount}</p></CardContent>
          </Card>
        </Link>
        <Link href="/projects">
          <Card className="hover:shadow-md hover:border-primary/30 transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">机器数</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{machineCount}</p></CardContent>
          </Card>
        </Link>
        <Link href="/parts">
          <Card className="hover:shadow-md hover:border-primary/30 transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">部件总数</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{partCount}</p></CardContent>
          </Card>
        </Link>
        <Link href="/parts?isSpare=true">
          <Card className="hover:shadow-md hover:border-primary/30 transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">备件数</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{sparePartCount}</p></CardContent>
          </Card>
        </Link>
        <Link href="/items">
          <Card className="hover:shadow-md hover:border-primary/30 transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">库存总值</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">¥{estimatedValue.toFixed(0)}</p></CardContent>
          </Card>
        </Link>
      </div>

      {/* 快捷操作 */}
      <div className="flex gap-3 mb-6">
        <Link href="/transactions/in"><Button>入库</Button></Link>
        <Link href="/transactions/out"><Button variant="secondary">出库</Button></Link>
        <Link href="/stocktake"><Button variant="outline">盘点</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 低库存预警 */}
        <Card>
          <CardHeader>
            <Link href="/items" className="hover:underline"><CardTitle>低库存预警</CardTitle></Link>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无低库存物料</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">({item.code})</span>
                      </div>
                      <Badge variant="destructive">{item.quantity}/{item.safetyStock} {item.unit}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 项目维保到期提醒 */}
        <Card>
          <CardHeader>
            <Link href="/projects" className="hover:underline"><CardTitle>项目维保到期提醒（90天内）</CardTitle></Link>
          </CardHeader>
          <CardContent>
            {expiringProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无即将到期的维保</p>
            ) : (
              <div className="space-y-2">
                {expiringProjects.map((proj) => {
                  const days = Math.ceil(
                    (new Date(proj.warrantyEnd!).getTime() - Date.now()) / 86400000
                  );
                  return (
                    <Link key={proj.id} href={`/projects/${proj.id}`}>
                      <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                        <span className="font-medium">{proj.name}</span>
                        <Badge variant={days < 30 ? "destructive" : "outline"}>
                          {days} 天后到期
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 待处理备件 */}
        <Card>
          <CardHeader>
            <Link href="/parts?spareStatus=NG" className="hover:underline"><CardTitle>待处理备件（非OK状态）</CardTitle></Link>
          </CardHeader>
          <CardContent>
            {pendingSpareParts.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无待处理备件</p>
            ) : (
              <div className="space-y-2">
                {pendingSpareParts.map((part) => (
                  <Link key={part.id} href={`/parts/${part.id}`}>
                    <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                      <div>
                        <span className="font-medium font-mono text-sm">{part.partSn}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {part.project?.name ?? "-"}
                        </span>
                      </div>
                      <Badge variant={part.spareStatus === "NG" ? "destructive" : "secondary"}>
                        {part.spareStatus ?? "-"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 本月出入库 */}
        <Card>
          <CardHeader>
            <Link href="/transactions/history" className="hover:underline"><CardTitle>本月出入库</CardTitle></Link>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 mb-4">
              <Link href="/transactions/history?type=IN" className="text-center flex-1 hover:bg-muted/50 rounded-lg py-2 transition-colors">
                <p className="text-3xl font-bold text-green-600">{inCount}</p>
                <p className="text-sm text-muted-foreground">入库次数</p>
              </Link>
              <Link href="/transactions/history?type=OUT" className="text-center flex-1 hover:bg-muted/50 rounded-lg py-2 transition-colors">
                <p className="text-3xl font-bold text-orange-600">{outCount}</p>
                <p className="text-sm text-muted-foreground">出库次数</p>
              </Link>
            </div>
            <div className="space-y-2">
              {recentTxns.slice(0, 5).map((txn) => (
                <div key={txn.id} className="flex justify-between items-center py-1 border-b last:border-0 text-sm">
                  <div>
                    <Badge variant={txn.type === "IN" ? "default" : "secondary"} className="mr-2 text-xs">
                      {txn.type === "IN" ? "入库" : "出库"}
                    </Badge>
                    <span>{txn.item.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {txn.quantity} {txn.item.unit} {new Date(txn.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/transactions/history" className="text-sm hover:underline mt-2 inline-block">
              查看全部 &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
